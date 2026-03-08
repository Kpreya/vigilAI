/**
 * Main application entry point and router
 * Handles client-side navigation and page initialization
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import Auth from './auth.js';
import toast from './toast.js';
import mobileSidebar from './mobile-sidebar.js';

/**
 * Router class for client-side navigation
 * Manages route configuration, navigation, and authentication enforcement
 */
class Router {
  /**
   * Create a new Router instance
   * @param {Array<RouteConfig>} routes - Array of route configurations
   */
  constructor(routes) {
    if (!Array.isArray(routes)) {
      throw new Error('Routes must be an array');
    }
    
    this.routes = routes;
    this.auth = new Auth();
    this.currentPath = null;
  }

  /**
   * Navigate to a route
   * @param {string} path - URL path to navigate to
   * @param {boolean} updateHistory - Whether to update browser history (default: true)
   */
  navigate(path, updateHistory = true) {
    try {
      // Find matching route
      const route = this.routes.find(r => r.path === path);
      
      if (!route) {
        console.error(`No route found for path: ${path}`);
        toast.error(`Page not found: ${path}`);
        return;
      }

      // Check authentication requirement
      if (route.requiresAuth && !this.auth.isAuthenticated()) {
        // Redirect to login if not authenticated
        window.location.href = '/login.html';
        return;
      }

      // Update browser history using pushState to avoid page reload
      if (updateHistory && path !== this.currentPath) {
        window.history.pushState({ path }, '', path);
      }

      // Store previous path for error recovery
      const previousPath = this.currentPath;

      // Update current path
      this.currentPath = path;

      // Execute route handler with error handling
      if (typeof route.handler === 'function') {
        try {
          route.handler();
        } catch (handlerError) {
          console.error('Route handler error:', handlerError);
          toast.error('Failed to load page. Please try again.');
          
          // Restore previous path on handler error
          this.currentPath = previousPath;
          
          // Restore browser history if it was updated
          if (updateHistory && previousPath) {
            window.history.replaceState({ path: previousPath }, '', previousPath);
          }
          
          return;
        }
      }

      // Update active navigation
      this.updateActiveNav(path);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Navigation failed. Please try again.');
    }
  }

  /**
   * Initialize router and set up event listeners
   */
  init() {
    // Initialize mobile sidebar
    mobileSidebar.init();
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      this.handlePopState(event);
    });

    // Get current path from URL
    const currentPath = window.location.pathname;
    
    // Navigate to current path (don't update history on initial load)
    this.navigate(currentPath, false);
  }

  /**
   * Handle browser back/forward navigation
   * @param {PopStateEvent} event - Browser popstate event
   */
  handlePopState(event) {
    try {
      const path = window.location.pathname;
      // Don't update history when handling popstate (user already navigated via browser)
      this.navigate(path, false);
    } catch (error) {
      console.error('Error handling browser navigation:', error);
      toast.error('Failed to navigate. Please try again.');
    }
  }

  /**
   * Update active navigation state in sidebar
   * @param {string} path - Current active path
   */
  updateActiveNav(path) {
    // Get all navigation links
    const navLinks = document.querySelectorAll('aside nav a');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // Remove active classes
      link.classList.remove('bg-white', 'border', 'border-black', 'shadow-brutal-sm', 'font-semibold');
      link.classList.add('text-slate-600', 'hover:text-black', 'hover:bg-white', 'hover:border', 'hover:border-black', 'hover:shadow-brutal-sm');
      
      // Add active classes if this is the current path
      if (href === path || (href === '/' && path === '/dashboard.html') || (href === '/dashboard.html' && path === '/')) {
        link.classList.remove('text-slate-600', 'hover:text-black', 'hover:bg-white', 'hover:border', 'hover:border-black', 'hover:shadow-brutal-sm');
        link.classList.add('bg-white', 'border', 'border-black', 'shadow-brutal-sm', 'text-black', 'font-semibold');
      }
    });
  }
}

/**
 * Route configuration interface
 * @typedef {Object} RouteConfig
 * @property {string} path - URL path pattern
 * @property {Function} handler - Function to execute when route matches
 * @property {boolean} requiresAuth - Whether route requires authentication
 */

