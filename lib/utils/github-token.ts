import { getCachedUserById } from '@/lib/models/user';
import { getOrganizationById } from '@/lib/models/organization';
import { getRepositoryByUrlNameAndOrganization } from '@/lib/models/repository';

/**
 * Gets a GitHub access token with fallback logic:
 * 1. Try requesting user's token (if they have GitHub connected)
 * 2. If repo is private and user's token fails, try the token of who added the repo
 * 3. If that fails, try the organization owner's token
 */
export async function getGitHubTokenWithFallback(
  requestingUserId: string,
  organizationId: string,
  repoUrlName: string,
  testToken?: (token: string, repoFullName: string) => Promise<boolean>
): Promise<{ token: string; source: 'user' | 'addedBy' | 'owner' } | null> {
  // Get requesting user
  const requestingUser = await getCachedUserById(requestingUserId);
  if (!requestingUser) {
    return null;
  }

  // Get repository to find who added it
  const repository = await getRepositoryByUrlNameAndOrganization(repoUrlName, organizationId);
  if (!repository) {
    return null;
  }

  // Get organization to find owner
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    return null;
  }

  // Extract repo full name from URL
  let repoFullName = '';
  if (repository.url && repository.source === 'github') {
    try {
      const url = new URL(repository.url);
      const pathParts = url.pathname.split('/').filter(part => part);
      if (pathParts.length >= 2) {
        repoFullName = `${pathParts[0]}/${pathParts[1]}`;
      }
    } catch (error) {
      console.error('Error parsing repository URL:', error);
    }
  }

  // Tier 1: Try requesting user's token
  if (requestingUser.github?.accessToken && requestingUser.github.status === 'active') {
    if (!testToken) {
      // If no test function provided, just return the token
      return { token: requestingUser.github.accessToken, source: 'user' };
    }
    
    // Test if token works
    const userTokenWorks = await testToken(requestingUser.github.accessToken, repoFullName);
    if (userTokenWorks) {
      return { token: requestingUser.github.accessToken, source: 'user' };
    }
    // If user's token doesn't work (private repo they don't have access to), continue to fallback
  }

  // Tier 2: Try the token of who added the repository
  if (repository.addedBy) {
    const addedByUser = await getCachedUserById(repository.addedBy.toString());
    if (addedByUser?.github?.accessToken && addedByUser.github.status === 'active') {
      if (!testToken) {
        return { token: addedByUser.github.accessToken, source: 'addedBy' };
      }
      
      const addedByTokenWorks = await testToken(addedByUser.github.accessToken, repoFullName);
      if (addedByTokenWorks) {
        return { token: addedByUser.github.accessToken, source: 'addedBy' };
      }
    }
  }

  // Tier 3: Try organization owner's token
  const owner = await getCachedUserById(organization.ownerId.toString());
  if (owner?.github?.accessToken && owner.github.status === 'active') {
    return { token: owner.github.accessToken, source: 'owner' };
  }

  // No valid token found
  return null;
}

/**
 * Tests if a GitHub token can access a repository
 */
export async function testGitHubTokenAccess(
  token: string,
  repoFullName: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    // 200 or 204 means we have access
    return response.ok;
  } catch (error) {
    return false;
  }
}

