'use client';

import { usePathname } from 'next/navigation';
import MainLayoutClient from './MainLayoutClient';
import type { OrganizationWithId } from '@/actions/organization';

interface ConditionalLayoutWrapperProps {
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  organizations: OrganizationWithId[];
  selectedOrganization: OrganizationWithId | null;
  children: React.ReactNode;
}

export default function ConditionalLayoutWrapper({
  userEmail,
  userName,
  userId,
  organizations,
  selectedOrganization,
  children,
}: ConditionalLayoutWrapperProps) {
  const pathname = usePathname();
  const isRepoRoute = pathname?.includes('/repo/');

  // If this is a repo route, don't wrap in MainLayoutClient (repo layout will handle it)
  if (isRepoRoute) {
    return <>{children}</>;
  }

  // Otherwise, use the main layout
  return (
    <MainLayoutClient
      userEmail={userEmail}
      userName={userName}
      userId={userId}
      organizations={organizations}
      selectedOrganization={selectedOrganization}
    >
      {children}
    </MainLayoutClient>
  );
}

