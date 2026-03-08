/**
 * Dashboard Page Module
 * 
 * Handles dashboard functionality including loading and displaying statistics.
 * Integrates with the ApiClient to fetch data from /api/dashboard/stats.
 * 
 * Requirements: 4.1
 */

import ApiClient from '../api-client.js';
import toast from '../toast.js';

class DashboardPage {
  constructor() {
    this.apiClient = new ApiClient();
    this.stats = null;
  }

  /**
   * Initialize the dashboard page
   * Sets up the page and loads initial data
   */
  async init() {
    console.log('Initializing dashboard page...');
    
    try {
      // Load dashboard statistics
      await this.loadStats();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      toast.error('Failed to load dashboard. Please refresh the page.');
    }
  }

  /**
   * Load dashboard statistics from the API
   * Fetches data from /api/dashboard/stats endpoint
   * @returns {Promise<void>}
   */
  async loadStats() {
    try {
      console.log('Loading dashboard stats...');
      
      // Fetch stats from API
      const stats = await this.apiClient.get('/dashboard/stats');
      
      // Store stats
      this.stats = stats;
      
      // Render stats to the DOM
      this.renderStats(stats);
      
      console.log('Dashboard stats loaded successfully:', stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Render statistics to the DOM
   * Updates the dashboard metric cards with fetched data
   * @param {Object} stats - Dashboard statistics object
   * @param {number} stats.totalIncidents - Total number of incidents
   * @param {number} stats.totalApplications - Total number of applications
   * @param {number} stats.totalApiKeys - Total number of API keys
   * @param {number} [stats.openIncidents] - Number of open incidents
   * @param {number} [stats.resolvedIncidents] - Number of resolved incidents
   */
  renderStats(stats) {
    console.log('Rendering dashboard stats:', stats);
    
    // Use data-stat attributes for reliable targeting (avoids fragile text matching)
    const totalIncidentsEl = document.querySelector('[data-stat="total-incidents"]');
    const totalApplicationsEl = document.querySelector('[data-stat="total-applications"]');
    const totalApiKeysEl = document.querySelector('[data-stat="total-api-keys"]');
    
    if (totalIncidentsEl) totalIncidentsEl.textContent = this.formatNumber(stats.totalIncidents ?? stats.incidents ?? 0);
    if (totalApplicationsEl) totalApplicationsEl.textContent = this.formatNumber(stats.totalApplications ?? stats.applications ?? 0);
    if (totalApiKeysEl) totalApiKeysEl.textContent = this.formatNumber(stats.totalApiKeys ?? stats.apiKeys ?? 0);
    
    // Also update the user display in the sidebar from auth if available
    try {
      const authData = JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user') || '{}');
      const userNameEls = document.querySelectorAll('[data-user="name"]');
      const userEmailEls = document.querySelectorAll('[data-user="email"]');
      if (authData.name) userNameEls.forEach(el => el.textContent = authData.name);
      if (authData.email) userEmailEls.forEach(el => el.textContent = authData.email);
    } catch (e) { /* ignore */ }
    
    console.log('Dashboard stats rendered successfully');
  }

  /**
   * Format number with leading zero for single digits
   * @private
   * @param {number} num - Number to format
   * @returns {string} Formatted number string
   */
  formatNumber(num) {
    return num < 10 ? `0${num}` : `${num}`;
  }
}

// Export for use in other modules
export default DashboardPage;
