import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCachedUserById } from '@/lib/models/user';
import { getGitHubTokenWithFallback, testGitHubTokenAccess } from '@/lib/utils/github-token';
import { getRepositoryByUrlNameAndOrganization } from '@/lib/models/repository';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { OrchestratorAgent } from '@/neurocode-ai/agents/orchestrator/OrchestratorAgent';
import { createDocumentation } from '@/lib/models/documentation';
import { nanoid } from 'nanoid';

/**
 * POST /api/documentation/[repoId]
 * Generate documentation for a repository
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> | { repoId: string } }
) {
  const requestStartTime = Date.now();
  console.log(`[API] POST /api/documentation - Starting request`);
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log(`[API] ✗ Not authenticated`);
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getCachedUserById(session.user.id);
    if (!user) {
      console.log(`[API] ✗ User not found: ${session.user.id}`);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await Promise.resolve(params);
    const repoFullName = decodeURIComponent(resolvedParams.repoId);
    console.log(`[API] Repository: ${repoFullName}, User: ${session.user.id}`);

    // Get request body
    const body = await request.json();
    const { scope = 'repository', target, branch = 'main', orgShortId, repoUrlName } = body;
    console.log(`[API] Request params: scope=${scope}, target=${target || 'N/A'}, branch=${branch}`);

    // Get organization and repository
    if (!orgShortId || !repoUrlName) {
      return Response.json(
        { error: 'orgShortId and repoUrlName are required' },
        { status: 400 }
      );
    }

    const shortId = orgShortId.startsWith('org-') ? orgShortId.replace('org-', '') : orgShortId;
    const organization = await getOrganizationByShortId(shortId);

    if (!organization) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    const repository = await getRepositoryByUrlNameAndOrganization(repoUrlName, organization._id!.toString());

    if (!repository) {
      return Response.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Get GitHub token
    const tokenResult = await getGitHubTokenWithFallback(
      session.user.id,
      organization._id!.toString(),
      repoUrlName,
      testGitHubTokenAccess
    );

    if (!tokenResult?.token) {
      return Response.json({ error: 'No GitHub access available' }, { status: 401 });
    }

    const accessToken = tokenResult.token;
    console.log(`[API] ✓ GitHub token obtained`);

    // Fetch repository files
    console.log(`[API] Fetching repository files from branch: ${branch}...`);
    const files = await fetchRepositoryFiles(repoFullName, accessToken, branch);
    console.log(`[API] ✓ Fetched ${files.length} files from repository`);

    if (files.length === 0) {
      console.log(`[API] ✗ No files found in repository`);
      return Response.json({ error: 'No files found in repository' }, { status: 404 });
    }

    // Create agent context
    const requestId = nanoid();
    const context = {
      requestId,
      repositoryId: repository._id!.toString(),
      userId: session.user.id,
      scope: scope as 'file' | 'module' | 'repository',
      target: target || (scope === 'repository' ? 'full' : undefined),
    };
    console.log(`[API] Created agent context: requestId=${requestId}, repositoryId=${context.repositoryId}`);

    // Initialize orchestrator and generate documentation
    console.log(`[API] Initializing OrchestratorAgent...`);
    const orchestrator = new OrchestratorAgent();
    const result = await orchestrator.execute(context, { files });
    console.log(`[API] ✓ Documentation generated successfully`);

    // Store documentation in database
    console.log(`[API] Storing documentation in database...`);
    const documentation = await createDocumentation(repository._id!.toString(), {
      scope: context.scope,
      target: context.target || 'full',
      content: result.documentation,
      metadata: result.metadata,
      branch,
      createdBy: new (await import('mongodb')).ObjectId(session.user.id),
    });
    console.log(`[API] ✓ Documentation stored with ID: ${documentation._id!.toString()}`);

    const totalTime = Date.now() - requestStartTime;
    console.log(`[API] ✓ Request completed in ${totalTime}ms`);

    return Response.json({
      success: true,
      documentation: {
        id: documentation._id!.toString(),
        content: documentation.content,
        metadata: documentation.metadata,
        scope: documentation.scope,
        target: documentation.target,
        createdAt: documentation.createdAt,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[API] ✗ Error after ${totalTime}ms:`, error);
    return Response.json(
      { error: 'Failed to generate documentation', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documentation/[repoId]
 * Get existing documentation for a repository
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string }> | { repoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { searchParams } = new URL(request.url);
    const orgShortId = searchParams.get('orgShortId');
    const repoUrlName = searchParams.get('repoUrlName');
    const scope = searchParams.get('scope') as 'file' | 'module' | 'repository' | null;
    const target = searchParams.get('target');

    if (!orgShortId || !repoUrlName) {
      return Response.json(
        { error: 'orgShortId and repoUrlName are required' },
        { status: 400 }
      );
    }

    const shortId = orgShortId.startsWith('org-') ? orgShortId.replace('org-', '') : orgShortId;
    const organization = await getOrganizationByShortId(shortId);

    if (!organization) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    const repository = await getRepositoryByUrlNameAndOrganization(repoUrlName, organization._id!.toString());

    if (!repository) {
      return Response.json({ error: 'Repository not found' }, { status: 404 });
    }

    const { getDocumentationByRepository } = await import('@/lib/models/documentation');
    const documentation = await getDocumentationByRepository(
      repository._id!.toString(),
      scope || undefined,
      target || undefined
    );

    if (!documentation) {
      return Response.json({ error: 'Documentation not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      documentation: {
        id: documentation._id!.toString(),
        content: documentation.content,
        metadata: documentation.metadata,
        scope: documentation.scope,
        target: documentation.target,
        createdAt: documentation.createdAt,
        updatedAt: documentation.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return Response.json(
      { error: 'Failed to fetch documentation', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Fetch all repository files recursively
 */
