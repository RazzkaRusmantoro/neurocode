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
              className="relative px-18 py-3 bg-[#5C42CE] hover:bg-[#4A35B5] rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-300 cursor-pointer group ml-auto shadow-lg hover:shadow-[0_0_20px_rgba(92,66,206,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-[1]">
                Generate Documentation
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#7B6DD9] to-[#5C42CE] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
            </button>
          </div>
        </div>
      </div>

      <GenerateDocumentationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        repoName={repoName}
        repoFullName={repoFullName}
        orgShortId={orgShortId}
        repoUrlName={repoUrlName}
        repositoryId={repositoryId}
      />
    </>
  );
}

