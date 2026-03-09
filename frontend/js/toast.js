/**
 * Toast Notification System
 * 
 * Displays temporary notification messages with brutal design styling.
 * Supports success, error, info, and warning message types with auto-dismiss.
 * 
 * Requirements: 11.1, 11.2, 11.5
 */

class Toast {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.maxToasts = 5;
    this.defaultDuration = 5000; // 5 seconds
    this.init();
  }

  /**
   * Initialize the toast container
   * Creates a fixed container at the top-right of the viewport
   */
  init() {
    // Check if container already exists
    if (document.getElementById('toast-container')) {
      this.container = document.getElementById('toast-container');
      return;
    }

    // Create container element
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none';
    this.container.style.maxWidth = '400px';
    
    // Append to body
    document.body.appendChild(this.container);
  }

  /**
   * Show a success toast notification
   * @param {string} message - The message to display
   * @param {number} duration - Duration in milliseconds (optional)
   */
  success(message, duration = this.defaultDuration) {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast notification
   * @param {string} message - The message to display
   * @param {number} duration - Duration in milliseconds (optional)
   */
  error(message, duration = this.defaultDuration) {
    this.show(message, 'error', duration);
  }

  /**
   * Show an info toast notification
   * @param {string} message - The message to display
   * @param {number} duration - Duration in milliseconds (optional)
   */
  info(message, duration = this.defaultDuration) {
    this.show(message, 'info', duration);
  }

  /**
   * Show a warning toast notification
   * @param {string} message - The message to display
   * @param {number} duration - Duration in milliseconds (optional)
   */
  warning(message, duration = this.defaultDuration) {
    this.show(message, 'warning', duration);
  }

  /**
   * Create and display a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast (success, error, info, warning)
   * @param {number} duration - Duration in milliseconds before auto-dismiss
   */
  show(message, type, duration) {
    // Limit number of toasts - remove oldest immediately if at max
    if (this.toasts.length >= this.maxToasts) {
      const oldestToast = this.toasts[0];
      this.removeImmediately(oldestToast);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto transform transition-all duration-300 ease-out';
    
    // Get type-specific styling
    const typeConfig = this.getTypeConfig(type);
    
    // Build toast HTML with brutal design
    toast.innerHTML = `
      <div class="bg-white border-2 border-black shadow-brutal flex items-start gap-3 p-4 min-w-[300px] max-w-[400px]">
        <div class="flex-shrink-0 w-8 h-8 ${typeConfig.bgColor} border border-black flex items-center justify-center">
          <span class="material-symbols-outlined text-lg ${typeConfig.iconColor}">${typeConfig.icon}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-mono text-black break-words">${this.escapeHtml(message)}</p>
        </div>
        <button class="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-slate-100 border border-transparent hover:border-black transition-colors" onclick="this.closest('[data-toast]').dispatchEvent(new Event('close'))">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    `;
    
    toast.setAttribute('data-toast', 'true');
    toast.setAttribute('data-type', type);
    
    // Add close event listener
    toast.addEventListener('close', () => {
      this.remove(toast);
    });
    
    // Initial state for animation (slide in from right)
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    // Add to container
    this.container.appendChild(toast);
    this.toasts.push(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
  }

  /**
   * Remove a toast notification immediately without animation
   * @param {HTMLElement} toast - The toast element to remove
   */
  removeImmediately(toast) {
    if (!toast || !toast.parentElement) {
      return;
    }
    
    // Remove from DOM immediately
    toast.parentElement.removeChild(toast);
    
    // Remove from toasts array
    const index = this.toasts.indexOf(toast);
    if (index > -1) {
      this.toasts.splice(index, 1);
    }
  }

  /**
   * Remove a toast notification
   * @param {HTMLElement} toast - The toast element to remove
   */
  remove(toast) {
    if (!toast || !toast.parentElement) {
      return;
    }
    
    // Animate out (slide to right and fade)
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
      
      // Remove from toasts array
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    }, 300);
  }

  /**
   * Get configuration for toast type
   * @param {string} type - The toast type
   * @returns {Object} Configuration object with colors and icon
   */
  getTypeConfig(type) {
    const configs = {
      success: {
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        icon: 'check_circle'
      },
      error: {
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        icon: 'error'
      },
      info: {
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        icon: 'info'
      },
      warning: {
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        icon: 'warning'
      }
    };
    
    return configs[type] || configs.info;
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} text - The text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear all toast notifications
   */
  clearAll() {
    const toastsCopy = [...this.toasts];
    toastsCopy.forEach(toast => this.remove(toast));
  }
}

// Create and export singleton instance
const toast = new Toast();
export default toast;

// Also export the class for testing
export { Toast };
