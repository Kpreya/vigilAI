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
 * GET /api/applications
 * Get all applications for authenticated user
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

    // Query applications for current user
    const applications = await prisma.application.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return applications array
    return NextResponse.json(
      {
        data: applications,
        message: 'Applications retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get applications error:', error);
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
 * POST /api/applications
 * Create new application
 * 
 * Request Body:
 * - name (string, required)
 * - description (string, optional)
 * - githubRepo (string, optional)
 * - githubOwner (string, optional)
 * - anomalyThreshold (number, optional, default: 2.0)
 * - enableAutoFix (boolean, optional, default: true)
 * - enableNotifications (boolean, optional, default: true)
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      githubRepo,
      githubOwner,
      anomalyThreshold,
      enableAutoFix,
      enableNotifications,
    } = body;

    // Validate application data
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Application name is required',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error: 'Application name must be 100 characters or less',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json(
        {
          error: 'Description must be a string',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (!githubRepo || typeof githubRepo !== 'string' || githubRepo.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'GitHub repository URL is required',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (!githubOwner || typeof githubOwner !== 'string' || githubOwner.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'GitHub owner is required',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (anomalyThreshold !== undefined && (typeof anomalyThreshold !== 'number' || anomalyThreshold <= 0)) {
      return NextResponse.json(
        {
          error: 'Anomaly threshold must be a positive number',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (enableAutoFix !== undefined && typeof enableAutoFix !== 'boolean') {
      return NextResponse.json(
        {
          error: 'enableAutoFix must be a boolean',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (enableNotifications !== undefined && typeof enableNotifications !== 'boolean') {
      return NextResponse.json(
        {
          error: 'enableNotifications must be a boolean',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    // Create application in database
    const application = await prisma.application.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: userId,
        githubRepo: githubRepo?.trim() || null,
        githubOwner: githubOwner?.trim() || null,
        anomalyThreshold: anomalyThreshold ?? 2.0,
        enableAutoFix: enableAutoFix ?? true,
        enableNotifications: enableNotifications ?? true,
      },
    });

    // Return created application
    return NextResponse.json(
      {
        data: application,
        message: 'Application created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
