import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getRepositoryByUrlNameAndOrganization } from '@/lib/models/repository';
import GlossaryViewer from '../documentation/components/GlossaryViewer';

export default async function GlossaryPage({
  params
}: {
  params: Promise<{ orgShortId: string; repoName: string }> | { orgShortId: string; repoName: string };
}) {
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

  // Get organization and repository from URL params
  const resolvedParams = await Promise.resolve(params);
  const shortId = resolvedParams.orgShortId.startsWith('org-') 
    ? resolvedParams.orgShortId.replace('org-', '') 
    : resolvedParams.orgShortId;
  const repoName = resolvedParams.repoName;

  const organization = await getOrganizationByShortId(shortId);

  if (!organization) {
    redirect('/organizations');
  }

  // Check if user is a member of this organization
  const userOrg = user.organizations?.find(
    org => org.organizationId.toString() === organization._id!.toString()
  );

  if (!userOrg) {
    redirect('/organizations');
  }

  // Get repository by urlName
  const repository = await getRepositoryByUrlNameAndOrganization(
    repoName,
    organization._id!.toString()
  );

  if (!repository) {
    redirect(`/org-${shortId}/repositories`);
  }

  return (
    <GlossaryViewer
      repositoryId={repository._id!.toString()}
      orgShortId={shortId}
      repoUrlName={repoName}
      repoName={repository.name}
    />
  );
}

