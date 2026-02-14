'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDocumentation } from '../context/DocumentationContext';
import CodeSnippet from '../components/CodeSnippet';

// Function to parse description and convert markdown lists, [[text]] to styled links, `text` to styled text, and **text** to bold
function parseDescription(
  description: string,
  onCodeRefClick?: (codeRefId: string) => void
): (string | React.ReactElement)[] {
  // First, parse lists (bullet points and numbered lists)
  const parts: (string | React.ReactElement)[] = [];
  let key = 0;
  
  // Split by lines to identify list items
  const lines = description.split('\n');
  let currentList: Array<{ type: 'bullet' | 'numbered'; content: string }> = [];
  let listType: 'bullet' | 'numbered' | null = null;
  let nonListParts: string[] = [];
  
  const flushNonList = () => {
    if (nonListParts.length > 0) {
      const nonListText = nonListParts.join('\n');
      if (nonListText.trim()) {
        // Split by double newlines (or more) to create paragraphs
        // This preserves single \n within paragraphs and treats \n\n as paragraph breaks
        const paragraphs = nonListText.split(/\n\s*\n+/);
        
        paragraphs.forEach((para, idx) => {
          if (para.trim()) {
            // Replace single newlines within paragraph with spaces (or keep them for line breaks)
            // For now, we'll replace single \n with spaces to keep paragraphs flowing
            const cleanedPara = para.replace(/\n/g, ' ').trim();
            
            // Parse the paragraph for other markdown (links, code, bold)
            const parsed = parseMarkdown(cleanedPara, onCodeRefClick, key);
            parts.push(...parsed.elements);
            key = parsed.nextKey;
            
            // Add spacing between paragraphs (except for the last one)
            if (idx < paragraphs.length - 1) {
              parts.push(<br key={key++} />);
              parts.push(<br key={key++} />);
            }
          }
        });
      }
      nonListParts = [];
    }
  };
  
  const flushList = () => {
    if (currentList.length > 0) {
      flushNonList();
      if (listType === 'bullet') {
        parts.push(
          <ul key={key++} className="list-disc list-inside space-y-2 my-4 text-white/80 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseMarkdown(item.content, onCodeRefClick, key).elements}
              </li>
            ))}
          </ul>
        );
      } else if (listType === 'numbered') {
        parts.push(
          <ol key={key++} className="list-decimal list-inside space-y-2 my-4 text-white/80 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {parseMarkdown(item.content, onCodeRefClick, key).elements}
              </li>
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };
  
  for (const line of lines) {
    // Check for bullet point (starts with - or * followed by space)
    const bulletMatch = line.match(/^[\s]*[-*][\s]+(.+)$/);
    // Check for numbered list (starts with number followed by . and space)
    const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    
    if (bulletMatch) {
      if (listType === 'numbered') {
        flushList();
      }
      listType = 'bullet';
      currentList.push({ type: 'bullet', content: bulletMatch[1] });
    } else if (numberedMatch) {
      if (listType === 'bullet') {
        flushList();
      }
      listType = 'numbered';
      currentList.push({ type: 'numbered', content: numberedMatch[1] });
    } else {
      // Not a list item
      // If it's an empty line and we're in a list, continue the list (don't break it)
      if (line.trim() === '' && listType !== null) {
        // Empty line within list - keep the list going
        continue;
      }
      // If we have a list and hit non-empty non-list content, flush the list
      if (listType !== null) {
        flushList();
      }
      nonListParts.push(line);
    }
  }
  
  // Flush any remaining list or non-list content
  flushList();
  flushNonList();
  
  return parts.length > 0 ? parts : [description];
}

