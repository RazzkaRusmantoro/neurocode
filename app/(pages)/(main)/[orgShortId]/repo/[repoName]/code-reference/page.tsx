import { getCachedUserById } from '@/lib/models/user';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/session';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getRepositoryByUrlNameAndOrganization } from '@/lib/models/repository';
import CodeReferenceViewer from '../documentation/components/CodeReferenceViewer';

export default async function CodeReferencePage({
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

  // Extract owner/repo from GitHub URL (e.g., https://github.com/owner/repo -> owner/repo)
  let repoFullName = '';
  if (repository.url && repository.source === 'github') {
    try {
      const url = new URL(repository.url);
      const pathParts = url.pathname.split('/').filter(part => part);
      if (pathParts.length >= 2) {
        repoFullName = `${pathParts[0]}/${pathParts[1]}`;
      }
    } catch (error) {
      console.error('Error parsing repository URL:', error);
    }
  }

  return (
    <>
      {repoFullName ? (
        <CodeReferenceViewer
          repositoryId={repository._id!.toString()}
          repoFullName={repoFullName}
          orgShortId={shortId}
          repoUrlName={repoName}
          repoName={repository.name}
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="px-4 py-8 text-center text-white/60 text-sm">
            Repository URL not available
          </div>
        </div>
      )}
    </>
  );
}

