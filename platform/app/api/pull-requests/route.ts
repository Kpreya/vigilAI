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

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    if (!JWT_SECRET) {
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Type guard to check if decoded has the expected shape
    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
      return (decoded as { id: string }).id;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/pull-requests
 * Get all pull requests for the authenticated user's applications
 * 
 * Returns pull requests with incident details
 */
export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const userId = verifyToken(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Query pull requests for user's applications
    const pullRequests = await prisma.pullRequest.findMany({
      where: {
        incident: {
          application: {
            userId: userId,
          },
        },
      },
      include: {
        incident: {
          select: {
            title: true,
            severity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return pull requests array
    return NextResponse.json(
      {
        data: pullRequests,
        message: 'Pull requests retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get pull requests error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
