'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCachedUserById } from '@/lib/models/user';
import { createRepository, getRepositoryByGithubIdAndOrganization, getRepositoriesByOrganization } from '@/lib/models/repository';
import { addRepositoryToOrganization, getOrganizationById } from '@/lib/models/organization';
import { ObjectId } from 'mongodb';

interface AddRepositoryData {
  githubId?: number; // Optional - only for GitHub repos
  name: string;
  url: string;
  source: 'github' | 'bitbucket' | 'upload';
  description?: string; // Optional description
  size?: number; // Repository size in KB
  lastUpdate?: Date | string; // Last update date
}

export async function addRepository(
  organizationId: string,
  repositoryData: AddRepositoryData
): Promise<{ success: boolean; error?: string; repositoryId?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await getCachedUserById(session.user.id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify user has access to the organization
    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    // Check if user is a member of this organization
    const userOrg = user.organizations?.find(
      org => org.organizationId.toString() === organizationId
    );
    if (!userOrg) {
      return { success: false, error: 'Unauthorized: Not a member of this organization' };
    }

    // Check if repository already exists in this organization (only for GitHub repos with githubId)
    if (repositoryData.githubId) {
      const existingRepo = await getRepositoryByGithubIdAndOrganization(
        repositoryData.githubId,
        organizationId
      );
      if (existingRepo) {
        return { success: false, error: 'Repository already exists in this organization' };
      }
    }

    // Create repository in repositories collection
    const repository = await createRepository(organizationId, repositoryData);

    // Add repository reference to organization
    const success = await addRepositoryToOrganization(
      organizationId,
      repository._id!,
      repositoryData.githubId,
      repositoryData.name
    );

    if (!success) {
      return { success: false, error: 'Failed to add repository to organization' };
    }

    return { success: true, repositoryId: repository._id!.toString() };
  } catch (error: any) {
    console.error('Error adding repository:', error);
    return { success: false, error: error.message || 'Failed to add repository' };
  }
}

export async function getOrganizationRepositories(
  organizationId: string
): Promise<{ success: boolean; repositories?: any[]; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await getCachedUserById(session.user.id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify user has access to the organization
    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      return { success: false, error: 'Organization not found' };
    }

    // Check if user is a member of this organization
    const userOrg = user.organizations?.find(
      org => org.organizationId.toString() === organizationId
    );
    if (!userOrg) {
      return { success: false, error: 'Unauthorized: Not a member of this organization' };
    }

    // Get all repositories for this organization
    const repositories = await getRepositoriesByOrganization(organizationId);

    return { 
      success: true, 
      repositories: repositories.map(repo => ({
        id: repo._id?.toString(),
        name: repo.name,
        url: repo.url,
        source: repo.source,
        githubId: repo.githubId,
        description: repo.description,
        size: repo.size,
        lastUpdate: repo.lastUpdate,
        addedAt: repo.addedAt,
      }))
    };
  } catch (error: any) {
    console.error('Error fetching repositories:', error);
    return { success: false, error: error.message || 'Failed to fetch repositories' };
  }
}

