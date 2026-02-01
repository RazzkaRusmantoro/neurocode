import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface Documentation {
  _id?: ObjectId;
  repositoryId: ObjectId;
  scope: 'file' | 'module' | 'repository';
  target: string; // file path, module name, or 'full' for repository
  content: string; // Markdown content
  metadata: {
    filesAnalyzed: string[];
    functionsDocumented: number;
    classesDocumented: number;
    modulesDocumented?: number;
    qualityScore?: number;
    generationTime: number; // milliseconds
  };
  branch?: string; // Git branch this was generated for
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
  documentationData: Omit<Documentation, '_id' | 'repositoryId' | 'createdAt' | 'updatedAt'>
): Promise<Documentation> {
  const collection = await getDocumentationCollection();
  const now = new Date();

  const newDocumentation: Omit<Documentation, '_id'> = {
    ...documentationData,
    repositoryId: new ObjectId(repositoryId),
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newDocumentation as Documentation);
  return { ...newDocumentation, _id: result.insertedId } as Documentation;
}

export async function getDocumentationByRepository(
  repositoryId: string,
  scope?: 'file' | 'module' | 'repository',
  target?: string
): Promise<Documentation | null> {
  const collection = await getDocumentationCollection();
  const query: any = { repositoryId: new ObjectId(repositoryId) };
  
  if (scope) {
    query.scope = scope;
  }
  
  if (target) {
    query.target = target;
  }

  // Get the most recent documentation
  return collection.findOne(query, { sort: { createdAt: -1 } });
}

export async function getDocumentationsByRepository(
  repositoryId: string
): Promise<Documentation[]> {
  const collection = await getDocumentationCollection();
  return collection
    .find({ repositoryId: new ObjectId(repositoryId) })
    .sort({ createdAt: -1 })
    .toArray();
}

