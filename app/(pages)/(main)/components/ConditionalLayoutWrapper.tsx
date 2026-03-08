'use client';

import { usePathname } from 'next/navigation';
import MainLayoutClient from './MainLayoutClient';
import OnboardingPathLayoutClient from './OnboardingPathLayoutClient';
import type { OrganizationWithId } from '@/actions/organization';

interface ConditionalLayoutWrapperProps {
  userEmail?: string | null;
  userName?: string | null;
  userId?: string | null;
  userImageUrl?: string | null;
  organizations: OrganizationWithId[];
  selectedOrganization: OrganizationWithId | null;
  children: React.ReactNode;
}

export default function ConditionalLayoutWrapper({
  userEmail,
  userName,
  userId,
  userImageUrl,
  organizations,
  selectedOrganization,
  children,
}: ConditionalLayoutWrapperProps) {
  const pathname = usePathname();
  const isRepoRoute = pathname?.includes('/repo/');
  // Onboarding path detail (e.g. /org-xxx/onboarding/getting-started): use page's own doc-style sidebar, no app sidebar
  const isOnboardingPathDetail = pathname != null && /\/onboarding\/[^/]+$/.test(pathname);

  // Repo route: repo layout handles its own sidebar.
  if (isRepoRoute) {
    return <>{children}</>;
  }

  // Onboarding path detail: same layout as doc page — sidebar left, navbar only over right column.
  if (isOnboardingPathDetail) {
    return (
      <OnboardingPathLayoutClient
        userEmail={userEmail}
        userName={userName}
        userId={userId}
        userImageUrl={userImageUrl}
        organizations={organizations}
        selectedOrganization={selectedOrganization}
      >
        {children}
      </OnboardingPathLayoutClient>
    );
  }

  // Otherwise, use the full main layout (sidebar + navbar)
  return (
    <MainLayoutClient
      userEmail={userEmail}
      userName={userName}
      userId={userId}
      userImageUrl={userImageUrl}
      organizations={organizations}
      selectedOrganization={selectedOrganization}
    >
      {children}
    </MainLayoutClient>
  );
}