async function fetchRepositoryFiles(
  repoFullName: string,
  accessToken: string,
  branch: string,
  path: string = ''
): Promise<Array<{ path: string; content: string; language: string }>> {
  console.log(`[fetchRepositoryFiles] Starting fetch for ${repoFullName} (branch: ${branch}, path: ${path || 'root'})`);
  const files: Array<{ path: string; content: string; language: string }> = [];
  const maxFiles = 50; // Limit to prevent overwhelming the system
  const supportedLanguages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'cpp', 'c'];

  async function fetchPath(currentPath: string): Promise<void> {
    if (files.length >= maxFiles) return;

    const apiUrl = currentPath
      ? `https://api.github.com/repos/${repoFullName}/contents/${currentPath}?ref=${branch}`
      : `https://api.github.com/repos/${repoFullName}/contents?ref=${branch}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${currentPath}:`, response.status);
      return;
    }

    const contents = await response.json();
    const items = Array.isArray(contents) ? contents : [contents];

    for (const item of items) {
      if (files.length >= maxFiles) break;

      if (item.type === 'file') {
        // Only process supported languages
        const language = item.language?.toLowerCase() || '';
        if (supportedLanguages.includes(language) || item.name.endsWith('.ts') || item.name.endsWith('.tsx') || item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
          if (item.download_url) {
            try {
              const fileResponse = await fetch(item.download_url);
              if (fileResponse.ok) {
                const content = await fileResponse.text();
                files.push({
                  path: item.path,
                  content,
                  language: item.language || 'typescript',
                });
                if (files.length % 10 === 0) {
                  console.log(`[fetchRepositoryFiles] Fetched ${files.length} files so far...`);
                }
              }
            } catch (error) {
              console.error(`[fetchRepositoryFiles] Failed to fetch content for ${item.path}:`, error);
            }
          }
        }
      } else if (item.type === 'dir') {
        // Skip node_modules, .git, and other common directories
        if (!item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'dist' && item.name !== 'build') {
          await fetchPath(item.path);
        }
      }
    }
  }

  await fetchPath(path);
  console.log(`[fetchRepositoryFiles] ✓ Completed: ${files.length} files fetched`);
  return files;
}

