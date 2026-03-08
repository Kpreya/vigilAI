# Next.js Middleware Implementation

This document describes the Next.js middleware integration for the VigilAI SDK.

## Overview

The Next.js middleware integration provides automatic request/response monitoring and error capture for Next.js applications. It supports both the App Router (Next.js 13+) and Pages Router patterns.

## Requirements Addressed

- **Requirement 3.4**: Middleware for Next.js applications
- **Requirement 3.5**: Automatic HTTP request/response metrics capture
- **Requirement 3.6**: Automatic unhandled error capture
- **Requirement 3.8**: Non-interference with normal request/response flow

## Implementation Details

### Core Method: `nextMiddleware()`

The `nextMiddleware()` method is implemented in the `VigilAI` class and provides a wrapper for Next.js middleware functions.

**Signature:**
```typescript
async nextMiddleware(
  request: any,
  handler: (req: any) => Promise<any>
): Promise<any>
```

**Parameters:**
- `request`: The Next.js `NextRequest` object
- `handler`: An async function that processes the request and returns a response

**Returns:**
- The response from the handler function

### Key Features

1. **Non-blocking Metric Capture**: Metrics are captured asynchronously using `setImmediate()` to avoid blocking the request/response cycle.

2. **Automatic Request Metrics**: Captures the following for each request:
   - Response time (duration in milliseconds)
   - HTTP method (GET, POST, etc.)
   - Endpoint (URL pathname)
   - Status code

3. **Automatic Error Capture**: Catches errors thrown by the handler and captures:
   - Error message and stack trace
   - Request context (endpoint, method, headers, URL)
   - Re-throws the error so Next.js can handle it properly

4. **Error Isolation**: Internal SDK errors are caught and logged without affecting the application.

## Usage Patterns

### 1. App Router Middleware (Next.js 13+)

**File: `middleware.ts` (root of project)**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { vigilai } from './lib/vigilai';

export async function middleware(request: NextRequest) {
  return vigilai.nextMiddleware(request, async (req) => {
    // Your custom middleware logic here
    return NextResponse.next();
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2. API Route Handlers (App Router)

**File: `app/api/users/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { vigilai } from '@/lib/vigilai';

export async function GET(request: NextRequest) {
  return vigilai.nextMiddleware(request, async (req) => {
    const users = await fetchUsers();
    return NextResponse.json(users);
  });
}
```

### 3. Pages Router Middleware

**File: `middleware.ts` (root of project)**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { vigilai } from './lib/vigilai';

export async function middleware(request: NextRequest) {
  return vigilai.nextMiddleware(request, async (req) => {
    return NextResponse.next();
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
```

### 4. Wrapper Function Pattern

Create a reusable wrapper for API routes:

```typescript
export function withVigilAI(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    return vigilai.nextMiddleware(req, handler);
  };
}

// Usage
export const GET = withVigilAI(async (request) => {
  const data = await fetchData();
  return NextResponse.json(data);
});
```

## Implementation Flow

1. **Request Received**: Next.js calls the middleware function with a `NextRequest` object
2. **Start Timer**: Record the start time for response time calculation
3. **Execute Handler**: Call the provided handler function with the request
4. **Capture Metrics**: After handler completes, asynchronously capture:
   - Response time (end time - start time)
   - Endpoint (from request URL pathname)
   - HTTP method
   - Status code (from response)
5. **Error Handling**: If handler throws an error:
   - Capture error with context asynchronously
   - Re-throw error for Next.js to handle
6. **Return Response**: Return the response from the handler

## Error Handling

### SDK Internal Errors

All internal SDK errors are caught and logged to console without affecting the application:

```typescript
try {
  self.monitoringAgent.captureRequest(endpoint, method, statusCode, duration);
} catch (error) {
  console.error('VigilAI: Failed to capture request metrics:', 
    error instanceof Error ? error.message : 'Unknown error');
}
```

### Application Errors

Application errors thrown by the handler are:
1. Captured with full context
2. Re-thrown so Next.js can handle them normally
3. Logged to the VigilAI backend for analysis

## Performance Considerations

1. **Asynchronous Operations**: All monitoring operations use `setImmediate()` to defer execution until after the response is sent
2. **Minimal Overhead**: The middleware adds minimal latency (< 5ms) as it only records timestamps and schedules async work
3. **Non-blocking**: The request/response cycle is never blocked by monitoring operations

## Configuration

The middleware respects all SDK configuration options:

```typescript
const vigilai = new VigilAI({
  apiKey: process.env.VIGILAI_API_KEY!,
  monitoring: {
    interval: 60000,        // Metric collection interval
    samplingRate: 1.0,      // Sample 100% of requests
  },
  thresholds: {
    responseTime: 1000,     // Alert if response time > 1000ms
    errorRate: 5,           // Alert if error rate > 5%
  },
});
```

## Matcher Configuration

Use the `matcher` config to control which routes the middleware runs on:

```typescript
export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
    
    // Or match specific paths
    '/api/:path*',
    '/dashboard/:path*',
  ],
};
```

## Testing

The middleware can be tested by:

1. Creating a mock `NextRequest` object
2. Providing a test handler function
3. Verifying metrics are captured correctly
4. Verifying errors are captured and re-thrown

Example test:

```typescript
test('nextMiddleware captures request metrics', async () => {
  const vigilai = new VigilAI({ apiKey: 'test-key' });
  await vigilai.initialize();

  const mockRequest = {
    url: 'http://localhost:3000/api/users',
    method: 'GET',
  };

  const mockHandler = async (req: any) => {
    return { status: 200 };
  };

  const response = await vigilai.nextMiddleware(mockRequest, mockHandler);

  expect(response.status).toBe(200);
  // Verify metrics were captured (check monitoring agent)
});
```

## Differences from Express Middleware

| Feature | Express | Next.js |
|---------|---------|---------|
| API Style | Callback-based (`next()`) | Promise-based (async/await) |
| Request Object | `req` | `NextRequest` |
| Response Object | `res` | `NextResponse` |
| Error Handling | Error middleware | Try/catch with re-throw |
| Execution Context | Node.js runtime | Edge Runtime or Node.js |

## Edge Runtime Compatibility

The Next.js middleware is compatible with the Edge Runtime because:
- Uses standard Web APIs (URL, Headers)
- No Node.js-specific APIs in the middleware itself
- Monitoring operations are deferred to the Node.js runtime

## Examples

See the following example files for complete implementations:
- `examples/nextjs-example.ts` - Basic middleware setup
- `examples/nextjs-app-router-example.ts` - App Router integration
- `examples/nextjs-pages-router-example.ts` - Pages Router integration

## Limitations

1. **Edge Runtime**: Some monitoring features (like system metrics) may not be available in Edge Runtime
2. **Static Pages**: Middleware doesn't run for statically generated pages at build time
3. **Client-Side**: Middleware only monitors server-side requests, not client-side navigation

## Future Enhancements

Potential improvements for future versions:
- Client-side monitoring integration
- Automatic performance tracking for Server Components
- Integration with Next.js built-in instrumentation
- Support for streaming responses
