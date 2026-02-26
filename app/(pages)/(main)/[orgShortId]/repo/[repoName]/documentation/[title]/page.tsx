'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDocumentation } from '../context/DocumentationContext';
import CodeSnippet from '../components/CodeSnippet';
import { slugify } from '@/lib/utils/slug';

// Segment types: paragraph (inline content), fenced code block, or markdown table
type DocSegment =
  | { type: 'paragraph'; content: (string | React.ReactElement)[] }
  | { type: 'code'; content: string; language?: string }
  | { type: 'table'; rows: string[][] };

// Parse inline patterns in a text string: [[text]], `text`, **text**
function parseInline(
  text: string,
  onCodeRefClick?: (codeRefId: string) => void,
  keyStart: number = 0
): { parts: (string | React.ReactElement)[]; nextKey: number } {
  const parts: (string | React.ReactElement)[] = [];
  let key = keyStart;
  let hasMatches = false;
  const allMatches: Array<{ type: 'link' | 'code' | 'bold'; start: number; end: number; text: string; priority: number }> = [];
  const patterns = [
    { regex: /`\[\[([^\]]+)\]\]`/g, type: 'link', priority: 4 },
    { regex: /\[\[([^\]]+)\]\]/g, type: 'link', priority: 3 },
    { regex: /`([^`\n]+)`/g, type: 'code', priority: 2 },
    { regex: /\*\*([^*\n]+?)\*\*/g, type: 'bold', priority: 1 },
  ];
  patterns.forEach(({ regex, type, priority }) => {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({ type: type as 'link' | 'code' | 'bold', start: match.index, end: match.index + match[0].length, text: match[1], priority });
    }
  });
  allMatches.sort((a, b) => (a.start !== b.start ? a.start - b.start : b.priority - a.priority));
  const filteredMatches: typeof allMatches = [];
  for (const current of allMatches) {
    let shouldAdd = true;
    for (let i = 0; i < filteredMatches.length; i++) {
      const existing = filteredMatches[i];
      if (current.start < existing.end && current.end > existing.start) {
        if (current.priority > existing.priority) filteredMatches[i] = current;
        shouldAdd = false;
        break;
      }
    }
    if (shouldAdd) filteredMatches.push(current);
  }
  filteredMatches.sort((a, b) => a.start - b.start);
  let lastIndex = 0;
  for (const match of filteredMatches) {
    hasMatches = true;
    if (match.start > lastIndex) parts.push(text.substring(lastIndex, match.start));
    const cleanText = match.text.replace(/[`\[\]]/g, '');
    if (match.type === 'link') {
      const codeRefId = `code-ref-${cleanText}`;
      parts.push(
        <a
          key={key++}
          href={`#${codeRefId}`}
          onClick={(e) => {
            e.preventDefault();
            if (onCodeRefClick) onCodeRefClick(codeRefId);
            else {
              const el = document.getElementById(codeRefId);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              else document.getElementById('code-references-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="inline px-1.5 py-0.5 rounded text-[#3fb1c5] cursor-pointer hover:text-[#5dd5e8] transition-colors"
          style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)', textDecoration: 'underline', textDecorationThickness: '0.5px', textUnderlineOffset: '2px' }}
        >
          {cleanText}
        </a>
      );
    } else if (match.type === 'code') {
      parts.push(<span key={key++} className="inline px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: 'rgba(128, 128, 128, 0.3)' }}>{cleanText}</span>);
    } else if (match.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold text-white">{match.text}</strong>);
    }
    lastIndex = match.end;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return { parts: hasMatches ? parts : [text], nextKey: key };
}

// Code block styling to match CodeSnippet look (no component)
const codeBlockStyle = 'mt-4 border border-white/20 rounded bg-[#1a1a1a] overflow-x-auto';
const codeBlockPreStyle = 'p-4 text-white/90 text-[13px] leading-[1.5] font-mono whitespace-pre';

// Split text into table blocks and paragraph blocks (for Markdown tables)
function splitTablesAndParagraphs(text: string): Array<{ type: 'table'; rows: string[][] } | { type: 'paragraph'; content: string }> {
  const result: Array<{ type: 'table'; rows: string[][] } | { type: 'paragraph'; content: string }> = [];
  const lines = text.split('\n');
  let i = 0;
  const isTableLine = (line: string) => /^\|.+\|$/.test(line.trim());
  const isSeparatorLine = (cells: string[]) => cells.every((c) => /^[\s\-:]+$/.test(c));
  while (i < lines.length) {
    if (isTableLine(lines[i])) {
      const tableRows: string[][] = [];
      let j = i;
      while (j < lines.length && isTableLine(lines[j])) {
        const cells = lines[j].trim().split('|').map((c) => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
        tableRows.push(cells);
        j++;
      }
      if (tableRows.length >= 2 && isSeparatorLine(tableRows[1])) tableRows.splice(1, 1);
      if (tableRows.length >= 1) {
        result.push({ type: 'table', rows: tableRows });
        i = j;
        continue;
      }
    }
    let paraStart = i;
    while (i < lines.length && !isTableLine(lines[i])) i++;
    const paraContent = lines.slice(paraStart, i).join('\n');
    if (paraContent.trim().length > 0) result.push({ type: 'paragraph', content: paraContent });
  }
  return result;
}

// Parse description: supports ``` fenced code blocks, markdown tables, and inline [[links]], `code`, **bold**
function parseDescription(
  description: string,
  onCodeRefClick?: (codeRefId: string) => void
): DocSegment[] {
  const segments: DocSegment[] = [];
  const fenceRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let key = 0;
  let lastEnd = 0;
  let match;
  while ((match = fenceRegex.exec(description)) !== null) {
    const before = description.slice(lastEnd, match.index).trimEnd();
    if (before.length > 0) {
      for (const block of splitTablesAndParagraphs(before)) {
        if (block.type === 'table') {
          segments.push({ type: 'table', rows: block.rows });
        } else {
          const { parts, nextKey } = parseInline(block.content, onCodeRefClick, key);
          key = nextKey;
          segments.push({ type: 'paragraph', content: parts });
        }
      }
    }
    const language = match[1]?.trim() || undefined;
    const codeContent = match[2].replace(/\n$/, '');
    segments.push({ type: 'code', content: codeContent, language });
    lastEnd = fenceRegex.lastIndex;
  }
  const after = description.slice(lastEnd);
  if (after.length > 0) {
    for (const block of splitTablesAndParagraphs(after)) {
      if (block.type === 'table') {
        segments.push({ type: 'table', rows: block.rows });
      } else {
        const { parts, nextKey } = parseInline(block.content, onCodeRefClick, key);
        key = nextKey;
        segments.push({ type: 'paragraph', content: parts });
      }
    }
  }
  if (segments.length === 0) {
    for (const block of splitTablesAndParagraphs(description)) {
      if (block.type === 'table') {
        segments.push({ type: 'table', rows: block.rows });
      } else {
        const { parts, nextKey } = parseInline(block.content, onCodeRefClick, key);
        key = nextKey;
        segments.push({ type: 'paragraph', content: parts });
      }
    }
  }
  return segments;
}

interface CodeReferenceDetail {
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

interface DocumentationContent {
  _id: string;
  title: string;
  metadata: {
    title: string;
    generated_at?: string;
    prompt?: string;
    repository?: string;
    branch?: string;
    scope?: string;
  };
  documentation: {
    sections: Array<{
      id: string;
      title: string;
      description: string;
      code_references?: string[];
      subsections?: Array<{
        id: string;
        title: string;
        description: string;
        code_references?: string[];
      }>;
    }>;
  };
  code_references?: (string | CodeReferenceDetail)[];
}

export default function DocumentationTitlePage() {
  const router = useRouter();
  const params = useParams<{
    orgShortId: string;
    repoName: string;
    title: string | string[];
  }>();
  const searchParams = useSearchParams();
  const { setDocumentation, setActiveSection } = useDocumentation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<DocumentationContent | null>(null);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const legacyTitleQuery = searchParams.get('title');
        const rawParamTitle = Array.isArray(params?.title) ? params.title[0] : params?.title;

        // Prefer dynamic route param `[title]`, fallback to legacy `?title=`
        const isLegacyPlaceholder = rawParamTitle === 'title' && !!legacyTitleQuery;
        const rawTitle = isLegacyPlaceholder ? legacyTitleQuery : (rawParamTitle ?? legacyTitleQuery);
        if (!rawTitle) {
          setError('No title provided');
          setLoading(false);
          return;
        }

        let decodedTitle = rawTitle;
        try {
          decodedTitle = decodeURIComponent(rawTitle);
        } catch {
          // keep rawTitle as-is if decoding fails
        }

        // If user hit the legacy URL `/documentation/title?title=<realTitle>`,
        // replace it with the canonical `/documentation/<realTitle>`.
        if (isLegacyPlaceholder && params?.orgShortId && params?.repoName) {
          const canonicalSlug = slugify(decodedTitle) || decodedTitle;
          const canonicalPath = `/${params.orgShortId}/repo/${params.repoName}/documentation/${encodeURIComponent(canonicalSlug)}`;
          router.replace(canonicalPath);
        }

        const response = await fetch(`/api/documentation/content/${encodeURIComponent(decodedTitle)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch documentation');
        }

        const data = await response.json();
        if (data.success) {
          setContent(data.documentation);

          // Ensure the URL uses the slug derived from the real documentation title
          const realTitle: string | undefined = data.documentation?.title;
          const expectedSlug = realTitle ? slugify(realTitle) : '';
          const currentParam = Array.isArray(params?.title) ? params.title[0] : params?.title;
          let currentSlug = currentParam || '';
          try {
            currentSlug = currentParam ? decodeURIComponent(currentParam) : '';
          } catch {
            // keep currentParam as-is if decoding fails
          }
          if (
            expectedSlug &&
            currentParam &&
            params?.orgShortId &&
            params?.repoName &&
            currentSlug !== expectedSlug
          ) {
            const canonicalPath = `/${params.orgShortId}/repo/${params.repoName}/documentation/${encodeURIComponent(expectedSlug)}`;
            router.replace(canonicalPath);
          }

          // Update context for sidebar
          setDocumentation({
            title: data.documentation.title,
            sections: data.documentation.documentation?.sections || [],
            code_references: data.documentation.code_references || [],
          });
        } else {
          throw new Error(data.error || 'Failed to fetch documentation');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching documentation:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch when we have either the dynamic param title or the legacy query param
    if (params?.title || searchParams.get('title')) {
      fetchDocumentation();
    }
  }, [params?.orgShortId, params?.repoName, params?.title, router, searchParams, setDocumentation]);

  // Optimized scroll detection with throttling
  const observerRef = useRef<IntersectionObserver | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveSectionRef = useRef<string | null>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const programmaticScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Throttled function to update active section
  const updateActiveSection = useCallback((sectionId: string) => {
    // Skip updates during programmatic scrolling
    if (isProgrammaticScrollRef.current) {
      return;
    }

    // Only update if it's different from the last one
    if (sectionId === lastActiveSectionRef.current) {
      return;
    }

    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Throttle updates to avoid too many state changes
    updateTimeoutRef.current = setTimeout(() => {
      lastActiveSectionRef.current = sectionId;
      setActiveSection(sectionId);
    }, 200); // Increased to 200ms for better performance during scrolling
  }, [setActiveSection]);

  // Handler for code reference clicks - pauses observer during scroll
  const handleCodeRefClick = useCallback((codeRefId: string) => {
    // Disable observer updates during programmatic scroll to prevent lag
    isProgrammaticScrollRef.current = true;
    
    // Clear any existing timeout
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }
    
    // Try to find the specific code reference first
    const specificRef = document.getElementById(codeRefId);
    if (specificRef) {
      specificRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback to code references section
      const codeRefSection = document.getElementById('code-references-section');
      if (codeRefSection) {
        codeRefSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    
    // Re-enable observer updates after scroll completes (smooth scroll takes ~500-1000ms)
    programmaticScrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      // Manually update active section after scroll completes
      const targetId = specificRef ? codeRefId : 'code-references-section';
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const sectionId = targetId.startsWith('code-ref-') 
          ? targetId 
          : targetId.replace(/^(section|subsection)-/, '');
        lastActiveSectionRef.current = sectionId;
        setActiveSection(sectionId);
      }
    }, 1000); // Wait for smooth scroll to complete
  }, [setActiveSection]);

  // Scroll detection to update active section (optimized)
  useEffect(() => {
    if (!content?.documentation?.sections) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Cleanup timeouts on unmount
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }

    const sections = content.documentation.sections;
    const allSectionIds: string[] = [];
    
    // Collect all section and subsection IDs
    sections.forEach(section => {
      allSectionIds.push(`section-${section.id}`);
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          allSectionIds.push(`subsection-${subsection.id}`);
        });
      }
    });
    
    // Add code references section if it exists
    if (content.code_references && content.code_references.length > 0) {
      allSectionIds.push('code-references-section');
      // Also add individual code reference IDs for scroll detection
      content.code_references.forEach((ref) => {
        if (typeof ref === 'object' && 'referenceId' in ref) {
          allSectionIds.push(`code-ref-${ref.referenceId || ref.name}`);
        } else if (typeof ref === 'string') {
          allSectionIds.push(`code-ref-${ref}`);
        }
      });
    }

    // Use a single observer with optimized options
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -70% 0px', // More lenient margins for better performance
      threshold: [0, 0.1, 0.5], // Multiple thresholds for better detection
    };

    // Track visible sections
    const visibleSections = new Map<string, number>();

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Skip processing during programmatic scrolling to avoid lag
      if (isProgrammaticScrollRef.current) {
        return;
      }

      // Batch process all entries
      entries.forEach(entry => {
        const target = entry.target as HTMLElement;
        if (!target.id) return;

        if (entry.isIntersecting) {
          visibleSections.set(target.id, entry.intersectionRatio);
        } else {
          visibleSections.delete(target.id);
        }
      });

      // Find the most visible section
      if (visibleSections.size === 0) return;

      let mostVisibleId: string | null = null;
      let highestRatio = 0;
      
      for (const [id, ratio] of visibleSections.entries()) {
        if (ratio > highestRatio) {
          highestRatio = ratio;
          mostVisibleId = id;
        }
      }

      // Update active section (throttled)
      if (mostVisibleId) {
        let sectionId: string;
        if (mostVisibleId.startsWith('code-ref-')) {
          sectionId = mostVisibleId;
        } else {
          sectionId = mostVisibleId.replace(/^(section|subsection)-/, '');
        }
        updateActiveSection(sectionId);
      }
    };

    // Create a single observer for all sections
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    observerRef.current = observer;

    // Observe all sections
    allSectionIds.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
      visibleSections.clear();
    };
  }, [content, updateActiveSection]);

  if (loading) {
    return (
      <div className="h-full flex flex-col overflow-y-auto custom-scrollbar py-6">
        <div className="max-w-screen-2xl mx-auto w-full px-6 flex-1 flex flex-col min-h-0">
          <div className="animate-pulse flex-1 flex flex-col">
            <div className="h-8 bg-white/10 rounded w-3/4 mb-6 flex-shrink-0" />
            <div className="space-y-4 flex-1 flex flex-col">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-white/10 rounded flex-shrink-0"
                  style={{ width: i % 3 === 0 ? '100%' : i % 3 === 1 ? '83%' : '66%' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar py-6">
        <div className="max-w-screen-2xl mx-auto w-full px-6">
          <div className="bg-red-500/10 border border-red-500/50 rounded p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar py-6">
        <div className="max-w-screen-2xl mx-auto w-full px-6">
          <p className="text-white/60">Documentation not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar py-6">
      <div className="max-w-screen-2xl mx-auto w-full px-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4 text-left">
          {content.title}
        </h1>
        <div className="border-t-2 border-white/20 mb-10" />

        {/* Sections */}
        {content.documentation?.sections && content.documentation.sections.length > 0 && (
          <div className="space-y-12">
            {content.documentation.sections.map((section, index) => (
              <div key={section.id} id={`section-${section.id}`} className="scroll-mt-6">
                {/* Horizontal line break between sections */}
                {index > 0 && (
                  <div className="border-t-2 border-white/20 mb-16 mt-16"></div>
                )}
                
                {/* Section Title */}
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {section.id}. {section.title}
                </h2>

                {/* Section Description */}
                <div className="prose prose-invert max-w-none mb-6 space-y-2">
                  {parseDescription(section.description, handleCodeRefClick).map((seg, i) =>
                    seg.type === 'code' ? (
                      <div key={i} className={codeBlockStyle}>
                        <pre className={codeBlockPreStyle}>{seg.content}</pre>
                      </div>
                    ) : seg.type === 'table' ? (
                      <div key={i} className="my-4 overflow-x-auto">
                        <table className="w-full border-collapse border border-white/20 text-sm text-white/90">
                          <tbody>
                            {seg.rows.map((row, ri) => (
                              <tr key={ri}>
                                {row.map((cell, ci) => (
                                  <td key={ci} className="border border-white/20 px-3 py-2 text-left">
                                    {ri === 0 ? <strong>{cell}</strong> : cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p key={i} className="text-white/80 leading-relaxed whitespace-pre-wrap">
                        {seg.content}
                      </p>
                    )
                  )}
                </div>

                {/* Subsections */}
                {section.subsections && section.subsections.length > 0 && (
                  <div className="ml-6 mt-8 space-y-8">
                    {section.subsections.map((subsection) => (
                      <div key={subsection.id} id={`subsection-${subsection.id}`} className="scroll-mt-6">
                        {/* Subsection Title */}
                        <h3 className="text-xl font-semibold text-white mb-3">
                          {subsection.id}. {subsection.title}
                        </h3>

                        {/* Subsection Description */}
                        <div className="prose prose-invert max-w-none mb-4 space-y-2">
                          {parseDescription(subsection.description, handleCodeRefClick).map((seg, i) =>
                            seg.type === 'code' ? (
                              <div key={i} className={codeBlockStyle}>
                                <pre className={codeBlockPreStyle}>{seg.content}</pre>
                              </div>
                            ) : seg.type === 'table' ? (
                              <div key={i} className="my-4 overflow-x-auto">
                                <table className="w-full border-collapse border border-white/20 text-sm text-white/90">
                                  <tbody>
                                    {seg.rows.map((row, ri) => (
                                      <tr key={ri}>
                                        {row.map((cell, ci) => (
                                          <td key={ci} className="border border-white/20 px-3 py-2 text-left">
                                            {ri === 0 ? <strong>{cell}</strong> : cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p key={i} className="text-white/80 leading-relaxed whitespace-pre-wrap">
                                {seg.content}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Code References Section */}
        {content.code_references && content.code_references.length > 0 && (
          <div id="code-references-section" className="mt-12 pt-8 border-t border-white/10 scroll-mt-6">
            <h2 className="text-2xl font-semibold text-white mb-8">Code References</h2>
            <div className="space-y-8">
              {content.code_references.map((ref, idx) => {
                // Handle both string (fallback) and detailed object
                const isDetailed = typeof ref === 'object' && 'description' in ref;
                const refDetail = isDetailed ? ref as CodeReferenceDetail : null;
                const refName = isDetailed ? refDetail!.name : ref as string;
                const refDescription = refDetail?.description || '';
                const refParameters = refDetail?.parameters || [];
                const refSignature = refDetail?.signature;
                const refReturns = refDetail?.returns;
                const refCode = refDetail?.code;

                // Get reference ID for scrolling
                const refId = isDetailed ? (refDetail!.referenceId || refDetail!.name) : (ref as string);

                return (
                  <div key={idx} id={`code-ref-${refId}`} className="scroll-mt-6">
                    {/* Code Reference Header */}
                    <div className="mb-3">
                      <h3 className="text-xl font-semibold text-white font-mono mb-2">
                        {refName}
                      </h3>
                      {refSignature && (
                        <div className="text-white/70 text-sm font-mono">
                          {refDetail?.type && (
                            <span className="text-white/60 mr-2">
                              {refDetail.type}
                            </span>
                          )}
                          {refSignature}
                        </div>
                      )}
                    </div>
                    
                    {/* Code Reference Description */}
                    {refDescription && (
                      <div className="prose prose-invert max-w-none mb-4 space-y-2">
                        {parseDescription(refDescription, handleCodeRefClick).map((seg, i) =>
                          seg.type === 'code' ? (
                            <div key={i} className={codeBlockStyle}>
                              <pre className={codeBlockPreStyle}>{seg.content}</pre>
                            </div>
                          ) : seg.type === 'table' ? (
                            <div key={i} className="my-4 overflow-x-auto">
                              <table className="w-full border-collapse border border-white/20 text-sm text-white/90">
                                <tbody>
                                  {seg.rows.map((row, ri) => (
                                    <tr key={ri}>
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="border border-white/20 px-3 py-2 text-left">
                                          {ri === 0 ? <strong>{cell}</strong> : cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p key={i} className="text-white/80 leading-relaxed whitespace-pre-wrap">
                              {seg.content}
                            </p>
                          )
                        )}
                      </div>
                    )}
                    
                    {/* Parameters Section */}
                    {refParameters && refParameters.length > 0 && (
                      <div className="mt-4 mb-4">
                        <h4 className="text-sm font-semibold text-white/60 mb-3">Parameters:</h4>
                        <div className="space-y-3 ml-4">
                          {refParameters.map((param, paramIdx) => (
                            <div key={paramIdx} className="border-l-2 border-white/10 pl-4">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-mono text-[#3fb1c5]">{param.name}</span>
                              </div>
                              {param.description && (
                                <div className="text-white/60 text-sm mt-1 ml-0 space-y-2">
                                  {parseDescription(param.description, handleCodeRefClick).map((seg, i) =>
                                    seg.type === 'code' ? (
                                      <div key={i} className={codeBlockStyle}>
                                        <pre className={codeBlockPreStyle}>{seg.content}</pre>
                                      </div>
                                    ) : seg.type === 'table' ? (
                                      <div key={i} className="my-2 overflow-x-auto">
                                        <table className="w-full border-collapse border border-white/20 text-sm text-white/90">
                                          <tbody>
                                            {seg.rows.map((row, ri) => (
                                              <tr key={ri}>
                                                {row.map((cell, ci) => (
                                                  <td key={ci} className="border border-white/20 px-2 py-1 text-left">
                                                    {ri === 0 ? <strong>{cell}</strong> : cell}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p key={i}>{seg.content}</p>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Code Snippet Section */}
                    {refCode && (
                      <CodeSnippet code={refCode} language={refDetail?.type === 'class' ? 'typescript' : undefined} />
                    )}
                    
                    {/* Returns Section */}
                    {refReturns && (
                      <div className="mt-4 mb-4">
                        <h4 className="text-sm font-semibold text-white/60 mb-2">Returns:</h4>
                        <div className="ml-4">
                          {refReturns.type && (
                            <span className="font-mono text-[#3fb1c5]">{refReturns.type}</span>
                          )}
                          {refReturns.description && (
                            <div className="text-white/60 text-sm mt-1 space-y-2">
                              {parseDescription(refReturns.description, handleCodeRefClick).map((seg, i) =>
                                seg.type === 'code' ? (
                                  <div key={i} className={codeBlockStyle}>
                                    <pre className={codeBlockPreStyle}>{seg.content}</pre>
                                  </div>
                                ) : seg.type === 'table' ? (
                                  <div key={i} className="my-2 overflow-x-auto">
                                    <table className="w-full border-collapse border border-white/20 text-sm text-white/90">
                                      <tbody>
                                        {seg.rows.map((row, ri) => (
                                          <tr key={ri}>
                                            {row.map((cell, ci) => (
                                              <td key={ci} className="border border-white/20 px-2 py-1 text-left">
                                                {ri === 0 ? <strong>{cell}</strong> : cell}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p key={i}>{seg.content}</p>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
