import { redirect } from 'next/navigation';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getUserOrganizations } from '@/actions/organization';
import { getCachedSession } from '@/lib/session';
import ConditionalLayoutWrapper from '../components/ConditionalLayoutWrapper';

export default async function OrgLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ orgShortId: string }> | { orgShortId: string };
}) {
  // Fetch session server-side
  const session = await getCachedSession();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Await params if it's a Promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  
  // Check if orgShortId exists
  if (!resolvedParams?.orgShortId) {
    redirect('/organizations');
  }
  
  // Extract orgShortId from URL (remove "org-" prefix if present)
  const shortId = resolvedParams.orgShortId.startsWith('org-') 
    ? resolvedParams.orgShortId.replace('org-', '') 
    : resolvedParams.orgShortId;

  // Look up organization by shortId
  const organization = await getOrganizationByShortId(shortId);

  if (!organization) {
    // Organization not found, redirect to first org or dashboard
    const { organizations } = await getUserOrganizations();
    if (organizations.length > 0) {
      redirect(`/org-${organizations[0].shortId}/dashboard`);
    } else {
      redirect('/dashboard');
    }
  }

  // Get all user organizations for the dropdown
  const { organizations } = await getUserOrganizations();
  const selectedOrganization = organizations.find(org => org.id === organization._id!.toString()) || null;

  return (
    <ConditionalLayoutWrapper
      userEmail={session.user.email}
      userName={session.user.name}
      userId={session.user.id}
      organizations={organizations}
      selectedOrganization={selectedOrganization}
    >
      {children}
    </ConditionalLayoutWrapper>
  );
}

