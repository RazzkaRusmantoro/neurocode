import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import { getUserOrganizations } from '@/actions/organization';
import { getOrganizationRepositories } from '@/actions/repository';
import RepositorySearch from './components/RepositorySearch';
import RepositoryCard from './components/RepositoryCard';

export default async function RepositoriesPage() {
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

  // Get user organizations and select the first one (same as layout)
  const { organizations } = await getUserOrganizations();
  const selectedOrganization = organizations.length > 0 ? organizations[0] : null;

  // Check if GitHub is connected
  const isGitHubConnected = user.github && user.github.status === 'active';
  const githubAccount = user.github?.providerAccount || null;

  // Fetch repositories for the selected organization
  let repositories: any[] = [];
  if (selectedOrganization) {
    const reposResult = await getOrganizationRepositories(selectedOrganization.id);
    if (reposResult.success && reposResult.repositories) {
      repositories = reposResult.repositories;
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl">
      <h1 className="text-3xl font-bold text-white mb-10">Repositories</h1>
      
      <RepositorySearch 
        githubAccount={githubAccount} 
        selectedOrganization={selectedOrganization}
      />

      {/* Repositories Grid */}
      <div className="mt-10">
        {repositories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {repositories.map((repo) => (
              <RepositoryCard
                key={repo.id}
                id={repo.id}
                name={repo.name}
                url={repo.url}
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
