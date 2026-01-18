import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  updated_at: string;
  stargazers_count: number;
}

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
  const githubToken = user.github?.accessToken;
  let repositories: GitHubRepository[] = [];

  // Fetch repositories from GitHub if connected
  if (isGitHubConnected && githubToken) {
    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        // Enable Next.js caching for this request
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      });

      if (response.ok) {
        repositories = await response.json();
      } else {
        console.error('Failed to fetch GitHub repositories:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Repositories</h1>
      
      {!isGitHubConnected ? (
        <div className="mt-6">
          <p className="text-white/70 mb-4">Connect your GitHub account to view your repositories.</p>
          <a 
            href="/settings" 
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Settings
          </a>
        </div>
      ) : repositories.length === 0 ? (
        <p className="text-white/70">No repositories found or unable to fetch repositories.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          {repositories.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {repo.full_name}
                    </h3>
                    {repo.private && (
                      <span className="px-2 py-0.5 text-xs bg-[#2a2a2a] text-white/60 rounded border border-[#3a3a3a]">
                        Private
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {repo.stargazers_count}
                    </span>
                    <span className="text-white/40">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <svg 
                  className="w-5 h-5 text-white/40 flex-shrink-0 ml-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
