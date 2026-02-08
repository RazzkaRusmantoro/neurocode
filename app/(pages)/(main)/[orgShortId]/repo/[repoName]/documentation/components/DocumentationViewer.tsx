'use client';

import { useState, useEffect } from 'react';
import GenerateDocumentationModal from './GenerateDocumentationModal';
import TextInput from '@/app/components/TextInput';

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
  branch: string;
  version: number;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleGenerateDocumentation = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Refresh documentations after generating new one
    if (activeTab === 'documentation') {
      fetchDocumentations();
    }
  };

  const fetchDocumentations = async () => {
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
    if (activeTab === 'documentation') {
      fetchDocumentations();
    }
  }, [activeTab, repositoryId]);

  const handleDocumentationClick = (docId: string) => {
    // Navigation will be implemented later
    console.log('Clicked documentation:', docId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredDocumentations = documentations.filter(doc => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.prompt?.toLowerCase().includes(query) ||
      doc.target?.toLowerCase().includes(query) ||
      doc.branch.toLowerCase().includes(query)
    );
  });

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
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
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
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
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
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
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
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Header with Search and Generate Button */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'documentation' && 'Documentation'}
              {activeTab === 'visual-tree' && 'Visual Tree'}
              {activeTab === 'code-reference' && 'Code Reference'}
              {activeTab === 'glossary' && 'Glossary'}
            </h2>
            {activeTab === 'documentation' && (
              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="w-128 relative">
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <TextInput
                    type="text"
                    id="documentationSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documentations..."
                    className="w-full pl-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerateDocumentation}
                  className="relative px-6 py-3 bg-[#5C42CE] hover:bg-[#4A35B5] rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-[0_0_20px_rgba(92,66,206,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="relative z-[1]">
                    Generate Documentation
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#7B6DD9] to-[#5C42CE] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="mt-12">
            {activeTab === 'documentation' && (
              <div>

                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-full"
                      >
                        <div className="flex flex-col w-full">
                          {/* Title skeleton */}
                          <div className="h-6 bg-white/10 rounded mb-2 animate-pulse w-full"></div>
                          <div className="h-6 bg-white/10 rounded mb-2 w-3/4 animate-pulse"></div>
                          
                          {/* Target skeleton */}
                          <div className="h-4 bg-white/10 rounded mb-4 w-2/3 animate-pulse"></div>
                          
                          {/* Metadata skeleton */}
                          <div className="pt-4 border-t border-white/10">
                            <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                ) : filteredDocumentations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/60 mb-2">
                      {searchQuery ? 'No documentations match your search' : 'No documentation found'}
                    </p>
                    <p className="text-white/40 text-sm">
                      {searchQuery ? 'Try a different search term' : 'Generate documentation to get started.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-6">
                      {filteredDocumentations.map((doc) => (
                        <div
                          key={doc._id}
                          onClick={() => handleDocumentationClick(doc._id)}
                          className="flex-shrink-0 flex-1 min-w-0 cursor-pointer group"
                        >
                          <div className="flex flex-col h-full hover:text-[#5C42CE] transition-colors">

                            {/* Title */}
                            {(doc.title || doc.prompt) && (
                              <h3 className="text-white/65 font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[#5C42CE] transition-colors">
                                {doc.title || doc.prompt}
                              </h3>
                            )}

                            {/* Target */}
                            {doc.target && (
                              <p className="text-white/50 text-sm mb-4 font-mono truncate">
                                {doc.target}
                              </p>
                            )}

                            {/* Metadata */}
                            <div className="mt-auto pt-4 border-t border-white/10">
                              <div className="flex items-center justify-between text-xs text-white/40">
                                <span>{formatDate(doc.createdAt)}</span>
                                <svg
                                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visual-tree' && (
              <div className="text-white/60">
                <p>Visual Tree content will be displayed here.</p>
                <p className="mt-4 text-sm">This section will show an interactive tree visualization of the codebase structure.</p>
              </div>
            )}

            {activeTab === 'code-reference' && (
              <div className="text-white/60">
                <p>Code Reference content will be displayed here.</p>
                <p className="mt-4 text-sm">This section will show all classes, functions, and methods from the codebase.</p>
              </div>
            )}

            {activeTab === 'glossary' && (
              <div className="text-white/60">
                <p>Glossary content will be displayed here.</p>
                <p className="mt-4 text-sm">This section will show common terms and API elements.</p>
              </div>
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

