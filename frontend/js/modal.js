/**
 * Modal Dialog System
 * 
 * Manages modal dialogs for forms and confirmations with brutal design styling.
 * Handles modal open/close, body scroll prevention, centering, and backdrop clicks.
 * 
 * Requirements: 16.3
 */

class Modal {
  constructor(modalId) {
    this.modalId = modalId;
    this.modal = null;
    this.backdrop = null;
    this.isOpen = false;
    this.onSubmitHandler = null;
    this.originalBodyOverflow = '';
    this.originalBodyPaddingRight = '';
  }

  /**
   * Create modal structure if it doesn't exist
   * @returns {HTMLElement} The modal element
   */
  createModal() {
    // Check if modal already exists
    let modal = document.getElementById(this.modalId);
    if (modal) {
      return modal;
    }

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = `${this.modalId}-backdrop`;
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden transition-opacity duration-300';
    backdrop.setAttribute('data-backdrop', 'true');
    
    // Create modal container
    modal = document.createElement('div');
    modal.id = this.modalId;
    modal.className = 'fixed inset-0 z-50 hidden overflow-y-auto';
    modal.setAttribute('data-modal', 'true');
    
    // Create modal content wrapper for centering
    const modalWrapper = document.createElement('div');
    modalWrapper.className = 'flex items-center justify-center min-h-screen p-4';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white border-2 border-black shadow-brutal w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0';
    modalContent.setAttribute('data-modal-content', 'true');
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'flex items-center justify-between p-6 border-b-2 border-black bg-slate-50';
    modalHeader.innerHTML = `
      <h3 class="text-xl font-display font-bold text-black" data-modal-title>Modal Title</h3>
      <button type="button" class="w-8 h-8 flex items-center justify-center hover:bg-white border border-transparent hover:border-black transition-colors" data-modal-close>
        <span class="material-symbols-outlined text-xl">close</span>
      </button>
    `;
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'p-6';
    modalBody.setAttribute('data-modal-body', 'true');
    modalBody.innerHTML = '<p class="text-sm font-mono text-slate-600">Modal content goes here</p>';
    
    // Create modal footer
    const modalFooter = document.createElement('div');
    modalFooter.className = 'flex items-center justify-end gap-3 p-6 border-t-2 border-black bg-slate-50';
    modalFooter.setAttribute('data-modal-footer', 'true');
    modalFooter.innerHTML = `
      <button type="button" class="px-4 py-2 text-sm font-bold font-mono border border-black hover:bg-slate-100 transition-colors" data-modal-cancel>
        Cancel
      </button>
      <button type="submit" class="px-4 py-2 text-sm font-bold font-mono bg-black text-white border border-black hover:shadow-brutal-sm transition-all" data-modal-submit>
        Submit
      </button>
    `;
    
    // Assemble modal structure
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalWrapper.appendChild(modalContent);
    modal.appendChild(modalWrapper);
    
    // Add to document
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    
    // Set up event listeners
    this.setupEventListeners(modal, backdrop);
    
    return modal;
  }

  /**
   * Set up event listeners for modal interactions
   * @param {HTMLElement} modal - The modal element
   * @param {HTMLElement} backdrop - The backdrop element
   */
  setupEventListeners(modal, backdrop) {
    // Close button
    const closeButton = modal.querySelector('[data-modal-close]');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }
    
    // Cancel button
    const cancelButton = modal.querySelector('[data-modal-cancel]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.close());
    }
    
