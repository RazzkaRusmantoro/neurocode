'use client';

import { useState, useEffect } from 'react';
import GenerateDocumentationModal from './GenerateDocumentationModal';
import DocumentationHeader from './DocumentationHeader';
import DocumentationList from './DocumentationList';
import CodeReferenceList from './CodeReferenceList';
import VisualTreeCanvas from './VisualTreeCanvas';
import GlossaryView from './GlossaryView';

interface DocumentationViewerProps {
  repositoryId: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repoName: string;
}

type TabType = 'documentation' | 'visual-tree' | 'code-reference' | 'glossary';

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

interface CodeReference {
  _id?: string;
  referenceId: string;
  name: string;
  type?: 'function' | 'class' | 'method' | 'module';
  module?: string;
  filePath?: string;
  description: string;
  signature?: string;
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
}

export default function DocumentationViewer({
  repositoryId,
  repoFullName,
  orgShortId,
  repoUrlName,
  repoName,
}: DocumentationViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('documentation');
  const [documentations, setDocumentations] = useState<Documentation[]>([]);
  const [codeReferences, setCodeReferences] = useState<CodeReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeRefLoading, setCodeRefLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeRefError, setCodeRefError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [codeRefSearchQuery, setCodeRefSearchQuery] = useState('');
  const [documentationsFetched, setDocumentationsFetched] = useState(false);
  const [codeReferencesFetched, setCodeReferencesFetched] = useState(false);

  const handleGenerateDocumentation = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Refresh documentations after generating new one (force refresh)
    if (activeTab === 'documentation') {
      fetchDocumentations(true);
    }
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

  const fetchCodeReferences = async (forceRefresh = false) => {
    // Skip if already fetched and not forcing refresh
    if (codeReferencesFetched && !forceRefresh) {
      setCodeRefLoading(false);
      return;
    }

    try {
      setCodeRefLoading(true);
      setCodeRefError(null);
      const response = await fetch(`/api/code-references/repository/${repositoryId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch code references');
      }

      const data = await response.json();
      if (data.success) {
        setCodeReferences(data.codeReferences || []);
        setCodeReferencesFetched(true);
      } else {
        throw new Error(data.error || 'Failed to fetch code references');
      }
    } catch (err) {
      setCodeRefError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching code references:', err);
    } finally {
      setCodeRefLoading(false);
    }
  };


  useEffect(() => {
    // Only fetch if not already cached - set loading to false immediately if cached
    if (activeTab === 'documentation') {
      if (!documentationsFetched) {
        fetchDocumentations();
      } else {
        // Data is cached, ensure loading is false immediately
        setLoading(false);
      }
    } else if (activeTab === 'code-reference') {
      if (!codeReferencesFetched) {
        fetchCodeReferences();
      } else {
        // Data is cached, ensure loading is false immediately
        setCodeRefLoading(false);
      }
    }
  }, [activeTab, repositoryId, documentationsFetched, codeReferencesFetched]);

  // Reset cache when repository changes
  useEffect(() => {
    setDocumentationsFetched(false);
    setCodeReferencesFetched(false);
    setDocumentations([]);
    setCodeReferences([]);
  }, [repositoryId]);


  return (
    <>
      <div className="h-full flex flex-col bg-transparent">
        <div className="max-w-screen-2xl mx-auto w-full h-full flex flex-col">
          {/* Tab Switcher */}
          <div className="border-b border-white/10 px-6">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('documentation')}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  activeTab === 'documentation'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Documentation
                {activeTab === 'documentation' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('visual-tree')}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  activeTab === 'visual-tree'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Visual Tree
                {activeTab === 'visual-tree' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code-reference')}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  activeTab === 'code-reference'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Code Reference
                {activeTab === 'code-reference' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('glossary')}
                className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  activeTab === 'glossary'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Glossary
                {activeTab === 'glossary' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"></span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
          {/* Header with Search and Generate Button */}
          <DocumentationHeader
            activeTab={activeTab}
            searchQuery={activeTab === 'documentation' ? searchQuery : activeTab === 'code-reference' ? codeRefSearchQuery : ''}
            onSearchChange={activeTab === 'documentation' ? setSearchQuery : activeTab === 'code-reference' ? setCodeRefSearchQuery : undefined}
            onGenerateClick={handleGenerateDocumentation}
          />

          {/* Tab Content */}
          <div className="mt-12">
            {activeTab === 'documentation' && (
              <DocumentationList
                documentations={documentations}
                loading={loading}
                error={error}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                orgShortId={orgShortId}
                repoUrlName={repoUrlName}
              />
            )}

            {activeTab === 'visual-tree' && (
              <VisualTreeCanvas />
            )}

            {activeTab === 'code-reference' && (
              <CodeReferenceList
                codeReferences={codeReferences}
                loading={codeRefLoading}
                error={codeRefError}
                searchQuery={codeRefSearchQuery}
                onSearchChange={setCodeRefSearchQuery}
              />
            )}

            {activeTab === 'glossary' && (
              <GlossaryView />
            )}
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

