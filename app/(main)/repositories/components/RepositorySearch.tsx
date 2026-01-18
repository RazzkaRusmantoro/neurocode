'use client';

import { useState } from 'react';

export default function RepositorySearch() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="mb-6">
      <input
        type="text"
        id="repositorySearch"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2.5 border-none rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#BC4918] transition-all bg-[#FFD45C]/5"
        placeholder="Search repositories..."
      />
    </div>
  );
}
