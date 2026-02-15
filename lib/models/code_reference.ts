import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface CodeReference {
  _id?: ObjectId;
  organizationId: ObjectId;
  repositoryId: ObjectId;
  referenceId: string; // Unique identifier (e.g., "processCitation")
  name: string; // Function/class name
  type: 'function' | 'class' | 'method' | 'module';
  module?: string; // Module path
  filePath?: string; // File path in repository
  description: string;
  signature?: string; // Function/class signature
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: any;
    description: string;
  }>;
  returns?: {
    type: string;
    description: string;
  };
  examples?: Array<{
    code: string;
    description: string;
  }>;
  seeAlso?: string[]; // Other reference IDs
  createdAt: Date;
  updatedAt: Date;
}

export async function getCodeReferencesCollection() {
  const db = await getDb();
  return db.collection<CodeReference>('code_references');
}

/**
 * Get code references by their referenceIds
 */
export async function getCodeReferencesByIds(
  repositoryId: string,
  referenceIds: string[],
  organizationId?: string
): Promise<CodeReference[]> {
  const collection = await getCodeReferencesCollection();
  const query: any = {
    repositoryId: new ObjectId(repositoryId),
    referenceId: { $in: referenceIds },
  };

  if (organizationId) {
    query.organizationId = new ObjectId(organizationId);
  }

  return collection.find(query).toArray();
}

/**
 * Get all code references for a repository
 */
export async function getCodeReferencesByRepository(
  repositoryId: string,
  organizationId?: string
): Promise<CodeReference[]> {
  const collection = await getCodeReferencesCollection();
  const query: any = {
    repositoryId: new ObjectId(repositoryId),
  };

  if (organizationId) {
    query.organizationId = new ObjectId(organizationId);
  }

  return collection.find(query).sort({ name: 1 }).toArray();
}

