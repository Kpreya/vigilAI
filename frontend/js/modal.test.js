/**
 * Unit Tests for Modal Dialog System
 * 
 * Tests modal functionality including open/close, body scroll prevention,
 * centering, backdrop clicks, and form submission handling.
 */

import { Modal } from './modal.js';

describe('Modal Dialog System', () => {
  let modal;
  
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
    
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Create a new modal instance
    modal = new Modal('test-modal');
  });
  
  afterEach(() => {
    // Clean up
    if (modal) {
      modal.destroy();
    }
    
    // Clear document body
    document.body.innerHTML = '';
  });

  describe('Modal Creation', () => {
    test('should create modal structure when opened', () => {
      modal.open();
      
      const modalElement = document.getElementById('test-modal');
      const backdropElement = document.getElementById('test-modal-backdrop');
      
      expect(modalElement).toBeTruthy();
      expect(backdropElement).toBeTruthy();
      expect(modalElement.querySelector('[data-modal-content]')).toBeTruthy();
      expect(modalElement.querySelector('[data-modal-title]')).toBeTruthy();
      expect(modalElement.querySelector('[data-modal-body]')).toBeTruthy();
      expect(modalElement.querySelector('[data-modal-footer]')).toBeTruthy();
    });

    test('should not create duplicate modals', () => {
      modal.open();
      modal.close();
      modal.open();
      
      const modals = document.querySelectorAll('#test-modal');
      expect(modals.length).toBe(1);
    });

    test('should have proper brutal design classes', () => {
      modal.open();
      
      const modalContent = document.querySelector('[data-modal-content]');
      expect(modalContent.className).toContain('border-2');
      expect(modalContent.className).toContain('border-black');
      expect(modalContent.className).toContain('shadow-brutal');
    });
  });

  describe('Modal Open/Close', () => {
    test('should open modal and set isOpen to true', () => {
      modal.open();
      
      expect(modal.isOpen).toBe(true);
      expect(modal.modal.classList.contains('hidden')).toBe(false);
      expect(modal.backdrop.classList.contains('hidden')).toBe(false);
    });

    test('should close modal and set isOpen to false', (done) => {
      modal.open();
      modal.close();
      
      // Wait for animation
      setTimeout(() => {
        expect(modal.isOpen).toBe(false);
        expect(modal.modal.classList.contains('hidden')).toBe(true);
        expect(modal.backdrop.classList.contains('hidden')).toBe(true);
        done();
      }, 350);
    });

    test('should close modal when close button is clicked', (done) => {
      modal.open();
      
      const closeButton = modal.modal.querySelector('[data-modal-close]');
      closeButton.click();
      
      setTimeout(() => {
        expect(modal.isOpen).toBe(false);
        done();
      }, 350);
    });

    test('should close modal when cancel button is clicked', (done) => {
      modal.open();
      
      const cancelButton = modal.modal.querySelector('[data-modal-cancel]');
      cancelButton.click();
      
      setTimeout(() => {
        expect(modal.isOpen).toBe(false);
        done();
      }, 350);
    });

    test('should close modal when Escape key is pressed', (done) => {
      modal.open();
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      setTimeout(() => {
        expect(modal.isOpen).toBe(false);
        done();
      }, 350);
    });
  });

  describe('Body Scroll Prevention', () => {
    test('should prevent body scroll when modal opens', () => {
      modal.open();
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should restore body scroll when modal closes', (done) => {
      // Set initial overflow
      document.body.style.overflow = 'auto';
      
      modal.open();
      modal.close();
      
      setTimeout(() => {
        expect(document.body.style.overflow).toBe('auto');
        done();
      }, 350);
    });

    test('should add padding to prevent layout shift when scrollbar exists', () => {
      // Mock scrollbar width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      Object.defineProperty(document.documentElement, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 1008 // 16px scrollbar
      });
      
      modal.open();
      
      expect(document.body.style.paddingRight).toBe('16px');
    });
  });

  describe('Backdrop Click to Close', () => {
    test('should close modal when backdrop is clicked', (done) => {
      modal.open();
      
      const backdrop = modal.backdrop;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: backdrop, enumerable: true });
      
      backdrop.dispatchEvent(clickEvent);
      
      setTimeout(() => {
        expect(modal.isOpen).toBe(false);
        done();
      }, 350);
    });

    test('should close modal when clicking outside modal content', (done) => {
      modal.open();
      
      const modalWrapper = modal.modal.querySelector('.flex.items-center');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: modalWrapper, enumerable: true });
      
      modalWrapper.dispatchEvent(clickEvent);
      
      setTimeout(() => {
        expect(modal.isOpen).toBe(false);
        done();
      }, 350);
    });

    test('should not close modal when clicking inside modal content', () => {
      modal.open();
      
      const modalContent = modal.modal.querySelector('[data-modal-content]');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: modalContent, enumerable: true });
      
      modalContent.dispatchEvent(clickEvent);
      
      expect(modal.isOpen).toBe(true);
    });
  });

  describe('Modal Centering', () => {
    test('should center modal using flexbox', () => {
      modal.open();
      
      const modalWrapper = modal.modal.querySelector('.flex.items-center');
      expect(modalWrapper.className).toContain('items-center');
      expect(modalWrapper.className).toContain('justify-center');
      expect(modalWrapper.className).toContain('min-h-screen');
    });

    test('should be responsive with max-width', () => {
      modal.open();
      
      const modalContent = modal.modal.querySelector('[data-modal-content]');
      expect(modalContent.className).toContain('max-w-lg');
      expect(modalContent.className).toContain('w-full');
    });
  });

  describe('Content Management', () => {
    test('should set modal title', () => {
      modal.setTitle('Test Title');
      
      const titleElement = modal.modal.querySelector('[data-modal-title]');
      expect(titleElement.textContent).toBe('Test Title');
    });

    test('should set modal content', () => {
      const testContent = '<p>Test content</p>';
      modal.setContent(testContent);
      
      const bodyElement = modal.modal.querySelector('[data-modal-body]');
      expect(bodyElement.innerHTML).toBe(testContent);
    });

    test('should set modal footer', () => {
      const testFooter = '<button>Custom Button</button>';
      modal.setFooter(testFooter);
      
      const footerElement = modal.modal.querySelector('[data-modal-footer]');
      expect(footerElement.innerHTML).toBe(testFooter);
    });
  });

  describe('Form Submission', () => {
    test('should call onSubmit handler when submit button is clicked', () => {
      let handlerCalled = false;
      const submitHandler = () => {
        handlerCalled = true;
      };
      
      modal.open();
      modal.setContent(`
        <form>
          <input name="test" value="value" />
        </form>
      `);
      modal.onSubmit(submitHandler);
      
      const submitButton = modal.modal.querySelector('[data-modal-submit]');
      submitButton.click();
      
      expect(handlerCalled).toBe(true);
    });

    test('should pass FormData to submit handler', () => {
      let receivedFormData;
      const submitHandler = (formData) => {
        receivedFormData = formData;
      };
      
      modal.open();
      modal.setContent(`
        <form>
          <input name="username" value="testuser" />
          <input name="email" value="test@example.com" />
        </form>
      `);
      modal.onSubmit(submitHandler);
      
      const submitButton = modal.modal.querySelector('[data-modal-submit]');
      submitButton.click();
      
      expect(receivedFormData).toBeInstanceOf(FormData);
      expect(receivedFormData.get('username')).toBe('testuser');
      expect(receivedFormData.get('email')).toBe('test@example.com');
    });

    test('should handle form submission event', () => {
      let handlerCalled = false;
      const submitHandler = () => {
        handlerCalled = true;
      };
      
      modal.open();
      modal.setContent(`
        <form>
          <input name="test" value="value" />
        </form>
      `);
      modal.onSubmit(submitHandler);
      
      const form = modal.modal.querySelector('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      expect(handlerCalled).toBe(true);
    });
  });

  describe('Focus Management', () => {
    test('should focus first input when modal opens', (done) => {
      modal.open();
      modal.setContent(`
        <form>
          <input id="first-input" name="test" />
          <input id="second-input" name="test2" />
        </form>
      `);
      
      setTimeout(() => {
        const firstInput = document.getElementById('first-input');
        expect(document.activeElement).toBe(firstInput);
        done();
      }, 150);
    });
  });

  describe('Modal Destruction', () => {
    test('should remove modal from DOM when destroyed', (done) => {
      modal.open();
      modal.destroy();
      
      setTimeout(() => {
        const modalElement = document.getElementById('test-modal');
        const backdropElement = document.getElementById('test-modal-backdrop');
        
        expect(modalElement).toBeFalsy();
        expect(backdropElement).toBeFalsy();
        done();
      }, 350);
    });

    test('should close modal before destroying if open', (done) => {
      modal.open();
      expect(modal.isOpen).toBe(true);
      
      modal.destroy();
      
      setTimeout(() => {
        expect(modal.isOpen).toBe(false);
        done();
      }, 350);
    });
  });

  describe('Animation', () => {
    test('should apply animation classes on open', () => {
      modal.open();
      
      const modalContent = modal.modal.querySelector('[data-modal-content]');
      expect(modalContent.className).toContain('transition-all');
      expect(modalContent.className).toContain('duration-300');
    });

    test('should animate backdrop opacity', () => {
      modal.open();
      
      expect(modal.backdrop.className).toContain('transition-opacity');
      expect(modal.backdrop.className).toContain('duration-300');
    });
  });

  describe('Multiple Modals', () => {
    test('should support multiple modal instances', () => {
      const modal1 = new Modal('modal-1');
      const modal2 = new Modal('modal-2');
      
      modal1.open();
      modal2.open();
      
      expect(modal1.isOpen).toBe(true);
      expect(modal2.isOpen).toBe(true);
      expect(document.getElementById('modal-1')).toBeTruthy();
      expect(document.getElementById('modal-2')).toBeTruthy();
      
      modal1.destroy();
      modal2.destroy();
    });
  });
});
