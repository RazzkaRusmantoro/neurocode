import { ObjectId } from 'mongodb';
import { getDb } from '../db';
import { generateUniqueUrlName } from '../utils/slug';

export interface Repository {
  _id?: ObjectId;
  organizationId: ObjectId;
  githubId?: number; // Optional - only for GitHub repos
  name: string;
  urlName?: string; // URL-friendly name for routing (optional for backward compatibility)
  url: string;
  source: 'github' | 'bitbucket' | 'upload';
  description?: string; // Optional description
  size?: number; // Repository size in KB (from GitHub API)
  lastUpdate?: Date; // Last update date (from GitHub API)
  addedAt: Date;
  addedBy?: ObjectId; // User ID who added this repository
}

// Serialized version for client-side use (ObjectIds and Dates converted to strings)
export interface SerializedRepository {
  _id: string;
  organizationId: string;
  githubId?: number;
  name: string;
  urlName?: string;
  url: string;
  source: 'github' | 'bitbucket' | 'upload';
  description?: string;
  size?: number;
  lastUpdate?: string; // ISO string
  addedAt: string; // ISO string
  addedBy?: string;
}

export async function getRepositoriesCollection() {
  const db = await getDb();
  return db.collection<Repository>('repositories');
}

export type CreateRepositoryData = Omit<Repository, '_id' | 'organizationId' | 'addedAt' | 'lastUpdate' | 'urlName' | 'addedBy'> & {
  urlName?: string; // Optional - will be generated if not provided
  lastUpdate?: Date | string; // Allow string for conversion
  addedBy?: string; // User ID who added this repository
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
  
  // Generate urlName if not provided
  let urlName = repositoryData.urlName;
  if (!urlName) {
    // Get all existing repositories in this organization to check for duplicates
    const existingRepos = await getRepositoriesByOrganization(organizationId);
    // Filter out repositories without urlName (legacy repos)
    const existingUrlNames = existingRepos
      .map(repo => repo.urlName)
      .filter((name): name is string => !!name);
    urlName = generateUniqueUrlName(repositoryData.name, organizationId, existingUrlNames);
  }
  
  const newRepository: Omit<Repository, '_id'> = {
    ...repositoryData,
    urlName,
    lastUpdate,
    organizationId: new ObjectId(organizationId),
    addedAt: now,
    addedBy: repositoryData.addedBy ? new ObjectId(repositoryData.addedBy) : undefined,
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

export async function getRepositoryByUrlNameAndOrganization(
  urlName: string,
  organizationId: string
): Promise<Repository | null> {
  const collection = await getRepositoriesCollection();
  return collection.findOne({
    urlName,
    organizationId: new ObjectId(organizationId),
  });
}

