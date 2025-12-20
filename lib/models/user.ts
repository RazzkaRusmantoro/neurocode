import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = {
  email: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true },
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
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


