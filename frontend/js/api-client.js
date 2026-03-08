/**
 * API Client Module
 * 
 * Centralized HTTP client for all backend communication.
 * Handles authentication, request/response processing, error handling, and retry logic.
 * 
 * Requirements: 3.1, 3.4
 */

import Auth from './auth.js';
import config from './config.js';

class ApiClient {
  /**
   * Create an API client instance
   * @param {string} baseURL - Base URL for API requests (default: from config)
   */
  constructor(baseURL = config.API_BASE_URL) {
    this.baseURL = baseURL;
    this.auth = new Auth();
    this.defaultTimeout = config.API_TIMEOUT;
    this.maxRetries = 3;
  }

  /**
   * Perform a GET request
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, { ...options, body: null });
  }

  /**
   * Perform a POST request
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, { ...options, body: data });
  }

  /**
   * Perform a PATCH request
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, { ...options, body: data });
  }

  /**
   * Perform a DELETE request
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, { ...options, body: null });
  }

  /**
   * Perform an HTTP request
   * @private
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options.headers);
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries !== undefined ? options.retries : this.maxRetries;

    const fetchOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout)
    };

    // Add body for POST, PATCH, PUT requests
    if (options.body !== null && options.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      return await this.handleResponse(response);
    } catch (error) {
      return await this.handleError(error, method, endpoint, options, retries);
    }
  }

  /**
   * Get request headers with authentication
   * @private
   * @param {Object} customHeaders - Custom headers to merge
   * @returns {Object} Complete headers object
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    // Add authentication token if available
    const token = this.auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle successful response
   * @private
   * @param {Response} response - Fetch API response
   * @returns {Promise<Object>} Parsed response data
   */
  async handleResponse(response) {
    // Handle 401 Unauthorized - clear session and redirect to login
    if (response.status === 401) {
      this.auth.logout();
      window.location.href = '/login.html';
      throw {
        status: 401,
        message: 'Unauthorized. Please log in again.',
        code: 'UNAUTHORIZED'
      };
    }

    // Parse response body
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || data.message || `Request failed with status ${response.status}`,
        code: data.code || 'REQUEST_FAILED',
        details: data.details || null
      };
    }

    // Return the data property if it exists, otherwise return the whole response
    return data.data !== undefined ? data.data : data;
  }

  /**
   * Handle request errors
   * @private
   * @param {Error} error - Error object
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {number} retriesLeft - Number of retries remaining
   * @returns {Promise<Object>} Response data or throws error
   */
  async handleError(error, method, endpoint, options, retriesLeft) {
    // If error already has status (from handleResponse), throw it
    if (error.status) {
      throw error;
    }

    // Network errors - retry with exponential backoff
    if (retriesLeft > 0 && this.isRetryableError(error)) {
      const retryDelay = this.calculateBackoff(this.maxRetries - retriesLeft);
      console.warn(`Request failed, retrying in ${retryDelay}ms... (${retriesLeft} retries left)`);
      
      await this.sleep(retryDelay);
      return this.request(method, endpoint, { ...options, retries: retriesLeft - 1 });
    }

    // No retries left or non-retryable error
    throw {
      status: 0,
      message: error.message || 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      details: error
    };
  }

  /**
   * Check if error is retryable
   * @private
   * @param {Error} error - Error object
   * @returns {boolean} True if error should be retried
   */
  isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return true;
    }
    if (error.message && error.message.includes('fetch')) {
      return true;
    }
    return false;
  }

  /**
   * Calculate exponential backoff delay
   * @private
   * @param {number} attempt - Current attempt number (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  calculateBackoff(attempt) {
    // Exponential backoff: 1s, 2s, 4s
    const baseDelay = 1000;
    return baseDelay * Math.pow(2, attempt);
  }

  /**
   * Sleep for specified duration
   * @private
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other modules
export default ApiClient;

