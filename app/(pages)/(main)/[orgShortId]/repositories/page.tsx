import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getRepositoriesByOrganization } from '@/lib/models/repository';
import { generateSlug } from '@/lib/utils/slug';
import RepositorySearch from './components/RepositorySearch';
import RepositoryCard from './components/RepositoryCard';

export default async function RepositoriesPage({
  params
}: {
  params: Promise<{ orgShortId: string }> | { orgShortId: string };
}) {
  // Fetch session server-side (cached - uses same fetch as layout)
  const session = await getCachedSession();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user data server-side (cached - only fetches once per request)
  const user = await getCachedUserById(session.user.id);

  if (!user) {
    redirect('/login');
  }

  // Get organization from URL params (already validated in layout)
  const resolvedParams = await Promise.resolve(params);
  const shortId = resolvedParams.orgShortId.startsWith('org-') 
    ? resolvedParams.orgShortId.replace('org-', '') 
    : resolvedParams.orgShortId;

  const organization = await getOrganizationByShortId(shortId);

  if (!organization) {
    redirect('/organizations');
  }

  // Check if user is a member of this organization (quick check from user data)
  const userOrg = user.organizations?.find(
    org => org.organizationId.toString() === organization._id!.toString()
  );

  if (!userOrg) {
    redirect('/organizations');
  }

  // Check if GitHub is connected
  const isGitHubConnected = user.github && user.github.status === 'active';
  const githubAccount = user.github?.providerAccount || null;

  // Fetch repositories directly (no redundant checks)
  const repositories = await getRepositoriesByOrganization(organization._id!.toString());

  // Format repositories for display
  // Generate urlName for existing repos that don't have it yet
  const formattedRepositories = repositories
    .filter(repo => repo._id) // Filter out repos without IDs
    .map(repo => ({
      id: repo._id!.toString(),
      name: repo.name,
      urlName: repo.urlName || generateSlug(repo.name), // Generate urlName if missing
      url: repo.url,
      source: repo.source,
      description: repo.description,
      size: repo.size,
      lastUpdate: repo.lastUpdate,
      addedAt: repo.addedAt,
    }));

  // Create selectedOrganization object for RepositorySearch component
  const selectedOrganization = {
    id: organization._id!.toString(),
    shortId: organization.shortId,
    name: userOrg.name,
    role: userOrg.role,
    ownerId: organization.ownerId.toString(),
  };

  return (
    <div className="mx-auto max-w-screen-2xl">
      <h1 className="text-3xl font-bold text-white mb-10">Repositories</h1>
      
      <RepositorySearch 
        githubAccount={githubAccount} 
        selectedOrganization={selectedOrganization}
      />

      {/* Repositories Grid */}
      <div className="mt-10">
        {formattedRepositories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {formattedRepositories.map((repo) => (
              <RepositoryCard
                key={repo.id}
                id={repo.id}
                name={repo.name}
                urlName={repo.urlName}
                url={repo.url}
                orgShortId={shortId}
                source={repo.source}
                addedAt={repo.addedAt}
                description={repo.description}
                size={repo.size ? `${(repo.size / 1024).toFixed(2)} MB` : undefined}
                lastUpdate={repo.lastUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-center">
            <p className="text-white/70">
              {selectedOrganization 
                ? 'No repositories found. Add a repository to get started.'
                : 'No organization selected. Please select an organization to view repositories.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
