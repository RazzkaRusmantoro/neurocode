import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch session server-side (cached - only fetches once per request)
  const session = await getCachedSession();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Just pass through children - the child layout will handle MainLayoutClient
  return <>{children}</>;
}

