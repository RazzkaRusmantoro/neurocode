import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCachedUserById } from '@/lib/models/user';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getRepositoriesByOrganization } from '@/lib/models/repository';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

function extractRepoFullName(repoUrl: string): string | null {
  try {
    const url = new URL(repoUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  } catch { /* ignore */ }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgShortId, taskId, taskTitle, taskDescription, taskType, repositories, topK } = body;

    if (!orgShortId || !taskTitle) {
      return NextResponse.json(
        { error: 'orgShortId and taskTitle are required' },
        { status: 400 },
      );
    }

    let githubToken: string | null = null;
    let repoFullNames: string[] = [];

    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await getCachedUserById(session.user.id);
      if (user?.github?.accessToken && user.github.status === 'active') {
        githubToken = user.github.accessToken;
      }

      const shortId = orgShortId.startsWith('org-') ? orgShortId.replace('org-', '') : orgShortId;
      const organization = await getOrganizationByShortId(shortId);
      if (organization?._id) {
        const repos = await getRepositoriesByOrganization(organization._id.toString());
        const taskRepoNames = Array.isArray(repositories) ? repositories.map((r: string) => r.toLowerCase()) : null;

        for (const repo of repos) {
          if (!repo.url || repo.source !== 'github') continue;
          const fullName = extractRepoFullName(repo.url);
          if (!fullName) continue;

          if (taskRepoNames) {
            const repoNameLower = (repo.urlName || repo.name || '').toLowerCase();
            if (taskRepoNames.some(t => repoNameLower.includes(t.toLowerCase()) || t.toLowerCase().includes(repoNameLower))) {
              repoFullNames.push(fullName);
            }
          } else {
            repoFullNames.push(fullName);
          }
        }
      }
    }

    const pythonPayload = {
      org_short_id: orgShortId,
      task_id: taskId || '',
      task_title: taskTitle,
      task_description: taskDescription || null,
      task_type: taskType || null,
      repositories: Array.isArray(repositories) ? repositories : null,
      top_k: typeof topK === 'number' ? topK : 15,
      github_token: githubToken,
      repo_full_names: repoFullNames.length > 0 ? repoFullNames : null,
    };

    const resp = await fetch(`${PYTHON_SERVICE_URL}/task-compass/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pythonPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[task-compass] Python service error:', resp.status, errText);
      return NextResponse.json(
        { error: 'Task compass analysis failed', details: errText },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[task-compass] Error:', e);
    return NextResponse.json(
      { error: 'Task compass request failed', details: String(e) },
      { status: 500 },
    );
  }
}
