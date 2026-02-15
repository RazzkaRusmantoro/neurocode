'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GenerateDocumentationModal from './GenerateDocumentationModal';
import TextInput from '@/app/components/TextInput';
import CodeSnippet from './CodeSnippet';
import { slugify } from '@/lib/utils/slug';

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
  examples?: Array<{
    code: string;
    description: string;
  }>;
  seeAlso?: string[];
  code?: string; // Raw code snippet
}

// Optimized function to parse description with support for [[text]], `text`, and **text** (bold)
function parseDescription(
  description: string
): (string | React.ReactElement)[] {
  if (!description) return [description];
  
  const parts: (string | React.ReactElement)[] = [];
  let key = 0;
  
  // Single pass regex to find all patterns: `[[text]]`, [[text]], `text`, and **text**
  // Order matters: backticked links first, then links, then code, then bold
  const patterns = [
    { regex: /`\[\[([^\]]+)\]\]`/g, type: 'link', priority: 4 },
    { regex: /\[\[([^\]]+)\]\]/g, type: 'link', priority: 3 },
    { regex: /`([^`\n]+)`/g, type: 'code', priority: 2 },
    { regex: /\*\*([^*\n]+?)\*\*/g, type: 'bold', priority: 1 },
  ];
  
  const allMatches: Array<{ type: 'link' | 'code' | 'bold'; start: number; end: number; text: string; priority: number }> = [];
  
  // Find all matches with their positions
  patterns.forEach(({ regex, type, priority }) => {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(description)) !== null) {
      allMatches.push({
        type: type as 'link' | 'code' | 'bold',
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        priority,
      });
    }
  });
  
  // Sort by position, then by priority (higher priority wins)
  allMatches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.priority - a.priority;
  });
  
  // Remove overlapping matches (keep higher priority)
  const filteredMatches: typeof allMatches = [];
  for (const current of allMatches) {
    let shouldAdd = true;
    
    for (let i = 0; i < filteredMatches.length; i++) {
      const existing = filteredMatches[i];
      // Check if overlaps
      if (current.start < existing.end && current.end > existing.start) {
        // If current has higher priority, replace existing
        if (current.priority > existing.priority) {
          filteredMatches[i] = current;
        }
        shouldAdd = false;
        break;
      }
    }
    
    if (shouldAdd) {
      filteredMatches.push(current);
    }
  }
  
  // Re-sort after filtering
  filteredMatches.sort((a, b) => a.start - b.start);
  
  // Build the parts array
  let lastIndex = 0;
  for (const match of filteredMatches) {
    if (match.start > lastIndex) {
      parts.push(description.substring(lastIndex, match.start));
    }
    
    const cleanText = match.text.replace(/[`\[\]]/g, '');
    
    if (match.type === 'link') {
      parts.push(
        <span
          key={key++}
          className="inline px-1.5 py-0.5 rounded text-[#3fb1c5]"
          style={{ 
            backgroundColor: 'rgba(128, 128, 128, 0.3)',
            textDecoration: 'underline',
            textDecorationThickness: '0.5px',
            textUnderlineOffset: '2px'
          }}
        >
          {cleanText}
        </span>
      );
    } else if (match.type === 'code') {
      parts.push(
        <span
          key={key++}
          className="inline px-1.5 py-0.5 rounded text-white"
          style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}
        >
          {cleanText}
        </span>
      );
    } else if (match.type === 'bold') {
      // For bold text, we don't need to clean brackets/backticks as they shouldn't be there
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {match.text}
        </strong>
      );
    }
    
    lastIndex = match.end;
  }
  
  if (lastIndex < description.length) {
    parts.push(description.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [description];
}

export default function DocumentationViewer({
  repositoryId,
  repoFullName,
  orgShortId,
  repoUrlName,
  repoName,
}: DocumentationViewerProps) {
  const router = useRouter();
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
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(new Set());
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

  const toggleRefExpansion = (refId: string) => {
    setExpandedRefs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(refId)) {
        newSet.delete(refId);
      } else {
        newSet.add(refId);
      }
      return newSet;
    });
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

  const handleDocumentationClick = (doc: Documentation) => {
    if (!doc.title) {
      console.error('Documentation has no title');
      return;
    }
    // Navigate to the documentation detail page using a slug in the path
    const slug = doc.slug || slugify(doc.title);
    router.push(`/org-${orgShortId}/repo/${repoUrlName}/documentation/${encodeURIComponent(slug)}`);
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

  const filteredDocumentations = useMemo(() => {
    if (!searchQuery.trim()) return documentations;
    const query = searchQuery.toLowerCase();
    return documentations.filter(doc => 
      doc.title?.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.prompt?.toLowerCase().includes(query) ||
      doc.target?.toLowerCase().includes(query) ||
      doc.branch.toLowerCase().includes(query)
    );
  }, [documentations, searchQuery]);

  // Persistent cache for parsed descriptions to avoid re-parsing on every render
  const parsedDescriptionsCache = useRef(new Map<string, (string | React.ReactElement)[]>());

  // Memoized function to get or parse description
  const getParsedDescription = useCallback((text: string): (string | React.ReactElement)[] => {
    if (!text) return [text];
    const cache = parsedDescriptionsCache.current;
    if (cache.has(text)) {
      return cache.get(text)!;
    }
    const parsed = parseDescription(text);
    cache.set(text, parsed);
    return parsed;
  }, []);

  const filteredCodeReferences = useMemo(() => {
    if (!codeRefSearchQuery.trim()) return codeReferences;
    const query = codeRefSearchQuery.toLowerCase();
    // Search only by name
    return codeReferences.filter(ref => 
      ref.name.toLowerCase().includes(query)
    );
  }, [codeReferences, codeRefSearchQuery]);

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
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
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
            {activeTab === 'code-reference' && (
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
                    id="codeReferenceSearch"
                    value={codeRefSearchQuery}
                    onChange={(e) => setCodeRefSearchQuery(e.target.value)}
                    placeholder="Search code references..."
                    className="w-full pl-10"
                  />
                </div>
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
                  <div className="pb-4">
                    <div className="flex flex-col gap-6">
                      {filteredDocumentations.map((doc) => (
                        <div
                          key={doc._id}
                          onClick={() => handleDocumentationClick(doc)}
                          className="w-full cursor-pointer group"
                        >
                          <div className="flex flex-col h-full hover:text-[#5C42CE] transition-colors">

                            {/* Title */}
                            {doc.title && (
                              <h3 className="text-white/65 font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[#5C42CE] transition-colors">
                                {doc.title}
                              </h3>
                            )}

                            {/* Description */}
                            {doc.description && (
                              <p className="text-white/50 text-sm mb-3 line-clamp-3">
                                {doc.description}
                              </p>
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
              <div>
                {codeRefLoading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-full"
                      >
                        <div className="flex flex-col w-full">
                          <div className="h-6 bg-white/10 rounded mb-2 animate-pulse w-full"></div>
                          <div className="h-4 bg-white/10 rounded mb-4 w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : codeRefError ? (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{codeRefError}</p>
                  </div>
                ) : filteredCodeReferences.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/60 mb-2">
                      {codeRefSearchQuery ? 'No code references match your search' : 'No code references found'}
                    </p>
                    <p className="text-white/40 text-sm">
                      {codeRefSearchQuery ? 'Try a different search term' : 'Code references will appear here after documentation is generated.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {filteredCodeReferences.map((ref) => {
                      const isExpanded = expandedRefs.has(ref.referenceId);
                      return (
                        <div key={ref.referenceId} className="scroll-mt-6 pb-8 border-b border-white/10 last:border-b-0">
                          {/* Code Reference Header - Always visible, clickable to expand/collapse */}
                          <button
                            onClick={() => toggleRefExpansion(ref.referenceId)}
                            className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-3">
                              <svg
                                className={`w-5 h-5 text-white/60 flex-shrink-0 transition-transform duration-300 ease-in-out ${
                                  isExpanded ? 'transform rotate-90' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <h3 className="text-xl font-semibold text-white font-mono">
                                {ref.name}
                              </h3>
                            </div>
                          </button>
                          
                          {/* Expanded Content with Animation */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="ml-8 mt-4 space-y-4">
                              {/* Signature - Now part of expanded content */}
                              {ref.signature && (
                                <div className="mb-4">
                                  <div className="text-white/70 text-sm font-mono">
                                    {ref.type && (
                                      <span className="text-white/60 mr-2">
                                        {ref.type}
                                      </span>
                                    )}
                                    {ref.signature}
                                  </div>
                                </div>
                              )}
                              
                              {/* Code Reference Description */}
                              {ref.description && (
                                <div className="prose prose-invert max-w-none mb-4">
                                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                                    {getParsedDescription(ref.description)}
                                  </p>
                                </div>
                              )}
                              
                              {/* Parameters Section */}
                              {ref.parameters && ref.parameters.length > 0 && (
                                <div className="mt-4 mb-4">
                                  <h4 className="text-sm font-semibold text-white/60 mb-3">Parameters:</h4>
                                  <div className="space-y-3 ml-4">
                                    {ref.parameters.map((param, paramIdx) => (
                                      <div key={paramIdx} className="border-l-2 border-white/10 pl-4">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                          <span className="font-mono text-[#3fb1c5]">{param.name}</span>
                                        </div>
                                        {param.description && (
                                          <p className="text-white/60 text-sm mt-1 ml-0">
                                            {getParsedDescription(param.description)}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Code Snippet Section */}
                              {ref.code && (
                                <CodeSnippet code={ref.code} language={ref.type === 'class' ? 'typescript' : undefined} />
                              )}
                              
                              {/* Returns Section */}
                              {ref.returns && (
                                <div className="mt-4 mb-4">
                                  <h4 className="text-sm font-semibold text-white/60 mb-2">Returns:</h4>
                                  <div className="ml-4">
                                    {ref.returns.type && (
                                      <span className="font-mono text-[#3fb1c5]">{ref.returns.type}</span>
                                    )}
                                    {ref.returns.description && (
                                      <p className="text-white/60 text-sm mt-1">
                                        {getParsedDescription(ref.returns.description)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

