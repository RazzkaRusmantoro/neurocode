import { redirect } from 'next/navigation';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getUserOrganizations } from '@/actions/organization';
import { getCachedSession } from '@/lib/session';
import { getRepositoriesByOrganization } from '@/lib/models/repository';
import RepoLayoutClient from '../../components/RepoLayoutClient';

export default async function RepoLayout({ 
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

  // Get all repositories for this organization
  const repositories = await getRepositoriesByOrganization(organization._id!.toString());
  // Serialize repositories for client components (convert ObjectId and Date to strings)
  const repositoriesWithId = repositories.map(repo => ({
    _id: repo._id!.toString(),
    id: repo._id!.toString(),
    organizationId: repo.organizationId.toString(),
    githubId: repo.githubId,
    name: repo.name,
    urlName: repo.urlName,
    url: repo.url,
    source: repo.source,
    description: repo.description,
    size: repo.size,
    lastUpdate: repo.lastUpdate ? repo.lastUpdate.toISOString() : undefined,
    addedAt: repo.addedAt.toISOString(),
  }));

  return (
    <RepoLayoutClient
      userEmail={session.user.email}
      userName={session.user.name}
      userId={session.user.id}
      organizations={organizations}
      selectedOrganization={selectedOrganization}
      repositories={repositoriesWithId}
    >
      {children}
    </RepoLayoutClient>
  );
}

