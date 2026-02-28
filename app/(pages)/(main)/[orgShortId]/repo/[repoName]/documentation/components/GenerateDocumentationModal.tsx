'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils/slug';

interface GenerateDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repositoryId: string;
}

type View = 'choice' | 'textual' | 'umlChoice' | 'umlPrompt';
type DiagramType = 'class' | 'sequence' | 'useCase' | 'state';

const UML_DIAGRAM_OPTIONS: { type: DiagramType; label: string; description: string }[] = [
  { type: 'class', label: 'Class diagram', description: 'Classes, interfaces, inheritance and associations' },
  { type: 'sequence', label: 'Sequence diagram', description: 'Message flow between objects over time' },
  { type: 'useCase', label: 'Use case diagram', description: 'Actors and use cases' },
  { type: 'state', label: 'State diagram', description: 'States and transitions' },
];

export default function GenerateDocumentationModal({
  isOpen,
  onClose,
  repoName,
  repoFullName,
  orgShortId,
  repoUrlName,
  repositoryId,
}: GenerateDocumentationModalProps) {
  const [view, setView] = useState<View>('choice');
  const [umlDiagramType, setUmlDiagramType] = useState<DiagramType | null>(null);
  const [target, setTarget] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setView('choice');
      setUmlDiagramType(null);
      setTarget('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTextualDoc = () => {
    setView('textual');
    setError(null);
  };

  const handleUmlGeneration = () => {
    setView('umlChoice');
    setError(null);
  };

  const handleUmlDiagramSelect = (type: DiagramType) => {
    setUmlDiagramType(type);
    setView('umlPrompt');
    setError(null);
  };

  const handleBack = () => {
    if (view === 'umlPrompt') {
      setView('umlChoice');
      setUmlDiagramType(null);
      setTarget('');
    } else if (view === 'umlChoice') {
      setView('choice');
    } else {
      setView('choice');
      setTarget('');
    }
    setError(null);
  };

  const handleGenerate = async () => {
    if (!target.trim()) {
      setError('Please enter a description of what documentation you want to generate');
      return;
    }

    // UML flow: call generate-uml API (RAG + LLM), then navigate to UML page with slug
    if (umlDiagramType) {
      setIsGenerating(true);
      setError(null);
      try {
        const response = await fetch('/api/documentation/uml/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoFullName,
            orgShortId,
            repoUrlName,
            branch: 'main',
            prompt: target.trim(),
            diagramType: umlDiagramType,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || data.details || 'Failed to generate UML diagram');
          return;
        }
        const slug = data.slug || `${umlDiagramType}-${slugify(target.trim()) || 'diagram'}`;
        const base = orgShortId.startsWith('org-') ? orgShortId : `org-${orgShortId}`;
        onClose();
        router.push(`/${base}/repo/${repoUrlName}/documentation/uml/${encodeURIComponent(slug)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    const body: Record<string, string> = {
      repoFullName: repoFullName,
      orgShortId: orgShortId,
      repoUrlName: repoUrlName,
      branch: 'main',
      scope: 'custom',
      prompt: target.trim(),
    };

    try {
      const response = await fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.details || 'Failed to generate documentation');
        return;
      }

      setResult(data);
      console.log('Documentation generated:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-150"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 bg-[#1a1a1a] rounded border border-[#424242] p-8 w-full mx-4 shadow-2xl transition-all duration-300 ease-in-out max-w-5xl min-h-[500px] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {(view === 'textual' || view === 'umlChoice' || view === 'umlPrompt') && (
              <button
                onClick={handleBack}
                className="text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-2xl font-bold text-white">
              Generate Documentation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative overflow-hidden p-5">
          {/* Initial View - Textual Documentation & UML Generation */}
          <div className={`transition-all duration-500 ease-in-out ${
            view !== 'choice'
              ? 'transform -translate-x-full opacity-0 absolute w-full'
              : 'transform translate-x-0 opacity-100 relative'
          }`}>
            <div className="grid grid-cols-2 gap-6">
              {/* Textual doc - goes straight to custom prompt stage */}
              <div
                onClick={handleTextualDoc}
                className="group relative border border-white/10 rounded p-8 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[300px]"
                style={{ backgroundColor: '#212121' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(188, 73, 24, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#D85A2A] transition-colors duration-300">
                  Textual Documentation
                </h3>
                <p className="text-base text-white/70">
                  Describe what you want documented and generate custom documentation
                </p>
                <div className="flex-grow"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
              </div>

              {/* UML Generation */}
              <div
                onClick={handleUmlGeneration}
                className="group relative border border-white/10 rounded p-8 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[300px]"
                style={{ backgroundColor: '#212121' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(188, 73, 24, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#D85A2A] transition-colors duration-300">
                  UML Generation
                </h3>
                <p className="text-base text-white/70">
                  Generate UML diagrams from your codebase
                </p>
                <div className="flex-grow"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
              </div>
            </div>
          </div>

          {/* UML Choice - four diagram type boxes */}
          <div className={`transition-all duration-500 ease-in-out ${
            view !== 'umlChoice'
              ? 'transform -translate-x-full opacity-0 absolute w-full'
              : 'transform translate-x-0 opacity-100 relative'
          }`}>
            <div className="grid grid-cols-2 gap-6">
              {UML_DIAGRAM_OPTIONS.map(({ type, label, description }) => (
                <div
                  key={type}
                  onClick={() => handleUmlDiagramSelect(type)}
                  className="group relative border border-white/10 rounded p-8 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[300px]"
                  style={{ backgroundColor: '#212121' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(188, 73, 24, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#D85A2A] transition-colors duration-300">
                    {label}
                  </h3>
                  <p className="text-base text-white/70">
                    {description}
                  </p>
                  <div className="flex-grow"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Textual doc / UML prompt - same text box stage */}
          <div className={`transition-all duration-500 ease-in-out ${
            view === 'textual' || view === 'umlPrompt'
              ? 'transform translate-x-0 opacity-100 relative'
              : 'transform translate-x-full opacity-0 absolute w-full'
          }`}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  {view === 'umlPrompt'
                    ? 'Describe what to include in the diagram (e.g. scope, focus area)'
                    : 'What documentation would you like to generate?'}
                </label>
                <textarea
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={view === 'umlPrompt'
                    ? "e.g. 'All classes in the auth module' or 'Checkout flow from cart to payment'"
                    : "Describe what you want documented. For example: 'Explain the payment processing flow' or 'Document the authentication system' or 'How does the API handle user requests?'"}
                  rows={8}
                  className="w-full px-4 py-3 bg-[#212121] border border-white/10 rounded text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#BC4918] focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !target.trim()}
                  className="w-full px-6 py-3 bg-[#BC4918] hover:bg-[#BC4918]/80 disabled:bg-[#BC4918]/50 disabled:cursor-not-allowed text-white font-medium rounded transition-all duration-200 cursor-pointer"
                >
                  {isGenerating
                    ? (view === 'umlPrompt' ? 'Generating diagram...' : 'Generating Documentation...')
                    : (view === 'umlPrompt' ? 'Generate diagram' : 'Generate Documentation')}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

