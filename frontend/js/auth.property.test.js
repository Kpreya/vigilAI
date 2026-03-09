/**
 * Property-Based Tests for Authentication Module
 * 
 * Tests universal properties of the Auth class using fast-check.
 * Each property test runs with minimum 100 iterations.
 * 
 * Feature: html-frontend-implementation
 * Validates: Requirements 1.2, 1.5, 1.6, 12.2, 12.3, 12.4
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import Auth from './auth.js';

describe('Auth Module - Property-Based Tests', () => {
  let auth;

  beforeEach(() => {
    localStorage.clear();
    auth = new Auth();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Helper function to create a valid JWT token
   */
  function createJWT(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa('mock-signature');
    return `${header}.${encodedPayload}.${signature}`;
  }

  /**
   * Property 1: Valid credential authentication
   * **Validates: Requirements 1.2, 1.5**
   * 
   * For any valid JWT token with non-expired timestamp, when stored via setToken,
   * the system should maintain authentication state and allow retrieval of user data.
   */
  describe('Property 1: Valid credential authentication', () => {
    it('should store valid tokens and maintain authentication state', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1 }), { nil: null }),
            image: fc.option(fc.webUrl(), { nil: null }),
            exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600 }) // Future expiration
          }),
          (payload) => {
            // Create a valid JWT token
            const token = createJWT(payload);
            
            // Store the token
            auth.setToken(token);
            
            // Verify authentication state
            expect(auth.isAuthenticated()).toBe(true);
            
            // Verify token retrieval
            const retrievedToken = auth.getToken();
            expect(retrievedToken).toBe(token);
            
            // Verify user data retrieval
            const user = auth.getCurrentUser();
            expect(user).not.toBeNull();
            expect(user.id).toBe(payload.id);
            expect(user.email).toBe(payload.email);
            // Auth module converts empty strings to null for optional fields
            expect(user.name).toBe(payload.name || null);
            expect(user.image).toBe(payload.image || null);
            
            // Cleanup for next iteration
            auth.logout();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Token lifecycle management
   * **Validates: Requirements 1.6, 12.2, 12.3**
   * 
   * For any JWT token, the system should correctly validate its expiration status.
   * Expired tokens should not authenticate users, and valid tokens should maintain
   * authentication until expiration.
   */
  describe('Property 3: Token lifecycle management', () => {
    it('should correctly handle token expiration lifecycle', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1 }), { nil: null }),
            // Generate both expired and non-expired tokens
            exp: fc.integer({ min: 0, max: Math.floor(Date.now() / 1000) + 7200 })
          }),
          (payload) => {
            const token = createJWT(payload);
            const currentTime = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp < currentTime;
            
            // Store the token
            auth.setToken(token);
            
            // Verify authentication state matches expiration status
            const authenticated = auth.isAuthenticated();
            expect(authenticated).toBe(!isExpired);
            
            // Verify user retrieval matches expiration status
            const user = auth.getCurrentUser();
            if (isExpired) {
              expect(user).toBeNull();
            } else {
              expect(user).not.toBeNull();
              expect(user.id).toBe(payload.id);
              expect(user.email).toBe(payload.email);
            }
            
            // Cleanup
            auth.logout();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle tokens without expiration field', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1 }), { nil: null })
            // No exp field
          }),
          (payload) => {
            const token = createJWT(payload);
            
            // Store the token
            auth.setToken(token);
            
            // Tokens without expiration should be considered valid
            expect(auth.isAuthenticated()).toBe(true);
            
            const user = auth.getCurrentUser();
            expect(user).not.toBeNull();
            expect(user.id).toBe(payload.id);
            
            // Cleanup
            auth.logout();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid token formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string().filter(s => !s.includes('.') || s.split('.').length !== 3),
            fc.constant(''),
            fc.constant('invalid'),
            fc.constant('only.two')
          ),
          (invalidToken) => {
            // Attempt to store invalid token should throw
            if (invalidToken === '' || invalidToken === null) {
              expect(() => auth.setToken(invalidToken)).toThrow();
            } else {
              // Store the invalid token
              auth.setToken(invalidToken);
              
              // Should not be authenticated with invalid token
              expect(auth.isAuthenticated()).toBe(false);
              expect(auth.getCurrentUser()).toBeNull();
            }
            
            // Cleanup
            auth.logout();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Logout token clearing
   * **Validates: Requirements 12.4**
   * 
   * For any logout action, the system should clear the JWT token from storage
   * and reset authentication state, regardless of the token's validity.
   */
  describe('Property 5: Logout token clearing', () => {
    it('should clear token and reset authentication state on logout', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            name: fc.option(fc.string(), { nil: null }),
            exp: fc.integer({ min: 0, max: Math.floor(Date.now() / 1000) + 7200 })
          }),
          (payload) => {
            const token = createJWT(payload);
            
            // Store the token
            auth.setToken(token);
            
            // Verify token is stored
            expect(auth.getToken()).toBe(token);
            
            // Perform logout
            auth.logout();
            
            // Verify token is cleared
            expect(auth.getToken()).toBeNull();
            
            // Verify authentication state is reset
            expect(auth.isAuthenticated()).toBe(false);
            expect(auth.getCurrentUser()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle logout when no token exists', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Ensure no token exists
            expect(auth.getToken()).toBeNull();
            
            // Logout should not throw
            expect(() => auth.logout()).not.toThrow();
            
            // State should remain unauthenticated
            expect(auth.isAuthenticated()).toBe(false);
            expect(auth.getCurrentUser()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple logout calls idempotently', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600 })
          }),
          fc.integer({ min: 1, max: 5 }),
          (payload, logoutCount) => {
            const token = createJWT(payload);
            
            // Store the token
            auth.setToken(token);
            
            // Perform multiple logouts
            for (let i = 0; i < logoutCount; i++) {
              auth.logout();
            }
            
            // Verify final state is unauthenticated
            expect(auth.getToken()).toBeNull();
            expect(auth.isAuthenticated()).toBe(false);
            expect(auth.getCurrentUser()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Token storage persistence
   * 
   * Verifies that tokens persist across Auth instance creation,
   * simulating page reloads.
   */
  describe('Additional Property: Token storage persistence', () => {
    it('should persist tokens across Auth instance creation', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600 })
          }),
          (payload) => {
            const token = createJWT(payload);
            
            // Store token with first instance
            const auth1 = new Auth();
            auth1.setToken(token);
            
            // Create new instance (simulating page reload)
            const auth2 = new Auth();
            
            // Verify token persists
            expect(auth2.getToken()).toBe(token);
            expect(auth2.isAuthenticated()).toBe(true);
            
            const user = auth2.getCurrentUser();
            expect(user).not.toBeNull();
            expect(user.id).toBe(payload.id);
            
            // Cleanup
            auth2.logout();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
