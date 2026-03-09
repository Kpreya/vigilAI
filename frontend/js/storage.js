/**
 * Storage Module
 * 
 * Wrapper around localStorage with error handling for quota exceeded errors.
 * Provides a safe interface for storing and retrieving data.
 * 
 * Requirements: 12.1, 12.2
 */

class Storage {
  /**
   * Store an item in localStorage
   * @param {string} key - The key to store the value under
   * @param {any} value - The value to store (will be JSON stringified)
   * @throws {Error} If quota is exceeded or storage is unavailable
   */
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Unable to save data.');
        throw new Error('Storage quota exceeded. Please clear some data and try again.');
      } else if (error.name === 'SecurityError') {
        console.error('Storage access denied. Cookies may be disabled.');
        throw new Error('Storage access denied. Please enable cookies and try again.');
      } else {
        console.error('Failed to store data:', error);
        throw new Error('Failed to store data. Please try again.');
      }
    }
  }

  /**
   * Retrieve an item from localStorage
   * @param {string} key - The key to retrieve
   * @returns {any|null} The parsed value, or null if not found or error occurs
   */
  get(key) {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      try {
        return JSON.parse(serializedValue);
      } catch (e) {
        // Fallback: If it's not valid JSON (e.g., a raw JWT string), return it directly
        return serializedValue;
      }
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   * @param {string} key - The key to remove
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

// Export for use in other modules
export default Storage;