// Define route configurations for all pages
const routes = [
  {
    path: '/',
    handler: () => {
      console.log('Dashboard page loaded');
      initDashboardPage();
    },
    requiresAuth: true
  },
  {
    path: '/dashboard.html',
    handler: () => {
      console.log('Dashboard page loaded');
      initDashboardPage();
    },
    requiresAuth: true
  },
  {
    path: '/incidents.html',
    handler: () => {
      console.log('Incidents page loaded');
      initIncidentsPage();
    },
    requiresAuth: true
  },
  {
    path: '/pull_request.html',
    handler: () => {
      console.log('Pull Requests page loaded');
      initPullRequestsPage();
    },
    requiresAuth: true
  },
  {
    path: '/applications.html',
    handler: () => {
      console.log('Applications page loaded');
      initApplicationsPage();
    },
    requiresAuth: true
  },
  {
    path: '/api_key.html',
    handler: () => {
      console.log('API Keys page loaded');
      initApiKeysPage();
    },
    requiresAuth: true
  },
  {
    path: '/settings.html',
    handler: () => {
      console.log('Settings page loaded');
      initSettingsPage();
    },
    requiresAuth: true
  },
  {
    path: '/login.html',
    handler: () => {
      console.log('Login page loaded');
      initLoginPage();
    },
    requiresAuth: false
  },
  {
    path: '/signup.html',
    handler: () => {
      console.log('Signup page loaded');
      initSignupPage();
    },
    requiresAuth: false
  }
];

// Create router instance
const router = new Router(routes);

/**
 * Initialize dashboard page functionality
 * Handles dashboard data loading and display
 * Requirements: 4.1
 */
function initDashboardPage() {
  // Import DashboardPage dynamically
  import('./pages/dashboard.js').then(DashboardPageModule => {
    const dashboardPage = new DashboardPageModule.default();
    dashboardPage.init();
  }).catch(error => {
    console.error('Failed to load dashboard page module:', error);
    toast.error('Failed to initialize dashboard');
  });
}

/**
 * Initialize incidents page functionality
 * Handles incidents data loading and display
 * Requirements: 5.1
 */
function initIncidentsPage() {
  // Import IncidentsPage dynamically
  import('./pages/incidents.js').then(IncidentsPageModule => {
    const incidentsPage = new IncidentsPageModule.default();
    incidentsPage.init();
  }).catch(error => {
    console.error('Failed to load incidents page module:', error);
    toast.error('Failed to initialize incidents page');
  });
}

/**
 * Initialize pull requests page functionality
 * Handles pull requests data loading and display
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
function initPullRequestsPage() {
  // Import PullRequestsPage dynamically
  import('./pages/pull-requests.js').then(PullRequestsPageModule => {
    const pullRequestsPage = new PullRequestsPageModule.default();
    pullRequestsPage.init();
  }).catch(error => {
    console.error('Failed to load pull requests page module:', error);
    toast.error('Failed to initialize pull requests page');
  });
}

/**
 * Initialize applications page functionality
 * Handles applications data loading and display
 * Requirements: 6.1
 */
function initApplicationsPage() {
  // Import ApplicationsPage dynamically
  import('./pages/applications.js').then(ApplicationsPageModule => {
    const applicationsPage = new ApplicationsPageModule.default();
    applicationsPage.init();
  }).catch(error => {
    console.error('Failed to load applications page module:', error);
    toast.error('Failed to initialize applications page');
  });
}

/**
 * Initialize API keys page functionality
 * Handles API keys data loading and display
 * Requirements: 7.1
 */
function initApiKeysPage() {
  // Import ApiKeysPage dynamically
  import('./pages/api-keys.js').then(ApiKeysPageModule => {
    const apiKeysPage = new ApiKeysPageModule.default();
    apiKeysPage.init();
  }).catch(error => {
    console.error('Failed to load API keys page module:', error);
    toast.error('Failed to initialize API keys page');
  });
}

/**
 * Initialize settings page functionality
 * Handles settings data loading and display
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.6
 */
