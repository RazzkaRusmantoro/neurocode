import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCachedUserById } from '@/lib/models/user';
import { getGitHubTokenWithFallback, testGitHubTokenAccess } from '@/lib/utils/github-token';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { getRepositoryByUrlNameAndOrganization } from '@/lib/models/repository';
import { markCommentAsPosted, markCommentPostFailed } from '@/lib/models/pr_comment';

/**
 * POST /api/github/repositories/[repoId]/pull-requests/[prNumber]/comments
 * Post review comments to a GitHub pull request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repoId: string; prNumber: string }> | { repoId: string; prNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getCachedUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await Promise.resolve(params);
    const { repoId, prNumber } = resolvedParams;
    const prNumberInt = parseInt(prNumber, 10);

    if (isNaN(prNumberInt)) {
      return NextResponse.json({ error: 'Invalid PR number' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const orgShortId = searchParams.get('orgShortId');
    const repoUrlName = searchParams.get('repoUrlName');

    if (!orgShortId || !repoUrlName) {
      return NextResponse.json(
        { error: 'orgShortId and repoUrlName are required' },
        { status: 400 }
      );
    }

    // Get organization and repository
    const shortId = orgShortId.startsWith('org-') ? orgShortId.replace('org-', '') : orgShortId;
    const organization = await getOrganizationByShortId(shortId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const repository = await getRepositoryByUrlNameAndOrganization(
      repoUrlName,
      organization._id!.toString()
    );
    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Get GitHub token
    const tokenResult = await getGitHubTokenWithFallback(
      session.user.id,
      organization._id!.toString(),
      repoUrlName,
      testGitHubTokenAccess
    );

    if (!tokenResult?.token) {
      return NextResponse.json({ error: 'No GitHub access available' }, { status: 401 });
    }

    const accessToken = tokenResult.token;

    // Extract repo full name from URL
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

    if (!repoFullName) {
      return NextResponse.json({ error: 'Could not determine repository full name' }, { status: 400 });
    }

    // Get request body with comments
    const body = await request.json();
    const { comments } = body;

    if (!Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json({ error: 'Comments array is required' }, { status: 400 });
    }

    // Fetch PR details to get the head commit SHA
    console.log(`[PR Comments] Fetching PR details for ${repoFullName} PR #${prNumberInt}`);
    const prResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/pulls/${prNumberInt}`,
      {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    let headCommitSha: string | null = null;
    if (prResponse.ok) {
      const prData = await prResponse.json();
      headCommitSha = prData.head?.sha || null;
      console.log(`[PR Comments] PR head commit SHA: ${headCommitSha}`);
    } else {
      console.error(`[PR Comments] Failed to fetch PR details: ${prResponse.status}`);
    }

    // Fetch PR files to get the diff and calculate positions
    console.log(`[PR Comments] Fetching PR files for ${repoFullName} PR #${prNumberInt}`);
    const prFilesResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/pulls/${prNumberInt}/files`,
      {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    let prFiles: any[] = [];
    if (prFilesResponse.ok) {
      prFiles = await prFilesResponse.json();
      console.log(`[PR Comments] Found ${prFiles.length} files in PR`);
    } else {
      console.error(`[PR Comments] Failed to fetch PR files: ${prFilesResponse.status}`);
    }

    // Helper function to calculate position in diff for a given line number
    // Returns { position: number, actualLine: number, isExact: boolean } or null
    const calculatePositionInDiff = (filePath: string, targetLine: number, side: string): { position: number; actualLine: number; isExact: boolean } | null => {
      console.log(`[PR Comments] Calculating position for file: ${filePath}, line: ${targetLine}, side: ${side}`);
      const file = prFiles.find((f: any) => f.filename === filePath || f.filename.endsWith(filePath));
      if (!file) {
        console.log(`[PR Comments] File not found in PR files. Available files: ${prFiles.map((f: any) => f.filename).join(', ')}`);
        return null;
      }
      if (!file.patch) {
        console.log(`[PR Comments] File found but no patch available for ${filePath}`);
        return null;
      }

      console.log(`[PR Comments] Found file: ${file.filename}, patch length: ${file.patch.length} chars`);
      const lines = file.patch.split('\n');
      let position = 0;
      let currentOldLine = 0;
      let currentNewLine = 0;
      
      // Track hunks for fallback - store position of first line in each hunk
      const hunks: Array<{ oldStart: number; newStart: number; firstLinePosition: number }> = [];

      for (const line of lines) {
        if (line.startsWith('@@')) {
          // Parse the hunk header to get the starting line numbers
          const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
          if (match) {
            currentOldLine = parseInt(match[1], 10);
            currentNewLine = parseInt(match[3], 10);
            const oldLength = match[2] ? parseInt(match[2], 10) : 1;
            const newLength = match[4] ? parseInt(match[4], 10) : 1;
            
            console.log(`[PR Comments] New hunk: old starts at ${currentOldLine} (length ${oldLength}), new starts at ${currentNewLine} (length ${newLength})`);
            
            // Store hunk info - firstLinePosition will be set when we process the first diff line
            hunks.push({
              oldStart: currentOldLine,
              newStart: currentNewLine,
              firstLinePosition: 0 // Will be set when we encounter first diff line
            });
          }
          // Don't count hunk headers in position
        } else if (line.startsWith('+++') || line.startsWith('---')) {
          // File header lines - don't count
          continue;
        } else if (line.startsWith('+')) {
          // Added line - count in position
          position++;
          // Check if this is the first line after a hunk header
          if (hunks.length > 0 && hunks[hunks.length - 1].firstLinePosition === 0) {
            hunks[hunks.length - 1].firstLinePosition = position;
          }
          currentNewLine++;
          if (side === 'RIGHT' && currentNewLine === targetLine) {
            console.log(`[PR Comments] Found target line! Position: ${position}, New line: ${currentNewLine}`);
            return { position, actualLine: currentNewLine, isExact: true };
          }
        } else if (line.startsWith('-')) {
          // Removed line - count in position
          position++;
          // Check if this is the first line after a hunk header
          if (hunks.length > 0 && hunks[hunks.length - 1].firstLinePosition === 0) {
            hunks[hunks.length - 1].firstLinePosition = position;
          }
          currentOldLine++;
          if (side === 'LEFT' && currentOldLine === targetLine) {
            console.log(`[PR Comments] Found target line! Position: ${position}, Old line: ${currentOldLine}`);
            return { position, actualLine: currentOldLine, isExact: true };
          }
        } else if (line.startsWith(' ')) {
          // Context line - count in position
          position++;
          // Check if this is the first line after a hunk header
          if (hunks.length > 0 && hunks[hunks.length - 1].firstLinePosition === 0) {
            hunks[hunks.length - 1].firstLinePosition = position;
          }
          currentOldLine++;
          currentNewLine++;
          // Check if we've reached the target line in context
          if (side === 'RIGHT' && currentNewLine === targetLine) {
            console.log(`[PR Comments] Found target line in context! Position: ${position}, New line: ${currentNewLine}`);
            return { position, actualLine: currentNewLine, isExact: true };
          }
          if (side === 'LEFT' && currentOldLine === targetLine) {
            console.log(`[PR Comments] Found target line in context! Position: ${position}, Old line: ${currentOldLine}`);
            return { position, actualLine: currentOldLine, isExact: true };
          }
        }
      }

      // If exact line not found, find the nearest hunk and use its first line
      console.log(`[PR Comments] Could not find exact line ${targetLine} in diff. Searching for nearest hunk...`);
      
      let nearestHunk: { oldStart: number; newStart: number; firstLinePosition: number } | null = null;
      let minDistance = Infinity;
      
      for (const hunk of hunks) {
        if (hunk.firstLinePosition === 0) continue; // Skip if we didn't capture the position
        const lineToCheck = side === 'RIGHT' ? hunk.newStart : hunk.oldStart;
        const distance = Math.abs(targetLine - lineToCheck);
        if (distance < minDistance) {
          minDistance = distance;
          nearestHunk = hunk;
        }
      }
      
      if (nearestHunk && nearestHunk.firstLinePosition > 0) {
        const hunkLine = side === 'RIGHT' ? nearestHunk.newStart : nearestHunk.oldStart;
        console.log(`[PR Comments] Found nearest hunk starting at line ${hunkLine} (distance: ${minDistance}). Using first line position: ${nearestHunk.firstLinePosition} (target was line ${targetLine})`);
        return { position: nearestHunk.firstLinePosition, actualLine: hunkLine, isExact: false };
      }

      console.log(`[PR Comments] Could not find line ${targetLine} in diff and no suitable hunk found. Final position: ${position}`);
      return null;
    };

    // Post comments to GitHub
    const postedComments = [];
    const errors = [];

    for (const comment of comments) {
      try {
        // Extract and validate required fields from comment object
        const path = comment.path;
        const line = comment.line !== null && comment.line !== undefined ? comment.line : null;
        const side = comment.side || 'RIGHT';
        const commentBody = comment.body;

        // Validate required fields
        if (!path || typeof path !== 'string' || path.trim().length === 0) {
          errors.push({ comment, error: 'Missing or invalid path field' });
          continue;
        }

        if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
          errors.push({ comment, error: 'Missing or invalid body field' });
          continue;
        }

        // If we have a line number and commit SHA, try to post as a review comment
        if (line !== null && line !== undefined && headCommitSha) {
          // Use commit_id and line instead of position
          const reviewCommentUrl = `https://api.github.com/repos/${repoFullName}/pulls/${prNumberInt}/comments`;
          
          const payload = {
            body: commentBody,
            path: path,
            commit_id: headCommitSha,
            line: line,
            side: side,
          };
          
          console.log(`[PR Comments] Posting review comment to ${reviewCommentUrl}`);
          console.log(`[PR Comments] Payload:`, JSON.stringify(payload, null, 2));
          
          const response = await fetch(reviewCommentUrl, {
            method: 'POST',
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`[PR Comments] Successfully posted review comment. GitHub ID: ${result.id}`);
            
            // Save to database
            try {
              await markCommentAsPosted(
                organization._id!.toString(),
                repository._id!.toString(),
                prNumberInt,
                {
                  path: path,
                  line: line,
                  side: side,
                  body: commentBody,
                  severity: comment.severity,
                  issueType: comment.issueType,
                },
                result.id,
                result.html_url || result.url || '',
                session.user.id
              );
            } catch (dbError: any) {
              console.error(`[PR Comments] Failed to save comment to DB:`, dbError);
            }
            
            postedComments.push({ ...comment, githubId: result.id });
            continue;
          } else {
            const errorText = await response.text();
            console.error(`[PR Comments] Failed to post review comment. Status: ${response.status}, Error: ${errorText}`);
            
            // Save error to database
            try {
              await markCommentPostFailed(
                organization._id!.toString(),
                repository._id!.toString(),
                prNumberInt,
                {
                  path: path,
                  line: line,
                  side: side,
                  body: commentBody,
                },
                `GitHub API error: ${response.status} - ${errorText}`
              );
            } catch (dbError: any) {
              console.error(`[PR Comments] Failed to save error to DB:`, dbError);
            }
            
            // Fall through to general comment fallback
            console.log(`[PR Comments] Falling back to general comment`);
          }
        } else if (line !== null && line !== undefined && !headCommitSha) {
          console.log(`[PR Comments] No commit SHA available, falling back to general comment`);
        }

        // Fallback to general PR comment if no line or position not found
        const generalCommentUrl = `https://api.github.com/repos/${repoFullName}/issues/${prNumberInt}/comments`;
        
        let formattedBody = '';
        if (line !== null && line !== undefined) {
          formattedBody = `**File:** \`${path}\`\n**Line:** ${line}\n\n${commentBody}`;
        } else {
          formattedBody = `**File:** \`${path}\`\n\n${commentBody}`;
        }
        
        console.log(`[PR Comments] Posting general comment to ${generalCommentUrl}`);
        console.log(`[PR Comments] Comment body length: ${formattedBody.length} chars`);
        
        const response = await fetch(generalCommentUrl, {
          method: 'POST',
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: formattedBody
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[PR Comments] Successfully posted general comment. GitHub ID: ${result.id}`);
          
          // Save to database
          try {
            await markCommentAsPosted(
              organization._id!.toString(),
              repository._id!.toString(),
              prNumberInt,
              {
                path: path,
                line: line,
                side: side,
                body: commentBody,
                severity: comment.severity,
                issueType: comment.issueType,
              },
              result.id,
              result.html_url || result.url || '',
              session.user.id
            );
          } catch (dbError: any) {
            console.error(`[PR Comments] Failed to save comment to DB:`, dbError);
          }
          
          postedComments.push({ ...comment, githubId: result.id });
        } else {
          const errorText = await response.text();
          console.error(`[PR Comments] Failed to post general comment. Status: ${response.status}, Error: ${errorText}`);
          
          // Save error to database
          try {
            await markCommentPostFailed(
              organization._id!.toString(),
              repository._id!.toString(),
              prNumberInt,
              {
                path: path,
                line: line,
                side: side,
                body: commentBody,
              },
              `GitHub API error: ${response.status} - ${errorText}`
            );
          } catch (dbError: any) {
            console.error(`[PR Comments] Failed to save error to DB:`, dbError);
          }
          
          errors.push({ comment, error: `GitHub API error: ${response.status} - ${errorText}` });
        }
      } catch (error: any) {
        errors.push({ comment, error: error.message || 'Unknown error' });
      }
    }

    console.log(`[PR Comments] Summary: Posted ${postedComments.length}/${comments.length} comments. Errors: ${errors.length}`);
    
    return NextResponse.json({
      success: true,
      posted: postedComments.length,
      total: comments.length,
      postedComments,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error posting PR comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post comments' },
      { status: 500 }
    );
  }
}

