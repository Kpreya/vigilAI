/**
 * Responsive Design Tests
 * 
 * Tests for responsive behavior including modal centering, toast positioning,
 * and layout preservation on viewport resize.
 * 
 * Requirements: 16.2, 16.3, 16.4
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Modal from './modal.js';
import { Toast } from './toast.js';

describe('Responsive Design', () => {
  let originalInnerWidth;
  let originalInnerHeight;

  beforeEach(() => {
    // Store original viewport dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    
    // Clear document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Restore original viewport dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
    
    // Clean up
    document.body.innerHTML = '';
  });

  describe('Modal Centering', () => {
    it('should center modal at desktop screen size (1920x1080)', () => {
      // Set viewport to desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080
      });

      const modal = new Modal('test-modal');
      modal.open();

      const modalWrapper = document.querySelector('.flex.items-center.justify-center');
      expect(modalWrapper).toBeTruthy();
      expect(modalWrapper.classList.contains('items-center')).toBe(true);
      expect(modalWrapper.classList.contains('justify-center')).toBe(true);

      modal.close();
    });

    it('should center modal at tablet screen size (768x1024)', () => {
      // Set viewport to tablet size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024
      });

      const modal = new Modal('test-modal');
      modal.open();

      const modalWrapper = document.querySelector('.flex.items-center.justify-center');
      expect(modalWrapper).toBeTruthy();
      expect(modalWrapper.classList.contains('items-center')).toBe(true);
      expect(modalWrapper.classList.contains('justify-center')).toBe(true);

      modal.close();
    });

    it('should center modal at mobile screen size (375x667)', () => {
      // Set viewport to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      });

      const modal = new Modal('test-modal');
      modal.open();

      const modalWrapper = document.querySelector('.flex.items-center.justify-center');
      expect(modalWrapper).toBeTruthy();
      expect(modalWrapper.classList.contains('items-center')).toBe(true);
      expect(modalWrapper.classList.contains('justify-center')).toBe(true);

      modal.close();
    });

    it('should prevent body scrolling when modal is open', () => {
      const modal = new Modal('test-modal');
      
      // Store original overflow
      const originalOverflow = document.body.style.overflow;
      
      modal.open();
      
      // Body should have overflow hidden
      expect(document.body.style.overflow).toBe('hidden');
      
      modal.close();
      
      // Wait for animation
      setTimeout(() => {
        // Body overflow should be restored
        expect(document.body.style.overflow).toBe(originalOverflow);
      }, 350);
    });
  });

  describe('Toast Positioning', () => {
    it('should position toast at top-right on desktop (1920x1080)', () => {
      // Set viewport to desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080
      });

      const toast = new Toast();
      toast.success('Test message');

      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
      expect(container.classList.contains('fixed')).toBe(true);
      expect(container.classList.contains('top-4')).toBe(true);
      expect(container.classList.contains('right-4')).toBe(true);
    });

    it('should position toast at top-right on tablet (768x1024)', () => {
      // Set viewport to tablet size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024
      });

      const toast = new Toast();
      toast.success('Test message');

      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
      expect(container.classList.contains('fixed')).toBe(true);
      expect(container.classList.contains('top-4')).toBe(true);
      expect(container.classList.contains('right-4')).toBe(true);
    });

    it('should position toast at top-right on mobile (375x667)', () => {
      // Set viewport to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      });

      const toast = new Toast();
      toast.success('Test message');

      const container = document.getElementById('toast-container');
      expect(container).toBeTruthy();
      expect(container.classList.contains('fixed')).toBe(true);
      expect(container.classList.contains('top-4')).toBe(true);
      expect(container.classList.contains('right-4')).toBe(true);
    });

    it('should maintain consistent positioning across screen sizes', () => {
      const screenSizes = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1366, height: 768, name: 'laptop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      screenSizes.forEach(size => {
        // Clear previous toast
        document.body.innerHTML = '';
        
        // Set viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: size.width
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: size.height
        });

        const toast = new Toast();
        toast.info(`Test on ${size.name}`);

        const container = document.getElementById('toast-container');
        expect(container).toBeTruthy();
        
        // Verify consistent positioning
        const styles = window.getComputedStyle(container);
        expect(container.classList.contains('fixed')).toBe(true);
        expect(container.classList.contains('top-4')).toBe(true);
        expect(container.classList.contains('right-4')).toBe(true);
      });
    });
  });

  describe('Layout Preservation on Viewport Resize', () => {
    it('should maintain layout when resizing from desktop to mobile', () => {
      // Start at desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080
      });

      // Create some content
      document.body.innerHTML = `
        <div class="container mx-auto p-4">
          <h1 class="text-2xl font-bold">Test Content</h1>
          <p class="text-sm">This is test content</p>
        </div>
      `;

      const container = document.querySelector('.container');
      expect(container).toBeTruthy();

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Container should still exist and maintain classes
      const containerAfterResize = document.querySelector('.container');
      expect(containerAfterResize).toBeTruthy();
      expect(containerAfterResize.classList.contains('container')).toBe(true);
      expect(containerAfterResize.classList.contains('mx-auto')).toBe(true);
    });

    it('should maintain modal centering after viewport resize', () => {
      // Start at desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });

      const modal = new Modal('test-modal');
      modal.open();

      let modalWrapper = document.querySelector('.flex.items-center.justify-center');
      expect(modalWrapper.classList.contains('items-center')).toBe(true);

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Modal should still be centered
      modalWrapper = document.querySelector('.flex.items-center.justify-center');
      expect(modalWrapper.classList.contains('items-center')).toBe(true);
      expect(modalWrapper.classList.contains('justify-center')).toBe(true);

      modal.close();
    });

    it('should maintain toast positioning after viewport resize', () => {
      // Start at desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });

      const toast = new Toast();
      toast.success('Test message');

      let container = document.getElementById('toast-container');
      expect(container.classList.contains('top-4')).toBe(true);
      expect(container.classList.contains('right-4')).toBe(true);

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Toast should maintain positioning
      container = document.getElementById('toast-container');
      expect(container.classList.contains('top-4')).toBe(true);
      expect(container.classList.contains('right-4')).toBe(true);
    });
  });

  describe('Brutal Design Aesthetic Preservation', () => {
    it('should maintain brutal design classes on modal across screen sizes', () => {
      const screenSizes = [1920, 768, 375];

      screenSizes.forEach(width => {
        // Clear previous modal
        document.body.innerHTML = '';
        
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width
        });

        const modal = new Modal('test-modal');
        modal.open();

        const modalContent = document.querySelector('[data-modal-content]');
        expect(modalContent).toBeTruthy();
        
        // Verify brutal design classes
        expect(modalContent.classList.contains('border-2')).toBe(true);
        expect(modalContent.classList.contains('border-black')).toBe(true);
        expect(modalContent.classList.contains('shadow-brutal')).toBe(true);

        modal.close();
      });
    });

    it('should maintain brutal design classes on toast across screen sizes', () => {
      const screenSizes = [1920, 768, 375];

      screenSizes.forEach(width => {
        // Clear previous toast
        document.body.innerHTML = '';
        
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width
        });

        const toast = new Toast();
        toast.success('Test message');

        const toastElement = document.querySelector('[data-toast]');
        expect(toastElement).toBeTruthy();
        
        const toastContent = toastElement.querySelector('div');
        expect(toastContent).toBeTruthy();
        
        // Verify brutal design classes
        expect(toastContent.classList.contains('border-2')).toBe(true);
        expect(toastContent.classList.contains('border-black')).toBe(true);
        expect(toastContent.classList.contains('shadow-brutal')).toBe(true);
      });
    });
  });
});
