'use server';

import { getUserById } from '@/lib/models/user';
import { getOrganizationsCollection } from '@/lib/models/organization';
import { getCachedSession } from '@/lib/session';
import { ObjectId } from 'mongodb';

export interface OrganizationWithId {
  id: string;
  shortId: string;
  name: string;
  role: 'owner' | 'member' | 'admin';
  ownerId: string;
}

export async function getUserOrganizations(): Promise<{ organizations: OrganizationWithId[]; error?: string }> {
  try {
    const session = await getCachedSession();
    
    if (!session?.user?.id) {
      return { organizations: [], error: 'Unauthorized' };
    }

    const user = await getUserById(session.user.id);
    
    if (!user || !user.organizations || user.organizations.length === 0) {
      return { organizations: [] };
    }

    // Get organization details from organizations collection to get ownerId
    const collection = await getOrganizationsCollection();
    const organizationIds = user.organizations.map(org => org.organizationId);
    
    const orgDocs = await collection
      .find({ _id: { $in: organizationIds } })
      .toArray();

    // Create a map for quick lookup
    const orgMap = new Map(
      orgDocs.map(org => [org._id!.toString(), org])
    );

    // Build result from user's organizations array (which has name and role)
    const organizationsWithId: OrganizationWithId[] = user.organizations.map(userOrg => {
      const orgDoc = orgMap.get(userOrg.organizationId.toString());
      return {
        id: userOrg.organizationId.toString(),
        shortId: orgDoc?.shortId || '',
        name: userOrg.name,
        role: userOrg.role,
        ownerId: orgDoc?.ownerId.toString() || '',
      };
    });

    return { organizations: organizationsWithId };
  } catch (error: any) {
    return { organizations: [], error: error.message || 'Failed to fetch organizations' };
  }
}

