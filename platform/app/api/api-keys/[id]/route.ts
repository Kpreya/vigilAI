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
 * DELETE /api/api-keys/:id
 * Revoke API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Verify key belongs to user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'API key not found or does not belong to user',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if already revoked
    if (apiKey.revokedAt) {
      return NextResponse.json(
        {
          error: 'API key is already revoked',
          code: 'ALREADY_REVOKED',
        },
        { status: 400 }
      );
    }

    // Set revokedAt timestamp
    const updatedKey = await prisma.apiKey.update({
      where: {
        id: id,
      },
      data: {
        revokedAt: new Date(),
      },
      include: {
        application: {
          select: {
            name: true,
          },
        },
      },
    });

    // Return updated key (without full key)
    return NextResponse.json(
      {
        data: {
          id: updatedKey.id,
          name: updatedKey.name,
          keyPrefix: updatedKey.keyPrefix,
          applicationId: updatedKey.applicationId,
          createdAt: updatedKey.createdAt,
          lastUsedAt: updatedKey.lastUsedAt,
          expiresAt: updatedKey.expiresAt,
          revokedAt: updatedKey.revokedAt,
          application: updatedKey.application,
        },
        message: 'API key revoked successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke API key error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
