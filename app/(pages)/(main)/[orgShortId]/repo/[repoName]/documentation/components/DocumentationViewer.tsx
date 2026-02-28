'use client';

import { useState, useEffect } from 'react';
import GenerateDocumentationModal from './GenerateDocumentationModal';
import DocumentationHeader from './DocumentationHeader';
import type { DocTypeFilter } from './DocumentationHeader';
import DocumentationList from './DocumentationList';

interface Documentation {
  _id: string;
  target?: string;
  prompt?: string;
  title?: string;
  description?: string;
  slug?: string | null;
  branch: string;
  version: number;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UmlDiagramItem {
  _id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  prompt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DocumentationListItem =
  | { kind: 'doc'; doc: Documentation }
  | { kind: 'uml'; uml: UmlDiagramItem };

interface DocumentationViewerProps {
  repositoryId: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repoName: string;
}

export default function DocumentationViewer({
  repositoryId,
  repoFullName,
  orgShortId,
  repoUrlName,
  repoName,
}: DocumentationViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentations, setDocumentations] = useState<Documentation[]>([]);
  const [umlDiagrams, setUmlDiagrams] = useState<UmlDiagramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocTypeFilter>('all');
  const [documentationsFetched, setDocumentationsFetched] = useState(false);

  const handleGenerateDocumentation = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Refresh documentations after generating new one (force refresh)
    fetchDocumentations(true);
  };

  const fetchDocumentations = async (forceRefresh = false) => {
    // Skip if already fetched and not forcing refresh
    if (documentationsFetched && !forceRefresh) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/documentation/repository/${repositoryId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documentations');
      }

      const data = await response.json();
      if (data.success) {
        setDocumentations(data.documentations || []);
        setUmlDiagrams(data.umlDiagrams || []);
        setDocumentationsFetched(true);
      } else {
        throw new Error(data.error || 'Failed to fetch documentations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching documentations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if not already cached - set loading to false immediately if cached
    if (!documentationsFetched) {
      fetchDocumentations();
    } else {
      // Data is cached, ensure loading is false immediately
      setLoading(false);
    }
  }, [repositoryId, documentationsFetched]);

  // Reset cache when repository changes
  useEffect(() => {
    setDocumentationsFetched(false);
    setDocumentations([]);
    setUmlDiagrams([]);
  }, [repositoryId]);

  const documentationListItems: DocumentationListItem[] = [
    ...documentations.map(doc => ({ kind: 'doc' as const, doc })),
    ...umlDiagrams.map(uml => ({ kind: 'uml' as const, uml })),
  ]
    .filter(item => typeFilter === 'all' || (typeFilter === 'doc' && item.kind === 'doc') || (typeFilter === 'uml' && item.kind === 'uml'))
    .sort((a, b) => {
      const dateA = a.kind === 'doc' ? a.doc.createdAt : a.uml.createdAt;
      const dateB = b.kind === 'doc' ? b.doc.createdAt : b.uml.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });


  return (
    <>
      <div className="h-full flex flex-col bg-transparent">
        <div className="max-w-screen-2xl mx-auto w-full h-full flex flex-col">
          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
            {/* Header with Search and Generate Button */}
            <DocumentationHeader
              activeTab="documentation"
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGenerateClick={handleGenerateDocumentation}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />

            {/* Documentation Content */}
            <div className="mt-12">
              <DocumentationList
                items={documentationListItems}
                loading={loading}
                error={error}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                orgShortId={orgShortId}
                repoUrlName={repoUrlName}
              />
            </div>
          </div>
        </div>
      </div>

      <GenerateDocumentationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        repoName={repoName}
        repoFullName={repoFullName}
        orgShortId={orgShortId}
        repoUrlName={repoUrlName}
        repositoryId={repositoryId}
      />
    </>
  );
}

