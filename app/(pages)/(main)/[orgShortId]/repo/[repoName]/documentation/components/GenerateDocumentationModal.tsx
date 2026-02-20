'use client';

import { useState } from 'react';

interface GenerateDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repositoryId: string;
}

type Scope = 'module' | 'file' | 'custom' | 'repository';

export default function GenerateDocumentationModal({
  isOpen,
  onClose,
  repoName,
  repoFullName,
  orgShortId,
  repoUrlName,
  repositoryId,
}: GenerateDocumentationModalProps) {
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [showCustomDetails, setShowCustomDetails] = useState(false);
  const [scope, setScope] = useState<Scope>('module');
  const [target, setTarget] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCompleteDocumentation = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoFullName: repoFullName,
          orgShortId: orgShortId,
          repoUrlName: repoUrlName,
          branch: 'main',
          scope: 'repository',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate documentation');
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

  const handleCustomDocumentation = () => {
    setShowCustomOptions(true);
  };

  const handleCustomScope = () => {
    setScope('custom');
    setShowCustomDetails(true);
  };

  const handleBack = () => {
    if (showCustomDetails) {
      setShowCustomDetails(false);
      setScope('module');
    } else {
      setShowCustomOptions(false);
    }
    // Reset form
    setTarget('');
  };

  const handleGenerate = async () => {
    if (!target.trim()) {
      setError('Please enter a description of what documentation you want to generate');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoFullName: repoFullName,
          orgShortId: orgShortId,
          repoUrlName: repoUrlName,
          branch: 'main',
          scope: 'custom',
          prompt: target.trim(), // Send the user's prompt/description
        }),
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
            {(showCustomOptions || showCustomDetails) && (
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
          {/* Initial View - Two Main Boxes */}
          <div className={`transition-all duration-500 ease-in-out ${
            showCustomOptions 
              ? 'transform -translate-x-full opacity-0 absolute w-full' 
              : 'transform translate-x-0 opacity-100 relative'
          }`}>
            <div className="grid grid-cols-2 gap-6">
              {/* Complete Documentation Box */}
              <div
                onClick={handleCompleteDocumentation}
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
                  Complete Documentation
                </h3>
                <p className="text-base text-white/70">
                  Generate comprehensive documentation including API reference, architecture, and guides
                </p>
                <div className="flex-grow"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
              </div>

              {/* Custom Documentation Box */}
              <div
                onClick={handleCustomDocumentation}
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
                  Custom Documentation
                </h3>
                <p className="text-base text-white/70">
                  Choose specific documentation types to generate
                </p>
                <div className="flex-grow"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
              </div>
            </div>
          </div>

          {/* Custom Options View - Selection Interface */}
          <div className={`transition-all duration-500 ease-in-out ${
            showCustomOptions 
              ? 'transform translate-x-0 opacity-100 relative' 
              : 'transform translate-x-full opacity-0 absolute w-full'
          }`}>
            {/* Scope Selection View */}
            <div className={`transition-all duration-500 ease-in-out ${
              showCustomDetails
                ? 'transform -translate-x-full opacity-0 absolute w-full'
                : 'transform translate-x-0 opacity-100 relative'
            }`}>
              <div className="space-y-6">
                {/* Scope Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    What would you like to document?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => {
                        setScope('module');
                        setTarget('');
                        setShowCustomDetails(true);
                      }}
                      className="group relative border border-white/10 rounded p-4 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden"
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
                      <div className="font-semibold mb-1 text-white group-hover:text-[#D85A2A] transition-colors duration-300">Module</div>
                      <div className="text-sm opacity-80 text-white/70">Specific module/folder</div>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
                    </div>
                    <div
                      onClick={() => {
                        setScope('file');
                        setTarget('');
                        setShowCustomDetails(true);
                      }}
                      className="group relative border border-white/10 rounded p-4 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden"
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
                      <div className="font-semibold mb-1 text-white group-hover:text-[#D85A2A] transition-colors duration-300">File</div>
                      <div className="text-sm opacity-80 text-white/70">Single file</div>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
                    </div>
                    <div
                      onClick={handleCustomScope}
                      className="group relative border border-white/10 rounded p-4 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden col-span-2"
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
                      <div className="font-semibold mb-1 text-white group-hover:text-[#D85A2A] transition-colors duration-300">Custom</div>
                      <div className="text-sm opacity-80 text-white/70">Custom documentation</div>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Details View */}
            <div className={`transition-all duration-500 ease-in-out ${
              showCustomDetails
                ? 'transform translate-x-0 opacity-100 relative'
                : 'transform translate-x-full opacity-0 absolute w-full'
            }`}>
              <div className="space-y-6">
                {/* Prompt/Description Field */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    What documentation would you like to generate?
                  </label>
                  <textarea
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="Describe what you want documented. For example: 'Explain the payment processing flow' or 'Document the authentication system' or 'How does the API handle user requests?'"
                    rows={8}
                    className="w-full px-4 py-3 bg-[#212121] border border-white/10 rounded text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#BC4918] focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Generate Button */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !target.trim()}
                    className="w-full px-6 py-3 bg-[#BC4918] hover:bg-[#BC4918]/80 disabled:bg-[#BC4918]/50 disabled:cursor-not-allowed text-white font-medium rounded transition-all duration-200 cursor-pointer"
                  >
                    {isGenerating ? 'Generating Documentation...' : 'Generate Documentation'}
                  </button>
                </div>

                {/* Error Display */}
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
    </div>
  );
}

