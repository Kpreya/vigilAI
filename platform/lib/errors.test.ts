import {
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
  errorHandler,
  withErrorHandler,
} from "./errors";

describe("Error Classes", () => {
  describe("ApiError", () => {
    it("should create an ApiError with status code, message, and code", () => {
      const error = new ApiError(400, "Test error", "TEST_ERROR");

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.name).toBe("ApiError");
    });

    it("should serialize to JSON correctly", () => {
      const error = new ApiError(400, "Test error", "TEST_ERROR");
      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          message: "Test error",
          code: "TEST_ERROR",
          statusCode: 400,
        },
      });
    });

    it("should work without error code", () => {
      const error = new ApiError(500, "Server error");

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Server error");
      expect(error.code).toBeUndefined();
    });
  });

  describe("ValidationError", () => {
    it("should create a ValidationError with 400 status", () => {
      const error = new ValidationError("Invalid input");

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("should include validation errors in JSON", () => {
      const validationErrors = {
        email: "Invalid email format",
        password: "Password too short",
      };
      const error = new ValidationError("Validation failed", validationErrors);
      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          statusCode: 400,
          errors: validationErrors,
        },
      });
    });
  });

  describe("UnauthorizedError", () => {
    it("should create an UnauthorizedError with 401 status", () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Unauthorized");
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("should accept custom message", () => {
      const error = new UnauthorizedError("Invalid credentials");

      expect(error.message).toBe("Invalid credentials");
      expect(error.statusCode).toBe(401);
    });
  });

  describe("ForbiddenError", () => {
    it("should create a ForbiddenError with 403 status", () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Forbidden");
      expect(error.code).toBe("FORBIDDEN");
    });

    it("should accept custom message", () => {
      const error = new ForbiddenError("Access denied");

      expect(error.message).toBe("Access denied");
      expect(error.statusCode).toBe(403);
    });
  });

  describe("NotFoundError", () => {
    it("should create a NotFoundError with 404 status", () => {
      const error = new NotFoundError();

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Not found");
      expect(error.code).toBe("NOT_FOUND");
    });

    it("should accept custom message", () => {
      const error = new NotFoundError("User not found");

      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("InternalServerError", () => {
    it("should create an InternalServerError with 500 status", () => {
      const error = new InternalServerError();

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Internal server error");
      expect(error.code).toBe("INTERNAL_ERROR");
    });

    it("should accept custom message", () => {
      const error = new InternalServerError("Database connection failed");

      expect(error.message).toBe("Database connection failed");
      expect(error.statusCode).toBe(500);
    });
  });
});

describe("errorHandler", () => {
  it("should handle ApiError and return appropriate response", async () => {
    const error = new ApiError(400, "Bad request", "BAD_REQUEST");
    const response = errorHandler(error);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json).toEqual({
      error: {
        message: "Bad request",
        code: "BAD_REQUEST",
        statusCode: 400,
      },
    });
  });

  it("should handle ValidationError with validation details", async () => {
    const validationErrors = { email: "Invalid email" };
    const error = new ValidationError("Validation failed", validationErrors);
    const response = errorHandler(error);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.errors).toEqual(validationErrors);
  });

  it("should handle UnauthorizedError", async () => {
    const error = new UnauthorizedError("Invalid token");
    const response = errorHandler(error);

    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error.message).toBe("Invalid token");
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should handle ForbiddenError", async () => {
    const error = new ForbiddenError("Access denied");
    const response = errorHandler(error);

    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json.error.message).toBe("Access denied");
  });

  it("should handle NotFoundError", async () => {
    const error = new NotFoundError("Resource not found");
    const response = errorHandler(error);

    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.error.message).toBe("Resource not found");
  });

  it("should handle unknown errors as 500 Internal Server Error", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const error = new Error("Unexpected error");
    const response = errorHandler(error);

    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({
      error: {
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected error:", error);

    consoleErrorSpy.mockRestore();
  });
});

describe("withErrorHandler", () => {
  it("should return response from successful handler", async () => {
    const handler = jest.fn().mockResolvedValue(
      Response.json({ success: true }, { status: 200 })
    );

    const wrappedHandler = withErrorHandler(handler);
    const request = new Request("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ success: true });
    expect(handler).toHaveBeenCalledWith(request, undefined);
  });

  it("should catch and handle ApiError thrown by handler", async () => {
    const handler = jest.fn().mockRejectedValue(
      new UnauthorizedError("Not authenticated")
    );

    const wrappedHandler = withErrorHandler(handler);
    const request = new Request("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.message).toBe("Not authenticated");
  });

  it("should catch and handle unknown errors thrown by handler", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const handler = jest.fn().mockRejectedValue(new Error("Database error"));

    const wrappedHandler = withErrorHandler(handler);
    const request = new Request("http://localhost/api/test");
    const response = await wrappedHandler(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.message).toBe("Internal server error");

    consoleErrorSpy.mockRestore();
  });

  it("should pass context to handler", async () => {
    const handler = jest.fn().mockResolvedValue(
      Response.json({ success: true })
    );

    const wrappedHandler = withErrorHandler(handler);
    const request = new Request("http://localhost/api/test");
    const context = { params: { id: "123" } };

    await wrappedHandler(request, context);

    expect(handler).toHaveBeenCalledWith(request, context);
  });
});
