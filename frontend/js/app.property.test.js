/**
 * Property-Based Tests for Router Module
 * 
 * Tests universal properties of the Router class using fast-check.
 * Each property test runs with minimum 100 iterations.
 * 
 * Feature: html-frontend-implementation
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 1.7
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { Router } from './app.js';
import Auth from './auth.js';
import Storage from './storage.js';

describe('Router Module - Property-Based Tests', () => {
  let router;
  let mockRoutes;
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = new Storage();
    
    // Create mock DOM structure
    document.body.innerHTML = `
      <aside>
        <nav>
          <a href="/dashboard.html" class="text-slate-600">Dashboard</a>
          <a href="/incidents.html" class="text-slate-600">Incidents</a>
          <a href="/applications.html" class="text-slate-600">Applications</a>
          <a href="/settings.html" class="text-slate-600">Settings</a>
          <a href="/login.html" class="text-slate-600">Login</a>
        </nav>
      </aside>
    `;
    
    // Mock window.history methods
    window.history.pushState = jest.fn();
    window.history.replaceState = jest.fn();
    
    // Mock window.location
    delete window.location;
    window.location = { href: '', pathname: '/dashboard.html' };
    
    // Define mock routes
    mockRoutes = [
      { path: '/dashboard.html', handler: jest.fn(), requiresAuth: true },
      { path: '/incidents.html', handler: jest.fn(), requiresAuth: true },
      { path: '/applications.html', handler: jest.fn(), requiresAuth: true },
      { path: '/settings.html', handler: jest.fn(), requiresAuth: true },
      { path: '/login.html', handler: jest.fn(), requiresAuth: false },
      { path: '/signup.html', handler: jest.fn(), requiresAuth: false }
    ];
    
    router = new Router(mockRoutes);
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
   * Property 6: Client-side navigation without reload
   * **Feature: html-frontend-implementation, Property 6: Client-side navigation without reload**
   * **Validates: Requirements 2.1**
   * 
   * For any navigation link click, the router should load the target page content
   * without triggering a full page reload.
   */
  describe('Property 6: Client-side navigation without reload', () => {
    it('should navigate without page reload using pushState', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html', '/settings.html'),
          (targetPath) => {
            // Setup: Authenticate user for protected routes
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Reset router's current path to ensure we're navigating to a different path
            router.currentPath = null;
            
            // Reset mocks
            window.history.pushState.mockClear();
            const route = mockRoutes.find(r => r.path === targetPath);
            if (route) route.handler.mockClear();
            
            // Execute: Navigate to target path
            router.navigate(targetPath);
            
            // Verify: pushState was called (no page reload)
            expect(window.history.pushState).toHaveBeenCalledWith(
              { path: targetPath },
              '',
              targetPath
            );
            
            // Verify: Route handler was executed
            if (route) {
              expect(route.handler).toHaveBeenCalled();
            }
            
            // Verify: Current path was updated
            expect(router.currentPath).toBe(targetPath);
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not reload page when navigating between routes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html'),
            { minLength: 2, maxLength: 5 }
          ),
          (paths) => {
            // Setup: Authenticate user
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Track that we never set window.location.href (which would reload)
            const originalHref = window.location.href;
            
            // Execute: Navigate through multiple paths
            paths.forEach(path => {
              router.navigate(path);
            });
            
            // Verify: window.location.href was never changed (no reload)
            // Only pushState should be used
            expect(window.history.pushState).toHaveBeenCalled();
            expect(window.location.href).toBe(originalHref);
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Browser history integration
   * **Feature: html-frontend-implementation, Property 7: Browser history integration**
   * **Validates: Requirements 2.2, 2.4**
   * 
   * For any browser back or forward action, the router should navigate to the
   * appropriate page and update the URL.
   */
  describe('Property 7: Browser history integration', () => {
    it('should handle browser back/forward navigation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html'),
            { minLength: 2, maxLength: 4 }
          ),
          (navigationPath) => {
            // Setup: Authenticate user
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Navigate through the path
            navigationPath.forEach(path => {
              router.navigate(path);
            });
            
            // Simulate browser back button by setting pathname and calling handlePopState
            const previousPath = navigationPath[navigationPath.length - 2] || navigationPath[0];
            window.location.pathname = previousPath;
            
            // Clear previous handler calls
            mockRoutes.forEach(r => r.handler.mockClear());
            
            // Execute: Simulate popstate event
            router.handlePopState(new PopStateEvent('popstate'));
            
            // Verify: Router navigated to the pathname
            expect(router.currentPath).toBe(previousPath);
            
            // Verify: Route handler was executed
            const route = mockRoutes.find(r => r.path === previousPath);
            if (route) {
              expect(route.handler).toHaveBeenCalled();
            }
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not update history when handling popstate', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html'),
          (targetPath) => {
            // Setup: Authenticate user
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Set pathname
            window.location.pathname = targetPath;
            
            // Clear pushState mock
            window.history.pushState.mockClear();
            
            // Execute: Handle popstate
            router.handlePopState(new PopStateEvent('popstate'));
            
            // Verify: pushState was NOT called (browser already updated history)
            expect(window.history.pushState).not.toHaveBeenCalled();
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Active navigation highlighting
   * **Feature: html-frontend-implementation, Property 8: Active navigation highlighting**
   * **Validates: Requirements 2.3**
   * 
   * For any page load, the router should highlight the corresponding navigation
   * item in the sidebar.
   */
  describe('Property 8: Active navigation highlighting', () => {
    it('should highlight active navigation item for current path', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html', '/settings.html'),
          (currentPath) => {
            // Setup: Authenticate user
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Execute: Navigate to path
            router.navigate(currentPath);
            
            // Verify: Active link has active classes
            const activeLink = document.querySelector(`a[href="${currentPath}"]`);
            expect(activeLink.classList.contains('bg-white')).toBe(true);
            expect(activeLink.classList.contains('border-black')).toBe(true);
            expect(activeLink.classList.contains('shadow-brutal-sm')).toBe(true);
            expect(activeLink.classList.contains('font-semibold')).toBe(true);
            
            // Verify: Other links don't have active classes
            const allLinks = document.querySelectorAll('aside nav a');
            allLinks.forEach(link => {
              if (link.getAttribute('href') !== currentPath) {
                expect(link.classList.contains('text-slate-600')).toBe(true);
                expect(link.classList.contains('bg-white')).toBe(false);
              }
            });
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update highlighting when navigating between pages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html'),
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html'),
          (firstPath, secondPath) => {
            // Setup: Authenticate user
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Navigate to first path
            router.navigate(firstPath);
            
            // Navigate to second path
            router.navigate(secondPath);
            
            // Verify: Only second path is highlighted
            const secondLink = document.querySelector(`a[href="${secondPath}"]`);
            expect(secondLink.classList.contains('bg-white')).toBe(true);
            
            // Verify: First path is not highlighted (if different)
            if (firstPath !== secondPath) {
              const firstLink = document.querySelector(`a[href="${firstPath}"]`);
              expect(firstLink.classList.contains('bg-white')).toBe(false);
              expect(firstLink.classList.contains('text-slate-600')).toBe(true);
            }
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Navigation error handling
   * **Feature: html-frontend-implementation, Property 9: Navigation error handling**
   * **Validates: Requirements 2.5**
   * 
   * For any navigation error, the router should display an error message and
   * remain on the current page.
   */
  describe('Property 9: Navigation error handling', () => {
    it('should handle non-existent routes gracefully', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => !mockRoutes.some(r => r.path === '/' + s))
            .map(s => '/' + s.replace(/\s/g, '-') + '.html'),
          (invalidPath) => {
            // Setup: Authenticate user and set initial path
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            router.navigate('/dashboard.html');
            const initialPath = router.currentPath;
            
            // Mock console.error to suppress output
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Execute: Try to navigate to invalid path
            router.navigate(invalidPath);
            
            // Verify: Error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
              `No route found for path: ${invalidPath}`
            );
            
            // Verify: Stayed on current page
            expect(router.currentPath).toBe(initialPath);
            
            // Cleanup
            consoleErrorSpy.mockRestore();
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle route handler errors and restore previous state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html'),
          fc.string({ minLength: 1 }),
          (goodPath, errorMessage) => {
            // Setup: Authenticate user
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Create router with error-throwing route
            const errorHandler = jest.fn(() => {
              throw new Error(errorMessage);
            });
            
            const testRoutes = [
              { path: goodPath, handler: jest.fn(), requiresAuth: true },
              { path: '/error.html', handler: errorHandler, requiresAuth: true }
            ];
            
            const testRouter = new Router(testRoutes);
            
            // Navigate to good path first
            testRouter.navigate(goodPath);
            const previousPath = testRouter.currentPath;
            
            // Mock console.error to suppress output
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Execute: Try to navigate to error route
            testRouter.navigate('/error.html');
            
            // Verify: Error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
              'Route handler error:',
              expect.any(Error)
            );
            
            // Verify: Stayed on previous page
            expect(testRouter.currentPath).toBe(previousPath);
            
            // Verify: History was restored
            expect(window.history.replaceState).toHaveBeenCalledWith(
              { path: previousPath },
              '',
              previousPath
            );
            
            // Cleanup
            consoleErrorSpy.mockRestore();
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle popstate errors gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html'),
          (targetPath) => {
            // Setup: Authenticate user
            const token = createJWT({
              id: 'user_123',
              email: 'test@example.com',
              exp: Math.floor(Date.now() / 1000) + 3600
            });
            storage.set('auth_token', token);
            
            // Create router with navigate that throws
            const testRouter = new Router(mockRoutes);
            const originalNavigate = testRouter.navigate.bind(testRouter);
            testRouter.navigate = jest.fn(() => {
              throw new Error('Navigation error');
            });
            
            // Set pathname
            window.location.pathname = targetPath;
            
            // Mock console.error to suppress output
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Execute: Handle popstate with error
            testRouter.handlePopState(new PopStateEvent('popstate'));
            
            // Verify: Error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
              'Error handling browser navigation:',
              expect.any(Error)
            );
            
            // Cleanup
            consoleErrorSpy.mockRestore();
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Protected route access control
   * **Feature: html-frontend-implementation, Property 4: Protected route access control**
   * **Validates: Requirements 1.7**
   * 
   * For any protected route, when accessed without a valid JWT token, the system
   * should redirect to the login page.
   */
  describe('Property 4: Protected route access control', () => {
    it('should redirect to login for protected routes without authentication', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html', '/settings.html'),
          (protectedPath) => {
            // Setup: Ensure no token exists
            storage.remove('auth_token');
            
            // Reset window.location
            window.location.href = '';
            
            // Execute: Try to navigate to protected route
            router.navigate(protectedPath);
            
            // Verify: Redirected to login
            expect(window.location.href).toBe('/login.html');
            
            // Verify: Route handler was NOT executed
            const route = mockRoutes.find(r => r.path === protectedPath);
            if (route) {
              expect(route.handler).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access to protected routes with valid authentication', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html', '/settings.html'),
          fc.record({
            id: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600 })
          }),
          (protectedPath, payload) => {
            // Setup: Store valid token
            const token = createJWT(payload);
            storage.set('auth_token', token);
            
            // Reset window.location
            window.location.href = '';
            
            // Clear handler mock
            const route = mockRoutes.find(r => r.path === protectedPath);
            if (route) route.handler.mockClear();
            
            // Execute: Navigate to protected route
            router.navigate(protectedPath);
            
            // Verify: Did NOT redirect to login
            expect(window.location.href).not.toBe('/login.html');
            
            // Verify: Route handler WAS executed
            if (route) {
              expect(route.handler).toHaveBeenCalled();
            }
            
            // Verify: Current path was updated
            expect(router.currentPath).toBe(protectedPath);
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow access to public routes without authentication', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/login.html', '/signup.html'),
          (publicPath) => {
            // Setup: Ensure no token exists
            storage.remove('auth_token');
            
            // Reset window.location
            window.location.href = '';
            
            // Clear handler mock
            const route = mockRoutes.find(r => r.path === publicPath);
            if (route) route.handler.mockClear();
            
            // Execute: Navigate to public route
            router.navigate(publicPath);
            
            // Verify: Did NOT redirect to login
            expect(window.location.href).not.toBe('/login.html');
            
            // Verify: Route handler WAS executed
            if (route) {
              expect(route.handler).toHaveBeenCalled();
            }
            
            // Verify: Current path was updated
            expect(router.currentPath).toBe(publicPath);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should redirect to login for expired tokens on protected routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/dashboard.html', '/incidents.html', '/applications.html'),
          fc.record({
            id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            email: fc.emailAddress(),
            exp: fc.integer({ min: 0, max: Math.floor(Date.now() / 1000) - 1 }) // Expired
          }),
          (protectedPath, payload) => {
            // Setup: Store expired token
            const token = createJWT(payload);
            storage.set('auth_token', token);
            
            // Reset window.location with a fresh mock object
            delete window.location;
            window.location = { href: '', pathname: protectedPath };
            
            // Execute: Try to navigate to protected route
            router.navigate(protectedPath);
            
            // Verify: Redirected to login (expired token = not authenticated)
            expect(window.location.href).toBe('/login.html');
            
            // Cleanup
            storage.remove('auth_token');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
