import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { IncidentStatus } from '@prisma/client';

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
 * PATCH /api/incidents/:id/status
 * Update incident status
 * 
 * Request Body:
 * {
 *   "status": "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED"
 * }
 * 
 * Returns updated incident with resolvedAt timestamp if status is RESOLVED
 */
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status value
    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'IGNORED'].includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status value. Must be one of: OPEN, IN_PROGRESS, RESOLVED, IGNORED',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Check if incident exists and belongs to user
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        application: {
          userId,
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        {
          error: 'Incident not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: status as IncidentStatus,
    };

    // Set resolvedAt if status is RESOLVED
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    // Update incident status
    const updatedIncident = await prisma.incident.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        application: {
          select: {
            name: true,
          },
        },
      },
    });

    // Return updated incident
    return NextResponse.json(
      {
        data: updatedIncident,
        message: 'Incident status updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update incident status error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
