'use client';

import OrganizationDropdown from './OrganizationDropdown';
import ProfileDropdown from './ProfileDropdown';

interface DashboardNavbarProps {
  userEmail?: string | null;
  userName?: string | null;
}

export default function DashboardNavbar({ userEmail, userName }: DashboardNavbarProps) {

  return (
    <nav className="w-full" style={{ fontFamily: 'var(--font-poppins)' }}>
      <div className="flex items-center py-8">
        <div className="flex items-center gap-12 w-full max-w-screen-2xl mx-auto">
          {/* Organization Dropdown */}
          <OrganizationDropdown />
          
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

            {/* Profile Dropdown */}
            <ProfileDropdown userEmail={userEmail} userName={userName} />
          </div>
        </div>
      </div>
    </nav>
  );
}

