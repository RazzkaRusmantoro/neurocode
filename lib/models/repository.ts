import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface Repository {
  _id?: ObjectId;
  organizationId: ObjectId;
  githubId?: number; // Optional - only for GitHub repos
  name: string;
  url: string;
  source: 'github' | 'bitbucket' | 'upload';
  description?: string; // Optional description
  size?: number; // Repository size in KB (from GitHub API)
  lastUpdate?: Date; // Last update date (from GitHub API)
  addedAt: Date;
}

export async function getRepositoriesCollection() {
  const db = await getDb();
  return db.collection<Repository>('repositories');
}

export type CreateRepositoryData = Omit<Repository, '_id' | 'organizationId' | 'addedAt' | 'lastUpdate'> & {
  lastUpdate?: Date | string; // Allow string for conversion
};

export async function createRepository(
  organizationId: string,
  repositoryData: CreateRepositoryData
): Promise<Repository> {
  const collection = await getRepositoriesCollection();
  const now = new Date();
  
  // Convert lastUpdate from string to Date if provided
  const lastUpdate = repositoryData.lastUpdate 
    ? (typeof repositoryData.lastUpdate === 'string' ? new Date(repositoryData.lastUpdate) : repositoryData.lastUpdate)
    : undefined;
  
  const newRepository: Omit<Repository, '_id'> = {
    ...repositoryData,
    lastUpdate,
    organizationId: new ObjectId(organizationId),
    addedAt: now,
  };
  
  const result = await collection.insertOne(newRepository as Repository);
  return { ...newRepository, _id: result.insertedId } as Repository;
}

export async function getRepositoryById(id: string): Promise<Repository | null> {
  const collection = await getRepositoriesCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function getRepositoriesByOrganization(organizationId: string): Promise<Repository[]> {
  const collection = await getRepositoriesCollection();
  return collection.find({ organizationId: new ObjectId(organizationId) }).toArray();
}

export async function getRepositoryByGithubIdAndOrganization(
  githubId: number,
  organizationId: string
): Promise<Repository | null> {
  const collection = await getRepositoriesCollection();
  return collection.findOne({
    githubId,
    organizationId: new ObjectId(organizationId),
  });
}

