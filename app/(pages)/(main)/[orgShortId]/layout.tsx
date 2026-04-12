import { redirect } from 'next/navigation';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getUserOrganizations } from '@/actions/organization';
import { getCachedSession } from '@/lib/session';
import { getCachedUserById } from '@/lib/models/user';
import ConditionalLayoutWrapper from '../components/ConditionalLayoutWrapper';
function getGitHubAvatarUrl(user: {
    github?: {
        status: string;
        providerUserId?: string;
    };
} | null): string | null {
    if (!user?.github?.providerUserId || user.github.status !== 'active')
        return null;
    return `https://avatars.githubusercontent.com/u/${user.github.providerUserId}`;
}
export default async function OrgLayout({ children, params }: {
    children: React.ReactNode;
    params: Promise<{
        orgShortId: string;
    }> | {
        orgShortId: string;
    };
}) {
    const session = await getCachedSession();
    if (!session?.user) {
        redirect('/login');
    }
    const resolvedParams = await Promise.resolve(params);
    if (!resolvedParams?.orgShortId) {
        redirect('/organizations');
    }
    const shortId = resolvedParams.orgShortId.startsWith('org-')
        ? resolvedParams.orgShortId.replace('org-', '')
        : resolvedParams.orgShortId;
    const organization = await getOrganizationByShortId(shortId);
    if (!organization) {
        const { organizations } = await getUserOrganizations();
        if (organizations.length > 0) {
            redirect(`/org-${organizations[0].shortId}/dashboard`);
        }
        else {
            redirect('/dashboard');
        }
    }
    const { organizations } = await getUserOrganizations();
    const selectedOrganization = organizations.find(org => org.id === organization._id!.toString()) || null;
    const user = await getCachedUserById(session.user.id);
    const userImageUrl = getGitHubAvatarUrl(user);
    return (<ConditionalLayoutWrapper userEmail={session.user.email} userName={session.user.name} userId={session.user.id} userImageUrl={userImageUrl} organizations={organizations} selectedOrganization={selectedOrganization}>
      {children}
    </ConditionalLayoutWrapper>);
}
