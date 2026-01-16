'use server';

import { getUsersCollection } from '@/lib/models/user';
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

