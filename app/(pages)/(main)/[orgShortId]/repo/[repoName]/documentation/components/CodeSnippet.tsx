'use client';

import { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeSnippetProps {
  code: string;
  language?: string;
}

export default function CodeSnippet({ code, language = 'typescript' }: CodeSnippetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [fullHeight, setFullHeight] = useState(200);
  const codeRef = useRef<HTMLDivElement>(null);

  // Check if code is long enough to need expansion
  const maxCollapsedHeight = 200; // pixels

  useEffect(() => {
    if (codeRef.current) {
      const height = codeRef.current.scrollHeight;
      setFullHeight(height);
      setNeedsExpansion(height > maxCollapsedHeight);
    }
  }, [code]);

  // Detect language from code if not provided
  const detectLanguage = (): string => {
    if (language) return language;
    
    if (code.includes('function') || code.includes('const') || code.includes('=>')) {
      return 'typescript';
    }
    if (code.includes('def ') || code.includes('import ')) {
      return 'python';
    }
    if (code.includes('class ') && code.includes('{')) {
      return 'typescript';
    }
    return 'typescript';
  };

  const detectedLang = detectLanguage();

  return (
    <div className="mt-4">
      <div
        className="relative border border-white/20 rounded-lg bg-[#1a1a1a] overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? `${fullHeight}px` : `${maxCollapsedHeight}px`,
        }}
      >
        <div ref={codeRef} className="overflow-x-auto cursor-text">
          <SyntaxHighlighter
            language={detectedLang}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '16px',
              background: '#1a1a1a',
              fontSize: '13px',
              lineHeight: '1.5',
              cursor: 'text',
            }}
            showLineNumbers={false}
          >
            {code}
          </SyntaxHighlighter>
        </div>
        
        {/* Gradient overlay when collapsed */}
        {!isExpanded && needsExpansion && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/90 to-transparent pointer-events-none z-10"
          />
        )}

        {/* Expand/Collapse Button - Inside at bottom */}
        {needsExpansion && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center pb-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-1.5 text-xs text-white/70 hover:text-white transition-colors border border-white/20 rounded-md hover:border-white/30 bg-[#1a1a1a]/90 backdrop-blur-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Collapse
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Expand code
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

