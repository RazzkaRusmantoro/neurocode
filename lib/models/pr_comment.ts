import { ObjectId } from 'mongodb';
import { getDb } from '../db';

export interface PRComment {
  _id?: ObjectId;
  
  // Identification
  organizationId: ObjectId;
  repositoryId: ObjectId;
  prNumber: number;
  
  // Comment identification (to match with reviewComments array)
  commentHash: string; // Hash of path + line + body to uniquely identify the comment
  
  // Comment data
  path: string;
  line: number | null;
  side: 'LEFT' | 'RIGHT' | null;
  body: string;
  severity?: string;
  issueType?: string;
  
  // GitHub posting status
  posted: boolean;
  postedAt?: Date;
  githubCommentId?: number; // GitHub's comment ID
  githubCommentUrl?: string;
  
  // Error tracking
  postError?: string;
  postAttempts: number;
  
  // Metadata
  postedBy?: ObjectId; // User who posted it
  createdAt: Date;
  updatedAt: Date;
}

export async function getPRCommentsCollection() {
  const db = await getDb();
  return db.collection<PRComment>('pr_comments');
}

/**
 * Generate a hash for a comment to uniquely identify it
 * Uses a simple hash that can be replicated in the frontend
 */
function generateCommentHash(path: string, line: number | null, body: string): string {
  const str = `${path}:${line}:${body}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
}

/**
 * Mark a comment as posted
 */
export async function markCommentAsPosted(
  organizationId: string,
  repositoryId: string,
  prNumber: number,
  comment: {
    path: string;
    line: number | null;
    side: 'LEFT' | 'RIGHT' | null;
    body: string;
    severity?: string;
    issueType?: string;
  },
  githubCommentId: number,
  githubCommentUrl: string,
  postedBy?: string
): Promise<PRComment> {
  const collection = await getPRCommentsCollection();
  const commentHash = generateCommentHash(comment.path, comment.line, comment.body);
  const now = new Date();

  const update: Partial<PRComment> = {
    posted: true,
    postedAt: now,
    githubCommentId,
    githubCommentUrl,
    postAttempts: 1,
    updatedAt: now,
  };

  if (postedBy) {
    update.postedBy = new ObjectId(postedBy);
  }

  const result = await collection.findOneAndUpdate(
    {
      organizationId: new ObjectId(organizationId),
      repositoryId: new ObjectId(repositoryId),
      prNumber: prNumber,
      commentHash: commentHash,
    },
    {
      $set: update,
      $setOnInsert: {
        organizationId: new ObjectId(organizationId),
        repositoryId: new ObjectId(repositoryId),
        prNumber: prNumber,
        commentHash: commentHash,
        path: comment.path,
        line: comment.line,
        side: comment.side,
        body: comment.body,
        severity: comment.severity,
        issueType: comment.issueType,
        posted: true,
        postedAt: now,
        githubCommentId,
        githubCommentUrl,
        postAttempts: 1,
        createdAt: now,
        updatedAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );

  return result as PRComment;
}

/**
 * Mark a comment posting as failed
 */
export async function markCommentPostFailed(
  organizationId: string,
  repositoryId: string,
  prNumber: number,
  comment: {
    path: string;
    line: number | null;
    side: 'LEFT' | 'RIGHT' | null;
    body: string;
  },
  error: string
): Promise<void> {
  const collection = await getPRCommentsCollection();
  const commentHash = generateCommentHash(comment.path, comment.line, comment.body);
  const now = new Date();

  await collection.updateOne(
    {
      organizationId: new ObjectId(organizationId),
      repositoryId: new ObjectId(repositoryId),
      prNumber: prNumber,
      commentHash: commentHash,
    },
    {
      $set: {
        postError: error,
        updatedAt: now,
      },
      $inc: {
        postAttempts: 1,
      },
      $setOnInsert: {
        organizationId: new ObjectId(organizationId),
        repositoryId: new ObjectId(repositoryId),
        prNumber: prNumber,
        commentHash: commentHash,
        path: comment.path,
        line: comment.line,
        side: comment.side,
        body: comment.body,
        posted: false,
        postAttempts: 1,
        createdAt: now,
        updatedAt: now,
      },
    },
    {
      upsert: true,
    }
  );
}

/**
 * Get all posted comments for a PR
 */
export async function getPostedComments(
  organizationId: string,
  repositoryId: string,
  prNumber: number
): Promise<PRComment[]> {
  const collection = await getPRCommentsCollection();
  return collection
    .find({
      organizationId: new ObjectId(organizationId),
      repositoryId: new ObjectId(repositoryId),
      prNumber: prNumber,
      posted: true,
    })
    .toArray();
}

/**
 * Check if a specific comment has been posted
 */
export async function isCommentPosted(
  organizationId: string,
  repositoryId: string,
  prNumber: number,
  comment: {
    path: string;
    line: number | null;
    body: string;
  }
): Promise<boolean> {
  const collection = await getPRCommentsCollection();
  const commentHash = generateCommentHash(comment.path, comment.line, comment.body);
  
  const existing = await collection.findOne({
    organizationId: new ObjectId(organizationId),
    repositoryId: new ObjectId(repositoryId),
    prNumber: prNumber,
    commentHash: commentHash,
    posted: true,
  });

  return !!existing;
}

/**
 * Get posted status for multiple comments
 */
export async function getCommentsPostedStatus(
  organizationId: string,
  repositoryId: string,
  prNumber: number,
  comments: Array<{
    path: string;
    line: number | null;
    body: string;
  }>
): Promise<Set<string>> {
  const collection = await getPRCommentsCollection();
  const commentHashes = comments.map(c => generateCommentHash(c.path, c.line, c.body));
  
  const posted = await collection
    .find({
      organizationId: new ObjectId(organizationId),
      repositoryId: new ObjectId(repositoryId),
      prNumber: prNumber,
      commentHash: { $in: commentHashes },
      posted: true,
    })
    .toArray();

  return new Set(posted.map(c => c.commentHash));
}

export async function deletePRCommentsByRepository(
  repositoryId: string
): Promise<number> {
  const collection = await getPRCommentsCollection();
  const result = await collection.deleteMany({
    repositoryId: new ObjectId(repositoryId),
  });
  return result.deletedCount;
}

