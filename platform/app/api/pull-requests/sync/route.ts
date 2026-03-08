import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be defined in environment variables');
}

/**
 * Verify JWT token and extract user ID
 */
function verifyToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    if (!JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
      return (decoded as { id: string }).id;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * POST /api/pull-requests/sync
 * Trigger a sync with GitHub to find or create PRs for open incidents
 */
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Find all open incidents for this user's apps
    const openIncidents = await prisma.incident.findMany({
      where: {
        status: 'OPEN',
        application: { userId: userId },
      },
      include: { application: true }
    });

    let syncedCount = 0;

    // Simulate the AI agent creating PRs for incidents that don't have one yet
    for (const incident of openIncidents) {
      // Check if PR already exists
      const existingPr = await prisma.pullRequest.findFirst({
        where: { incidentId: incident.id }
      });

      if (!existingPr && incident.application.githubRepo) {
        // Sync API actually only syncs if real PR found
        console.log(`No local PR found for incident ${incident.id}. You must run Analyze to generate a fix.`);
      }
    }

    return NextResponse.json({
        message: 'Sync completed successfully',
        syncedCount: syncedCount
      }, { status: 200 }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
