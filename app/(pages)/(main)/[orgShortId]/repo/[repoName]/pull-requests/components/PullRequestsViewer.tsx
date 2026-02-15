'use client';

import { useState, useMemo } from 'react';
import TextInput from '@/app/components/TextInput';

interface PullRequestsViewerProps {
  repositoryId: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repoName: string;
}

type FilterType = 'open' | 'closed';

export default function PullRequestsViewer({
  repositoryId,
  repoFullName,
  orgShortId,
  repoUrlName,
  repoName,
}: PullRequestsViewerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [pullRequests] = useState<any[]>([]); // Empty for now, will be populated later

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

          {/* Main Container - Large Left Aligned */}
          <div className="flex gap-6">
            {/* Pull Requests List Container - Takes up most of the space */}
            <div className="flex-[0.95]">
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg overflow-hidden">
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

                {/* Pull Requests List or Empty State */}
                <div className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                  {filteredPullRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
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
                          className="px-6 py-5 hover:bg-[#121215] transition-all duration-200 cursor-pointer group border-l-4 border-transparent hover:border-[#5C42CE]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-white font-semibold text-lg group-hover:text-[#5C42CE] transition-colors">
                                  {pr.title}
                                </h3>
                                {pr.state === 'open' && (
                                  <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    Open
                                  </span>
                                )}
                                {pr.state === 'closed' && (
                                  <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                    Closed
                                  </span>
                                )}
                                {pr.state === 'merged' && (
                                  <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                    Merged
                                  </span>
                                )}
                              </div>
                              <p className="text-white/60 text-sm mb-4 line-clamp-2">
                                {pr.description || 'No description provided'}
                              </p>
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 text-xs text-white/50">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  <span className="font-mono">#{pr.number}</span>
                                </div>
                                {pr.author && (
                                  <div className="flex items-center gap-2 text-xs text-white/50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>{pr.author}</span>
                                  </div>
                                )}
                                {pr.createdAt && (
                                  <div className="flex items-center gap-2 text-xs text-white/50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {pr.commentsCount > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-white/50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{pr.commentsCount} {pr.commentsCount === 1 ? 'comment' : 'comments'}</span>
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

            {/* Sidebar - Right container (empty for now) */}
            <div className="flex-[0.05] min-w-[200px]">
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg overflow-hidden h-full">
              </div>
            </div>
          </div>

          {/* Bottom Container - Wide and long */}
          <div className="mt-6">
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg overflow-hidden w-full h-32">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

