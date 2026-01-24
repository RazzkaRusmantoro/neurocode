'use client';

import { useState } from 'react';
import DashboardNavbar from '@/app/components/DashboardNavbar';
import RepoSidebar from '@/app/components/RepoSidebar';
import type { OrganizationWithId } from '@/actions/organization';

interface RepoLayoutClientProps {
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  organizations: OrganizationWithId[];
  selectedOrganization: OrganizationWithId | null;
}

export default function RepoLayoutClient({
  userEmail,
  userName,
  userId,
  organizations,
  selectedOrganization,
  children,
}: RepoLayoutClientProps & { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="h-screen flex bg-transparent">
      {/* Sidebar on the left - full height */}
      <RepoSidebar 
        isExpanded={isSidebarExpanded} 
        onToggle={toggleSidebar}
        userName={userName}
        userEmail={userEmail}
      />
      
      {/* Right side - Navbar and content stacked */}
      <div className="flex-1 flex flex-col overflow-hidden px-16">
        {/* Navbar */}
        <DashboardNavbar 
          userEmail={userEmail} 
          userName={userName}
          organizations={organizations}
          selectedOrganization={selectedOrganization}
        />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

