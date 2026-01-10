import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface User {
  _id?: ObjectId;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  authProvider?: 'credentials' | 'google' | 'github';
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = {
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: false },
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  authProvider: { type: 'string', required: false },
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now },
};

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection<User>('users');
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const collection = await getUsersCollection();
  const now = new Date();
  const newUser: Omit<User, '_id'> = {
    ...userData,
    authProvider: userData.authProvider || 'credentials',
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(newUser as User);
  return { ...newUser, _id: result.insertedId } as User;
}

export async function createOrUpdateOAuthUser(
  email: string,
  name: string,
  provider: 'google' | 'github' = 'google'
): Promise<User> {
  const collection = await getUsersCollection();
  const now = new Date();

  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const existingUser = await getUserByEmail(email);
  
  if (existingUser) {
    const updateData: Partial<User> = {
      updatedAt: now,
      authProvider: provider,
    };
    
    if (!existingUser.firstName && firstName) {
      updateData.firstName = firstName;
    }
    if (!existingUser.lastName && lastName) {
      updateData.lastName = lastName;
    }
    
    await collection.updateOne(
      { email },
      { $set: updateData }
    );
    
    return {
      ...existingUser,
      firstName: existingUser.firstName || firstName,
      lastName: existingUser.lastName || lastName,
      authProvider: provider,
      updatedAt: now,
    };
  }
  
  const newUser: Omit<User, '_id'> = {
    email,
    firstName,
    lastName,
    authProvider: provider,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(newUser as User);
  return { ...newUser, _id: result.insertedId } as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ email });
}

export async function getUserById(id: string): Promise<User | null> {
  const collection = await getUsersCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}


