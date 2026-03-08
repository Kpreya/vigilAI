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

    // Query incident count from database
    const totalIncidents = await prisma.incident.count({
      where: {
        application: {
          userId: userId,
        },
      },
    });

    // Query application count from database
    const totalApplications = await prisma.application.count({
      where: {
        userId: userId,
      },
    });

    // Query API key count from database
    const totalApiKeys = await prisma.apiKey.count({
      where: {
        userId: userId,
        revokedAt: null, // Only count non-revoked keys
      },
    });

    // Calculate open/acknowledged/resolved counts
    const openIncidents = await prisma.incident.count({
      where: {
        application: {
          userId: userId,
        },
        status: 'OPEN',
      },
    });

    const acknowledgedIncidents = await prisma.incident.count({
      where: {
        application: {
          userId: userId,
        },
        status: 'IN_PROGRESS',
      },
    });

    const resolvedIncidents = await prisma.incident.count({
      where: {
        application: {
          userId: userId,
        },
        status: 'RESOLVED',
      },
    });

    // Calculate average MTTR (Mean Time To Resolution)
    // Get all resolved incidents with their resolution times
    const resolvedIncidentsWithTimes = await prisma.incident.findMany({
      where: {
        application: {
          userId: userId,
        },
        status: 'RESOLVED',
        resolvedAt: {
          not: null,
        },
      },
      select: {
        firstSeenAt: true,
        resolvedAt: true,
      },
    });

    let averageMTTR = 0;
    if (resolvedIncidentsWithTimes.length > 0) {
      const totalResolutionTime = resolvedIncidentsWithTimes.reduce((sum, incident) => {
        if (incident.resolvedAt) {
          const resolutionTime = incident.resolvedAt.getTime() - incident.firstSeenAt.getTime();
          return sum + resolutionTime;
        }
        return sum;
      }, 0);

      // Convert from milliseconds to minutes
      const averageResolutionTimeMs = totalResolutionTime / resolvedIncidentsWithTimes.length;
      averageMTTR = Math.round(averageResolutionTimeMs / (1000 * 60)); // Convert to minutes
    }

    // Return stats object
    return NextResponse.json(
      {
        data: {
          totalIncidents,
          totalApplications,
          totalApiKeys,
          openIncidents,
          acknowledgedIncidents,
          resolvedIncidents,
          averageMTTR,
        },
        message: 'Dashboard stats retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
