import { auth } from "./auth";
import { prisma } from "./prisma";
import crypto from "crypto";
import { UnauthorizedError, ForbiddenError } from "./errors";

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  return user;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session.user;
}

/**
 * Require API key authentication for SDK endpoints
 * Validates the API key from the x-api-key header
 * Returns the API key record with user information
 * Throws error if API key is invalid, revoked, or expired
 */
export async function requireApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    throw new UnauthorizedError("API key is required");
  }

  const hashedKey = hashApiKey(apiKey);

  const key = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    include: { user: true, application: true },
  });

  if (!key) {
    throw new UnauthorizedError("Invalid API key");
  }

  if (key.revokedAt) {
    throw new UnauthorizedError("API key has been revoked");
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    throw new UnauthorizedError("API key has expired");
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return key;
}

/**
 * Check if user has access to a specific application
 */
export async function requireApplicationAccess(
  userId: string,
  applicationId: string
) {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId: userId,
    },
  });

  if (!application) {
    throw new ForbiddenError("You don't have access to this application");
  }

  return application;
}
