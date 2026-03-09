import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

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
 * GET /api/applications/[id]
 * Get a specific application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Note: params must be awaited in Next.js 15
) {
  try {
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: application, message: 'Application retrieved successfully' });
  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/applications/[id]
 * Update application settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const existingApp = await prisma.application.findUnique({
      where: { id },
    });

    if (!existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (existingApp.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updating certain fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.anomalyThreshold !== undefined) updateData.anomalyThreshold = Number(body.anomalyThreshold);
    if (body.enableAutoFix !== undefined) updateData.enableAutoFix = Boolean(body.enableAutoFix);
    if (body.enableNotifications !== undefined) updateData.enableNotifications = Boolean(body.enableNotifications);
    
    // Validate name if it's being updated
    if (updateData.name !== undefined && (!updateData.name || typeof updateData.name !== 'string' || updateData.name.trim().length === 0)) {
      return NextResponse.json({ error: 'Application name cannot be empty' }, { status: 400 });
    }

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: application, message: 'Application updated successfully' });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/applications/[id]
 * Delete application
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existingApp = await prisma.application.findUnique({
      where: { id },
    });

    if (!existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (existingApp.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