// Function to parse markdown (links, code, bold) - used by parseDescription
function parseMarkdown(
  text: string,
  onCodeRefClick?: (codeRefId: string) => void,
  startKey: number = 0
): { elements: (string | React.ReactElement)[]; nextKey: number } {
  const parts: (string | React.ReactElement)[] = [];
  let key = startKey;
  let hasMatches = false;

  // Find all matches for patterns: [[text]], `text`, and **text**
  // Priority: First match `[[text]]` patterns (with or without backticks), then regular backticked text, then bold text
  const allMatches: Array<{ type: 'link' | 'code' | 'bold'; start: number; end: number; text: string }> = [];
  
  // First, find `[[text]]` patterns (backticks around double brackets) - this takes priority
  const backtickedLinkRegex = /`\[\[([^\]]+)\]\]`/g;
  let match;
  while ((match = backtickedLinkRegex.exec(text)) !== null) {
    allMatches.push({
      type: 'link',
      start: match.index,
      end: match.index + match[0].length,
      text: match[1], // Just the text inside brackets, no backticks
    });
  }
  
  // Then find [[text]] patterns without backticks (but not already matched)
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  linkRegex.lastIndex = 0;
  while ((match = linkRegex.exec(text)) !== null) {
    // Check if this match is already covered by a backticked link match
    let alreadyMatched = false;
    for (const existingMatch of allMatches) {
      if (existingMatch.type === 'link' &&
          match.index >= existingMatch.start &&
          match.index < existingMatch.end) {
        alreadyMatched = true;
        break;
      }
    }
    
    if (!alreadyMatched) {
      allMatches.push({
        type: 'link',
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
      });
    }
  }
  
  // Finally, find `text` patterns (backticks) - but exclude those that wrap [[text]]
  const codeRegex = /`([^`\n]+)`/g;
  codeRegex.lastIndex = 0;
  while ((match = codeRegex.exec(text)) !== null) {
    // Make sure we're not inside a [[ ]] pattern or a backticked [[ ]] pattern
    let isInsideLink = false;
    for (const linkMatch of allMatches) {
      if (linkMatch.type === 'link' && 
          match.index >= linkMatch.start && 
          match.index < linkMatch.end) {
        isInsideLink = true;
        break;
      }
    }
    
    if (!isInsideLink) {
      allMatches.push({
        type: 'code',
        start: match.index,
        end: match.index + match[0].length,
        text: match[1].trim(), // Trim any whitespace
      });
    }
  }
  
  // Find **text** patterns (bold) - but exclude those inside code blocks or links
  const boldRegex = /\*\*([^*]+)\*\*/g;
  boldRegex.lastIndex = 0;
  while ((match = boldRegex.exec(text)) !== null) {
    // Make sure we're not inside a link or code block
    let isInsideOther = false;
    for (const otherMatch of allMatches) {
      if ((otherMatch.type === 'link' || otherMatch.type === 'code') &&
          match.index >= otherMatch.start && 
          match.index < otherMatch.end) {
        isInsideOther = true;
        break;
      }
    }
    
    if (!isInsideOther) {
      allMatches.push({
        type: 'bold',
        start: match.index,
        end: match.index + match[0].length,
        text: match[1], // Text between the asterisks
      });
    }
  }
  
  // Sort matches by position
  allMatches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (prioritize links > code > bold)
  // But allow bold to wrap other elements (bold can contain links/code)
  const filteredMatches: typeof allMatches = [];
  for (let i = 0; i < allMatches.length; i++) {
    const current = allMatches[i];
    let overlaps = false;
    
    for (let j = 0; j < filteredMatches.length; j++) {
      const existing = filteredMatches[j];
      // Check if they overlap
      if (
        (current.start < existing.end && current.end > existing.start) ||
        (existing.start < current.end && existing.end > current.start)
      ) {
        // If current is bold and it fully contains existing, keep both (bold wraps the other)
        if (current.type === 'bold' && current.start <= existing.start && current.end >= existing.end) {
          // Keep both - bold will wrap the other element
          overlaps = false;
          break;
        }
        // If existing is bold and it fully contains current, keep both
        if (existing.type === 'bold' && existing.start <= current.start && existing.end >= current.end) {
          // Keep both - existing bold wraps current
          overlaps = false;
          break;
        }
        // Priority: link > code > bold (for same-level overlaps)
        if (current.type === 'link' && (existing.type === 'code' || existing.type === 'bold')) {
          filteredMatches[j] = current;
        } else if (current.type === 'code' && existing.type === 'bold') {
          filteredMatches[j] = current;
        }
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      filteredMatches.push(current);
    }
  }
  
  // Build the parts array
  // Identify bold matches that contain other matches (need special handling)
  const boldMatches = filteredMatches.filter(m => m.type === 'bold');
  const nonBoldMatches = filteredMatches.filter(m => m.type !== 'bold');
  
  // Find bold matches that contain other matches
  const boldWithNested = new Set<number>();
  for (let i = 0; i < filteredMatches.length; i++) {
    const match = filteredMatches[i];
    if (match.type === 'bold') {
      for (const otherMatch of nonBoldMatches) {
        if (match.start <= otherMatch.start && match.end >= otherMatch.end) {
          boldWithNested.add(i);
          break;
        }
      }
    }
  }
  
  let lastIndex = 0;
  for (let i = 0; i < filteredMatches.length; i++) {
    const match = filteredMatches[i];
    hasMatches = true;
    
    // Skip non-bold matches that are inside a bold match (they'll be handled by recursive parsing)
    if (match.type !== 'bold') {
      let isInsideBold = false;
      for (const boldIndex of boldWithNested) {
        const boldMatch = filteredMatches[boldIndex];
        if (match.start >= boldMatch.start && match.end <= boldMatch.end) {
          isInsideBold = true;
          break;
        }
      }
      if (isInsideBold) {
        continue; // Skip - will be handled by recursive parsing of the bold
      }
    }
    
    // Add text before the match
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start));
    }
    
    // Add the styled element
    if (match.type === 'link') {
      // Ensure text doesn't contain backticks or brackets
      const cleanText = match.text.replace(/[`\[\]]/g, '');
      // Hyperlink with thin underline - scrolls to specific code reference or code references section
      const codeRefId = `code-ref-${cleanText}`;
      parts.push(
        <a
          key={key++}
          href={`#${codeRefId}`}
          onClick={(e) => {
            e.preventDefault();
            if (onCodeRefClick) {
              onCodeRefClick(codeRefId);
            } else {
              // Fallback if no handler provided
              const specificRef = document.getElementById(codeRefId);
              if (specificRef) {
                specificRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                const codeRefSection = document.getElementById('code-references-section');
                if (codeRefSection) {
                  codeRefSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }
          }}
          className="inline px-1.5 py-0.5 rounded text-[#3fb1c5] cursor-pointer hover:text-[#5dd5e8] transition-colors"
          style={{ 
            backgroundColor: 'rgba(128, 128, 128, 0.3)',
            textDecoration: 'underline',
            textDecorationThickness: '0.5px',
            textUnderlineOffset: '2px'
          }}
        >
          {cleanText}
        </a>
      );
    } else if (match.type === 'code') {
      // Ensure text doesn't contain backticks or brackets
      const cleanText = match.text.replace(/[`\[\]]/g, '');
      // Code text without underline (not a link)
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
      // Bold text - always parse recursively to handle nested formatting
      const boldContent = parseDescription(match.text, onCodeRefClick);
      parts.push(
        <strong key={key++} className="font-semibold">
          {boldContent}
        </strong>
      );
    }
    
    lastIndex = match.end;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no matches, return the original text as a string in an array
  return { elements: hasMatches ? parts : [text], nextKey: key };
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
      code_snippet?: {
        code: string;
        language: string;
      };
      code_references?: string[];
      subsections?: Array<{
        id: string;
        title: string;
        description: string;
        code_snippet?: {
          code: string;
          language: string;
        };
        code_references?: string[];
      }>;
    }>;
  };
  code_references?: (string | CodeReferenceDetail)[];
}

export default function DocumentationTitlePage() {
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
        
        const title = searchParams.get('title');
        if (!title) {
          setError('No title provided');
          setLoading(false);
          return;
        }

        const decodedTitle = decodeURIComponent(title);
        const response = await fetch(`/api/documentation/content/${encodeURIComponent(decodedTitle)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch documentation');
        }

        const data = await response.json();
        if (data.success) {
          setContent(data.documentation);
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

    if (searchParams.get('title')) {
      fetchDocumentation();
    }
  }, [searchParams, setDocumentation]);

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
      <div className="h-full overflow-y-auto custom-scrollbar py-6">
        <div className="max-w-screen-2xl mx-auto w-full px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded w-full"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
              <div className="h-4 bg-white/10 rounded w-4/6"></div>
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
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
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
        <h1 className="text-3xl font-bold text-white mb-6 text-left">
          {content.title}
        </h1>

        {/* Sections */}
        {content.documentation?.sections && content.documentation.sections.length > 0 && (
          <div className="space-y-12">
            {content.documentation.sections.map((section) => (
              <div key={section.id} id={`section-${section.id}`} className="scroll-mt-6">
                {/* Section Title */}
                <h2 className="text-2xl font-semibold text-white mb-4">
                  {section.id}. {section.title}
                </h2>

                {/* Section Description */}
                <div className="prose prose-invert max-w-none mb-6">
                  <div className="text-white/80 leading-relaxed">
                    {parseDescription(section.description, handleCodeRefClick)}
                  </div>
                </div>

                {/* Section Code Snippet */}
                {section.code_snippet && (
                  <div className="mb-6">
                    <CodeSnippet code={section.code_snippet.code} language={section.code_snippet.language} />
                  </div>
                )}

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
                        <div className="prose prose-invert max-w-none mb-4">
                          <div className="text-white/80 leading-relaxed">
                            {parseDescription(subsection.description, handleCodeRefClick)}
                          </div>
                        </div>

                        {/* Subsection Code Snippet */}
                        {subsection.code_snippet && (
                          <div className="mb-4">
                            <CodeSnippet code={subsection.code_snippet.code} language={subsection.code_snippet.language} />
                          </div>
                        )}
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
                      <div className="prose prose-invert max-w-none mb-4">
                        <div className="text-white/80 leading-relaxed">
                          {parseDescription(refDescription, handleCodeRefClick)}
                        </div>
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
                                <div className="text-white/60 text-sm mt-1 ml-0">
                                  {parseDescription(param.description, handleCodeRefClick)}
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
                            <div className="text-white/60 text-sm mt-1">
                              {parseDescription(refReturns.description, handleCodeRefClick)}
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
