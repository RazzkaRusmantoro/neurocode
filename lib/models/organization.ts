import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface Organization {
  _id?: ObjectId;
  name: string;
  ownerId: ObjectId;
  members: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getOrganizationsCollection() {
  const db = await getDb();
  return db.collection<Organization>('organizations');
}

export async function createOrganization(
  name: string,
  ownerId: ObjectId
): Promise<Organization> {
  const collection = await getOrganizationsCollection();
  const now = new Date();
  
  const newOrganization: Omit<Organization, '_id'> = {
    name,
    ownerId,
    members: [ownerId],
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await collection.insertOne(newOrganization as Organization);
  return { ...newOrganization, _id: result.insertedId } as Organization;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const collection = await getOrganizationsCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function updateOrganizationName(
  organizationId: string,
  newName: string
): Promise<boolean> {
  const collection = await getOrganizationsCollection();
  const now = new Date();
  
  const result = await collection.updateOne(
    { _id: new ObjectId(organizationId) },
    {
      $set: {
        name: newName,
        updatedAt: now,
      },
    }
  );
  
  return result.modifiedCount > 0;
}