    // Backdrop click to close
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.close();
      }
    });
    
    // Modal wrapper click to close (click outside content)
    const modalWrapper = modal.querySelector('.flex.items-center');
    if (modalWrapper) {
      modalWrapper.addEventListener('click', (e) => {
        if (e.target === modalWrapper) {
          this.close();
        }
      });
    }
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Submit button
    const submitButton = modal.querySelector('[data-modal-submit]');
    if (submitButton) {
      submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
    
    // Form submission
    const form = modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  /**
   * Open the modal
   */
  open() {
    // Create modal if it doesn't exist
    if (!this.modal) {
      this.modal = this.createModal();
    }
    
    // Ensure backdrop is found if not already set
    if (!this.backdrop) {
      this.backdrop = document.getElementById(`${this.modalId}-backdrop`);
    }
    
    // Prevent body scroll
    this.preventBodyScroll();
    
    // Show backdrop
    this.backdrop.classList.remove('hidden');
    requestAnimationFrame(() => {
      this.backdrop.style.opacity = '1';
    });
    
    // Show modal
    this.modal.classList.remove('hidden');
    
    // Trigger animation
    const modalContent = this.modal.querySelector('[data-modal-content]');
    requestAnimationFrame(() => {
      modalContent.style.opacity = '1';
      modalContent.style.transform = 'scale(1)';
    });
    
    this.isOpen = true;
    
    // Focus first input
    setTimeout(() => {
      const firstInput = this.modal.querySelector('input, textarea, select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.modal || !this.isOpen) {
      return;
    }
    
    // Animate out
    const modalContent = this.modal.querySelector('[data-modal-content]');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
    this.backdrop.style.opacity = '0';
    
    // Hide after animation
    setTimeout(() => {
      this.modal.classList.add('hidden');
      this.backdrop.classList.add('hidden');
      
      // Restore body scroll
      this.restoreBodyScroll();
      
      this.isOpen = false;
    }, 300);
  }

  /**
   * Set the modal title
   * @param {string} title - The title text
   */
  setTitle(title) {
    if (!this.modal) {
      this.modal = this.createModal();
    }
    
    const titleElement = this.modal.querySelector('[data-modal-title]');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  /**
   * Set the modal content
   * @param {string} html - The HTML content
   */
  setContent(html) {
    if (!this.modal) {
      this.modal = this.createModal();
    }
    
    const bodyElement = this.modal.querySelector('[data-modal-body]');
    if (bodyElement) {
      bodyElement.innerHTML = html;
    }
    
    // Re-setup event listeners for new content
    const form = this.modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  /**
   * Set the modal footer content
   * @param {string} html - The HTML content for footer
   */
  setFooter(html) {
    if (!this.modal) {
      this.modal = this.createModal();
    }
    
    const footerElement = this.modal.querySelector('[data-modal-footer]');
    if (footerElement) {
      footerElement.innerHTML = html;
      
      // Re-setup event listeners for new buttons
      const cancelButton = footerElement.querySelector('[data-modal-cancel]');
      if (cancelButton) {
        cancelButton.addEventListener('click', () => this.close());
      }
      
      const submitButton = footerElement.querySelector('[data-modal-submit]');
      if (submitButton) {
        submitButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleSubmit();
        });
      }
    }
  }

  /**
   * Register a submit handler
   * @param {Function} handler - Function to call on submit, receives FormData
   */
  onSubmit(handler) {
    this.onSubmitHandler = handler;
  }

  /**
   * Handle form submission
   */
  handleSubmit() {
    if (!this.onSubmitHandler) {
      return;
    }
    
    // Get form data
    const form = this.modal.querySelector('form');
    if (form) {
      const formData = new FormData(form);
      this.onSubmitHandler(formData);
    } else {
      // If no form, call handler with null
      this.onSubmitHandler(null);
    }
  }

  /**
   * Prevent body scroll when modal is open
   */
  preventBodyScroll() {
    // Store original values
    this.originalBodyOverflow = document.body.style.overflow;
    this.originalBodyPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Apply styles to prevent scroll
    document.body.style.overflow = 'hidden';
    
    // Add padding to prevent layout shift
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  /**
   * Restore body scroll when modal is closed
   */
  restoreBodyScroll() {
    // Restore original values
    document.body.style.overflow = this.originalBodyOverflow;
    document.body.style.paddingRight = this.originalBodyPaddingRight;
  }

  /**
   * Destroy the modal and remove from DOM
   */
  destroy() {
    if (this.isOpen) {
      this.close();
    }
    
    setTimeout(() => {
      if (this.modal) {
        this.modal.remove();
        this.modal = null;
      }
      
      if (this.backdrop) {
        this.backdrop.remove();
        this.backdrop = null;
      }
    }, 300);
  }
}

// Export the Modal class
export default Modal;
export { Modal };
