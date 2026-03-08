'use client';

import { useState } from 'react';
import DashboardNavbar from '@/app/components/DashboardNavbar';
import Sidebar from '@/app/components/Sidebar';
import type { OrganizationWithId } from '@/actions/organization';

interface MainLayoutClientProps {
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  userImageUrl?: string | null;
  organizations: OrganizationWithId[];
  selectedOrganization: OrganizationWithId | null;
  /** When true, hide the app sidebar (e.g. onboarding path page uses its own doc sidebar) */
  hideSidebar?: boolean;
}

export default function MainLayoutClient({
  userEmail,
  userName,
  userId,
  userImageUrl,
  organizations,
  selectedOrganization,
  hideSidebar = false,
  children,
}: MainLayoutClientProps & { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="h-screen flex bg-transparent">
      {/* Sidebar on the left - full height (hidden when hideSidebar, e.g. onboarding path) */}
      {!hideSidebar && (
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          onToggle={toggleSidebar}
          userName={userName}
          userEmail={userEmail}
          userImageUrl={userImageUrl}
        />
      )}
      
      {/* Right side - Navbar and content stacked */}
      <div className="flex-1 flex flex-col overflow-hidden px-16">
        {/* Navbar */}
        <DashboardNavbar 
          userEmail={userEmail} 
          userName={userName}
          userImageUrl={userImageUrl}
          organizations={organizations}
          selectedOrganization={selectedOrganization}
        />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto hide-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

