import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface Documentation {
  _id?: ObjectId;
  organizationId: ObjectId; // For multi-tenant queries
  repositoryId: ObjectId;
  scope: 'file' | 'module' | 'repository' | 'custom';
  target?: string; // file path, module name, or 'full' for repository
  prompt?: string; // For custom/RAG documentation
  title?: string; // Title extracted from documentation content
  
  // S3 storage fields
  s3Key: string; // S3 object key/path
  s3Bucket: string; // S3 bucket name
  contentSize: number; // Size in bytes
  content?: string; // Optional: only for small docs or legacy support
  
  // Versioning
  version: number; // Version number for same scope/target/branch
  isLatest: boolean; // Mark latest version
  
  branch: string; // Git branch this was generated for (required)
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId; // User ID who generated this
}

export async function getDocumentationCollection() {
  const db = await getDb();
  return db.collection<Documentation>('documentation');
}

export async function createDocumentation(
  repositoryId: string,
  documentationData: Omit<Documentation, '_id' | 'repositoryId' | 'organizationId' | 'createdAt' | 'updatedAt'> & {
    organizationId: string; // Accept string, convert to ObjectId
  }
): Promise<Documentation> {
  const collection = await getDocumentationCollection();
  const now = new Date();

  const newDocumentation: Omit<Documentation, '_id'> = {
    ...documentationData,
    organizationId: new ObjectId(documentationData.organizationId),
    repositoryId: new ObjectId(repositoryId),
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newDocumentation as Documentation);
  return { ...newDocumentation, _id: result.insertedId } as Documentation;
}

export async function getDocumentationByRepository(
  repositoryId: string,
  scope?: 'file' | 'module' | 'repository' | 'custom',
  target?: string,
  isLatest?: boolean
): Promise<Documentation | null> {
  const collection = await getDocumentationCollection();
  const query: any = { repositoryId: new ObjectId(repositoryId) };
  
  if (scope) {
    query.scope = scope;
  }
  
  if (target) {
    query.target = target;
  }

  // If isLatest is specified, filter by it; otherwise get most recent
  if (isLatest !== undefined) {
    query.isLatest = isLatest;
  }

  // Get the most recent documentation
  return collection.findOne(query, { sort: { createdAt: -1 } });
}

export async function getDocumentationsByRepository(
  repositoryId: string,
  organizationId?: string,
  isLatest?: boolean
): Promise<Documentation[]> {
  const collection = await getDocumentationCollection();
  const query: any = { repositoryId: new ObjectId(repositoryId) };
  
  if (organizationId) {
    query.organizationId = new ObjectId(organizationId);
  }
  
  if (isLatest !== undefined) {
    query.isLatest = isLatest;
  }
  
  return collection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getDocumentationById(
  documentationId: string
): Promise<Documentation | null> {
  const collection = await getDocumentationCollection();
  return collection.findOne({ _id: new ObjectId(documentationId) });
}

export async function getDocumentationsByOrganization(
  organizationId: string,
  isLatest?: boolean
): Promise<Documentation[]> {
  const collection = await getDocumentationCollection();
  const query: any = { organizationId: new ObjectId(organizationId) };
  
  if (isLatest !== undefined) {
    query.isLatest = isLatest;
  }
  
  return collection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

