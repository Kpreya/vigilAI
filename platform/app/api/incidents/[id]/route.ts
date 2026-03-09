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
 * GET /api/incidents/:id
 * Get detailed incident information
 * 
 * Returns incident with application details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params;
    const { id } = params;

    // Validate incident ID
    if (!id) {
      return NextResponse.json(
        {
          error: 'Incident ID is required',
          code: 'INVALID_PARAMETERS',
        },
        { status: 400 }
      );
    }

    // Query incident by ID with application details
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        application: {
          userId,
        },
      },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            description: true,
            githubRepo: true,
            githubOwner: true,
          },
        },
      },
    });

    // Check if incident exists and belongs to user
    if (!incident) {
      return NextResponse.json(
        {
          error: 'Incident not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Return incident data
    return NextResponse.json(
      {
        data: incident,
        message: 'Incident retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get incident error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
