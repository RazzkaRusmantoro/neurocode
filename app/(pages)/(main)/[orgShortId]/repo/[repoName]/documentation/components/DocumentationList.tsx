'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils/slug';
import { useLoadingBar } from '@/app/contexts/LoadingBarContext';
import type { DocumentationListItem } from './DocumentationViewer';

interface DocumentationListProps {
  items: DocumentationListItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  orgShortId: string;
  repoUrlName: string;
}

export default function DocumentationList({
  items,
  loading,
  error,
  searchQuery,
  onSearchChange,
  orgShortId,
  repoUrlName,
}: DocumentationListProps) {
  const router = useRouter();
  const { startLoading } = useLoadingBar();

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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      if (item.kind === 'doc') {
        const doc = item.doc;
        return (
          doc.title?.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.prompt?.toLowerCase().includes(query) ||
          doc.target?.toLowerCase().includes(query) ||
          doc.branch.toLowerCase().includes(query)
        );
      }
      const uml = item.uml;
      return (
        uml.name?.toLowerCase().includes(query) ||
        uml.description?.toLowerCase().includes(query) ||
        uml.prompt?.toLowerCase().includes(query) ||
        uml.type?.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery]);

  const handleItemClick = (item: DocumentationListItem) => {
    startLoading();
    if (item.kind === 'uml') {
      router.push(`/org-${orgShortId}/repo/${repoUrlName}/documentation/uml/${encodeURIComponent(item.uml.slug)}`);
      return;
    }
    const doc = item.doc;
    if (!doc.title) {
      console.error('Documentation has no title');
      return;
    }
    const slug = doc.slug || slugify(doc.title);
    router.push(`/org-${orgShortId}/repo/${repoUrlName}/documentation/${encodeURIComponent(slug)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-full">
            <div className="flex flex-col w-full">
              <div className="h-6 bg-white/10 rounded mb-2 animate-pulse w-full"></div>
              <div className="h-4 bg-white/10 rounded mb-4 w-2/3 animate-pulse"></div>
              <div className="pt-4 border-t border-white/10">
                <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-2">
          {searchQuery ? 'No documentations match your search' : 'No documentation found'}
        </p>
        <p className="text-white/40 text-sm">
          {searchQuery ? 'Try a different search term' : 'Generate documentation to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="flex flex-col gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.kind === 'doc' ? item.doc._id : `uml-${item.uml._id}`}
            onClick={() => handleItemClick(item)}
            className="w-full cursor-pointer group"
          >
            <div className="flex flex-col h-full hover:text-[var(--color-primary)] transition-colors">
              {item.kind === 'doc' ? (
                <>
                  {item.doc.title && (
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                      {item.doc.title}
                    </h3>
                  )}
                  {item.doc.description && (
                    <p className="text-white/50 text-sm mb-3 line-clamp-3">
                      {item.doc.description}
                    </p>
                  )}
                  {item.doc.target && (
                    <p className="text-white/50 text-sm mb-4 font-mono truncate">
                      {item.doc.target}
                    </p>
                  )}
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{formatDate(item.doc.createdAt)}</span>
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
                </>
              ) : (
                <>
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors flex items-center gap-2 flex-wrap">
                    <span>{item.uml.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/40">
                      UML
                    </span>
                  </h3>
                  {(item.uml.description ?? item.uml.prompt) && (
                    <p className="text-white/50 text-sm mb-3 line-clamp-3">
                      {item.uml.description ?? item.uml.prompt}
                    </p>
                  )}
                  <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{formatDate(item.uml.createdAt)}</span>
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
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

