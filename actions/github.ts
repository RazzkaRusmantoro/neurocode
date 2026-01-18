'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserById, getUsersCollection } from '@/lib/models/user';

/**
 * Get the GitHub OAuth authorization URL
 * Call this when user clicks "Connect GitHub"
 */
export async function getGitHubAuthUrl(userId: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID is not configured');
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/github/callback`;
  
  // Store userId in state parameter to identify user after OAuth
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo', // Request repo access
    state: state,
    prompt: 'consent', // Force re-authorization screen to allow account switching
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Disconnect GitHub connection
 * Removes GitHub connection from user's account
 */
export async function disconnectGitHub(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.github) {
      return { success: false, error: 'GitHub not connected' };
    }

    const collection = await getUsersCollection();
    await collection.updateOne(
      { _id: user._id },
      {
        $unset: {
          github: '', // Completely remove github field - allows switching accounts
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting GitHub:', error);
    return { success: false, error: 'Failed to disconnect GitHub' };
  }
}