function initSettingsPage() {
  // Import SettingsPage dynamically
  import('./pages/settings.js').then(SettingsPageModule => {
    const settingsPage = new SettingsPageModule.default();
    settingsPage.init();
  }).catch(error => {
    console.error('Failed to load settings page module:', error);
    toast.error('Failed to initialize settings page');
  });
}

/**
 * Initialize login page functionality
 * Handles form submission, validation, and authentication
 * Requirements: 1.2, 1.3
 */
function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  
  if (!loginForm) {
    console.error('Login form not found');
    return;
  }

  // Import validators and API client dynamically
  import('./utils/validators.js').then(validators => {
    import('./api-client.js').then(ApiClientModule => {
      const apiClient = new ApiClientModule.default();
      
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form elements
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        if (!emailInput || !passwordInput || !submitButton) {
          toast.error('Form elements not found');
          return;
        }
        
        // Get form values
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate email
        const emailValidation = validators.validateEmail(email);
        if (!emailValidation.isValid) {
          toast.error(emailValidation.error);
          emailInput.focus();
          return;
        }
        
        // Validate password presence
        const passwordValidation = validators.validateRequired(password, 'Password');
        if (!passwordValidation.isValid) {
          toast.error(passwordValidation.error);
          passwordInput.focus();
          return;
        }
        
        // Disable button and show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="inline-block animate-pulse">Signing in...</span>';
        
        try {
          // Call API to authenticate
          const response = await apiClient.post('/auth/login', {
            email,
            password
          });
          
          // Store JWT token
          const auth = new Auth();
          auth.setToken(response.token);
          
          // Show success message
          toast.success('Login successful! Redirecting...');
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 500);
          
        } catch (error) {
          // Display error toast
          const errorMessage = error.message || 'Login failed. Please check your credentials.';
          toast.error(errorMessage);
          
          // Re-enable button
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
          
          // Focus on email field for retry
          emailInput.focus();
        }
      });
    });
  });
}

/**
 * Initialize signup page functionality
 * Handles form submission, validation, account creation, and authentication
 * Requirements: 1.5
 */
function initSignupPage() {
  const signupForm = document.getElementById('signup-form');
  
  if (!signupForm) {
    console.error('Signup form not found');
    return;
  }

  // Import validators and API client dynamically
  import('./utils/validators.js').then(validators => {
    import('./api-client.js').then(ApiClientModule => {
      const apiClient = new ApiClientModule.default();
      
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form elements
        const emailInput = document.getElementById('email');
        const nameInput = document.getElementById('name');
        const passwordInput = document.getElementById('password');
        const submitButton = signupForm.querySelector('button[type="submit"]');
        
        if (!emailInput || !nameInput || !passwordInput || !submitButton) {
          toast.error('Form elements not found');
          return;
        }
        
        // Get form values
        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        const password = passwordInput.value;
        
        // Validate email
        const emailValidation = validators.validateEmail(email);
        if (!emailValidation.isValid) {
          toast.error(emailValidation.error);
          emailInput.focus();
          return;
        }
        
        // Validate name
        const nameValidation = validators.validateRequired(name, 'Name');
        if (!nameValidation.isValid) {
          toast.error(nameValidation.error);
          nameInput.focus();
          return;
        }
        
        // Validate password strength
        const passwordValidation = validators.validatePassword(password);
        if (!passwordValidation.isValid) {
          toast.error(passwordValidation.error);
          passwordInput.focus();
          return;
        }
        
        // Disable button and show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="inline-block animate-pulse">Creating account...</span>';
        
        try {
          // Call API to create account
          const response = await apiClient.post('/auth/signup', {
            email,
            name,
            password
          });
          
          // Store JWT token
          const auth = new Auth();
          auth.setToken(response.token);
          
          // Show success message
          toast.success('Account created successfully! Redirecting...');
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 500);
          
        } catch (error) {
          // Display error toast
          const errorMessage = error.message || 'Signup failed. Please try again.';
          toast.error(errorMessage);
          
          // Re-enable button
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
          
          // Focus on email field for retry
          emailInput.focus();
        }
      });
    });
  });
}

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('App DOM loaded, initializing router...');
  router.init();
});

// Export router and Router class
export { Router, router };
export default router;
