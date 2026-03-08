/**
 * Base API Error class
 * All custom API errors extend from this class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
      },
    };
  }
}

/**
 * 400 Bad Request - Validation Error
 * Used when request data fails validation
 */
export class ValidationError extends ApiError {
  constructor(message: string, public errors?: any) {
    super(400, message, "VALIDATION_ERROR");
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        errors: this.errors,
      },
    };
  }
}

/**
 * 401 Unauthorized
 * Used when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

/**
 * 403 Forbidden
 * Used when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

/**
 * 404 Not Found
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, message, "NOT_FOUND");
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(500, message, "INTERNAL_ERROR");
  }
}

/**
 * Error handler middleware for API routes
 * Converts errors to appropriate HTTP responses
 */
export function errorHandler(error: Error): Response {
  // Handle known API errors
  if (error instanceof ApiError) {
    return Response.json(error.toJSON(), { status: error.statusCode });
  }

  // Log unexpected errors for debugging
  console.error("Unexpected error:", error);

  // Return generic error response for unknown errors
  return Response.json(
    {
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 * Wraps async route handlers to catch and handle errors
 */
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorHandler(error as Error);
    }
  };
}
