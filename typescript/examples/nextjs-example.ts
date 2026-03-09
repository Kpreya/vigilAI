/**
 * Example: Next.js Middleware Integration with VigilAI SDK
 * 
 * This example demonstrates how to integrate VigilAI monitoring
 * into a Next.js application using middleware.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { VigilAI } from '../src/vigilai';

// Initialize VigilAI SDK
const vigilai = new VigilAI({
  apiKey: process.env.VIGILAI_API_KEY || 'test-api-key',
  monitoring: {
    interval: 60000,
    samplingRate: 1.0,
  },
  thresholds: {
    responseTime: 1000,
    errorRate: 5,
  },
});

// Initialize the SDK (should be done once at startup)
vigilai.initialize().catch((error) => {
  console.error('Failed to initialize VigilAI:', error);
});

/**
 * Next.js middleware function
 * This runs on every request to your Next.js application
 */
export async function middleware(request: NextRequest) {
  return vigilai.nextMiddleware(request, async (req) => {
    // You can add custom logic here before passing to Next.js
    
    // Example: Skip monitoring for static assets
    const url = new URL(req.url);
    if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/static/')) {
      return NextResponse.next();
    }

    // Example: Add custom headers
    const response = NextResponse.next();
    response.headers.set('X-Monitored-By', 'VigilAI');
    
    return response;
  });
}

/**
 * Configure which routes the middleware should run on
 * See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

/**
 * Alternative: API Route Handler Integration
 * 
 * For API routes, you can wrap your handlers:
 */
export function withVigilAI(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    return vigilai.nextMiddleware(req, handler);
  };
}

/**
 * Example API route with VigilAI monitoring:
 * 
 * // app/api/users/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { withVigilAI } from '@/middleware';
 * 
 * export const GET = withVigilAI(async (request: NextRequest) => {
 *   const users = await fetchUsers();
 *   return NextResponse.json(users);
 * });
 */
