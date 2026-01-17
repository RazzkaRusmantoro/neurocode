'use client';

import { useState, useRef, useEffect } from 'react';
import { getUserOrganizations, type OrganizationWithId } from '@/actions/organization';

export default function OrganizationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [organizations, setOrganizations] = useState<OrganizationWithId[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationWithId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      setIsLoading(true);
      const result = await getUserOrganizations();
      if (result.organizations.length > 0) {
        setOrganizations(result.organizations);
        // Set first organization as selected by default
        setSelectedOrganization(result.organizations[0]);
      }
      setIsLoading(false);
    };

    fetchOrganizations();
  }, []);

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOrganizationChange = (org: OrganizationWithId) => {
    setSelectedOrganization(org);
    setIsOpen(false);
    setSearchQuery('');
    // TODO: Add logic to switch organization context
  };

  const handleViewAllOrganizations = () => {
    setIsOpen(false);
    setSearchQuery('');
    // TODO: Add logic to navigate to all organizations page
    console.log('View all organizations');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-start cursor-pointer"
      >
        <span className="text-sm font-bold text-[#BC4918] mb-1">ORGANIZATION</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white">
            {isLoading ? 'Loading...' : selectedOrganization?.name || 'No organization'}
          </span>
          <svg
            className={`w-3 h-3 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      <div
        className={`absolute z-10 mt-2 bg-[#212121] border border-[#424242] rounded-lg shadow-lg overflow-hidden min-w-[280px] transition-all duration-200 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Search Input */}
        <div className="p-3 border-b border-[#424242]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Find an organization"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-[#424242] rounded-lg text-white text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#BC4918] focus:border-transparent transition-all"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Organization List */}
        <div className="py-2 px-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-white/60 text-center">
              Loading organizations...
            </div>
          ) : filteredOrganizations.length > 0 ? (
            filteredOrganizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => handleOrganizationChange(org)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer rounded-lg ${
                  selectedOrganization?.id === org.id
                    ? 'bg-[#BC4918]/20 text-[#BC4918] hover:bg-[#BC4918]/30'
                    : 'text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {org.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-white/60 text-center">
              No organizations found
            </div>
          )}
        </div>

        {/* Create New Organization */}
        <div className="py-2 px-2">
          <button
            type="button"
            onClick={() => {
              console.log('Create new organization clicked');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#FF8D28] hover:text-[#FF8D28]/80 hover:bg-[#FF8D28]/10 transition-colors duration-200 cursor-pointer flex items-center gap-2 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create new organization
          </button>
        </div>

        {/* View All Organizations */}
        <div className="border-t border-[#424242]">
          <button
            type="button"
            onClick={handleViewAllOrganizations}
            className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-[#2a2a2a] transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            View all organizations
          </button>
        </div>
      </div>
    </div>
  );
}

