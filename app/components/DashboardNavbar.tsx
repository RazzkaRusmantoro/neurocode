'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface DashboardNavbarProps {
  userEmail?: string | null;
  userName?: string | null;
}

export default function DashboardNavbar({ userEmail, userName }: DashboardNavbarProps) {
  const router = useRouter();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Placeholder organization data - replace with actual data later
  const organizations = ['Razzka\'s Org - 2024-07-22', 'Another Org - 2024-06-15', 'Third Organization - 2024-05-10'];
  const [selectedOrganization, setSelectedOrganization] = useState(organizations[0]);
  
  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org =>
    org.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
        setSearchQuery('');
      }
    };

    if (isOrgDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOrgDropdownOpen]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  const handleProfileClick = () => {
    // Placeholder for profile click handler
    console.log('Profile clicked');
  };

  const handleOrganizationChange = (org: string) => {
    setSelectedOrganization(org);
    setIsOrgDropdownOpen(false);
    setSearchQuery('');
    // TODO: Add logic to switch organization context
  };

  const handleViewAllOrganizations = () => {
    setIsOrgDropdownOpen(false);
    setSearchQuery('');
    // TODO: Add logic to navigate to all organizations page
    console.log('View all organizations');
  };

  // Get initials from name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <nav className="w-full" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="flex items-center py-8">
        <div className="flex items-center gap-12 w-full max-w-screen-2xl mx-auto">
          {/* Organization Dropdown */}
          <div className="relative" ref={orgDropdownRef}>
            <button
              type="button"
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex flex-col items-start cursor-pointer"
            >
              <span className="text-sm font-bold text-[#BC4918] mb-1">ORGANIZATION</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{selectedOrganization}</span>
                <svg 
                  className={`w-3 h-3 text-white/70 transition-transform duration-200 ${isOrgDropdownOpen ? 'rotate-180' : ''}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            <div
              className={`absolute z-10 mt-2 bg-[#212121] border border-[#424242] rounded-lg shadow-lg overflow-hidden min-w-[280px] transition-all duration-200 ease-in-out ${
                isOrgDropdownOpen
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
              <div className="py-2 max-h-64 overflow-y-auto">
                {filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((org, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleOrganizationChange(org)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                        selectedOrganization === org
                          ? 'bg-[#BC4918]/20 text-[#BC4918] hover:bg-[#BC4918]/30'
                          : 'text-white hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {org}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-white/60 text-center">
                    No organizations found
                  </div>
                )}
              </div>
              
              {/* Create New Organization */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Create new organization clicked');
                    setIsOrgDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#FF8D28] hover:text-[#FF8D28]/80 hover:bg-[#FF8D28]/10 transition-colors duration-200 cursor-pointer flex items-center gap-2"
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
          
          {/* Right Side - Icons and Profile */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Person Add Icon */}
            <button
              className="p-2 text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
              aria-label="Add person"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>

            {/* Notification Bell Icon */}
            <button
              className="p-2 text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* 9 Blocks Icon */}
            <button
              className="p-2 text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
              aria-label="Apps"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Profile Picture with Name */}
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer"
              aria-label="Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-[#BC4918] flex items-center justify-center text-white text-sm font-medium">
                {getInitials(userName)}
              </div>
              {userName && (
                <span className="text-sm text-white/70 hover:text-white">
                  {userName}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

