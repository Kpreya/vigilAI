import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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
 * GET /api/api-keys
 * Get all API keys for authenticated user
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

    // Query API keys for current user
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: userId,
      },
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
    });

    // Return only key prefix (not full key)
    const sanitizedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      applicationId: key.applicationId,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      revokedAt: key.revokedAt,
      application: key.application,
    }));

    return NextResponse.json(
      {
        data: sanitizedKeys,
        message: 'API keys retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get API keys error:', error);
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
 * POST /api/api-keys
 * Generate new API key
 * 
 * Request Body:
 * - name (string, required)
 * - applicationId (string, optional)
 * - expiresAt (string, optional) - ISO date string
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
    const { name, applicationId, expiresAt } = body;

    // Validate key data
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'API key name is required',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error: 'API key name must be 100 characters or less',
          code: 'INVALID_DATA',
        },
        { status: 400 }
      );
    }

    // Validate applicationId if provided
    if (applicationId) {
      if (typeof applicationId !== 'string') {
        return NextResponse.json(
          {
            error: 'Application ID must be a string',
            code: 'INVALID_DATA',
          },
          { status: 400 }
        );
      }

      // Verify application belongs to user
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId: userId,
        },
      });

      if (!application) {
        return NextResponse.json(
          {
            error: 'Application not found or does not belong to user',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }
    }

    // Validate expiresAt if provided
    let expiresAtDate: Date | null = null;
    if (expiresAt) {
      if (typeof expiresAt !== 'string') {
        return NextResponse.json(
          {
            error: 'Expiration date must be a string',
            code: 'INVALID_DATA',
          },
          { status: 400 }
        );
      }

      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid expiration date format',
            code: 'INVALID_DATA',
          },
          { status: 400 }
        );
      }

      if (expiresAtDate <= new Date()) {
        return NextResponse.json(
          {
            error: 'Expiration date must be in the future',
            code: 'INVALID_DATA',
          },
          { status: 400 }
        );
      }
    }

    // Generate secure random key
    const randomBytes = crypto.randomBytes(32);
    const keyValue = randomBytes.toString('hex');
    const fullKey = `vgl_${keyValue}`;
    const keyPrefix = `vgl_${keyValue.substring(0, 8)}`;

    // Hash key for storage
    const hashedKey = crypto
      .createHash('sha256')
      .update(fullKey)
      .digest('hex');

    // Store key in database
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: hashedKey,
        keyPrefix: keyPrefix,
        userId: userId,
        applicationId: applicationId || null,
        expiresAt: expiresAtDate,
      },
      include: {
        application: {
          select: {
            name: true,
          },
        },
      },
    });

    // Return full key (one-time only)
    return NextResponse.json(
      {
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: fullKey,
          keyPrefix: apiKey.keyPrefix,
          applicationId: apiKey.applicationId,
          createdAt: apiKey.createdAt,
          expiresAt: apiKey.expiresAt,
          application: apiKey.application,
        },
        message: 'API key created. Save this key securely - it won\'t be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
