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

    // Query user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Return profile data
    return NextResponse.json(
      {
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { name, image } = body;

    // Validate profile data
    const updates: { name?: string | null; image?: string | null } = {};

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json(
          {
            error: 'Name must be a string',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      updates.name = name.trim() || null;
    }

    if (image !== undefined) {
      if (image !== null && typeof image !== 'string') {
        return NextResponse.json(
          {
            error: 'Image must be a string or null',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      updates.image = image;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    // Return updated profile
    return NextResponse.json(
      {
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
