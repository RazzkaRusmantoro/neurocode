'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils/slug';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface GenerateDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repositoryId: string;
}

type View = 'choice' | 'docTypeChoice' | 'textual' | 'umlChoice' | 'umlPrompt';
type DiagramType = 'class' | 'sequence' | 'useCase' | 'state';
type DocType = 'api' | 'architecture' | 'aiAgent' | 'endUser' | 'test' | 'onboarding' | 'fakeLoading';
type AiAgentDocKind = 'context' | 'playbook' | 'custom';

const AI_AGENT_DOC_KIND_OPTIONS: { type: AiAgentDocKind; label: string; description: string }[] = [
  { type: 'context', label: 'Context', description: 'Explanations: project overview, structure, conventions, how things work' },
  { type: 'playbook', label: 'Playbook', description: 'Procedures: step-by-step instructions (e.g. how to add doc, run tests)' },
  { type: 'custom', label: 'Custom', description: 'Free-form; describe exactly what you need' },
];

const UML_DIAGRAM_OPTIONS: { type: DiagramType; label: string; description: string }[] = [
  { type: 'class', label: 'Class diagram', description: 'Classes, interfaces, inheritance and associations' },
  { type: 'sequence', label: 'Sequence diagram', description: 'Message flow between objects over time' },
  { type: 'useCase', label: 'Use case diagram', description: 'Actors and use cases' },
  { type: 'state', label: 'State diagram', description: 'States and transitions' },
];

