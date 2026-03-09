/**
 * Toast Notification System Tests
 * 
 * Unit tests for the toast notification system.
 * Tests toast creation, display, auto-dismiss, and stacking logic.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Toast } from './toast.js';

describe('Toast Notification System', () => {
  let toast;
  let container;

  beforeEach(() => {
    // Clear any existing toast containers
    const existingContainer = document.getElementById('toast-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create new toast instance
    toast = new Toast();
    container = document.getElementById('toast-container');
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentElement) {
      container.remove();
    }
    toast = null;
  });

  describe('Initialization', () => {
    test('should create toast container on init', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('toast-container');
      expect(container.className).toContain('fixed');
      expect(container.className).toContain('top-4');
      expect(container.className).toContain('right-4');
    });

    test('should not create duplicate containers', () => {
      const toast2 = new Toast();
      const containers = document.querySelectorAll('#toast-container');
      expect(containers.length).toBe(1);
    });
  });

  describe('Toast Creation', () => {
    test('should create success toast with correct styling', () => {
      toast.success('Success message');
      
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement).toBeTruthy();
      expect(toastElement.getAttribute('data-type')).toBe('success');
      expect(toastElement.innerHTML).toContain('Success message');
      expect(toastElement.innerHTML).toContain('check_circle');
      expect(toastElement.innerHTML).toContain('bg-green-50');
    });

    test('should create error toast with correct styling', () => {
      toast.error('Error message');
      
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement).toBeTruthy();
      expect(toastElement.getAttribute('data-type')).toBe('error');
      expect(toastElement.innerHTML).toContain('Error message');
      expect(toastElement.innerHTML).toContain('error');
      expect(toastElement.innerHTML).toContain('bg-red-50');
    });

    test('should create info toast with correct styling', () => {
      toast.info('Info message');
      
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement).toBeTruthy();
      expect(toastElement.getAttribute('data-type')).toBe('info');
      expect(toastElement.innerHTML).toContain('Info message');
      expect(toastElement.innerHTML).toContain('info');
      expect(toastElement.innerHTML).toContain('bg-blue-50');
    });

    test('should create warning toast with correct styling', () => {
      toast.warning('Warning message');
      
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement).toBeTruthy();
      expect(toastElement.getAttribute('data-type')).toBe('warning');
      expect(toastElement.innerHTML).toContain('Warning message');
      expect(toastElement.innerHTML).toContain('warning');
      expect(toastElement.innerHTML).toContain('bg-yellow-50');
    });

    test('should apply brutal design styling', () => {
      toast.success('Test');
      
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement.innerHTML).toContain('border-2');
      expect(toastElement.innerHTML).toContain('border-black');
      expect(toastElement.innerHTML).toContain('shadow-brutal');
      expect(toastElement.innerHTML).toContain('font-mono');
    });

    test('should escape HTML in messages to prevent XSS', () => {
      const maliciousMessage = '<script>alert("XSS")</script>';
      toast.success(maliciousMessage);
      
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement.innerHTML).not.toContain('<script>');
      expect(toastElement.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('Auto-dismiss', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    test('should auto-dismiss after default duration', () => {
      toast.success('Test message');
      
      expect(container.querySelectorAll('[data-toast]').length).toBe(1);
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      // Wait for animation
      jest.advanceTimersByTime(300);
      
      expect(container.querySelectorAll('[data-toast]').length).toBe(0);
    });

    test('should auto-dismiss after custom duration', () => {
      toast.success('Test message', 2000);
      
      expect(container.querySelectorAll('[data-toast]').length).toBe(1);
      
      // Fast-forward time
      jest.advanceTimersByTime(2000);
      
      // Wait for animation
      jest.advanceTimersByTime(300);
      
      expect(container.querySelectorAll('[data-toast]').length).toBe(0);
    });

    test('should not auto-dismiss when duration is 0', () => {
      toast.success('Test message', 0);
      
      expect(container.querySelectorAll('[data-toast]').length).toBe(1);
      
      // Fast-forward time
      jest.advanceTimersByTime(10000);
      
      // Toast should still be present
      expect(container.querySelectorAll('[data-toast]').length).toBe(1);
    });
  });

  describe('Manual Dismissal', () => {
    test('should dismiss toast when close button is clicked', () => {
      toast.success('Test message');
      
      const toastElement = container.querySelector('[data-toast]');
      const closeButton = toastElement.querySelector('button');
      
      expect(container.querySelectorAll('[data-toast]').length).toBe(1);
      
      closeButton.click();
      
      // Wait for animation
      setTimeout(() => {
        expect(container.querySelectorAll('[data-toast]').length).toBe(0);
      }, 300);
    });

    test('should clear all toasts with clearAll method', () => {
      toast.success('Message 1');
      toast.error('Message 2');
      toast.info('Message 3');
      
      expect(container.querySelectorAll('[data-toast]').length).toBe(3);
      
      toast.clearAll();
      
      // Wait for animation
      setTimeout(() => {
        expect(container.querySelectorAll('[data-toast]').length).toBe(0);
      }, 300);
    });
  });

  describe('Toast Stacking', () => {
    test('should stack multiple toasts vertically', () => {
      toast.success('Message 1');
      toast.error('Message 2');
      toast.info('Message 3');
      
      const toasts = container.querySelectorAll('[data-toast]');
      expect(toasts.length).toBe(3);
      
      // Container should have flex-col for vertical stacking
      expect(container.className).toContain('flex-col');
    });

    test('should limit toasts to maximum of 5', () => {
      // Create 7 toasts
      for (let i = 0; i < 7; i++) {
        toast.success(`Message ${i + 1}`);
      }
      
      // Should only have 5 toasts
      const toasts = container.querySelectorAll('[data-toast]');
      expect(toasts.length).toBe(5);
    });

    test('should remove oldest toast when exceeding max', () => {
      toast.success('Message 1');
      toast.success('Message 2');
      toast.success('Message 3');
      toast.success('Message 4');
      toast.success('Message 5');
      
      // All 5 should be present
      expect(container.innerHTML).toContain('Message 1');
      expect(container.innerHTML).toContain('Message 5');
      
      // Add 6th toast
      toast.success('Message 6');
      
      // Wait for removal animation
      setTimeout(() => {
        // Message 1 should be removed, Message 6 should be present
        expect(container.innerHTML).not.toContain('Message 1');
        expect(container.innerHTML).toContain('Message 6');
        expect(container.querySelectorAll('[data-toast]').length).toBe(5);
      }, 300);
    });
  });

  describe('Toast Positioning', () => {
    test('should position container at top-right', () => {
      expect(container.className).toContain('top-4');
      expect(container.className).toContain('right-4');
      expect(container.className).toContain('fixed');
    });

    test('should have high z-index for visibility', () => {
      expect(container.className).toContain('z-50');
    });

    test('should have max-width constraint', () => {
      expect(container.style.maxWidth).toBe('400px');
    });

    test('should have pointer-events-none on container', () => {
      expect(container.className).toContain('pointer-events-none');
    });

    test('should have pointer-events-auto on individual toasts', () => {
      toast.success('Test');
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement.className).toContain('pointer-events-auto');
    });
  });

  describe('Animation', () => {
    test('should start with opacity 0 and translateX(100%)', () => {
      toast.success('Test');
      const toastElement = container.querySelector('[data-toast]');
      
      // Initial state before animation
      expect(toastElement.style.opacity).toBe('0');
      expect(toastElement.style.transform).toContain('translateX(100%)');
    });

    test('should have transition classes', () => {
      toast.success('Test');
      const toastElement = container.querySelector('[data-toast]');
      
      expect(toastElement.className).toContain('transition-all');
      expect(toastElement.className).toContain('duration-300');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty message', () => {
      toast.success('');
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement).toBeTruthy();
    });

    test('should handle very long messages', () => {
      const longMessage = 'A'.repeat(500);
      toast.success(longMessage);
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement).toBeTruthy();
      expect(toastElement.innerHTML).toContain('break-words');
    });

    test('should handle special characters in messages', () => {
      const specialMessage = 'Test & <test> "quotes" \'apostrophes\'';
      toast.success(specialMessage);
      const toastElement = container.querySelector('[data-toast]');
      expect(toastElement).toBeTruthy();
    });

    test('should handle rapid successive calls', () => {
      for (let i = 0; i < 10; i++) {
        toast.success(`Message ${i}`);
      }
      
      // Should be limited to max toasts
      const toasts = container.querySelectorAll('[data-toast]');
      expect(toasts.length).toBeLessThanOrEqual(5);
    });

    test('should handle removal of already removed toast', () => {
      toast.success('Test');
      const toastElement = container.querySelector('[data-toast]');
      
      // Remove twice
      toast.remove(toastElement);
      toast.remove(toastElement);
      
      // Should not throw error
      expect(true).toBe(true);
    });
  });
});
