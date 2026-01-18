import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import RepositorySearch from './components/RepositorySearch';

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

  // Check if GitHub is connected
  const isGitHubConnected = user.github && user.github.status === 'active';

  return (
    <div className="mx-auto max-w-screen-2xl py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Repositories</h1>
      
      {isGitHubConnected && <RepositorySearch />}
      
      {!isGitHubConnected && (
        <div className="mt-6">
          <p className="text-white/70 mb-4">Connect your GitHub account to view your repositories.</p>
        </div>
      )}
    </div>
  );
}
