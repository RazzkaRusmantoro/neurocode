import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCachedUserById } from '@/lib/models/user';
import { getGitHubTokenWithFallback, testGitHubTokenAccess } from '@/lib/utils/github-token';
import { getRepositoryByUrlNameAndOrganization } from '@/lib/models/repository';
import { getOrganizationByShortId } from '@/lib/models/organization';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> | { repoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getCachedUserById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await Promise.resolve(params);
    const repoFullName = decodeURIComponent(resolvedParams.repoId);
    
    // Extract organization and repo info from the request
    // We need to find the repository to get organization info
    // For now, we'll get it from the URL structure or pass it as a query param
    // Since we don't have org info in the URL, we'll use a simpler approach:
    // Try user's token first, then fallback logic will be handled by the helper
    
    // Get GitHub token with fallback
    const { searchParams } = new URL(request.url);
    const orgShortId = searchParams.get('orgShortId');
    const repoUrlName = searchParams.get('repoUrlName');
    
    let accessToken: string | null = null;
    
    if (orgShortId && repoUrlName) {
      // Use fallback system
      const shortId = orgShortId.startsWith('org-') ? orgShortId.replace('org-', '') : orgShortId;
      const organization = await getOrganizationByShortId(shortId);
      
      if (organization) {
        const tokenResult = await getGitHubTokenWithFallback(
          session.user.id,
          organization._id!.toString(),
          repoUrlName,
          testGitHubTokenAccess
        );
        
        if (tokenResult) {
          accessToken = tokenResult.token;
        }
      }
    }
    
    // Fallback: if no token from fallback system, try user's token directly
    if (!accessToken && user.github?.accessToken && user.github.status === 'active') {
      accessToken = user.github.accessToken;
    }
    
    if (!accessToken) {
      return Response.json({ error: 'No GitHub access available' }, { status: 401 });
    }
    
    // Get path from query parameter (defaults to root if not provided)
    const path = searchParams.get('path') || '';
    const ref = searchParams.get('ref') || 'main'; // Default to main branch

    // Build the API URL
    const apiUrl = path 
      ? `https://api.github.com/repos/${repoFullName}/contents/${path}?ref=${ref}`
      : `https://api.github.com/repos/${repoFullName}/contents?ref=${ref}`;

    // Fetch repository contents from GitHub API
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch repository contents' }, { status: response.status });
    }

    const contents = await response.json();
    
    // Format contents - handle both single file and array of files/folders
    const formattedContents = Array.isArray(contents) 
      ? contents.map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type, // 'file' or 'dir'
          size: item.size || 0,
          sha: item.sha,
          url: item.html_url,
          downloadUrl: item.download_url,
          gitUrl: item.git_url,
        }))
      : [{
          name: contents.name,
          path: contents.path,
          type: contents.type,
          size: contents.size || 0,
          sha: contents.sha,
          url: contents.html_url,
          downloadUrl: contents.download_url,
          gitUrl: contents.git_url,
          content: contents.content, // Base64 encoded content for files
          encoding: contents.encoding,
          language: contents.language || null, // Language detected by GitHub
        }];

    return Response.json({ contents: formattedContents });
  } catch (error) {
    console.error('Error fetching repository contents:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

