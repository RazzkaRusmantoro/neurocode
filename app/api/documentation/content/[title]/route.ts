/**
 * GET /api/documentation/content/[title]
 * Get documentation content by title
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCachedUserById } from '@/lib/models/user';
import { getDocumentationCollection } from '@/lib/models/documentation';
import { getCodeReferencesByIds } from '@/lib/models/code_reference';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> | { title: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getCachedUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await Promise.resolve(params);
    const title = decodeURIComponent(resolvedParams.title);

    // Get documentation by title
    const collection = await getDocumentationCollection();
    const documentation = await collection.findOne({ title });

    if (!documentation) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    // Check if user has access to this organization
    const userOrg = user.organizations?.find(
      org => org.organizationId.toString() === documentation.organizationId.toString()
    );

    if (!userOrg) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch content from S3 via Python backend
    const pythonBackendUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${pythonBackendUrl}/api/get-documentation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3_key: documentation.s3Key,
          s3_bucket: documentation.s3Bucket,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from S3: ${response.statusText}`);
      }

      const s3Data = await response.json();
      
      if (!s3Data.success) {
        return NextResponse.json(
          { error: s3Data.error || s3Data.detail || 'Failed to fetch documentation content' },
          { status: response.status }
        );
      }

      // Parse the JSON content
      const content = JSON.parse(s3Data.content);

      // Fetch detailed code references from MongoDB if they exist
      let codeReferencesDetails: any[] = [];
      if (content.code_references && content.code_references.length > 0) {
        try {
          codeReferencesDetails = await getCodeReferencesByIds(
            documentation.repositoryId.toString(),
            content.code_references,
            documentation.organizationId.toString()
          );
          
          // Convert ObjectIds to strings for JSON serialization
          codeReferencesDetails = codeReferencesDetails.map(ref => ({
            _id: ref._id?.toString(),
            referenceId: ref.referenceId,
            name: ref.name,
            type: ref.type,
            module: ref.module,
            filePath: ref.filePath,
            description: ref.description,
            signature: ref.signature, // Full signature with module path and parameters (no type prefix)
            parameters: ref.parameters,
            returns: ref.returns,
            examples: ref.examples,
            seeAlso: ref.seeAlso,
            code: ref.code, // Raw code snippet
          }));
        } catch (codeRefError) {
          console.error('[Documentation API] Error fetching code references:', codeRefError);
          // Continue without code reference details if fetch fails
        }
      }

      return NextResponse.json({
        success: true,
        documentation: {
          _id: documentation._id?.toString(),
          title: documentation.title,
          metadata: content.metadata || {},
          documentation: content.documentation || {},
          code_references: codeReferencesDetails.length > 0 ? codeReferencesDetails : content.code_references || [],
        },
      });
    } catch (s3Error) {
      console.error('[Documentation API] Error fetching from S3:', s3Error);
      return NextResponse.json(
        {
          error: 'Failed to fetch documentation content from S3',
          message: s3Error instanceof Error ? s3Error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Documentation API] Error fetching documentation content:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch documentation content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

