/**
 * Property-Based Tests for API Client Module
 * 
 * Tests universal properties of the ApiClient class using fast-check.
 * Each property test runs with minimum 100 iterations.
 * 
 * Feature: html-frontend-implementation
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 12.5
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';
import ApiClient from './api-client.js';
import Auth from './auth.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client Module - Property-Based Tests', () => {
  let apiClient;
  let auth;

  beforeEach(() => {
    localStorage.clear();
    auth = new Auth();
    apiClient = new ApiClient('/api');
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
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
   * Property 10: JWT token injection in requests
   * **Validates: Requirements 3.1, 12.5**
   * 
   * For any API request when a JWT token is present, the API client should
   * include the token in the Authorization header.
   */
  describe('Property 10: JWT token injection in requests', () => {
    it('should include JWT token in Authorization header for all requests', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600 })
          }),
          fc.constantFrom('GET', 'POST', 'PATCH', 'DELETE'),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.object(),
          async (payload, method, endpoint, data) => {
            // Create and store a valid token
            const token = createJWT(payload);
            auth.setToken(token);
            
            // Mock successful response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => ({ data: { success: true } })
            });
            
            // Make request based on method
            try {
              if (method === 'GET' || method === 'DELETE') {
                await apiClient[method.toLowerCase()](endpoint);
              } else {
                await apiClient[method.toLowerCase()](endpoint, data);
              }
            } catch (error) {
              // Ignore errors for this test - we're only checking headers
            }
            
            // Verify fetch was called with Authorization header
            expect(global.fetch).toHaveBeenCalled();
            const fetchCall = global.fetch.mock.calls[0];
            const fetchOptions = fetchCall[1];
            
            expect(fetchOptions.headers).toBeDefined();
            expect(fetchOptions.headers['Authorization']).toBe(`Bearer ${token}`);
            
            // Cleanup
            auth.logout();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include Authorization header when no token exists', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('GET', 'POST', 'PATCH', 'DELETE'),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          async (method, endpoint) => {
            // Ensure no token exists
            auth.logout();
            
            // Mock successful response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => ({ data: { success: true } })
            });
            
            // Make request
            try {
              await apiClient[method.toLowerCase()](endpoint, method === 'POST' || method === 'PATCH' ? {} : undefined);
            } catch (error) {
              // Ignore errors
            }
            
            // Verify fetch was called without Authorization header
            expect(global.fetch).toHaveBeenCalled();
            const fetchCall = global.fetch.mock.calls[0];
            const fetchOptions = fetchCall[1];
            
            expect(fetchOptions.headers['Authorization']).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: 401 response handling
   * **Validates: Requirements 3.2**
   * 
   * For any API request that receives a 401 response, the API client should
   * clear the session and redirect to the login page.
   */
  describe('Property 11: 401 response handling', () => {
    it('should clear session and redirect on 401 response', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600 })
          }),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          async (payload, endpoint) => {
            // Create and store a valid token
            const token = createJWT(payload);
            auth.setToken(token);
            
            // Verify token is stored
            expect(auth.getToken()).toBe(token);
            
            // Mock 401 response
            global.fetch.mockResolvedValueOnce({
              ok: false,
              status: 401,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => ({ error: 'Unauthorized' })
            });
            
            // Mock window.location
            delete window.location;
            window.location = { href: '' };
            
            // Make request and expect it to throw
            try {
              await apiClient.get(endpoint);
            } catch (error) {
              // Verify error structure
              expect(error.status).toBe(401);
              expect(error.code).toBe('UNAUTHORIZED');
            }
            
            // Verify token was cleared
            expect(auth.getToken()).toBeNull();
            
            // Verify redirect was attempted
            expect(window.location.href).toBe('/frontend/login.html');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Network error retry with exponential backoff
   * **Validates: Requirements 3.3**
   * 
   * For any API request that fails due to network error, the API client should
   * retry up to 3 times with exponential backoff before returning an error.
   */
  describe('Property 12: Network error retry with exponential backoff', () => {
    it('should retry network errors up to 3 times with exponential backoff', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          async (endpoint) => {
            // Mock network error
            const networkError = new Error('Network request failed');
            networkError.name = 'TypeError';
            
            global.fetch.mockRejectedValue(networkError);
            
            const startTime = Date.now();
            
            // Make request and expect it to fail after retries
            try {
              await apiClient.get(endpoint);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify error structure
              expect(error.status).toBe(0);
              expect(error.code).toBe('NETWORK_ERROR');
              expect(error.message).toContain('Network error');
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Verify fetch was called 4 times (initial + 3 retries)
            expect(global.fetch).toHaveBeenCalledTimes(4);
            
            // Verify exponential backoff occurred
            // Total delay should be at least 1s + 2s + 4s = 7s
            // We allow some tolerance for test execution time
            expect(duration).toBeGreaterThanOrEqual(6500);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should succeed on retry if network recovers', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.integer({ min: 1, max: 3 }),
          fc.object(),
          async (endpoint, failCount, responseData) => {
            // Mock network error for first N attempts, then success
            let callCount = 0;
            global.fetch.mockImplementation(() => {
              callCount++;
              if (callCount <= failCount) {
                const error = new Error('Network request failed');
                error.name = 'TypeError';
                return Promise.reject(error);
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({ data: responseData })
              });
            });
            
            // Make request
            const result = await apiClient.get(endpoint);
            
            // Verify we got the response data
            expect(result).toEqual(responseData);
            
            // Verify fetch was called failCount + 1 times
            expect(global.fetch).toHaveBeenCalledTimes(failCount + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not retry non-network errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.integer({ min: 400, max: 599 }).filter(n => n !== 401),
          async (endpoint, statusCode) => {
            // Mock HTTP error response (not a network error)
            global.fetch.mockResolvedValueOnce({
              ok: false,
              status: statusCode,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => ({ error: 'Server error' })
            });
            
            // Make request and expect it to fail immediately
            try {
              await apiClient.get(endpoint);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify error structure
              expect(error.status).toBe(statusCode);
            }
            
            // Verify fetch was called only once (no retries)
            expect(global.fetch).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Successful response parsing
   * **Validates: Requirements 3.4**
   * 
   * For any successful API request, the API client should return the parsed
   * response data in a consistent format.
   */
  describe('Property 13: Successful response parsing', () => {
    it('should parse and return data from successful responses', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.object(),
          async (endpoint, responseData) => {
            // Mock successful response with data property
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => ({ data: responseData })
            });
            
            // Make request
            const result = await apiClient.get(endpoint);
            
            // Verify we got the data property
            expect(result).toEqual(responseData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle responses without data property', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.object(),
          async (endpoint, responseData) => {
            // Mock successful response without data property
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => responseData
            });
            
            // Make request
            const result = await apiClient.get(endpoint);
            
            // Verify we got the whole response
            expect(result).toEqual(responseData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle non-JSON responses', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.string(),
          async (endpoint, textResponse) => {
            // Mock successful text response
            global.fetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              headers: new Map([['content-type', 'text/plain']]),
              text: async () => textResponse,
              json: async () => { throw new Error('Not JSON'); }
            });
            
            // Make request
            const result = await apiClient.get(endpoint);
            
            // Verify we got the text response
            expect(result).toBe(textResponse);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Failed request error structure
   * **Validates: Requirements 3.5**
   * 
   * For any API request that fails after all retries, the API client should
   * return a structured error object containing status and message.
   */
  describe('Property 14: Failed request error structure', () => {
    it('should return structured error for HTTP errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.integer({ min: 400, max: 599 }).filter(n => n !== 401),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          async (endpoint, statusCode, errorMessage, errorCode) => {
            // Mock HTTP error response
            global.fetch.mockResolvedValueOnce({
              ok: false,
              status: statusCode,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => ({
                error: errorMessage,
                code: errorCode
              })
            });
            
            // Make request and expect it to throw
            try {
              await apiClient.get(endpoint);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify error structure
              expect(error).toHaveProperty('status');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('code');
              
              expect(error.status).toBe(statusCode);
              expect(error.message).toBe(errorMessage);
              expect(error.code).toBe(errorCode);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return structured error for network failures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          async (endpoint) => {
            // Mock network error
            const networkError = new Error('Network request failed');
            networkError.name = 'TypeError';
            global.fetch.mockRejectedValue(networkError);
            
            // Make request and expect it to throw
            try {
              await apiClient.get(endpoint);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify error structure
              expect(error).toHaveProperty('status');
              expect(error).toHaveProperty('message');
              expect(error).toHaveProperty('code');
              
              expect(error.status).toBe(0);
              expect(error.code).toBe('NETWORK_ERROR');
              expect(error.message).toContain('Network error');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include error details when available', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/\s/g, '-')),
          fc.integer({ min: 400, max: 599 }).filter(n => n !== 401),
          fc.object(),
          async (endpoint, statusCode, errorDetails) => {
            // Mock HTTP error response with details
            global.fetch.mockResolvedValueOnce({
              ok: false,
              status: statusCode,
              headers: new Map([['content-type', 'application/json']]),
              json: async () => ({
                error: 'Error occurred',
                code: 'ERROR_CODE',
                details: errorDetails
              })
            });
            
            // Make request and expect it to throw
            try {
              await apiClient.get(endpoint);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Verify error includes details
              expect(error).toHaveProperty('details');
              expect(error.details).toEqual(errorDetails);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
