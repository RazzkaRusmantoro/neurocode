/**
 * POST /api/documentation/generate
 * Generate documentation by calling Python service
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { getCachedUserById } from '@/lib/models/user';
import { getGitHubTokenWithFallback, testGitHubTokenAccess } from '@/lib/utils/github-token';
import { getRepositoryByUrlNameAndOrganization } from '@/lib/models/repository';
import { getOrganizationByShortId } from '@/lib/models/organization';
import { createDocumentation } from '@/lib/models/documentation';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getCachedUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { 
      repoFullName, 
      orgShortId, 
      repoUrlName, 
      branch = 'main', 
      scope = 'repository',
      target,
      prompt  // User's prompt/description for custom documentation
    } = body;

    if (!repoFullName || !orgShortId || !repoUrlName) {
      return NextResponse.json(
        { error: 'repoFullName, orgShortId, and repoUrlName are required' },
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

    // Determine which endpoint to call based on scope
    let pythonEndpoint = '/api/generate-documentation';
    let requestBody: any = {
      github_token: accessToken,
      repo_full_name: repoFullName,
      branch: branch,
      scope: scope,
      // Platform organization info (REQUIRED for collection naming)
      organization_id: organization._id!.toString(),
      organization_short_id: organization.shortId,
      organization_name: organization.name,
      // Platform repository info (REQUIRED for collection naming)
      repository_id: repository._id!.toString(),
      repository_name: repository.name,
    };

    // For custom documentation with prompt, use RAG endpoint
    if (scope === 'custom' && prompt) {
      pythonEndpoint = '/api/generate-docs-rag';
      requestBody.prompt = prompt;
    } else {
      // For other scopes, include target if provided
      if (target) {
        requestBody.target = target;
      }
    }

    // Call Python service
    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}${pythonEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('[Python Service Error]', errorText);
      return NextResponse.json(
        { 
          error: 'Python service error', 
          details: errorText 
        },
        { status: pythonResponse.status }
      );
    }

    const result = await pythonResponse.json();
    
    // If S3 upload was successful, save metadata to MongoDB
    if (result.success && result.s3) {
      try {
        // Determine scope - if custom, use 'custom', otherwise use the provided scope
        const docScope = (scope === 'custom' && prompt) ? 'custom' : scope;
        
        // Get version number (check for existing docs with same scope/target/branch)
        // For now, set version to 1 and isLatest to true
        // TODO: Implement proper versioning logic later
        const version = 1;
        const isLatest = true;
        
        // Save to MongoDB
        const documentation = await createDocumentation(
          repository._id!.toString(),
          {
            organizationId: organization._id!.toString(),
            scope: docScope as 'file' | 'module' | 'repository' | 'custom',
            target: target || undefined,
            prompt: prompt || undefined,
            title: result.title || undefined, // Include title from Python service
            description: result.description || undefined, // Include description from Python service
            s3Key: result.s3.s3_key,
            s3Bucket: result.s3.s3_bucket,
            contentSize: result.s3.content_size,
            version: version,
            isLatest: isLatest,
            branch: branch,
            code_reference_ids: result.code_reference_ids || undefined, // Array of code reference IDs
            glossary_term_ids: result.glossary_term_ids || undefined, // Array of glossary term IDs
            createdBy: new ObjectId(session.user.id),
          }
        );
        
        console.log(`[Documentation] Saved to MongoDB with ID: ${documentation._id}`);
        
        // Return result with MongoDB document ID
        return NextResponse.json({
          success: true,
          documentationId: documentation._id!.toString(),
          ...result,
        });
      } catch (dbError) {
        console.error('[Documentation] Failed to save to MongoDB:', dbError);
        // Still return success if Python service succeeded, but log the error
        // The documentation is in S3, MongoDB save can be retried later if needed
        return NextResponse.json({
          success: true,
          warning: 'Documentation uploaded to S3 but failed to save metadata to MongoDB',
          ...result,
        });
      }
    }

    // If no S3 upload (fallback or error), return as-is
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Documentation Generation Error]', error);
    return NextResponse.json(
      {
        error: 'Failed to generate documentation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

