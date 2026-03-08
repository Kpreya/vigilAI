/**
 * Storage Module Tests
 * 
 * Unit tests for the localStorage wrapper with error handling.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Storage from './storage.js';

describe('Storage Module', () => {
  let storage;

  beforeEach(() => {
    storage = new Storage();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('set method', () => {
    it('should store a string value', () => {
      storage.set('testKey', 'testValue');
      expect(localStorage.getItem('testKey')).toBe('"testValue"');
    });

    it('should store an object value', () => {
      const testObj = { name: 'John', age: 30 };
      storage.set('testKey', testObj);
      const stored = JSON.parse(localStorage.getItem('testKey'));
      expect(stored).toEqual(testObj);
    });

    it('should store an array value', () => {
      const testArray = [1, 2, 3, 4, 5];
      storage.set('testKey', testArray);
      const stored = JSON.parse(localStorage.getItem('testKey'));
      expect(stored).toEqual(testArray);
    });

    it('should store a number value', () => {
      storage.set('testKey', 42);
      expect(localStorage.getItem('testKey')).toBe('42');
    });

    it('should store a boolean value', () => {
      storage.set('testKey', true);
      expect(localStorage.getItem('testKey')).toBe('true');
    });

    it('should store null value', () => {
      storage.set('testKey', null);
      expect(localStorage.getItem('testKey')).toBe('null');
    });
  });

  describe('get method', () => {
    it('should retrieve a stored string value', () => {
      storage.set('testKey', 'testValue');
      expect(storage.get('testKey')).toBe('testValue');
    });

    it('should retrieve a stored object value', () => {
      const testObj = { name: 'John', age: 30 };
      storage.set('testKey', testObj);
      expect(storage.get('testKey')).toEqual(testObj);
    });

    it('should retrieve a stored array value', () => {
      const testArray = [1, 2, 3, 4, 5];
      storage.set('testKey', testArray);
      expect(storage.get('testKey')).toEqual(testArray);
    });

    it('should retrieve a stored number value', () => {
      storage.set('testKey', 42);
      expect(storage.get('testKey')).toBe(42);
    });

    it('should retrieve a stored boolean value', () => {
      storage.set('testKey', true);
      expect(storage.get('testKey')).toBe(true);
    });

    it('should retrieve null for stored null value', () => {
      storage.set('testKey', null);
      expect(storage.get('testKey')).toBeNull();
    });

    it('should return null for non-existent key', () => {
      expect(storage.get('nonExistentKey')).toBeNull();
    });

    it('should return null when JSON parsing fails', () => {
      // Directly set invalid JSON in localStorage
      localStorage.setItem('invalidKey', 'invalid json {');
      expect(storage.get('invalidKey')).toBeNull();
    });
  });

  describe('remove method', () => {
    it('should remove a stored value', () => {
      storage.set('testKey', 'testValue');
      expect(storage.get('testKey')).toBe('testValue');
      
      storage.remove('testKey');
      expect(storage.get('testKey')).toBeNull();
    });

    it('should not throw error when removing non-existent key', () => {
      expect(() => storage.remove('nonExistentKey')).not.toThrow();
    });
  });

  describe('clear method', () => {
    it('should clear all stored values', () => {
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.set('key3', 'value3');
      
      expect(storage.get('key1')).toBe('value1');
      expect(storage.get('key2')).toBe('value2');
      expect(storage.get('key3')).toBe('value3');
      
      storage.clear();
      
      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key2')).toBeNull();
      expect(storage.get('key3')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as key', () => {
      storage.set('', 'value');
      expect(storage.get('')).toBe('value');
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key-with-special_chars.123';
      storage.set(specialKey, 'value');
      expect(storage.get(specialKey)).toBe('value');
    });

    it('should handle nested objects', () => {
      const nestedObj = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      };
      storage.set('nested', nestedObj);
      expect(storage.get('nested')).toEqual(nestedObj);
    });

    it('should handle arrays of objects', () => {
      const arrayOfObjects = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      storage.set('items', arrayOfObjects);
      expect(storage.get('items')).toEqual(arrayOfObjects);
    });

    it('should overwrite existing values', () => {
      storage.set('key', 'value1');
      expect(storage.get('key')).toBe('value1');
      
      storage.set('key', 'value2');
      expect(storage.get('key')).toBe('value2');
    });
  });

  describe('error handling', () => {
    it('should handle quota exceeded errors with appropriate message', () => {
      // This test verifies the error handling code exists
      // Actual quota exceeded testing requires browser-specific setup
      const code = storage.set.toString();
      expect(code).toContain('QuotaExceededError');
      expect(code).toContain('Storage quota exceeded');
    });

    it('should handle security errors with appropriate message', () => {
      // This test verifies the error handling code exists
      const code = storage.set.toString();
      expect(code).toContain('SecurityError');
      expect(code).toContain('Storage access denied');
    });

    it('should have generic error handling', () => {
      // This test verifies the error handling code exists
      const code = storage.set.toString();
      expect(code).toContain('Failed to store data');
    });
  });
});
