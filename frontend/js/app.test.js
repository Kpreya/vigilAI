/**
 * Router Module Tests
 * Tests for the Router class and route configuration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Router } from './app.js';
import Storage from './storage.js';
import toast from './toast.js';

describe('Frontend JavaScript Infrastructure', () => {
  it('should have ES6 module support', () => {
    // This test passing means ES6 modules are working
    expect(true).toBe(true);
  });

  it('should be able to import modules', async () => {
    // Dynamic import test
    const module = await import('./app.js');
    expect(module).toBeDefined();
    expect(module.default).toBeDefined();
  });
});

describe('Router Class', () => {
  let mockRoutes;
  let router;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock routes
    mockRoutes = [
      {
        path: '/dashboard.html',
        handler: jest.fn(),
        requiresAuth: true
      },
      {
        path: '/login.html',
        handler: jest.fn(),
        requiresAuth: false
      }
    ];
    
    router = new Router(mockRoutes);
  });

  describe('Constructor', () => {
    it('should create a Router instance with routes', () => {
      expect(router).toBeDefined();
      expect(router.routes).toEqual(mockRoutes);
    });

    it('should throw error if routes is not an array', () => {
      expect(() => new Router('not-an-array')).toThrow('Routes must be an array');
    });

    it('should initialize auth instance', () => {
      expect(router.auth).toBeDefined();
    });
  });

  describe('Route Configuration', () => {
    it('should have all required page routes defined', async () => {
      const module = await import('./app.js');
      const routes = module.router.routes;
      
      const expectedPaths = [
        '/',
        '/dashboard.html',
        '/incidents.html',
        '/pull_request.html',
        '/applications.html',
        '/api_key.html',
        '/settings.html',
        '/login.html',
        '/signup.html'
      ];
      
      const actualPaths = routes.map(r => r.path);
      
      expectedPaths.forEach(path => {
        expect(actualPaths).toContain(path);
      });
    });

    it('should mark protected routes with requiresAuth flag', async () => {
      const module = await import('./app.js');
      const routes = module.router.routes;
      
      const protectedRoutes = routes.filter(r => r.requiresAuth);
      const publicRoutes = routes.filter(r => !r.requiresAuth);
      
      // Protected routes should include dashboard, incidents, etc.
      expect(protectedRoutes.length).toBeGreaterThan(0);
      
      // Public routes should include login and signup
      expect(publicRoutes.some(r => r.path === '/login.html')).toBe(true);
      expect(publicRoutes.some(r => r.path === '/signup.html')).toBe(true);
    });

    it('should have handler functions for all routes', async () => {
      const module = await import('./app.js');
      const routes = module.router.routes;
      
      routes.forEach(route => {
        expect(typeof route.handler).toBe('function');
      });
    });
  });

  describe('updateActiveNav', () => {
    beforeEach(() => {
      // Create mock DOM structure
      document.body.innerHTML = `
        <aside>
          <nav>
            <a href="/dashboard.html" class="text-slate-600">Dashboard</a>
            <a href="/incidents.html" class="text-slate-600">Incidents</a>
            <a href="/settings.html" class="text-slate-600">Settings</a>
          </nav>
        </aside>
      `;
    });

    it('should add active classes to the current path link', () => {
      router.updateActiveNav('/dashboard.html');
      
      const dashboardLink = document.querySelector('a[href="/dashboard.html"]');
      expect(dashboardLink.classList.contains('bg-white')).toBe(true);
      expect(dashboardLink.classList.contains('border-black')).toBe(true);
      expect(dashboardLink.classList.contains('shadow-brutal-sm')).toBe(true);
    });

    it('should remove active classes from other links', () => {
      router.updateActiveNav('/dashboard.html');
      
      const incidentsLink = document.querySelector('a[href="/incidents.html"]');
      expect(incidentsLink.classList.contains('text-slate-600')).toBe(true);
      expect(incidentsLink.classList.contains('bg-white')).toBe(false);
    });

    it('should handle root path as dashboard', () => {
      router.updateActiveNav('/');
      
      const dashboardLink = document.querySelector('a[href="/dashboard.html"]');
      // Should activate dashboard link when on root path
      expect(dashboardLink.classList.contains('bg-white')).toBe(true);
    });
  });

  describe('navigate', () => {
    beforeEach(() => {
      // Mock window.history.pushState
      window.history.pushState = jest.fn();
      
      // Create mock DOM structure
      document.body.innerHTML = `
        <aside>
          <nav>
            <a href="/dashboard.html" class="text-slate-600">Dashboard</a>
            <a href="/login.html" class="text-slate-600">Login</a>
          </nav>
        </aside>
      `;
      
      // Mock localStorage with a valid token using Storage module
      const storage = new Storage();
      storage.set('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.test');
    });

    it('should update browser history using pushState', () => {
      router.navigate('/dashboard.html');
      
      expect(window.history.pushState).toHaveBeenCalledWith(
        { path: '/dashboard.html' },
        '',
        '/dashboard.html'
      );
    });

    it('should not update history when updateHistory is false', () => {
      window.history.pushState = jest.fn();
      router.navigate('/dashboard.html', false);
      
      expect(window.history.pushState).not.toHaveBeenCalled();
    });

    it('should not update history when navigating to the same path', () => {
      window.history.pushState = jest.fn();
      router.currentPath = '/dashboard.html';
      router.navigate('/dashboard.html');
      
      expect(window.history.pushState).not.toHaveBeenCalled();
    });

    it('should execute the route handler', () => {
      const handler = jest.fn();
      const testRouter = new Router([
        { path: '/test.html', handler, requiresAuth: false }
      ]);
      
      testRouter.navigate('/test.html');
      
      expect(handler).toHaveBeenCalled();
    });

    it('should update active navigation', () => {
      router.navigate('/dashboard.html');
      
      const dashboardLink = document.querySelector('a[href="/dashboard.html"]');
      expect(dashboardLink.classList.contains('bg-white')).toBe(true);
    });

    it('should update currentPath', () => {
      router.navigate('/dashboard.html');
      
      expect(router.currentPath).toBe('/dashboard.html');
    });

    it('should redirect to login for protected routes when not authenticated', () => {
      // Clear token to simulate unauthenticated state
      localStorage.clear();
      
      // Mock window.location
      delete window.location;
      window.location = { href: '' };
      
      router.navigate('/dashboard.html');
      
      expect(window.location.href).toBe('/login.html');
    });

    it('should allow navigation to public routes when not authenticated', () => {
      // Clear token to simulate unauthenticated state
      localStorage.clear();
      
      const handler = jest.fn();
      const testRouter = new Router([
        { path: '/login.html', handler, requiresAuth: false }
      ]);
      
      testRouter.navigate('/login.html');
      
      expect(handler).toHaveBeenCalled();
    });

    it('should log error for non-existent routes', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      router.navigate('/non-existent.html');
      
      expect(consoleSpy).toHaveBeenCalledWith('No route found for path: /non-existent.html');
      
      consoleSpy.mockRestore();
    });

    it('should display error toast for non-existent routes', () => {
      const toastSpy = jest.spyOn(toast, 'error').mockImplementation();
      
      router.navigate('/non-existent.html');
      
      expect(toastSpy).toHaveBeenCalledWith('Page not found: /non-existent.html');
      
      toastSpy.mockRestore();
    });

    it('should catch and handle route handler errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toastSpy = jest.spyOn(toast, 'error').mockImplementation();
      
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const testRouter = new Router([
        { path: '/error.html', handler: errorHandler, requiresAuth: false }
      ]);
      
      testRouter.navigate('/error.html');
      
      expect(consoleSpy).toHaveBeenCalledWith('Route handler error:', expect.any(Error));
      expect(toastSpy).toHaveBeenCalledWith('Failed to load page. Please try again.');
      
      consoleSpy.mockRestore();
      toastSpy.mockRestore();
    });

    it('should restore previous path when handler throws error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toastSpy = jest.spyOn(toast, 'error').mockImplementation();
      
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const testRouter = new Router([
        { path: '/good.html', handler: jest.fn(), requiresAuth: false },
        { path: '/error.html', handler: errorHandler, requiresAuth: false }
      ]);
      
      // Navigate to a good page first
      testRouter.navigate('/good.html');
      expect(testRouter.currentPath).toBe('/good.html');
      
      // Try to navigate to error page
      testRouter.navigate('/error.html');
      
      // Should restore previous path
      expect(testRouter.currentPath).toBe('/good.html');
      
      consoleSpy.mockRestore();
      toastSpy.mockRestore();
    });

    it('should restore browser history when handler throws error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toastSpy = jest.spyOn(toast, 'error').mockImplementation();
      window.history.replaceState = jest.fn();
      
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const testRouter = new Router([
        { path: '/good.html', handler: jest.fn(), requiresAuth: false },
        { path: '/error.html', handler: errorHandler, requiresAuth: false }
      ]);
      
      // Navigate to a good page first
      testRouter.navigate('/good.html');
      
      // Try to navigate to error page
      testRouter.navigate('/error.html');
      
      // Should restore browser history
      expect(window.history.replaceState).toHaveBeenCalledWith(
        { path: '/good.html' },
        '',
        '/good.html'
      );
      
      consoleSpy.mockRestore();
      toastSpy.mockRestore();
    });

    it('should catch and handle general navigation errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toastSpy = jest.spyOn(toast, 'error').mockImplementation();
      
      // Create a router with a route that will cause an error in navigate
      const testRouter = new Router([
        { path: '/test.html', handler: jest.fn(), requiresAuth: false }
      ]);
      
      // Mock updateActiveNav to throw an error
      testRouter.updateActiveNav = jest.fn(() => {
        throw new Error('Update nav error');
      });
      
      testRouter.navigate('/test.html');
      
      expect(consoleSpy).toHaveBeenCalledWith('Navigation error:', expect.any(Error));
      expect(toastSpy).toHaveBeenCalledWith('Navigation failed. Please try again.');
      
      consoleSpy.mockRestore();
      toastSpy.mockRestore();
    });

    it('should stay on current page when navigation fails', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toastSpy = jest.spyOn(toast, 'error').mockImplementation();
      
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      
      const testRouter = new Router([
        { path: '/current.html', handler: jest.fn(), requiresAuth: false },
        { path: '/error.html', handler: errorHandler, requiresAuth: false }
      ]);
      
      // Navigate to current page
      testRouter.navigate('/current.html');
      const currentPath = testRouter.currentPath;
      
      // Try to navigate to error page
      testRouter.navigate('/error.html');
      
      // Should stay on current page
      expect(testRouter.currentPath).toBe(currentPath);
      
      consoleSpy.mockRestore();
      toastSpy.mockRestore();
    });
  });

  describe('handlePopState', () => {
    beforeEach(() => {
      // Mock window.history.pushState
      window.history.pushState = jest.fn();
      
      // Create mock DOM structure
      document.body.innerHTML = `
        <aside>
          <nav>
            <a href="/dashboard.html" class="text-slate-600">Dashboard</a>
            <a href="/incidents.html" class="text-slate-600">Incidents</a>
          </nav>
        </aside>
      `;
      
      // Mock localStorage with a valid token using Storage module
      const storage = new Storage();
      storage.set('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.test');
    });

    it('should navigate to the current pathname', () => {
      // Mock window.location.pathname
      delete window.location;
      window.location = { pathname: '/incidents.html' };
      
      const navigateSpy = jest.spyOn(router, 'navigate');
      
      router.handlePopState(new PopStateEvent('popstate'));
      
      expect(navigateSpy).toHaveBeenCalledWith('/incidents.html', false);
      
      navigateSpy.mockRestore();
    });

    it('should not update history when handling popstate', () => {
      // Mock window.location.pathname
      delete window.location;
      window.location = { pathname: '/incidents.html' };
      
      window.history.pushState = jest.fn();
      
      router.handlePopState(new PopStateEvent('popstate'));
      
      // pushState should not be called because updateHistory is false
      expect(window.history.pushState).not.toHaveBeenCalled();
    });

    it('should execute the route handler for the new path', () => {
      const handler = jest.fn();
      const testRouter = new Router([
        { path: '/test.html', handler, requiresAuth: false }
      ]);
      
      // Mock window.location.pathname
      delete window.location;
      window.location = { pathname: '/test.html' };
      
      testRouter.handlePopState(new PopStateEvent('popstate'));
      
      expect(handler).toHaveBeenCalled();
    });

    it('should catch and handle errors during popstate navigation', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toastSpy = jest.spyOn(toast, 'error').mockImplementation();
      
      const testRouter = new Router([
        { path: '/test.html', handler: jest.fn(), requiresAuth: false }
      ]);
      
      // Mock navigate to throw an error
      testRouter.navigate = jest.fn(() => {
        throw new Error('Navigation error');
      });
      
      // Mock window.location.pathname
      delete window.location;
      window.location = { pathname: '/test.html' };
      
      testRouter.handlePopState(new PopStateEvent('popstate'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Error handling browser navigation:', expect.any(Error));
      expect(toastSpy).toHaveBeenCalledWith('Failed to navigate. Please try again.');
      
      consoleSpy.mockRestore();
      toastSpy.mockRestore();
    });
  });

  describe('init', () => {
    beforeEach(() => {
      // Mock window.history.pushState
      window.history.pushState = jest.fn();
      
      // Mock window.addEventListener
      window.addEventListener = jest.fn();
      
      // Create mock DOM structure
      document.body.innerHTML = `
        <aside>
          <nav>
            <a href="/dashboard.html" class="text-slate-600">Dashboard</a>
          </nav>
        </aside>
      `;
      
      // Mock localStorage with a valid token using Storage module
      const storage = new Storage();
      storage.set('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.test');
    });

    it('should set up popstate event listener', () => {
      router.init();
      
      expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    });

    it('should navigate to current path on initialization', () => {
      // Mock window.location.pathname
      delete window.location;
      window.location = { pathname: '/dashboard.html' };
      
      const navigateSpy = jest.spyOn(router, 'navigate');
      
      router.init();
      
      expect(navigateSpy).toHaveBeenCalledWith('/dashboard.html', false);
      
      navigateSpy.mockRestore();
    });

    it('should not update history on initial load', () => {
      // Mock window.location.pathname
      delete window.location;
      window.location = { pathname: '/dashboard.html' };
      
      window.history.pushState = jest.fn();
      
      router.init();
      
      // pushState should not be called on initial load
      expect(window.history.pushState).not.toHaveBeenCalled();
    });
  });
});
