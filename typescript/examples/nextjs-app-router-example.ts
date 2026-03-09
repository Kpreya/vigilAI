/**
 * Example: Next.js App Router Integration with VigilAI SDK
 * 
 * This example shows how to use VigilAI with Next.js 13+ App Router
 * including both middleware and API route handlers.
 */

// ============================================================================
// File: lib/vigilai.ts
// ============================================================================

import { VigilAI } from 'vigilai-sdk';

// Create a singleton instance
let vigilaiInstance: VigilAI | null = null;

export function getVigilAI(): VigilAI {
  if (!vigilaiInstance) {
    vigilaiInstance = new VigilAI({
      apiKey: process.env.VIGILAI_API_KEY!,
      github: {
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER || 'your-org',
        repo: process.env.GITHUB_REPO || 'your-repo',
      },
      monitoring: {
        interval: 60000,
        samplingRate: 1.0,
      },
      thresholds: {
        responseTime: 1000,
        errorRate: 5,
        memoryUsage: 500,
        cpuUsage: 80,
      },
    });

    // Initialize asynchronously
    vigilaiInstance.initialize().catch((error) => {
      console.error('Failed to initialize VigilAI:', error);
    });
  }

  return vigilaiInstance;
}

// ============================================================================
// File: middleware.ts (Root of your Next.js project)
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getVigilAI } from './lib/vigilai';

export async function middleware(request: NextRequest) {
  const vigilai = getVigilAI();

  return vigilai.nextMiddleware(request, async (req) => {
    // Custom middleware logic
    const url = new URL(req.url);

    // Example: Redirect old paths
    if (url.pathname === '/old-path') {
      return NextResponse.redirect(new URL('/new-path', req.url));
    }

    // Example: Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// ============================================================================
// File: app/api/users/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getVigilAI } from '@/lib/vigilai';

export async function GET(request: NextRequest) {
  const vigilai = getVigilAI();

  return vigilai.nextMiddleware(request, async (req) => {
    try {
      // Your API logic here
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      return NextResponse.json(users);
    } catch (error) {
      // Errors are automatically captured by VigilAI
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  const vigilai = getVigilAI();

  return vigilai.nextMiddleware(request, async (req) => {
    try {
      const body = await req.json();
      
      // Validate input
      if (!body.name) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }

      // Create user
      const newUser = {
        id: Date.now(),
        name: body.name,
      };

      return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
  });
}

// ============================================================================
// File: app/api/health/route.ts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getVigilAI } from '@/lib/vigilai';

export async function GET(request: NextRequest) {
  const vigilai = getVigilAI();

  // Health check endpoint - includes VigilAI SDK health status
  const healthStatus = vigilai.healthCheck();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    vigilai: healthStatus,
  });
}

// ============================================================================
// File: app/error.tsx (Error Boundary)
// ============================================================================

'use client';

import { useEffect } from 'react';
import { getVigilAI } from '@/lib/vigilai';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Track client-side errors with VigilAI
    const vigilai = getVigilAI();
    vigilai.trackError(error, {
      type: 'client-error-boundary',
      digest: error.digest,
      pathname: window.location.pathname,
    });
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// ============================================================================
// File: .env.local
// ============================================================================

/*
VIGILAI_API_KEY=your-vigilai-api-key
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name
*/
