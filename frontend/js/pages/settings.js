/**
 * Settings Page Module
 * 
 * Handles settings page functionality including profile management and notification preferences.
 * Integrates with the ApiClient to fetch and update data from /api/settings endpoints.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.6
 */

import ApiClient from '../api-client.js';
import toast from '../toast.js';

class SettingsPage {
  constructor() {
    this.apiClient = new ApiClient();
    this.profile = null;
    this.notifications = null;
  }

  /**
   * Initialize the settings page
   * Sets up the page and loads initial data
   */
  async init() {
    console.log('Initializing settings page...');
    
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Load profile and notification preferences
      await Promise.all([
        this.loadProfile(),
        this.loadNotifications()
      ]);
    } catch (error) {
      console.error('Failed to initialize settings page:', error);
      toast.error('Failed to load settings. Please refresh the page.');
    }
  }

  /**
   * Set up event listeners for page interactions
   */
  setupEventListeners() {
    // Profile form submit button - find by text content in first section
    const profileSection = document.querySelector('.bg-white.border-2.border-black.shadow-brutal');
    if (profileSection) {
      const profileSaveButton = profileSection.querySelector('button');
      if (profileSaveButton && profileSaveButton.textContent.includes('SAVE CHANGES')) {
        profileSaveButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleProfileUpdate();
        });
      }
    }
    
    // Notification preferences update button - find in second section
    const sections = document.querySelectorAll('.bg-white.border-2.border-black.shadow-brutal');
    if (sections.length >= 2) {
      const notificationSection = sections[1];
      const notificationUpdateButton = notificationSection.querySelector('button');
      if (notificationUpdateButton && notificationUpdateButton.textContent.includes('UPDATE PREFERENCES')) {
        notificationUpdateButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleNotificationUpdate();
        });
      }
    }
    
    // Notification checkboxes - immediate save on toggle
    const notificationCheckboxes = document.querySelectorAll('.brutal-checkbox');
    notificationCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.handleNotificationToggle();
      });
    });
  }

  /**
   * Load user profile from the API
   * Fetches data from /api/settings/profile endpoint
   * @returns {Promise<void>}
   */
  async loadProfile() {
    try {
      console.log('Loading user profile...');
      
      // api-client already unwraps {data: {...}} envelope — profile is the object directly
      const profile = await this.apiClient.get('/settings/profile');
      
      // Store profile (handle both {data: {...}} and direct object shapes)
      this.profile = profile?.data || profile;
      
      // Render profile to the DOM
      this.renderProfile(this.profile);
      
      console.log('User profile loaded:', this.profile?.email);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }

  /**
   * Load notification preferences from the API
   * Fetches data from /api/settings/notifications endpoint
   * @returns {Promise<void>}
   */
  async loadNotifications() {
    try {
      console.log('Loading notification preferences...');
      
      // api-client already unwraps {data: {...}} envelope
      const notifications = await this.apiClient.get('/settings/notifications');
      
      // Handle both wrapped and unwrapped formats
      this.notifications = notifications?.data || notifications;
      
      // Render notifications to the DOM
      this.renderNotifications(this.notifications);
      
      console.log('Notification preferences loaded:', this.notifications);
    } catch (error) {
      console.warn('Failed to load notification preferences (non-fatal):', error.message);
      // Non-fatal — page still works without notification preferences
    }
  }

  /**
   * Render profile data to the DOM
   * Updates the profile form with fetched data
   * @param {Object} profile - User profile object
   * @param {string} profile.name - User's name
   * @param {string} profile.email - User's email
   */
  renderProfile(profile) {
    console.log('Rendering user profile:', profile);
    
    // Find the username input
    const usernameInput = document.querySelector('input[type="text"][placeholder="Enter username"]');
    if (usernameInput && profile.name) {
      usernameInput.value = profile.name;
    }
    
    // Find the email input
    const emailInput = document.querySelector('input[type="email"][readonly]');
    if (emailInput && profile.email) {
      emailInput.value = profile.email;
    }
    
    console.log('User profile rendered successfully');
  }

  /**
   * Render notification preferences to the DOM
   * Updates the notification checkboxes with fetched data
   * @param {Object} notifications - Notification preferences object
   */
  renderNotifications(notifications) {
    console.log('Rendering notification preferences:', notifications);
    
    // Get all checkboxes
    const checkboxes = document.querySelectorAll('.brutal-checkbox');
    
    // Map checkbox indices to notification properties
    // Based on the HTML structure:
    // 0: Email notifications for critical incidents (emailCritical)
    // 1: Daily summary report (emailEnabled)
    // 2: Browser desktop notifications (not in API, skip)
    // 3: Alerts for unassigned open PRs (not in API, skip)
    
    if (checkboxes[0] && notifications.emailCritical !== undefined) {
      checkboxes[0].checked = notifications.emailCritical;
    }
    
    if (checkboxes[1] && notifications.emailEnabled !== undefined) {
      checkboxes[1].checked = notifications.emailEnabled;
    }
    
    // Note: checkboxes[2] and checkboxes[3] are UI-only features not backed by API
    
    console.log('Notification preferences rendered successfully');
  }

  /**
   * Handle profile update form submission
   * Validates and sends profile data to the API
   */
  async handleProfileUpdate() {
    try {
      // Get the username input
      const usernameInput = document.querySelector('input[type="text"][placeholder="Enter username"]');
      
      if (!usernameInput) {
        toast.error('Profile form not found');
        return;
      }
      
      const name = usernameInput.value.trim();
      
      // Validate name
      if (!name) {
        toast.error('Name cannot be empty');
        return;
      }
      
      if (name.length < 2) {
        toast.error('Name must be at least 2 characters');
        return;
      }
      
      if (name.length > 100) {
        toast.error('Name must be less than 100 characters');
        return;
      }
      
      // Show loading state
      const profileSection = document.querySelector('.bg-white.border-2.border-black.shadow-brutal');
      const saveButton = profileSection?.querySelector('button');
      if (!saveButton) {
        toast.error('Save button not found');
        return;
      }
      
      const originalText = saveButton.textContent;
      saveButton.textContent = 'SAVING...';
      saveButton.disabled = true;
      
      // Call API to update profile
      console.log('Updating profile:', { name });
      const updatedProfile = await this.apiClient.patch('/settings/profile', { name });
      
      // Update stored profile
      this.profile = updatedProfile;
      
      // Show success message
      toast.success('Profile updated successfully!');
      
      // Restore button state
      saveButton.textContent = originalText;
      saveButton.disabled = false;
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      
      // Display error message
      const errorMessage = error.message || 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
      
      // Restore button state
      const profileSection = document.querySelector('.bg-white.border-2.border-black.shadow-brutal');
      const saveButton = profileSection?.querySelector('button');
      if (saveButton) {
        saveButton.textContent = 'SAVE CHANGES';
        saveButton.disabled = false;
      }
    }
  }

  /**
   * Handle notification preferences update
   * Sends notification preferences to the API
   */
  async handleNotificationUpdate() {
    try {
      // Get all checkboxes
      const checkboxes = document.querySelectorAll('.brutal-checkbox');
      
      // Build notification preferences object
      const preferences = {
        emailCritical: checkboxes[0]?.checked || false,
        emailEnabled: checkboxes[1]?.checked || false,
        // Note: Other checkboxes are UI-only and not sent to API
      };
      
      // Show loading state
      const sections = document.querySelectorAll('.bg-white.border-2.border-black.shadow-brutal');
      const notificationSection = sections.length >= 2 ? sections[1] : null;
      const updateButton = notificationSection?.querySelector('button');
      if (!updateButton) {
        toast.error('Update button not found');
        return;
      }
      
      const originalText = updateButton.textContent;
      updateButton.textContent = 'UPDATING...';
      updateButton.disabled = true;
      
      // Call API to update notification preferences
      console.log('Updating notification preferences:', preferences);
      const updatedNotifications = await this.apiClient.patch('/settings/notifications', preferences);
      
      // Update stored notifications
      this.notifications = updatedNotifications;
      
      // Show success message
      toast.success('Notification preferences updated successfully!');
      
      // Restore button state
      updateButton.textContent = originalText;
      updateButton.disabled = false;
      
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      
      // Display error message
      const errorMessage = error.message || 'Failed to update notification preferences. Please try again.';
      toast.error(errorMessage);
      
      // Revert checkboxes to previous state
      if (this.notifications) {
        this.renderNotifications(this.notifications);
      }
      
      // Restore button state
      const sections = document.querySelectorAll('.bg-white.border-2.border-black.shadow-brutal');
      const notificationSection = sections.length >= 2 ? sections[1] : null;
      const updateButton = notificationSection?.querySelector('button');
      if (updateButton) {
        updateButton.textContent = 'UPDATE PREFERENCES';
        updateButton.disabled = false;
      }
    }
  }

  /**
   * Handle immediate notification toggle
   * Saves notification preferences immediately when a checkbox is toggled
   */
  async handleNotificationToggle() {
    try {
      // Get all checkboxes
      const checkboxes = document.querySelectorAll('.brutal-checkbox');
      
      // Build notification preferences object
      const preferences = {
        emailCritical: checkboxes[0]?.checked || false,
        emailEnabled: checkboxes[1]?.checked || false,
      };
      
      // Store previous state for rollback
      const previousState = { ...this.notifications };
      
      // Call API to update notification preferences
      console.log('Auto-saving notification preferences:', preferences);
      const updatedNotifications = await this.apiClient.patch('/settings/notifications', preferences);
      
      // Update stored notifications
      this.notifications = updatedNotifications;
      
      // Show subtle success message
      toast.success('Notification preference saved');
      
    } catch (error) {
      console.error('Failed to auto-save notification preferences:', error);
      
      // Display error message
      const errorMessage = error.message || 'Failed to save notification preference. Please try again.';
      toast.error(errorMessage);
      
      // Revert checkboxes to previous state (rollback)
      if (this.notifications) {
        this.renderNotifications(this.notifications);
      }
    }
  }
}

// Export for use in other modules
export default SettingsPage;
