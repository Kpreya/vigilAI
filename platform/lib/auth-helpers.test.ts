import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import crypto from "crypto";

// Mock dependencies before importing the module under test
jest.mock("./auth", () => ({
  auth: jest.fn(),
}));

jest.mock("./prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    application: {
      findFirst: jest.fn(),
    },
  },
}));

// Import after mocking
import {
  requireAuth,
  requireApiKey,
  requireApplicationAccess,
} from "./auth-helpers";
import { auth } from "./auth";
import { prisma } from "./prisma";

describe("Authentication Helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("should return user when authenticated", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      (auth as jest.Mock).mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await requireAuth();

      expect(result).toEqual(mockUser);
    });

    it("should throw error when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });

    it("should throw error when session has no user", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: null,
        expires: "2024-12-31",
      });

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });
  });

  describe("requireApiKey", () => {
    const hashApiKey = (key: string) =>
      crypto.createHash("sha256").update(key).digest("hex");

    it("should return API key when valid", async () => {
      const apiKey = "test-api-key-12345678";
      const hashedKey = hashApiKey(apiKey);
      const mockApiKey = {
        id: "key-123",
        key: hashedKey,
        userId: "user-123",
        revokedAt: null,
        expiresAt: null,
        user: { id: "user-123", email: "test@example.com" },
        application: null,
      };

      const request = new Request("http://localhost", {
        headers: { "x-api-key": apiKey },
      });

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (prisma.apiKey.update as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await requireApiKey(request);

      expect(result).toEqual(mockApiKey);
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { key: hashedKey },
        include: { user: true, application: true },
      });
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: "key-123" },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it("should throw error when API key header is missing", async () => {
      const request = new Request("http://localhost");

      await expect(requireApiKey(request)).rejects.toThrow(
        "Unauthorized: API key is required"
      );
    });

    it("should throw error when API key is invalid", async () => {
      const request = new Request("http://localhost", {
        headers: { "x-api-key": "invalid-key" },
      });

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(requireApiKey(request)).rejects.toThrow(
        "Unauthorized: Invalid API key"
      );
    });

    it("should throw error when API key is revoked", async () => {
      const apiKey = "test-api-key-12345678";
      const hashedKey = hashApiKey(apiKey);
      const mockApiKey = {
        id: "key-123",
        key: hashedKey,
        revokedAt: new Date(),
        expiresAt: null,
      };

      const request = new Request("http://localhost", {
        headers: { "x-api-key": apiKey },
      });

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      await expect(requireApiKey(request)).rejects.toThrow(
        "Unauthorized: API key has been revoked"
      );
    });

    it("should throw error when API key is expired", async () => {
      const apiKey = "test-api-key-12345678";
      const hashedKey = hashApiKey(apiKey);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockApiKey = {
        id: "key-123",
        key: hashedKey,
        revokedAt: null,
        expiresAt: yesterday,
      };

      const request = new Request("http://localhost", {
        headers: { "x-api-key": apiKey },
      });

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);

      await expect(requireApiKey(request)).rejects.toThrow(
        "Unauthorized: API key has expired"
      );
    });

    it("should allow API key that expires in the future", async () => {
      const apiKey = "test-api-key-12345678";
      const hashedKey = hashApiKey(apiKey);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockApiKey = {
        id: "key-123",
        key: hashedKey,
        userId: "user-123",
        revokedAt: null,
        expiresAt: tomorrow,
        user: { id: "user-123", email: "test@example.com" },
        application: null,
      };

      const request = new Request("http://localhost", {
        headers: { "x-api-key": apiKey },
      });

      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockApiKey);
      (prisma.apiKey.update as jest.Mock).mockResolvedValue(mockApiKey);

      const result = await requireApiKey(request);

      expect(result).toEqual(mockApiKey);
    });
  });

  describe("requireApplicationAccess", () => {
    it("should return application when user has access", async () => {
      const mockApplication = {
        id: "app-123",
        userId: "user-123",
        name: "Test App",
      };

      (prisma.application.findFirst as jest.Mock).mockResolvedValue(
        mockApplication
      );

      const result = await requireApplicationAccess("user-123", "app-123");

      expect(result).toEqual(mockApplication);
      expect(prisma.application.findFirst).toHaveBeenCalledWith({
        where: {
          id: "app-123",
          userId: "user-123",
        },
      });
    });

    it("should throw error when user does not have access", async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        requireApplicationAccess("user-123", "app-456")
      ).rejects.toThrow("Forbidden: You don't have access to this application");
    });

    it("should throw error when application does not exist", async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        requireApplicationAccess("user-123", "nonexistent")
      ).rejects.toThrow("Forbidden: You don't have access to this application");
    });
  });
});
