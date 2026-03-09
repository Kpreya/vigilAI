import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { Severity, IncidentStatus } from '@prisma/client';

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
 * GET /api/incidents
 * Get paginated list of incidents with optional filters
 * 
 * Query Parameters:
 * - page (number, default: 1)
 * - pageSize (number, default: 20)
 * - status (string, optional: OPEN | IN_PROGRESS | RESOLVED | IGNORED)
 * - severity (string, optional: LOW | MEDIUM | HIGH | CRITICAL)
 * - applicationId (string, optional)
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status') as IncidentStatus | null;
    const severity = searchParams.get('severity') as Severity | null;
    const applicationId = searchParams.get('applicationId');

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        {
          error: 'Invalid pagination parameters',
          code: 'INVALID_PARAMETERS',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'IGNORED'].includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status parameter',
          code: 'INVALID_PARAMETERS',
        },
        { status: 400 }
      );
    }

    // Validate severity if provided
    if (severity && !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
      return NextResponse.json(
        {
          error: 'Invalid severity parameter',
          code: 'INVALID_PARAMETERS',
        },
        { status: 400 }
      );
    }

    // Build where clause for filtering
    const where: any = {
      application: {
        userId: userId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (severity) {
      where.severity = severity;
    }

    if (applicationId) {
      where.applicationId = applicationId;
    }

    // Query incidents with filters and pagination
    const [incidents, totalCount] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          application: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.incident.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Return paginated incidents
    return NextResponse.json(
      {
        data: incidents,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalCount,
        },
        message: 'Incidents retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get incidents error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/incidents
 * Create a new manual incident
 * 
 * Request Body:
 * - title (string, required)
 * - description (string, optional)
 * - applicationId (string, required)
 * - severity (string, optional: LOW | MEDIUM | HIGH | CRITICAL)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, applicationId, severity } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required', code: 'INVALID_DATA' }, { status: 400 });
    }

    if (!applicationId || typeof applicationId !== 'string') {
      return NextResponse.json({ error: 'Application ID is required', code: 'INVALID_DATA' }, { status: 400 });
    }

    // Verify application belongs to user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: userId,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found or unauthorized', code: 'NOT_FOUND' }, { status: 404 });
    }

    const incidentSeverity = severity && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity) 
      ? severity as Severity 
      : 'MEDIUM';

    // Proceed to create incident
    const incident = await prisma.incident.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        applicationId,
        severity: incidentSeverity,
        status: 'OPEN',
        errorCount: 1,
        stackTrace: "Manual Incident created by user",
      },
      include: {
        application: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(
      {
        data: incident,
        message: 'Incident created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create incident error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
