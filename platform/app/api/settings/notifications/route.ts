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

    // Query notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: userId },
      select: {
        emailEnabled: true,
        emailCritical: true,
        emailHigh: true,
        emailMedium: true,
        emailLow: true,
        slackEnabled: true,
        slackWebhook: true,
        webhookEnabled: true,
        webhookUrl: true,
      },
    });

    // Create default preferences if not exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: userId,
          emailEnabled: true,
          emailCritical: true,
          emailHigh: true,
          emailMedium: false,
          emailLow: false,
          slackEnabled: false,
          slackWebhook: null,
          webhookEnabled: false,
          webhookUrl: null,
        },
        select: {
          emailEnabled: true,
          emailCritical: true,
          emailHigh: true,
          emailMedium: true,
          emailLow: true,
          slackEnabled: true,
          slackWebhook: true,
          webhookEnabled: true,
          webhookUrl: true,
        },
      });
    }

    // Return preferences
    return NextResponse.json(
      {
        data: preferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get notification preferences error:', error);
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

    // Validate notification preferences
    const updates: {
      emailEnabled?: boolean;
      emailCritical?: boolean;
      emailHigh?: boolean;
      emailMedium?: boolean;
      emailLow?: boolean;
      slackEnabled?: boolean;
      slackWebhook?: string | null;
      webhookEnabled?: boolean;
      webhookUrl?: string | null;
    } = {};

    // Validate boolean fields
    const booleanFields = [
      'emailEnabled',
      'emailCritical',
      'emailHigh',
      'emailMedium',
      'emailLow',
      'slackEnabled',
      'webhookEnabled',
    ] as const;

    for (const field of booleanFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'boolean') {
          return NextResponse.json(
            {
              error: `${field} must be a boolean`,
              code: 'VALIDATION_ERROR',
            },
            { status: 400 }
          );
        }
        updates[field] = body[field];
      }
    }

    // Validate string fields
    if (body.slackWebhook !== undefined) {
      if (body.slackWebhook !== null && typeof body.slackWebhook !== 'string') {
        return NextResponse.json(
          {
            error: 'slackWebhook must be a string or null',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      updates.slackWebhook = body.slackWebhook;
    }

    if (body.webhookUrl !== undefined) {
      if (body.webhookUrl !== null && typeof body.webhookUrl !== 'string') {
        return NextResponse.json(
          {
            error: 'webhookUrl must be a string or null',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
      updates.webhookUrl = body.webhookUrl;
    }

    // Update preferences (upsert to handle case where preferences don't exist yet)
    const updatedPreferences = await prisma.notificationPreference.upsert({
      where: { userId: userId },
      update: updates,
      create: {
        userId: userId,
        emailEnabled: updates.emailEnabled ?? true,
        emailCritical: updates.emailCritical ?? true,
        emailHigh: updates.emailHigh ?? true,
        emailMedium: updates.emailMedium ?? false,
        emailLow: updates.emailLow ?? false,
        slackEnabled: updates.slackEnabled ?? false,
        slackWebhook: updates.slackWebhook ?? null,
        webhookEnabled: updates.webhookEnabled ?? false,
        webhookUrl: updates.webhookUrl ?? null,
      },
      select: {
        emailEnabled: true,
        emailCritical: true,
        emailHigh: true,
        emailMedium: true,
        emailLow: true,
        slackEnabled: true,
        slackWebhook: true,
        webhookEnabled: true,
        webhookUrl: true,
      },
    });

    // Return updated preferences
    return NextResponse.json(
      {
        data: updatedPreferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
