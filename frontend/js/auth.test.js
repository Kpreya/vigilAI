/**
 * Unit Tests for Authentication Module
 * 
 * Tests the Auth class functionality including token management,
 * user authentication state, and JWT token handling.
 */

import Auth from './auth.js';
import Storage from './storage.js';

describe('Auth Module', () => {
  let auth;
  let mockStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    auth = new Auth();
    mockStorage = new Storage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setToken', () => {
    it('should store a valid token', () => {
      const token = 'valid.jwt.token';
      auth.setToken(token);
      
      const stored = localStorage.getItem('auth_token');
      expect(stored).toBe(JSON.stringify(token));
    });

    it('should throw error for null token', () => {
      expect(() => auth.setToken(null)).toThrow('Invalid token');
    });

    it('should throw error for empty string token', () => {
      expect(() => auth.setToken('')).toThrow('Invalid token');
    });

    it('should throw error for non-string token', () => {
      expect(() => auth.setToken(123)).toThrow('Invalid token');
      expect(() => auth.setToken({})).toThrow('Invalid token');
      expect(() => auth.setToken([])).toThrow('Invalid token');
    });
  });

  describe('getToken', () => {
    it('should retrieve stored token', () => {
      const token = 'valid.jwt.token';
      auth.setToken(token);
      
      const retrieved = auth.getToken();
      expect(retrieved).toBe(token);
    });

    it('should return null when no token is stored', () => {
      const retrieved = auth.getToken();
      expect(retrieved).toBeNull();
    });

    it('should return null on storage error', () => {
      // Corrupt the stored data
      localStorage.setItem('auth_token', 'invalid-json{');
      
      const retrieved = auth.getToken();
      expect(retrieved).toBeNull();
    });
  });

  describe('logout', () => {
    it('should remove stored token', () => {
      const token = 'valid.jwt.token';
      auth.setToken(token);
      
      auth.logout();
      
      const retrieved = auth.getToken();
      expect(retrieved).toBeNull();
    });

    it('should not throw error when no token exists', () => {
      expect(() => auth.logout()).not.toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      // Create a valid JWT token (header.payload.signature)
      const payload = { id: 'user123', email: 'test@example.com', exp: 9999999999 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const decoded = auth.decodeToken(token);
      
      expect(decoded.id).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw error for invalid token format', () => {
      expect(() => auth.decodeToken('invalid')).toThrow('Invalid token format');
      expect(() => auth.decodeToken('only.two')).toThrow('Invalid token format');
    });

    it('should throw error for malformed payload', () => {
      const token = 'header.invalid-base64!@#.signature';
      expect(() => auth.decodeToken(token)).toThrow('Failed to decode token');
    });

    it('should handle URL-safe base64 encoding', () => {
      // JWT uses URL-safe base64 (- and _ instead of + and /)
      const payload = { id: 'user123', email: 'test@example.com' };
      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const token = `header.${encodedPayload}.signature`;
      
      const decoded = auth.decodeToken(token);
      expect(decoded.id).toBe('user123');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Token expires in the future (year 2099)
      const payload = { id: 'user123', exp: 4102444800 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const expired = auth.isTokenExpired(token);
      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      // Token expired in the past (year 2000)
      const payload = { id: 'user123', exp: 946684800 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const expired = auth.isTokenExpired(token);
      expect(expired).toBe(true);
    });

    it('should return false for token without expiration', () => {
      // Token without exp field
      const payload = { id: 'user123', email: 'test@example.com' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const expired = auth.isTokenExpired(token);
      expect(expired).toBe(false);
    });

    it('should return true for invalid token', () => {
      const expired = auth.isTokenExpired('invalid.token');
      expect(expired).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid non-expired token', () => {
      // Token expires in the future
      const payload = { id: 'user123', email: 'test@example.com', exp: 4102444800 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      auth.setToken(token);
      
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('should return false for expired token', () => {
      // Token expired in the past
      const payload = { id: 'user123', email: 'test@example.com', exp: 946684800 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      auth.setToken(token);
      
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('should return false when no token is stored', () => {
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('should return false for invalid token', () => {
      auth.setToken('invalid.token.format');
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user object for valid token', () => {
      const payload = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        exp: 4102444800
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      auth.setToken(token);
      
      const user = auth.getCurrentUser();
      expect(user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      });
    });

    it('should return null for expired token', () => {
      const payload = {
        id: 'user123',
        email: 'test@example.com',
        exp: 946684800 // Expired
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      auth.setToken(token);
      
      const user = auth.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null when no token is stored', () => {
      const user = auth.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null for invalid token', () => {
      auth.setToken('invalid.token.format');
      
      const user = auth.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should handle missing optional fields', () => {
      const payload = {
        id: 'user123',
        email: 'test@example.com',
        exp: 4102444800
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      auth.setToken(token);
      
      const user = auth.getCurrentUser();
      expect(user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        name: null,
        image: null
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete login flow', () => {
      // User logs in and receives token
      const payload = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        exp: 4102444800
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      auth.setToken(token);
      
      // Check authentication status
      expect(auth.isAuthenticated()).toBe(true);
      
      // Get user info
      const user = auth.getCurrentUser();
      expect(user.email).toBe('test@example.com');
      
      // Logout
      auth.logout();
      
      // Check authentication status after logout
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getCurrentUser()).toBeNull();
    });

    it('should handle token expiration scenario', () => {
      // User has an expired token
      const payload = {
        id: 'user123',
        email: 'test@example.com',
        exp: 946684800 // Expired
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      auth.setToken(token);
      
      // Should not be authenticated
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getCurrentUser()).toBeNull();
    });
  });
});
