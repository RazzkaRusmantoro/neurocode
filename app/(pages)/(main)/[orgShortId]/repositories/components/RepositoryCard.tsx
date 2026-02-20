'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface RepositoryCardProps {
  id: string;
  name: string;
  urlName: string;
  url: string;
  orgShortId: string;
  source?: 'github' | 'bitbucket' | 'upload';
  addedAt: Date | string;
  size?: string;
  lastUpdate?: Date | string;
  description?: string;
}

export default function RepositoryCard({ id, name, urlName, url, orgShortId, source, addedAt, size, lastUpdate, description }: RepositoryCardProps) {
  const router = useRouter();
  const addedDate = typeof addedAt === 'string' ? new Date(addedAt) : addedAt;
  const updateDate = lastUpdate ? (typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate) : addedDate;
  const sizeDisplay = size || 'N/A';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/org-${orgShortId}/repo/${urlName}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative border border-[#262626] rounded-lg p-6 hover:border-[var(--color-primary)]/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col bg-[#262626]/50"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 25px rgba(var(--color-primary-rgb), 0.3)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Repository Name - Headline */}
      <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-[var(--color-primary)] transition-colors duration-300">
        {name}
      </h2>

      {/* Repository URL Name Badge */}
      <div 
        className="w-fit inline-block pl-3 pr-7 py-1 rounded-lg text-sm font-medium mt-2 mb-3 bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
      >
        /{urlName}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-white/70 mb-4 line-clamp-3">
          {description}
        </p>
      )}

      {/* Spacer to push footer to bottom */}
      <div className="flex-grow"></div>

      {/* Horizontal Line */}
      <hr className="border-[#262626] mb-3 mt-4" />

      {/* Footer: Size on left, Last Update on right */}
      <div className="flex justify-between items-center text-xs text-white/50">
        <span>Size: {sizeDisplay}</span>
        <span>Last Update: {updateDate.toLocaleDateString()}</span>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/0 to-[var(--color-primary)]/0 group-hover:from-[var(--color-primary)]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-lg" />
    </div>
  );
}

