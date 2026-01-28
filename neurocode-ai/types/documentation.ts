/**
 * Documentation types
 */

export interface Documentation {
  id: string;
  repositoryId: string;
  scope: 'file' | 'module' | 'repository';
  target: string;
  content: string; // Markdown content
  metadata: DocumentationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentationMetadata {
  filesAnalyzed: string[];
  functionsDocumented: number;
  classesDocumented: number;
  modulesDocumented: number;
  qualityScore?: number;
  generationTime: number; // milliseconds
}

export interface DocumentationRequest {
  repositoryId: string;
  scope: 'file' | 'module' | 'repository';
  target?: string;
  branch?: string;
}

export interface DocumentationResponse {
  success: boolean;
  documentation?: Documentation;
  error?: string;
  message?: string;
}

