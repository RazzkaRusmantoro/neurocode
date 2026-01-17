import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import SettingsClient from './components/SettingsClient';

export default async function SettingsPage() {
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

  // Prepare user data for the client component
  const userData = {
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
  };

  return <SettingsClient userData={userData} />;
}
