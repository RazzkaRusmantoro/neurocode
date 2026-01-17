import { redirect } from 'next/navigation';
import { getUserOrganizations, type OrganizationWithId } from '@/actions/organization';
import { getCachedSession } from '@/lib/session';
import MainLayoutClient from './components/MainLayoutClient';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch session server-side (cached - only fetches once per request)
  const session = await getCachedSession();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch organizations server-side
  const { organizations } = await getUserOrganizations();
  const selectedOrganization = organizations.length > 0 ? organizations[0] : null;

  return (
    <MainLayoutClient
      userEmail={session.user.email}
      userName={session.user.name}
      userId={session.user.id}
      organizations={organizations}
      selectedOrganization={selectedOrganization}
    >
      {children}
    </MainLayoutClient>
  );
}

