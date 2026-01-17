'use server';

import { getUsersCollection, getUserById } from '@/lib/models/user';
import { updateOrganizationName } from '@/lib/models/organization';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function updateUserPersonalization(
  primaryGoal: string,
  role: string
) {
  try {
    // Get the authenticated user from the session (server-side)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const userId = session.user.id;
    const collection = await getUsersCollection();
    const now = new Date();

    await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          personalization: {
            primaryGoal,
            role,
          },
          updatedAt: now,
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update personalization' };
  }
}


// Will need refactoring in case of some situations where maybe the user gets invited without prior of makign an account and stuff but idk yet, we'll see
// This function assumes its the first org because the user registers so idk maybe later we change it
export async function updateUserOrganizationName(organizationName: string) {
  try {
    // Get the authenticated user from the session (server-side)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const userId = session.user.id;
    const user = await getUserById(userId);
    
    if (!user || !user.organizations || user.organizations.length === 0) {
      return { error: 'User has no organizations' };
    }

    // Update the first organization (default organization)
    const firstOrg = user.organizations[0];
    const organizationId = firstOrg.organizationId.toString();
    
    // Update organization name in organizations collection
    const success = await updateOrganizationName(organizationId, organizationName);
    
    if (!success) {
      return { error: 'Failed to update organization name' };
    }

    // Update organization name in user's organizations array
    const collection = await getUsersCollection();
    const now = new Date();
    
    const updatedOrganizations = user.organizations.map((org, index) => 
      index === 0 
        ? { ...org, name: organizationName }
        : org
    );

    await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          organizations: updatedOrganizations,
          updatedAt: now,
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update organization name' };
  }
}

