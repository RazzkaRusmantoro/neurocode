'use client';

import { useState, useMemo, useEffect } from 'react';
import TextInput from '@/app/components/TextInput';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PullRequestsViewerProps {
  repositoryId: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repoName: string;
}

type FilterType = 'open' | 'closed';

interface PullRequest {
  id: number;
  number: number;
  title: string;
  description: string;
  state: string;
  merged: boolean;
  author: string;
  authorAvatar: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  url: string;
  commentsCount: number;
  reviewCommentsCount: number;
  commitsCount: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  baseBranch: string;
  headBranch: string;
  headCommitSha: string;
  baseCommitSha: string;
  headRepo: string;
  baseRepo: string;
}

export default function PullRequestsViewer({
  repositoryId,
  repoFullName,
  orgShortId,
  repoUrlName,
  repoName,
}: PullRequestsViewerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'commits'>('files');
  const [prFiles, setPrFiles] = useState<any[]>([]);
  const [prCommits, setPrCommits] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(60); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  // Fetch pull requests when component mounts or filter changes
  useEffect(() => {
    const fetchPullRequests = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // URL encode repoFullName to handle special characters like '/'
        const encodedRepoFullName = encodeURIComponent(repoFullName);
        
        // Fetch both open and closed PRs, then filter client-side
        const [openResponse, closedResponse] = await Promise.all([
          fetch(
            `/api/github/repositories/${encodedRepoFullName}/pull-requests?state=open&orgShortId=${encodeURIComponent(orgShortId)}&repoUrlName=${encodeURIComponent(repoUrlName)}`
          ),
          fetch(
            `/api/github/repositories/${encodedRepoFullName}/pull-requests?state=closed&orgShortId=${encodeURIComponent(orgShortId)}&repoUrlName=${encodeURIComponent(repoUrlName)}`
          ),
        ]);

        if (!openResponse.ok && !closedResponse.ok) {
          throw new Error('Failed to fetch pull requests');
        }

        const openData = openResponse.ok ? await openResponse.json() : { pullRequests: [] };
        const closedData = closedResponse.ok ? await closedResponse.json() : { pullRequests: [] };

        // Combine all pull requests
        const allPRs = [...(openData.pullRequests || []), ...(closedData.pullRequests || [])];
        
        // Mark merged PRs correctly
        const formattedPRs = allPRs.map((pr: any) => ({
          ...pr,
          state: pr.merged ? 'merged' : pr.state,
        }));

        setPullRequests(formattedPRs);
      } catch (err) {
        console.error('Error fetching pull requests:', err);
        setError('Failed to load pull requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPullRequests();
  }, [repoFullName, orgShortId, repoUrlName]);

  // Fetch PR files
  const fetchPRFiles = async (prNumber: number) => {
    setLoadingFiles(true);
    try {
      const encodedRepoFullName = encodeURIComponent(repoFullName);
      const response = await fetch(
        `/api/github/repositories/${encodedRepoFullName}/pull-requests/${prNumber}/files?orgShortId=${encodeURIComponent(orgShortId)}&repoUrlName=${encodeURIComponent(repoUrlName)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPrFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching PR files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Fetch PR commits
  const fetchPRCommits = async (prNumber: number) => {
    setLoadingCommits(true);
    try {
      const encodedRepoFullName = encodeURIComponent(repoFullName);
      const response = await fetch(
        `/api/github/repositories/${encodedRepoFullName}/pull-requests/${prNumber}/commits?orgShortId=${encodeURIComponent(orgShortId)}&repoUrlName=${encodeURIComponent(repoUrlName)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPrCommits(data.commits || []);
      }
    } catch (error) {
      console.error('Error fetching PR commits:', error);
    } finally {
      setLoadingCommits(false);
    }
  };

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const modal = document.querySelector('[data-modal-container]') as HTMLElement;
      if (!modal) return;
      
      const rect = modal.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const detectLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'tsx',
      'js': 'javascript',
      'jsx': 'jsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'md': 'markdown',
      'sql': 'sql',
      'vue': 'vue',
      'svelte': 'svelte',
    };
    
    return extension && languageMap[extension] ? languageMap[extension] : 'text';
  };

  // Parse diff patch to show line-by-line changes
  const parseDiff = (patch: string) => {
    if (!patch) return [];
    const lines = patch.split('\n');
    const result: Array<{ type: 'context' | 'add' | 'remove' | 'header'; content: string; oldLine?: number; newLine?: number }> = [];
    let oldLine = 0;
    let newLine = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLine = parseInt(match[1]);
          newLine = parseInt(match[2]);
        }
        result.push({ type: 'header', content: line });
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        result.push({ type: 'add', content: line.substring(1), newLine: newLine++ });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        result.push({ type: 'remove', content: line.substring(1), oldLine: oldLine++ });
      } else if (line.startsWith(' ')) {
        result.push({ type: 'context', content: line.substring(1), oldLine: oldLine++, newLine: newLine++ });
      } else {
        result.push({ type: 'context', content: line });
      }
    }
    return result;
  };

  const filteredPullRequests = useMemo(() => {
    let filtered = pullRequests;

    // Filter by status
    if (activeFilter === 'open') {
      filtered = filtered.filter(pr => pr.state === 'open');
    } else if (activeFilter === 'closed') {
      filtered = filtered.filter(pr => pr.state === 'closed' || pr.state === 'merged');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pr =>
        pr.title?.toLowerCase().includes(query) ||
        pr.number?.toString().includes(query) ||
        pr.author?.toLowerCase().includes(query)
      );
    }

    // Sort by updated date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [pullRequests, activeFilter, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="max-w-screen-2xl mx-auto w-full h-full flex flex-col">
        {/* Tab Switcher */}
        <div className="border-b border-white/10 px-6">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveFilter('open')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                activeFilter === 'open'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Open
              {activeFilter === 'open' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('closed')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                activeFilter === 'closed'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Closed
              {activeFilter === 'closed' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-white">Pull Requests</h2>
          </div>

          {/* Main Container */}
          <div>
            {/* Pull Requests List Container */}
            <div className="w-full">
              <div className="bg-[#121215] border border-[#262626] rounded-lg overflow-hidden">
                {/* Container Header */}
                <div className="px-6 py-4 border-b border-[#262626] bg-[#121215]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {activeFilter === 'open' ? 'Open Pull Requests' : 'Closed Pull Requests'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>{filteredPullRequests.length} {filteredPullRequests.length === 1 ? 'request' : 'requests'}</span>
                    </div>
                  </div>
                </div>

                {/* Pull Requests List or Empty State - Fixed Height */}
                <div className="h-[600px] overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <div className="divide-y divide-[#262626]">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="px-6 py-5 animate-pulse">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                                <div className="h-5 bg-white/10 rounded-full w-16"></div>
                              </div>
                              <div className="space-y-2 mb-3">
                                <div className="h-4 bg-white/10 rounded w-full"></div>
                                <div className="h-4 bg-white/10 rounded w-5/6"></div>
                              </div>
                              <div className="h-7 bg-white/10 rounded w-48 mb-3"></div>
                              <div className="h-4 bg-white/10 rounded w-32 mb-3"></div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="h-4 bg-white/10 rounded w-12"></div>
                                <div className="h-4 bg-white/10 rounded w-20"></div>
                                <div className="h-4 bg-white/10 rounded w-24"></div>
                                <div className="h-4 bg-white/10 rounded w-16"></div>
                              </div>
                            </div>
                            <div className="h-5 w-5 bg-white/10 rounded flex-shrink-0"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 px-6">
                      <div className="mb-6 p-6 bg-red-500/10 rounded-full border border-red-500/30">
                        <svg
                          className="w-16 h-16 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Error loading pull requests</h3>
                      <p className="text-white/60 text-center max-w-md mb-6">{error}</p>
                    </div>
                  ) : filteredPullRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 px-6">
                      <div className="mb-6 p-6 bg-[#121215] rounded-full border border-[#262626]">
                        <svg
                          className="w-16 h-16 text-white/20"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {activeFilter === 'open' ? 'No open pull requests' : 'No closed pull requests'}
                      </h3>
                      <p className="text-white/60 text-center max-w-md mb-6">
                        {activeFilter === 'open' 
                          ? 'There are no open pull requests for this repository. Pull requests will appear here when they are created.'
                          : 'There are no closed pull requests for this repository.'
                        }
                      </p>
                      {activeFilter === 'open' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#121215] border border-[#262626] rounded-lg text-white/40 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Pull requests are created on GitHub</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#262626]">
                      {filteredPullRequests.map((pr, index) => (
                        <div
                          key={pr.id}
                          onClick={() => {
                            setSelectedPR(pr);
                            setIsModalOpen(true);
                            setActiveTab('files');
                            setSelectedFile(null);
                            // Fetch files and commits when PR is opened
                            fetchPRFiles(pr.number);
                            fetchPRCommits(pr.number);
                          }}
                          className="px-6 py-5 hover:bg-[#121215] transition-all duration-200 cursor-pointer group border-l-4 border-transparent hover:border-[#5C42CE]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                {pr.state === 'open' && (
                                  <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded border border-green-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    Open
                                  </span>
                                )}
                                {pr.state === 'closed' && !pr.merged && (
                                  <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded border border-red-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                    Closed
                                  </span>
                                )}
                                {(pr.state === 'merged' || pr.merged) && (
                                  <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded border border-purple-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                    Merged
                                  </span>
                                )}
                                <h3 className="text-white font-semibold text-lg group-hover:text-[#5C42CE] transition-colors">
                                  {pr.title}
                                </h3>
                              </div>
                              
                              {/* Branch merge, commit, author, date all in one line */}
                              <div className="flex items-center gap-4 flex-wrap text-xs">
                                {pr.headBranch && pr.baseBranch && (
                                  <div className="inline-flex items-center gap-2 text-white/60 bg-[#121215] px-3 py-2 rounded border border-[#262626]">
                                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                    <span className="font-mono text-white/70">{pr.headBranch}</span>
                                    <span className="text-white/40">→</span>
                                    <span className="font-mono text-white/70">{pr.baseBranch}</span>
                                  </div>
                                )}
                                {pr.headCommitSha && (
                                  <div className="flex items-center gap-2 text-white/50">
                                    <span>Commit:</span>
                                    <span className="font-mono">{pr.headCommitSha.substring(0, 7)}</span>
                                </div>
                                )}
                                {pr.author && (
                                  <div className="flex items-center gap-2 text-white/50">
                                    <span>{pr.author}</span>
                                  </div>
                                )}
                                {pr.createdAt && (
                                  <div className="flex items-center gap-2 text-white/50">
                                    <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <svg
                                className="w-5 h-5 text-white/40 group-hover:text-[#5C42CE] transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>

      {/* PR Modal */}
      {isModalOpen && selectedPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-150 animate-[fadeIn_0.15s_ease-out]"
            onClick={() => {
              setIsModalOpen(false);
              setSelectedPR(null);
            }}
          />
          
          {/* Modal Content */}
          <div 
            className="relative z-10 bg-[#121215] rounded-xl border border-[#262626] p-8 w-full mx-4 shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden max-w-7xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedPR.title}</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedPR(null);
                }}
                className="text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Container with two columns */}
            <div className="overflow-hidden flex flex-row h-[600px] gap-0" data-modal-container>
              {/* Left Container */}
              <div 
                className="flex flex-col overflow-hidden border-r border-[#262626]"
                style={{ width: `${leftWidth}%`, minWidth: '200px', maxWidth: '80%' }}
              >
                {/* Tabs */}
                <div className="border-b border-[#262626] px-6">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('files')}
                      className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                        activeTab === 'files'
                          ? 'text-white'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Files Changed
                      {activeTab === 'files' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('commits')}
                      className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                        activeTab === 'commits'
                          ? 'text-white'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      Commits
                      {activeTab === 'commits' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C42CE]"></span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {activeTab === 'files' && (
                    <div>
                      {loadingFiles ? (
                        <div className="flex items-center justify-center py-20">
                          <div className="animate-spin">
                            <svg className="w-8 h-8 text-[#5C42CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        </div>
                      ) : prFiles.length === 0 ? (
                        <div className="text-center py-20 text-white/60">No files changed</div>
                      ) : (
                        <div className="space-y-4">
                          {prFiles.map((file, index) => {
                            const isExpanded = selectedFile === file.filename;
                            return (
                              <div key={index} className="border border-[#262626] rounded-lg overflow-hidden">
                                {/* File Header */}
                                <div 
                                  className="px-6 py-4 bg-[#121215] border-b border-[#262626] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                                  onClick={() => setSelectedFile(isExpanded ? null : file.filename)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        file.status === 'added' ? 'bg-green-500/20 text-green-400' :
                                        file.status === 'removed' ? 'bg-red-500/20 text-red-400' :
                                        'bg-blue-500/20 text-blue-400'
                                      }`}>
                                        {file.status}
                                      </span>
                                      <span className="text-white font-medium">{file.filename}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-4 text-sm text-white/60">
                                        <span className="text-green-400">+{file.additions}</span>
                                        <span className="text-red-400">-{file.deletions}</span>
                                      </div>
                                      <svg 
                                        className={`w-5 h-5 text-white/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Diff Content */}
                                {isExpanded && file.patch && (() => {
                                  const language = detectLanguage(file.filename);
                                  return (
                                    <div className="bg-[#1a1a1a] overflow-x-auto">
                                      {parseDiff(file.patch).map((line, lineIndex) => {
                                        if (line.type === 'header') {
                                          return (
                                            <div
                                              key={lineIndex}
                                              className="border-t border-b border-[#262626] bg-[#121215] py-2 px-4"
                                            >
                                              <span className="text-white/40 text-xs font-mono">{line.content}</span>
                                            </div>
                                          );
                                        }
                                        
                                        return (
                                          <div
                                            key={lineIndex}
                                            className={`font-mono text-sm flex ${
                                              line.type === 'add' ? 'bg-green-500/10' :
                                              line.type === 'remove' ? 'bg-red-500/10' :
                                              ''
                                            }`}
                                            style={{ minHeight: '24px' }}
                                          >
                                            {/* Old line number - Fixed position */}
                                            <div 
                                              className={`min-w-[3rem] w-auto text-right pr-3 py-1 text-xs border-r border-[#262626] bg-[#1a1a1a] flex-shrink-0 ${
                                                line.type === 'remove' ? 'bg-red-500/20' :
                                                ''
                                              }`} 
                                              style={{ 
                                                color: 'rgba(255, 255, 255, 0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                lineHeight: '24px',
                                                paddingLeft: '8px'
                                              }}
                                            >
                                              {line.type === 'remove' || line.type === 'context' ? line.oldLine || '' : ''}
                                            </div>
                                            {/* New line number - Fixed position */}
                                            <div 
                                              className={`min-w-[3rem] w-auto text-right pr-3 py-1 text-xs border-r border-[#262626] bg-[#1a1a1a] flex-shrink-0 ${
                                                line.type === 'add' ? 'bg-green-500/20' :
                                                ''
                                              }`} 
                                              style={{ 
                                                color: 'rgba(255, 255, 255, 0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                lineHeight: '24px',
                                                paddingLeft: '8px'
                                              }}
                                            >
                                              {line.type === 'add' || line.type === 'context' ? line.newLine || '' : ''}
                                            </div>
                                            {/* Code content with syntax highlighting and background */}
                                            <div 
                                              className={`flex-1 px-4 py-1 ${
                                                line.type === 'add' ? 'bg-green-500/10' :
                                                line.type === 'remove' ? 'bg-red-500/10' :
                                                'bg-[#1a1a1a]'
                                              }`} 
                                              style={{ 
                                                fontSize: '14px', 
                                                lineHeight: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                overflow: 'hidden'
                                              }}
                                            >
                                              {line.type === 'add' && <span className="text-green-400 mr-1 flex-shrink-0">+</span>}
                                              {line.type === 'remove' && <span className="text-red-400 mr-1 flex-shrink-0">-</span>}
                                              <span style={{ display: 'inline-block', width: '100%' }}>
                                                <SyntaxHighlighter
                                                  language={language}
                                                  style={vscDarkPlus}
                                                  customStyle={{
                                                    margin: 0,
                                                    padding: 0,
                                                    background: 'transparent',
                                                    fontSize: '14px',
                                                    lineHeight: '24px',
                                                    display: 'inline',
                                                  }}
                                                  PreTag="span"
                                                  CodeTag="span"
                                                >
                                                  {line.content}
                                                </SyntaxHighlighter>
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === 'commits' && (
                    <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6">
                      {loadingCommits ? (
                        <div className="flex items-center justify-center py-20">
                          <div className="animate-spin">
                            <svg className="w-8 h-8 text-[#5C42CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        </div>
                      ) : prCommits.length === 0 ? (
                        <div className="text-center py-20 text-white/60">No commits</div>
                      ) : (
                        <div className="divide-y divide-[#262626]">
                          {prCommits.map((commit, index) => (
                            <div key={index} className="py-4 hover:bg-[#121215] transition-colors rounded-lg px-2">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono text-sm text-[#5C42CE]">{commit.sha.substring(0, 7)}</span>
                                    <span className="text-white font-medium">{commit.message.split('\n')[0]}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-white/60">
                                    {commit.author.avatarUrl && (
                                      <img src={commit.author.avatarUrl} alt={commit.author.name} className="w-5 h-5 rounded-full" />
                                    )}
                                    <span>{commit.author.name || commit.author.login}</span>
                                    <span>{new Date(commit.author.date).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Resizable Divider */}
              <div
                className="w-[1px] bg-[#262626] relative group"
                style={{ flexShrink: 0 }}
              >
                {/* Drag Handle */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center bg-[#121215] border border-[#262626] rounded cursor-col-resize hover:border-[#5C42CE] hover:bg-[#1a1a1a] transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                  }}
                >
                  <div className="flex gap-1">
                    <div className="w-0.5 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-0.5 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-0.5 h-3 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                {/* Wider hit area for easier dragging */}
                <div 
                  className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                  }}
                />
              </div>

              {/* Right Container */}
              <div 
                className="flex flex-col overflow-hidden h-[550px]"
                style={{ width: `${100 - leftWidth}%`, minWidth: '200px' }}
              >
                {/* Right container content will go here */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

