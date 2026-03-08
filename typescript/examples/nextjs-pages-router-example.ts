/**
 * Example: Next.js Pages Router Integration with VigilAI SDK
 * 
 * This example shows how to use VigilAI with Next.js Pages Router
 * (the traditional Next.js routing system before App Router)
 */

// ============================================================================
// File: lib/vigilai.ts
// ============================================================================

import { VigilAI } from 'vigilai-sdk';

let vigilaiInstance: VigilAI | null = null;

export function getVigilAI(): VigilAI {
  if (!vigilaiInstance) {
    vigilaiInstance = new VigilAI({
      apiKey: process.env.VIGILAI_API_KEY!,
      monitoring: {
        interval: 60000,
        samplingRate: 1.0,
      },
      thresholds: {
        responseTime: 1000,
        errorRate: 5,
      },
    });

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
    return NextResponse.next();
  });
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// ============================================================================
// File: pages/api/users/index.ts
// ============================================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { getVigilAI } from '@/lib/vigilai';

type User = {
  id: number;
  name: string;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | User | ErrorResponse>
) {
  const vigilai = getVigilAI();

  // For Pages Router API routes, we need to manually track metrics
  const startTime = Date.now();

  try {
    if (req.method === 'GET') {
      // Fetch users
      const users: User[] = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      res.status(200).json(users);
    } else if (req.method === 'POST') {
      // Create user
      const { name } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const newUser: User = {
        id: Date.now(),
        name,
      };

      res.status(201).json(newUser);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

    // Track successful request
    const duration = Date.now() - startTime;
    vigilai.trackMetric('api.response_time', duration);
  } catch (error) {
    // Track error
    if (error instanceof Error) {
      vigilai.trackError(error, {
        endpoint: req.url,
        method: req.method,
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// File: pages/api/users/[id].ts
// ============================================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { getVigilAI } from '@/lib/vigilai';

type User = {
  id: number;
  name: string;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User | ErrorResponse>
) {
  const vigilai = getVigilAI();
  const startTime = Date.now();

  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      // Fetch user by ID
      const user: User = {
        id: Number(id),
        name: 'Alice',
      };

      res.status(200).json(user);
    } else if (req.method === 'PUT') {
      // Update user
      const { name } = req.body;

      const updatedUser: User = {
        id: Number(id),
        name,
      };

      res.status(200).json(updatedUser);
    } else if (req.method === 'DELETE') {
      // Delete user
      res.status(204).end();
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

    const duration = Date.now() - startTime;
    vigilai.trackMetric('api.response_time', duration);
  } catch (error) {
    if (error instanceof Error) {
      vigilai.trackError(error, {
        endpoint: req.url,
        method: req.method,
        userId: req.query.id,
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// File: pages/_app.tsx
// ============================================================================

import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { getVigilAI } from '@/lib/vigilai';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Track client-side errors
    const handleError = (event: ErrorEvent) => {
      const vigilai = getVigilAI();
      vigilai.trackError(event.error, {
        type: 'client-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const vigilai = getVigilAI();
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      vigilai.trackError(error, {
        type: 'unhandled-rejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <Component {...pageProps} />;
}

// ============================================================================
// File: pages/_error.tsx
// ============================================================================

import type { NextPageContext } from 'next';
import { getVigilAI } from '@/lib/vigilai';

interface ErrorProps {
  statusCode?: number;
  err?: Error;
}

function Error({ statusCode, err }: ErrorProps) {
  return (
    <div>
      <h1>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </h1>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  // Track server-side errors
  if (err) {
    const vigilai = getVigilAI();
    vigilai.trackError(err, {
      type: 'page-error',
      statusCode,
    });
  }

  return { statusCode, err };
};

export default Error;

// ============================================================================
// File: next.config.js
// ============================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure environment variables are available
  env: {
    VIGILAI_API_KEY: process.env.VIGILAI_API_KEY,
  },
};

module.exports = nextConfig;
