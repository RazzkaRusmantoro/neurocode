'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import TextInput from '@/app/components/TextInput';

type TabType = 'documentation' | 'visual-tree' | 'code-reference' | 'glossary';

export type DocTypeFilter = 'all' | 'doc' | 'uml';

const TYPE_FILTER_VALUES = ['all', 'doc', 'uml'] as const;

interface DocumentationHeaderProps {
  activeTab: TabType;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onGenerateClick?: () => void;
  typeFilter?: DocTypeFilter;
  onTypeFilterChange?: (filter: DocTypeFilter) => void;
}

export default function DocumentationHeader({
  activeTab,
  searchQuery = '',
  onSearchChange,
  onGenerateClick,
  typeFilter = 'all',
  onTypeFilterChange,
}: DocumentationHeaderProps) {
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; transition: string }>({
    left: 0,
    width: 0,
    transition: 'none',
  });
  const prevTypeFilter = useRef<DocTypeFilter | null>(null);

  useLayoutEffect(() => {
    if (!onTypeFilterChange || activeTab !== 'documentation') return;
    const idx = TYPE_FILTER_VALUES.indexOf(typeFilter);
    const btn = buttonRefs.current[idx];
    const container = filterContainerRef.current;
    if (btn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const isInitialMount = prevTypeFilter.current === null;
      const isUserSwitch = prevTypeFilter.current !== null && prevTypeFilter.current !== typeFilter;
      prevTypeFilter.current = typeFilter;
      setPillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        transition: isInitialMount ? 'none' : isUserSwitch ? 'left 0.25s ease-out, width 0.25s ease-out' : 'none',
      });
    }
  }, [typeFilter, activeTab, onTypeFilterChange]);

  const getTitle = () => {
    switch (activeTab) {
      case 'documentation':
        return 'Documentation';
      case 'visual-tree':
        return 'Visual Tree';
      case 'code-reference':
        return 'Code Reference';
      case 'glossary':
        return 'Glossary';
      default:
        return '';
    }
  };

  return (
    <div className="flex justify-between items-center mb-6 gap-4">
      <h2 className="text-2xl font-bold text-white">
        {getTitle()}
      </h2>
      {activeTab === 'documentation' && (
        <div className="flex items-center gap-4 flex-wrap">
          {/* Type filter: All / Textual / UML */}
          {onTypeFilterChange && (
            <div
              ref={filterContainerRef}
              className="relative flex rounded-lg bg-white/5 border border-white/10 p-0.5"
            >
              {/* Sliding pill behind active tab - only show once positioned to avoid flash */}
              {pillStyle.width > 0 && (
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-md bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.15)] pointer-events-none"
                  style={{
                    left: pillStyle.left,
                    width: pillStyle.width,
                    transition: pillStyle.transition,
                  }}
                />
              )}
              {TYPE_FILTER_VALUES.map((value, index) => (
                <button
                  key={value}
                  ref={el => { buttonRefs.current[index] = el; }}
                  type="button"
                  onClick={() => onTypeFilterChange(value)}
                  className={`relative z-10 cursor-pointer px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ease-out ${
                    typeFilter === value
                      ? 'text-[var(--color-primary)]'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {value === 'all' ? 'All' : value === 'doc' ? 'Textual' : 'UML'}
                </button>
              ))}
            </div>
          )}
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
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search documentations..."
              className="w-full pl-10"
            />
          </div>
          <button
            type="button"
            onClick={onGenerateClick}
            className="relative px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded text-white text-sm font-semibold overflow-hidden transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.4)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-[1]">
              Generate Documentation
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
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
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search code references..."
              className="w-full pl-10"
            />
          </div>
        </div>
      )}
    </div>
  );
}

