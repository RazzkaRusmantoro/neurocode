'use client';

import { useState } from 'react';
import GenerateDocumentationModal from './GenerateDocumentationModal';

interface DocumentationViewerProps {
  repositoryId: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repoName: string;
}

export default function DocumentationViewer({
  repositoryId,
  repoFullName,
  orgShortId,
  repoUrlName,
  repoName,
}: DocumentationViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateDocumentation = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-transparent">
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateDocumentation}
              className="relative px-18 py-2.5 bg-transparent border-2 border-[#BC4918] rounded-xl text-[#BC4918] text-sm font-medium overflow-hidden transition-all duration-300 cursor-pointer group z-0"
            >
              <span className="relative z-[1] flex items-center gap-2 transition-colors duration-300 group-hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate Documentation
              </span>
              <span className="absolute inset-0 bg-[#BC4918] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 z-0"></span>
            </button>
          </div>
        </div>
      </div>

      <GenerateDocumentationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        repoName={repoName}
      />
    </>
  );
}

