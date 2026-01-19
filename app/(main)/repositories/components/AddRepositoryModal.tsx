'use client';

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubAccount?: string | null;
  onUploadFromComputer?: () => void;
  onUploadFromGitHub?: () => void;
  onUploadFromBitbucket?: () => void;
}

export default function AddRepositoryModal({
  isOpen,
  onClose,
  githubAccount,
  onUploadFromComputer,
  onUploadFromGitHub,
  onUploadFromBitbucket,
}: AddRepositoryModalProps) {
  if (!isOpen) return null;

  const isGitHubConnected = !!githubAccount;
  const githubAvatarUrl = githubAccount ? `https://github.com/${githubAccount}.png` : null;

  const handleUploadFromComputer = () => {
    onUploadFromComputer?.();
    // TODO: Implement upload from computer
  };

  const handleUploadFromGitHub = () => {
    onUploadFromGitHub?.();
    // TODO: Implement upload from GitHub
  };

  const handleUploadFromBitbucket = () => {
    onUploadFromBitbucket?.();
    // TODO: Implement upload from Bitbucket
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-150 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 bg-[#1a1a1a] rounded-xl border border-[#424242] p-8 w-full max-w-3xl mx-4 shadow-2xl animate-[explosivePop_0.15s_ease-out]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add Repository</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleUploadFromComputer}
            className="w-full px-6 py-4 bg-[#2a2a2a] hover:bg-[#2a2a2a]/80 border border-[#424242] rounded-lg text-white text-left transition-all duration-200 flex items-center gap-3 group"
          >
            <svg className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <div className="font-medium">Upload from Computer</div>
              <div className="text-sm text-white/60">Upload a ZIP file or folder</div>
            </div>
          </button>

          <button
            onClick={handleUploadFromGitHub}
            className="w-full px-6 py-4 bg-[#2a2a2a] hover:bg-[#2a2a2a]/80 border border-[#424242] rounded-lg text-white text-left transition-all duration-200 flex items-center gap-3 group"
          >
            <svg className="w-6 h-6 text-white/60 group-hover:text-white transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <div className="flex-1">
              <div className="font-medium">
                {isGitHubConnected ? 'Upload repository from GitHub' : 'Connect your GitHub account'}
              </div>
              <div className="text-sm text-white/60 flex items-center gap-2">
                {isGitHubConnected ? (
                  <>
                    <span>Connected as</span>
                    <span className="flex items-center gap-1.5">
                      {githubAvatarUrl && (
                        <img 
                          src={githubAvatarUrl} 
                          alt={githubAccount || ''} 
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span className="font-medium text-white/80">@{githubAccount}</span>
                    </span>
                  </>
                ) : (
                  'Connect to import a repository'
                )}
              </div>
            </div>
          </button>

          <button
            onClick={handleUploadFromBitbucket}
            className="w-full px-6 py-4 bg-[#2a2a2a] hover:bg-[#2a2a2a]/80 border border-[#424242] rounded-lg text-white text-left transition-all duration-200 flex items-center gap-3 group"
          >
            <svg className="w-6 h-6" viewBox="8.4 14.39 2481.29 2231.21" fill="none">
              <defs>
                <linearGradient id="bitbucket-gradient-popup" x1="945.1094" y1="1524.8389" x2="944.4923" y2="1524.1893" gradientTransform="matrix(1996.6343 0 0 -1480.3047 -1884485.625 2258195)" gradientUnits="userSpaceOnUse">
                  <stop offset="0.18" stopColor="#0052CC"/>
                  <stop offset="1" stopColor="#2684FF"/>
                </linearGradient>
              </defs>
              <path d="M88.92,14.4C45.02,13.83,8.97,48.96,8.41,92.86c-0.06,4.61,0.28,9.22,1.02,13.77l337.48,2048.72 c8.68,51.75,53.26,89.8,105.74,90.24h1619.03c39.38,0.5,73.19-27.9,79.49-66.78l337.49-2071.78c7.03-43.34-22.41-84.17-65.75-91.2 c-4.55-0.74-9.15-1.08-13.76-1.02L88.92,14.4z M1509.99,1495.09H993.24l-139.92-731h781.89L1509.99,1495.09z" fill="#2684FF"/>
              <path d="M2379.27,763.06h-745.5l-125.12,730.42H992.31l-609.67,723.67c19.32,16.71,43.96,26,69.5,26.21h1618.13 c39.35,0.51,73.14-27.88,79.44-66.72L2379.27,763.06z" fill="url(#bitbucket-gradient-popup)"/>
            </svg>
            <div>
              <div className="font-medium">Connect your Bitbucket account</div>
              <div className="text-sm text-white/60">Connect to import a repository</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

