import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import { getUserOrganizations } from '@/actions/organization';
import OrganizationsNavbar from '@/app/components/OrganizationsNavbar';
import OrganizationsPageClient from './components/OrganizationsPageClient';
export default async function OrganizationsPage() {
    const session = await getCachedSession();
    if (!session?.user) {
        redirect('/login');
    }
    const { organizations } = await getUserOrganizations();
    return (<>
      <OrganizationsNavbar userEmail={session.user.email} userName={session.user.name}/>
      <OrganizationsPageClient organizations={organizations}/>
    </>);
}
