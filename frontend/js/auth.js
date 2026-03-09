/**
 * Authentication Module
 * 
 * Manages user authentication state and token lifecycle.
 * Handles JWT token storage, validation, and user session management.
 * 
 * Requirements: 1.2, 1.6, 12.1, 12.4
 */

import Storage from './storage.js';

class Auth {
  constructor() {
    this.storage = new Storage();
    this.TOKEN_KEY = 'auth_token';
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has a valid token
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    return !this.isTokenExpired(token);
  }

  /**
   * Get current user from token
   * @returns {Object|null} User object with id, email, name, or null if not authenticated
   */
  getCurrentUser() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      
      // Check if token is expired
      if (this.isTokenExpired(token)) {
        return null;
      }

      return {
        id: payload.id,
        email: payload.email,
        name: payload.name || null,
        image: payload.image || null
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Store authentication token
   * @param {string} token - JWT token to store
   */
  setToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token: must be a non-empty string');
    }
    
    try {
      this.storage.set(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store token:', error);
      throw error;
    }
  }

  /**
   * Get stored token
   * @returns {string|null} JWT token or null if not found
   */
  getToken() {
    try {
      return this.storage.get(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Clear authentication and logout user
   */
  logout() {
    try {
      this.storage.remove(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  /**
   * Decode JWT token
   * @private
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid
   */
  decodeToken(token) {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode the payload (second part)
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to decode token: ' + error.message);
    }
  }

  /**
   * Check if token is expired
   * @private
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    try {
      const payload = this.decodeToken(token);
      
      // Check if exp field exists (must check for undefined/null, not falsy, since 0 is valid)
      if (payload.exp === undefined || payload.exp === null) {
        // If no expiration, consider it valid
        return false;
      }

      // exp is in seconds, Date.now() is in milliseconds
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      return currentTime >= expirationTime;
    } catch (error) {
      // If we can't decode the token, consider it expired
      return true;
    }
  }
}

// Export for use in other modules
export default Auth;
