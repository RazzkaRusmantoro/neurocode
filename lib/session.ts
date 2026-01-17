import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Cached session getter - ensures session is only fetched once per request
 * Use this instead of getServerSession() to avoid duplicate fetches
 */
export const getCachedSession = cache(async () => {
  return await getServerSession(authOptions);
});

