/**
 * Mobile sidebar toggle functionality
 * Handles hamburger menu and sidebar show/hide on mobile devices
 * 
 * Requirements: 16.5
 */

class MobileSidebar {
  constructor() {
    this.sidebar = null;
    this.hamburgerButton = null;
    this.overlay = null;
    this.isOpen = false;
  }

  /**
   * Initialize mobile sidebar functionality
   */
  init() {
    this.sidebar = document.querySelector('aside');
    
    if (!this.sidebar) {
      console.error('Sidebar not found');
      return;
    }

    // Create hamburger button
    this.createHamburgerButton();
    
    // Create overlay for mobile
    this.createOverlay();
    
    // Add mobile-specific classes to sidebar
    this.setupSidebarStyles();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Create hamburger menu button
   */
  createHamburgerButton() {
    // Create button element
    this.hamburgerButton = document.createElement('button');
    this.hamburgerButton.id = 'mobile-menu-button';
    this.hamburgerButton.className = 'fixed top-4 left-4 z-50 md:hidden bg-white border-2 border-black shadow-brutal-sm p-2 hover:shadow-brutal transition-shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';
    this.hamburgerButton.setAttribute('aria-label', 'Toggle menu');
    this.hamburgerButton.setAttribute('aria-expanded', 'false');
    
    // Create hamburger icon (three lines)
    this.hamburgerButton.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    `;
    
    // Add to body
    document.body.appendChild(this.hamburgerButton);
  }

  /**
   * Create overlay for mobile sidebar
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'sidebar-overlay';
    this.overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-30 hidden md:hidden';
    this.overlay.setAttribute('aria-hidden', 'true');
    
    // Add to body
    document.body.appendChild(this.overlay);
  }

  /**
   * Setup sidebar styles for mobile
   */
  setupSidebarStyles() {
    // Add mobile-specific classes
    // On mobile: hidden by default, fixed position, slide in from left
    // On desktop: always visible, normal position
    this.sidebar.classList.add(
      'md:flex', // Always visible on desktop
      'transition-transform', // Smooth animation
      'duration-300', // Animation duration
      'ease-in-out', // Animation easing
      'fixed', // Fixed position on mobile
      'md:relative', // Relative position on desktop
      'left-0', // Align to left
      'top-0', // Align to top
      'z-40', // Above content, below hamburger
      '-translate-x-full', // Hidden by default on mobile
      'md:translate-x-0' // Always visible on desktop
    );
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Hamburger button click
    this.hamburgerButton.addEventListener('click', () => {
      this.toggle();
    });
    
    // Overlay click to close
    this.overlay.addEventListener('click', () => {
      this.close();
    });
    
    // Close sidebar when clicking navigation links on mobile
    const navLinks = this.sidebar.querySelectorAll('nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Only close on mobile
        if (window.innerWidth < 768) {
          this.close();
        }
      });
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      // Close sidebar if resizing to desktop
      if (window.innerWidth >= 768 && this.isOpen) {
        this.close();
      }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Toggle sidebar visibility
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open sidebar
   */
  open() {
    this.isOpen = true;
    
    // Show sidebar
    this.sidebar.classList.remove('-translate-x-full');
    this.sidebar.classList.add('translate-x-0');
    
    // Show overlay
    this.overlay.classList.remove('hidden');
    
    // Update button aria-expanded
    this.hamburgerButton.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close sidebar
   */
  close() {
    this.isOpen = false;
    
    // Hide sidebar
    this.sidebar.classList.remove('translate-x-0');
    this.sidebar.classList.add('-translate-x-full');
    
    // Hide overlay
    this.overlay.classList.add('hidden');
    
    // Update button aria-expanded
    this.hamburgerButton.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// Create and export singleton instance
const mobileSidebar = new MobileSidebar();

export default mobileSidebar;
