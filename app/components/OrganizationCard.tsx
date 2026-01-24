'use client';

import Link from 'next/link';
import type { OrganizationWithId } from '@/actions/organization';

interface OrganizationCardProps {
  organization: OrganizationWithId;
}

export default function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Link
      href={`/org-${organization.shortId}/dashboard`}
      className="group relative border border-white/10 rounded-lg p-6 hover:border-[#BC4918]/50 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col bg-[#212121] hover:shadow-[0_0_25px_rgba(188,73,24,0.3)] hover:-translate-y-0.5"
    >
      {/* Organization Name */}
      <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-[#D85A2A] transition-colors duration-300">
        {organization.name}
      </h2>

      {/* Role Badge */}
      <div 
        className="w-fit inline-block px-3 py-1 rounded-lg text-xs font-medium mb-4 capitalize"
        style={{ 
          backgroundColor: organization.role === 'owner' 
            ? 'rgba(188, 73, 24, 0.3)' 
            : 'rgba(255, 255, 255, 0.1)',
          color: organization.role === 'owner' ? '#E95E23' : '#ffffff'
        }}
      >
        {organization.role}
      </div>

      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Click to open</span>
          <svg 
            className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#BC4918]/0 to-[#BC4918]/0 group-hover:from-[#BC4918]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-lg" />
    </Link>
  );
}

