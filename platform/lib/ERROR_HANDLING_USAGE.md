# Error Handling Usage Guide

This document explains how to use the error handling utilities in the VigilAI Platform.

## Error Classes

The platform provides several error classes for different HTTP status codes:

### ApiError (Base Class)
Base class for all API errors. Can be used directly for custom status codes.

```typescript
import { ApiError } from "@/lib/errors";

throw new ApiError(418, "I'm a teapot", "TEAPOT_ERROR");
```

### ValidationError (400)
Used when request data fails validation.

```typescript
import { ValidationError } from "@/lib/errors";

// Simple validation error
throw new ValidationError("Invalid input");

// With detailed validation errors
throw new ValidationError("Validation failed", {
  email: "Invalid email format",
  password: "Password must be at least 8 characters",
});
```

### UnauthorizedError (401)
Used when authentication is required but not provided or invalid.

```typescript
import { UnauthorizedError } from "@/lib/errors";

// Default message
throw new UnauthorizedError();

// Custom message
throw new UnauthorizedError("Invalid API key");
```

### ForbiddenError (403)
Used when user is authenticated but doesn't have permission.

```typescript
import { ForbiddenError } from "@/lib/errors";

// Default message
throw new ForbiddenError();

// Custom message
throw new ForbiddenError("You don't have access to this resource");
```

### NotFoundError (404)
Used when requested resource doesn't exist.

```typescript
import { NotFoundError } from "@/lib/errors";

// Default message
throw new NotFoundError();

// Custom message
throw new NotFoundError("User not found");
```

### InternalServerError (500)
Used for unexpected server errors.

```typescript
import { InternalServerError } from "@/lib/errors";

// Default message
throw new InternalServerError();

// Custom message
throw new InternalServerError("Database connection failed");
```

## Error Handler Middleware

### errorHandler
Converts errors to appropriate HTTP responses.

```typescript
import { errorHandler } from "@/lib/errors";

try {
  // Your code here
} catch (error) {
  return errorHandler(error as Error);
}
```

### withErrorHandler
Wraps async route handlers to automatically catch and handle errors.

```typescript
import { withErrorHandler, NotFoundError } from "@/lib/errors";

export const GET = withErrorHandler(async (request: Request) => {
  const user = await getUser();
  
  if (!user) {
    throw new NotFoundError("User not found");
  }
  
  return Response.json({ user });
});
```

## Usage Examples

### Example 1: Basic API Route with Error Handling

```typescript
// app/api/users/[id]/route.ts
import { withErrorHandler, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  // Require authentication
  const currentUser = await requireAuth();
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });
  
  if (!user) {
    throw new NotFoundError("User not found");
  }
  
  // Check permissions
  if (user.id !== currentUser.id) {
    throw new ForbiddenError("You can only view your own profile");
  }
  
  return Response.json({ user });
});
```

### Example 2: Validation with Zod

```typescript
// app/api/users/route.ts
import { withErrorHandler, ValidationError } from "@/lib/errors";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  
  // Validate request body
  const result = createUserSchema.safeParse(body);
  
  if (!result.success) {
    throw new ValidationError(
      "Validation failed",
      result.error.flatten().fieldErrors
    );
  }
  
  // Create user
  const user = await prisma.user.create({
    data: result.data,
  });
  
  return Response.json({ user }, { status: 201 });
});
```

### Example 3: API Key Authentication

```typescript
// app/api/ingest/incident/route.ts
import { withErrorHandler, ValidationError } from "@/lib/errors";
import { requireApiKey } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const POST = withErrorHandler(async (request: Request) => {
  // Require API key authentication
  const apiKey = await requireApiKey(request);
  
  const body = await request.json();
  
  // Validate incident data
  if (!body.title || !body.severity) {
    throw new ValidationError("Title and severity are required");
  }
  
  // Create incident
  const incident = await prisma.incident.create({
    data: {
      title: body.title,
      severity: body.severity,
      description: body.description,
      applicationId: apiKey.applicationId,
    },
  });
  
  return Response.json({ incident }, { status: 201 });
});
```

### Example 4: Manual Error Handling (without wrapper)

```typescript
// app/api/health/route.ts
import { errorHandler, InternalServerError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return Response.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Handle error manually
    const serverError = new InternalServerError("Database connection failed");
    return errorHandler(serverError);
  }
}
```

## Integration with Auth Helpers

The auth helper functions now use the new error classes:

```typescript
import { requireAuth, requireApiKey, requireApplicationAccess } from "@/lib/auth-helpers";

// These functions now throw UnauthorizedError or ForbiddenError
// which are automatically handled by withErrorHandler

export const GET = withErrorHandler(async (request: Request) => {
  // Throws UnauthorizedError if not authenticated
  const user = await requireAuth();
  
  // Throws UnauthorizedError if API key is invalid
  const apiKey = await requireApiKey(request);
  
  // Throws ForbiddenError if user doesn't have access
  const app = await requireApplicationAccess(user.id, "app-id");
  
  return Response.json({ success: true });
});
```

## Error Response Format

All errors return a consistent JSON format:

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

For ValidationError, additional error details are included:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "errors": {
      "email": "Invalid email format",
      "password": "Password too short"
    }
  }
}
```

## Best Practices

1. **Always use withErrorHandler** for API routes to ensure consistent error handling
2. **Use specific error classes** instead of generic Error for better error responses
3. **Provide meaningful error messages** to help clients understand what went wrong
4. **Include validation details** when using ValidationError
5. **Don't expose sensitive information** in error messages (e.g., database errors)
6. **Log unexpected errors** for debugging (errorHandler does this automatically)

## Testing

All error classes and handlers are fully tested. See `lib/errors.test.ts` for examples.

```typescript
import { UnauthorizedError, errorHandler } from "@/lib/errors";

describe("My API Route", () => {
  it("should throw UnauthorizedError when not authenticated", async () => {
    const error = new UnauthorizedError("Not authenticated");
    const response = errorHandler(error);
    
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });
});
```
