'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarItem {
  id: string;
  label: string;
  subItems?: SidebarItem[];
}

interface DocumentationSidebarProps {
  activeSection: string | null;
  onSectionChange: (section: string) => void;
}

export default function DocumentationSidebar({ activeSection, onSectionChange }: DocumentationSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['2', '4', '5']));

  // Extract orgShortId and repoName from pathname
  const orgMatch = pathname.match(/\/org-([^/]+)/);
  const orgShortId = orgMatch ? `org-${orgMatch[1]}` : null;
  const repoMatch = pathname.match(/\/repo\/([^/]+)/);
  const repoName = repoMatch ? repoMatch[1] : null;

  const handleBackToDocumentations = useCallback(() => {
    if (orgShortId && repoName) {
      router.push(`/${orgShortId}/repo/${repoName}/documentation`);
    }
  }, [router, orgShortId, repoName]);

  // Sidebar navigation items with hierarchical structure
  const sidebarItems: SidebarItem[] = [
    { id: '1', label: '1.', subItems: [{ id: '1.1', label: '1.1' }] },
    { 
      id: '2', 
      label: '2.', 
      subItems: [
        { id: '2.1', label: '2.1' },
        { id: '2.2', label: '2.2' },
        { id: '2.3', label: '2.3' },
      ] 
    },
    { id: '3', label: '3.' },
    { id: '4', label: '4.', subItems: [{ id: '4.1', label: '4.1' }] },
    { 
      id: '5', 
      label: '5.', 
      subItems: [
        { id: '5.1', label: '5.1' },
        { id: '5.2', label: '5.2' },
      ] 
    },
    { id: 'code-references', label: 'Code References' },
    { id: 'glossary', label: 'Glossary' },
  ];

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isExpanded = (itemId: string) => expandedItems.has(itemId);

  return (
    <aside className="w-80 bg-[#121215] rounded-tr-lg rounded-br-lg border-r border-[#262626] flex-shrink-0 h-full overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 pl-8 pr-4">
          <img 
            src="/Full-logo.png" 
            alt="Logo" 
            className="h-10 w-auto"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-[#262626]"></div>

        {/* Search Bar */}
        <div className="px-4 pt-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-white text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#5C42CE] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Back to Documentations Button */}
        {orgShortId && repoName && (
          <div className="px-4 pt-4 pb-3">
            <button
              onClick={handleBackToDocumentations}
              className="w-full text-left pl-4 py-2.5 text-sm rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer text-white/60 hover:text-white hover:bg-[#2a2a2a]/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Documentations</span>
            </button>
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">
          <h2 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
            Navigation
          </h2>
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isItemExpanded = isExpanded(item.id);
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        toggleExpand(item.id);
                      } else {
                        onSectionChange(item.id);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors rounded-lg flex items-center justify-between cursor-pointer ${
                      hasSubItems
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : activeSection === item.id
                        ? 'bg-[#5C42CE]/20 text-white border-l-2 border-[#5C42CE] pl-2.5'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    {hasSubItems && (
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isItemExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  
                  {hasSubItems && isItemExpanded && (
                    <div className="pl-4 mt-1">
                      {item.subItems!.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => onSectionChange(subItem.id)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors rounded-lg cursor-pointer ${
                            activeSection === subItem.id
                              ? 'bg-[#5C42CE]/20 text-white border-l-2 border-[#5C42CE] pl-2.5'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

