'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardNavbar from '@/app/components/DashboardNavbar';
import RepoSidebar from '@/app/components/RepoSidebar';
import DocumentationSidebar from '../[orgShortId]/repo/[repoName]/documentation/components/DocumentationSidebar';
import { RepoCacheProvider } from '../[orgShortId]/repo/context/RepoCacheContext';
import { DocumentationProvider, useDocumentation } from '../[orgShortId]/repo/[repoName]/documentation/context/DocumentationContext';
import type { OrganizationWithId } from '@/actions/organization';
import type { Repository } from '@/lib/models/repository';

// Wrapper component to use the context
function DocumentationSidebarWrapper() {
  const { activeSection, setActiveSection } = useDocumentation();
  return (
    <DocumentationSidebar 
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    />
  );
}

interface RepositoryWithId extends Repository {
  id: string;
}

interface RepoLayoutClientProps {
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  organizations: OrganizationWithId[];
  selectedOrganization: OrganizationWithId | null;
  repositories: RepositoryWithId[];
}

export default function RepoLayoutClient({
  userEmail,
  userName,
  userId,
  organizations,
  selectedOrganization,
  repositories,
  children,
}: RepoLayoutClientProps & { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  // Extract repo name from pathname (e.g., /org-x7k2/repo/repo-name -> repo-name)
  const repoMatch = pathname.match(/\/repo\/([^/]+)/);
  const currentRepoName = repoMatch ? repoMatch[1] : null;
  const selectedRepository = currentRepoName
    ? repositories.find(repo => repo.urlName === currentRepoName) || null
    : null;

  // Hide sidebar on documentation title pages
  const isDocumentationTitlePage = pathname.includes('/documentation/title');

  return (
    <RepoCacheProvider>
      <DocumentationProvider>
        <div className="h-screen flex bg-transparent">
        {/* Sidebar on the left - full height */}
        {isDocumentationTitlePage ? (
          <DocumentationSidebarWrapper />
        ) : (
          <RepoSidebar 
            isExpanded={isSidebarExpanded} 
            onToggle={toggleSidebar}
            userName={userName}
            userEmail={userEmail}
          />
        )}
        
        {/* Right side - Navbar and content stacked */}
        <div className="flex-1 flex flex-col overflow-hidden px-16">
          {/* Navbar */}
          <DashboardNavbar 
            userEmail={userEmail} 
            userName={userName}
            organizations={organizations}
            selectedOrganization={selectedOrganization}
            repositories={repositories}
            selectedRepository={selectedRepository}
          />
          
          {/* Main content area */}
          <main className="flex-1 overflow-hidden min-h-0">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
      </DocumentationProvider>
    </RepoCacheProvider>
  );
}

