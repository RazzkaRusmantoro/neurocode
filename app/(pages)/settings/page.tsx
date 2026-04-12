import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import OrganizationsNavbar from '@/app/components/OrganizationsNavbar';
import SettingsClient from './components/SettingsClient';
export default async function SettingsPage() {
    const session = await getCachedSession();
    if (!session?.user?.id) {
        redirect('/login');
    }
    const user = await getCachedUserById(session.user.id);
    if (!user) {
        redirect('/login');
    }
    const userData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        github: user.github || null,
    };
    return (<>
      <OrganizationsNavbar userEmail={session.user.email} userName={session.user.name}/>
      <SettingsClient userData={userData}/>
    </>);
}
