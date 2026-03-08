import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Severity } from '@prisma/client';

import crypto from 'crypto';

/**
 * POST /api/events
 * Public endpoint for SDKs to report errors/events.
 * Requires a valid API key (either in header `x-api-key` or body `apiKey`).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKeyData = request.headers.get('x-api-key') || body.apiKey;

    if (!apiKeyData) {
      return NextResponse.json(
        { error: 'API key is required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Hash the incoming key to match the database stored format
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKeyData)
      .digest('hex');

    const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
            key: hashedKey
        }
    });

    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    // Check if the key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return NextResponse.json(
            { error: 'API key expired', code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    // Create the Incident directly from the event payload
    const { message, stack, stackTrace, environment } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Error message is required', code: 'INVALID_DATA' },
        { status: 400 }
      );
    }

    // Support both 'stack' and 'stackTrace' field names
    const errorStack = stackTrace || stack || null;

    // Determine the applicationId to attach this incident to
    let targetAppId = apiKeyRecord.applicationId;
    
    if (!targetAppId) {
       // If the API key is tied to the user but not a specific app, we need an app ID
       // Or we try to pick their first app, or fail. Since incidents require an applicationId:
       const userApps = await prisma.application.findMany({
          where: { userId: apiKeyRecord.userId }
       });
       if (userApps.length > 0) {
           targetAppId = userApps[0].id; // Fallback to first app
       } else {
           return NextResponse.json(
               { error: 'No application associated with this user to report the incident.', code: 'FORBIDDEN' },
               { status: 403 }
           );
       }
    }

    const incident = await prisma.incident.create({
      data: {
        title: message,
        description: `Environment: ${environment || 'unknown'}\nSDK Error Report`,
        stackTrace: errorStack,
        severity: 'HIGH', // Default for uncaught exceptions via SDK
        applicationId: targetAppId,
        status: 'OPEN',
        errorCount: 1,
      }
    });

    return NextResponse.json({ success: true, incidentId: incident.id }, { status: 200 });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