const DOC_TYPE_OPTIONS: { type: DocType; label: string; description: string }[] = [
  { type: 'api', label: 'API/Code Documentation', description: 'Functions, classes, parameters, code references and examples' },
  { type: 'architecture', label: 'System Architecture Documentation', description: 'Components, data flow, design decisions and how the system works' },
  { type: 'aiAgent', label: 'AI-Agent (.md)', description: 'Structured markdown for AI agents: clear sections, parseable, minimal prose' },
  { type: 'endUser', label: 'End-User Documentation', description: 'User manuals, guides, tutorials and FAQs' },
  { type: 'test', label: 'Test Documentation', description: 'Test strategy, coverage, scenarios and how to run tests' },
  { type: 'onboarding', label: 'Onboarding', description: 'Getting started, setup, conventions and where to find things' },
  { type: 'fakeLoading', label: 'Test loading (temp)', description: 'Temporary: fake loading UX only, no API call' },
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
  const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);
  const [target, setTarget] = useState('');
  const [aiAgentDocKind, setAiAgentDocKind] = useState<AiAgentDocKind | null>(null);
  const [aiAgentExtraInstructions, setAiAgentExtraInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const router = useRouter();

  // Progress bar animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          // Fast up to 60%, then slower up to ~85%
          if (prev < 60) return prev + Math.random() * 15;
          if (prev < 85) return prev + Math.random() * 5;
          return prev; // Stay at ~85% until complete
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Loading dots animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setDotCount(0);
      interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!isOpen) {
      setView('choice');
      setUmlDiagramType(null);
      setSelectedDocType(null);
      setTarget('');
      setAiAgentDocKind(null);
      setAiAgentExtraInstructions('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTextualDoc = () => {
    setView('docTypeChoice');
    setError(null);
  };

  const handleDocTypeSelect = (type: DocType) => {
    setSelectedDocType(type);
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
    } else if (view === 'textual') {
      setView('docTypeChoice');
      setTarget('');
      setAiAgentDocKind(null);
      setAiAgentExtraInstructions('');
    } else if (view === 'docTypeChoice') {
      setView('choice');
      setSelectedDocType(null);
    } else {
      setView('choice');
      setTarget('');
    }
    setError(null);
  };

  const handleGenerate = async () => {
    const isAiAgent = selectedDocType === 'aiAgent';
    if (isAiAgent) {
      if (!aiAgentDocKind) {
        setError('Please select what kind of AI-Agent document you want to generate');
        return;
      }
      if (!aiAgentExtraInstructions.trim()) {
        setError('Please provide instructions for what to generate');
        return;
      }
    } else {
      if (!target.trim()) {
        setError('Please enter a description of what documentation you want to generate');
        return;
      }
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
        
        // Complete the progress bar before navigating
        setLoadingProgress(100);
        setTimeout(() => {
          onClose();
          router.push(`/${base}/repo/${repoUrlName}/documentation/uml/${encodeURIComponent(slug)}`);
        }, 400);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsGenerating(false);
      }
      return;
    }

    // Temporary: fake loading UX only (no API call) for testing
    if (selectedDocType === 'fakeLoading') {
      setIsGenerating(true);
      setError(null);
      setTimeout(() => {
        setLoadingProgress(100);
        setTimeout(() => setIsGenerating(false), 400);
      }, 2500);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    const promptForApi = isAiAgent && aiAgentDocKind
      ? `${AI_AGENT_DOC_KIND_OPTIONS.find((o) => o.type === aiAgentDocKind)?.label || aiAgentDocKind}. ${aiAgentExtraInstructions.trim()}`
      : target.trim();

    const body: Record<string, string> = {
      repoFullName: repoFullName,
      orgShortId: orgShortId,
      repoUrlName: repoUrlName,
      branch: 'main',
      scope: 'custom',
      prompt: promptForApi,
      ...(selectedDocType && { documentationType: selectedDocType }),
      ...(isAiAgent &&
        aiAgentDocKind && {
          aiAgentDocKind,
          aiAgentExtraInstructions: aiAgentExtraInstructions.trim(),
        }),
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
      const base = orgShortId.startsWith('org-') ? orgShortId : `org-${orgShortId}`;
      const slug = data.slug || (data.title ? slugify(data.title) : slugify(promptForApi) || 'documentation');
      
      // Complete the progress bar before navigating
      setLoadingProgress(100);
      setTimeout(() => {
        onClose();
        router.push(`/${base}/repo/${repoUrlName}/documentation/${encodeURIComponent(slug)}`);
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            {(view === 'docTypeChoice' || view === 'textual' || view === 'umlChoice' || view === 'umlPrompt') && (
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

          {/* Doc type choice - six documentation type options (containers only, no animation/logos) */}
          <div className={`transition-all duration-500 ease-in-out ${
            view === 'docTypeChoice'
              ? 'transform translate-x-0 opacity-100 relative'
              : view === 'choice'
                ? 'transform translate-x-full opacity-0 absolute w-full'
                : 'transform -translate-x-full opacity-0 absolute w-full'
          }`}>
            <div className="grid grid-cols-2 gap-6">
              {DOC_TYPE_OPTIONS.map(({ type, label, description }) => (
                <div
                  key={type}
                  onClick={() => handleDocTypeSelect(type)}
                  className="group relative border border-white/10 rounded p-8 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer flex flex-col min-h-[180px] bg-[#212121]"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(188, 73, 24, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D85A2A] transition-colors duration-300">
                    {label}
                  </h3>
                  <p className="text-sm text-white/70">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* UML Choice - four diagram type boxes (enter from right when coming from choice, exit left when going to prompt) */}
          <div className={`transition-all duration-500 ease-in-out ${
            view === 'umlChoice'
              ? 'transform translate-x-0 opacity-100 relative'
              : view === 'choice'
                ? 'transform translate-x-full opacity-0 absolute w-full'
                : 'transform -translate-x-full opacity-0 absolute w-full'
          }`}>
            <div className="grid grid-cols-2 gap-6">
              {UML_DIAGRAM_OPTIONS.map(({ type, label, description }) => {
                const isAnimatedBg = type === 'class' || type === 'sequence' || type === 'useCase' || type === 'state';
                return (
                  <div
                    key={type}
                    onClick={() => handleUmlDiagramSelect(type)}
                    className="group relative border border-white/10 rounded p-8 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[300px] bg-transparent"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 25px rgba(188, 73, 24, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Underlying revealed background */}
                    {isAnimatedBg && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/15 via-[#1a1a1a] to-[#1a1a1a] z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    
                    {/* Primary Background */}
                    <div className={`absolute top-0 left-0 right-0 bg-[#212121] z-10 ${
                      isAnimatedBg 
                        ? 'h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:h-[35%]' 
                        : 'bottom-0'
                    }`}>
                      {isAnimatedBg && (
                        <div className="absolute bottom-[-40px] left-0 right-0 h-[40px] bg-gradient-to-b from-[#212121] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#D85A2A] transition-colors duration-300 z-20 relative pointer-events-none">
                      {label}
                    </h3>
                    <p className="text-base text-white/70 z-20 relative pointer-events-none">
                      {description}
                    </p>
                    <div className="flex-grow z-20 relative pointer-events-none"></div>
                    
                    {/* Background Detailed Mini-Canvas Visuals */}
                    {type === 'class' && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center pointer-events-none z-0 translate-y-12 group-hover:translate-y-[25px] overflow-hidden">
                        <div className="relative w-[340px] h-[220px] scale-[0.9]">
                          {/* Main Class Node */}
                          <div className="absolute left-[180px] top-[75px] w-[140px] bg-[#1a1a1e] border border-[#333] rounded-[8px] shadow-xl overflow-hidden font-mono opacity-100">
                            <div className="px-2 py-1.5 bg-gradient-to-b from-[#252528] to-[#1e1e22] border-b border-[#333] text-center">
                              <div className="text-[11px] font-bold text-white tracking-wide">AuthService</div>
                            </div>
                            <div className="px-2 py-1.5 border-b border-[#2a2a2e] bg-[#1e1e22] flex flex-col gap-0.5">
                              <div className="text-[9px] flex gap-1 whitespace-nowrap"><span className="text-[#f87171] font-bold">-</span><span className="text-[#e4e4e7]">token</span><span className="text-[#71717a]">: str</span></div>
                            </div>
                            <div className="px-2 py-1.5 bg-[#1a1a1e] flex flex-col gap-0.5">
                              <div className="text-[9px] flex gap-1 whitespace-nowrap"><span className="text-[#6ee7b7] font-bold">+</span><span className="text-[#e4e4e7]">login()</span><span className="text-[#71717a]">: bool</span></div>
                            </div>
                          </div>
                          {/* Secondary Node */}
                          <div className="absolute left-[20px] top-[75px] w-[110px] bg-[#1a1a1e] border border-[#333] rounded-[8px] shadow-xl overflow-hidden font-mono opacity-100">
                            <div className="px-2 py-1.5 bg-gradient-to-b from-[#252528] to-[#1e1e22] border-b border-[#333] text-center">
                              <div className="text-[9px] text-[#888] italic mb-0.5">&lt;&lt;interface&gt;&gt;</div>
                              <div className="text-[11px] font-bold text-white tracking-wide">User</div>
                            </div>
                            <div className="px-2 py-1.5 border-b border-[#2a2a2e] bg-[#1e1e22] flex flex-col gap-0.5">
                              <div className="text-[9px] flex gap-1 whitespace-nowrap"><span className="text-[#6ee7b7] font-bold">+</span><span className="text-[#e4e4e7]">id</span><span className="text-[#71717a]">: str</span></div>
                            </div>
                          </div>
                          {/* Relationship Line */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" style={{ zIndex: -2 }}>
                            <path d="M 130 105 L 180 105" stroke="#e4e4e7" strokeWidth="1.5" fill="none" />
                            <polygon points="180,105 174,102 174,108" fill="#e4e4e7" />
                            <text x="138" y="100" fill="#a1a1aa" fontSize="10" fontFamily="monospace">1</text>
                            <text x="166" y="100" fill="#a1a1aa" fontSize="10" fontFamily="monospace">0..*</text>
                          </svg>
                        </div>
                      </div>
                    )}

                    {type === 'sequence' && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center pointer-events-none z-0 translate-y-12 group-hover:translate-y-[48px] overflow-hidden">
                        <div className="relative w-[340px] h-[220px] scale-[0.9] opacity-100">
                          {/* Lifeline 1 */}
                          <div className="absolute left-[50px] top-[40px] flex flex-col items-center w-[60px]">
                            <div className="w-full bg-[#2a2a2e] border border-[#444] rounded py-1.5 text-center text-white text-[11px] font-semibold z-10 shadow-md">Client</div>
                            <div className="w-px h-[140px] border-l-2 border-dashed border-[#555] mt-1 relative flex flex-col items-center">
                               <div className="absolute top-[20px] w-[12px] h-[80px] bg-[#e4e4e7] border border-[#333] rounded-sm transform -translate-x-1/2"></div>
                            </div>
                          </div>
                          {/* Lifeline 2 */}
                          <div className="absolute left-[230px] top-[40px] flex flex-col items-center w-[60px]">
                            <div className="w-full bg-[#2a2a2e] border border-[#444] rounded py-1.5 text-center text-white text-[11px] font-semibold z-10 shadow-md">Server</div>
                            <div className="w-px h-[140px] border-l-2 border-dashed border-[#555] mt-1 relative flex flex-col items-center">
                               <div className="absolute top-[40px] w-[12px] h-[40px] bg-[#e4e4e7] border border-[#333] rounded-sm transform -translate-x-1/2"></div>
                            </div>
                          </div>

                          {/* Arrows */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                            {/* request() */}
                            <path d="M 86 100 L 254 100" stroke="#e4e4e7" strokeWidth="1.5" fill="none" />
                            <polygon points="254,100 248,97 248,103" fill="#e4e4e7" />
                            <text x="170" y="95" fill="#e4e4e7" fontSize="10" fontFamily="monospace" textAnchor="middle">request()</text>

                            {/* response */}
                            <path d="M 254 130 L 86 130" stroke="#e4e4e7" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                            <polygon points="86,130 92,127 92,133" fill="none" stroke="#e4e4e7" strokeWidth="1.5" />
                            <text x="170" y="125" fill="#e4e4e7" fontSize="10" fontFamily="monospace" textAnchor="middle">response</text>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Bottom Right Simple SVGs (Original Visuals) - fade out on hover */}
                    {type === 'class' && (
                      <div className="absolute right-4 bottom-4 opacity-[0.07] group-hover:opacity-0 transition-all duration-400 pointer-events-none translate-y-4 group-hover:translate-y-2 group-hover:scale-95 z-10">
                        <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="60" y="20" width="80" height="60" rx="4" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="60" y1="45" x2="140" y2="45" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="60" y1="65" x2="140" y2="65" stroke="currentColor" strokeWidth="4" className="text-white" />
                          
                          <path d="M100 80 L100 110" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <path d="M50 110 L150 110" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <path d="M50 110 L50 130" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <path d="M150 110 L150 130" stroke="currentColor" strokeWidth="4" className="text-white" />

                          <rect x="10" y="130" width="80" height="50" rx="4" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="10" y1="155" x2="90" y2="155" stroke="currentColor" strokeWidth="4" className="text-white" />

                          <rect x="110" y="130" width="80" height="50" rx="4" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="110" y1="155" x2="190" y2="155" stroke="currentColor" strokeWidth="4" className="text-white" />
                          
                          <polygon points="100,80 95,90 105,90" fill="currentColor" className="text-white" />
                        </svg>
                      </div>
                    )}

                    {type === 'sequence' && (
                      <div className="absolute right-4 bottom-4 opacity-[0.07] group-hover:opacity-0 transition-all duration-400 pointer-events-none translate-y-4 group-hover:translate-y-2 group-hover:scale-95 z-10">
                        <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="30" y="20" width="50" height="30" rx="4" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <rect x="120" y="20" width="50" height="30" rx="4" stroke="currentColor" strokeWidth="4" className="text-white" />
                          
                          <line x1="55" y1="50" x2="55" y2="180" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" className="text-white" />
                          <line x1="145" y1="50" x2="145" y2="180" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" className="text-white" />

                          <rect x="47" y="70" width="16" height="90" fill="currentColor" className="text-white" />
                          <rect x="137" y="90" width="16" height="50" fill="currentColor" className="text-white" />

                          <path d="M63 100 L133 100" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <polygon points="133,95 141,100 133,105" fill="currentColor" className="text-white" />

                          <path d="M133 130 L63 130" stroke="currentColor" strokeWidth="4" strokeDasharray="4 4" className="text-white" />
                          <polygon points="63,125 55,130 63,135" fill="currentColor" className="text-white" />
                        </svg>
                      </div>
                    )}

                    {type === 'useCase' && (
                      <div className="absolute right-4 bottom-4 opacity-[0.07] group-hover:opacity-0 transition-all duration-400 pointer-events-none translate-y-4 group-hover:translate-y-2 group-hover:scale-95 z-10">
                        <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="40" cy="80" r="15" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="40" y1="95" x2="40" y2="135" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="40" y1="105" x2="20" y2="120" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="40" y1="105" x2="60" y2="120" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="40" y1="135" x2="25" y2="165" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="40" y1="135" x2="55" y2="165" stroke="currentColor" strokeWidth="4" className="text-white" />

                          <rect x="90" y="20" width="100" height="160" rx="8" stroke="currentColor" strokeWidth="4" className="text-white" strokeDasharray="8 8" />

                          <ellipse cx="140" cy="60" rx="35" ry="20" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <ellipse cx="140" cy="140" rx="35" ry="20" stroke="currentColor" strokeWidth="4" className="text-white" />

                          <line x1="55" y1="105" x2="105" y2="70" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <line x1="55" y1="125" x2="105" y2="135" stroke="currentColor" strokeWidth="4" className="text-white" />
                        </svg>
                      </div>
                    )}

                    {type === 'state' && (
                      <div className="absolute right-4 bottom-4 opacity-[0.07] group-hover:opacity-0 transition-all duration-400 pointer-events-none translate-y-4 group-hover:translate-y-2 group-hover:scale-95 z-10">
                        <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="30" cy="100" r="12" fill="currentColor" className="text-white" />
                          
                          <rect x="70" y="75" width="50" height="50" rx="16" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <rect x="150" y="30" width="40" height="40" rx="16" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <rect x="150" y="130" width="40" height="40" rx="16" stroke="currentColor" strokeWidth="4" className="text-white" />

                          <path d="M42 100 L70 100" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <polygon points="65,95 73,100 65,105" fill="currentColor" className="text-white" />

                          <path d="M120 90 L150 60" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <polygon points="143,62 152,58 148,67" fill="currentColor" className="text-white" />

                          <path d="M120 110 L150 140" stroke="currentColor" strokeWidth="4" className="text-white" />
                          <polygon points="148,133 152,142 143,138" fill="currentColor" className="text-white" />
                        </svg>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded z-10" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Textual doc / UML prompt - same text box stage; when generating, show loading stage */}
          <div className={`transition-all duration-500 ease-in-out ${
            view === 'textual' || view === 'umlPrompt'
              ? 'transform translate-x-0 opacity-100 relative'
              : 'transform translate-x-full opacity-0 absolute w-full'
          }`}>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] py-12">
                <div className="mb-8 scale-[0.8] origin-center">
                  <LoadingSpinner />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-4 w-64 text-center">
                  {view === 'umlPrompt' ? 'Generating diagram' : 'Generating documentation'}
                  <span className="inline-block text-left" style={{ width: '24px' }}>
                    {'.'.repeat(dotCount)}
                  </span>
                </h3>
                
                <div className="w-64 h-1.5 bg-[#212121] rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#BC4918] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                  />
                </div>
              </div>
            ) : view === 'textual' && selectedDocType === 'aiAgent' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    What kind of AI-Agent document?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AI_AGENT_DOC_KIND_OPTIONS.map(({ type, label, description }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAiAgentDocKind(type)}
                        className={`text-left p-4 rounded border transition-all duration-200 ${
                          aiAgentDocKind === type
                            ? 'border-[#BC4918] bg-[#BC4918]/10 text-white'
                            : 'border-white/10 bg-[#212121] text-white/90 hover:border-white/20 hover:bg-[#252525]'
                        }`}
                      >
                        <span className="font-medium block mb-0.5">{label}</span>
                        <span className="text-xs text-white/60">{description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={aiAgentExtraInstructions}
                    onChange={(e) => setAiAgentExtraInstructions(e.target.value)}
                    placeholder={
                      aiAgentDocKind === 'custom'
                        ? "e.g. 'Cursor rules for this repo focusing on testing conventions'"
                        : aiAgentDocKind === 'context'
                          ? "e.g. 'Explain the auth flow and where config lives'"
                          : "e.g. 'How to add a new doc type and run the generator'"
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-[#212121] border border-white/10 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#BC4918] focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !aiAgentDocKind || !aiAgentExtraInstructions.trim()}
                    className="w-full px-6 py-3 bg-[#BC4918] hover:bg-[#BC4918]/80 disabled:bg-[#BC4918]/50 disabled:cursor-not-allowed text-white font-medium rounded transition-all duration-200 cursor-pointer"
                  >
                    Generate AI-Agent Documentation
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            ) : (
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
                    {view === 'umlPrompt' ? 'Generate diagram' : 'Generate Documentation'}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

