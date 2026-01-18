'use client';

import { useState } from 'react';

export default function RepositorySearch() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="mb-6 flex gap-4">
      <input
        type="text"
        id="repositorySearch"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-[70%] px-4 py-2.5 border-none rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#BC4918] transition-all bg-[#FFD45C]/5"
        placeholder="Search repositories..."
      />
      <button
        type="button"
        className="relative px-18 py-2.5 bg-transparent border-2 border-[#BC4918] rounded-xl text-[#BC4918] text-sm font-medium overflow-hidden transition-all duration-300 cursor-pointer group ml-auto"
      >
        <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Repository
        </span>
        <span className="absolute inset-0 bg-[#BC4918] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
      </button>
    </div>
  );
}
