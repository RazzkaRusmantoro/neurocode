import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import { getUserOrganizations } from '@/actions/organization';
import OrganizationsNavbar from '@/app/components/OrganizationsNavbar';
import OrganizationsPageClient from './components/OrganizationsPageClient';

export default async function OrganizationsPage() {
  // Fetch session server-side
  const session = await getCachedSession();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Get user organizations
  const { organizations } = await getUserOrganizations();

  return (
    <>
      <OrganizationsNavbar 
        userEmail={session.user.email}
        userName={session.user.name}
      />
      <OrganizationsPageClient organizations={organizations} />
    </>
  );
}

