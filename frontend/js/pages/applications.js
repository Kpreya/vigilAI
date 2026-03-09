/**
 * Applications Page Module
 * 
 * Handles applications page functionality including loading, displaying, and creating applications.
 * Integrates with the ApiClient to fetch data from /api/applications.
 * 
 * Requirements: 6.1, 6.3, 6.4
 */

import ApiClient from '../api-client.js';
import toast from '../toast.js';
import Modal from '../modal.js';

class ApplicationsPage {
  constructor() {
    this.apiClient = new ApiClient();
    this.applications = [];
    this.addAppModal = null;
  }

  /**
   * Initialize the applications page
   * Sets up the page and loads initial data
   */
  async init() {
    console.log('Initializing applications page...');
    
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Load applications
      await this.loadApplications();
    } catch (error) {
      console.error('Failed to initialize applications page:', error);
      toast.error('Failed to load applications. Please refresh the page.');
    }
  }

  /**
   * Set up event listeners for page interactions
   */
  setupEventListeners() {
    // Add Application button in header
    const addAppButton = document.querySelector('header button');
    if (addAppButton) {
      addAppButton.addEventListener('click', () => this.showAddApplicationModal());
    }
    
    // Create Your First Application button (in empty state)
    const createFirstAppButton = document.getElementById('create-first-app-btn');
    if (createFirstAppButton) {
      createFirstAppButton.addEventListener('click', () => this.showAddApplicationModal());
    }
  }

  /**
   * Load applications from the API
   * Fetches data from /api/applications endpoint
   * @returns {Promise<void>}
   */
  async loadApplications() {
    try {
      console.log('Loading applications...');
      
      // Fetch applications from API
      // api-client already unwraps the {data: [...]} envelope, so response IS the array
      const applications = await this.apiClient.get('/applications');
      
      // Store applications
      this.applications = Array.isArray(applications) ? applications : [];
      
      // Render applications to the DOM
      this.renderApplications(this.applications);
      
      console.log('Applications loaded successfully:', this.applications.length, 'apps');
    } catch (error) {
      console.error('Failed to load applications:', error);
      throw error;
    }
  }

  /**
   * Render applications to the DOM
   * Updates the applications display with fetched data
   * @param {Array} applications - Array of application objects
   */
  renderApplications(applications) {
    console.log('Rendering applications:', applications);
    
    // Find the main content container
    const mainContent = document.querySelector('main .p-8');
    
    if (!mainContent) {
      console.error('Main content container not found');
      return;
    }
    
    // If no applications, show empty state (already in HTML)
    if (!applications || applications.length === 0) {
      console.log('No applications to display, showing empty state');
      return;
    }
    
    // Clear the empty state and render applications grid
    mainContent.innerHTML = this.createApplicationsGrid(applications);
    
    // Add event listeners for the card buttons
    mainContent.querySelectorAll('button[data-action="details"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const appId = e.currentTarget.getAttribute('data-id');
        this.showApplicationDetails(appId);
      });
    });

    mainContent.querySelectorAll('button[data-action="settings"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const appId = e.currentTarget.getAttribute('data-id');
        this.showApplicationSettings(appId);
      });
    });
    
    console.log('Applications rendered successfully');
  }

  /**
   * Create the applications grid HTML
   * @private
   * @param {Array} applications - Array of application objects
   * @returns {string} HTML for applications grid
   */
  createApplicationsGrid(applications) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${applications.map(app => this.createApplicationCard(app)).join('')}
      </div>
    `;
  }

  /**
   * Create an application card HTML
   * @private
   * @param {Object} app - Application object
   * @returns {string} HTML for application card
   */
  createApplicationCard(app) {
    const createdDate = this.formatDate(app.createdAt);
    const githubInfo = app.githubRepo && app.githubOwner 
      ? `${app.githubOwner}/${app.githubRepo}` 
      : 'No GitHub integration';
    
    return `
      <div class="bg-white border border-black shadow-brutal p-6 hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-black border border-black flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-2xl">grid_view</span>
            </div>
            <div>
              <h3 class="font-bold text-lg text-black">${this.escapeHtml(app.name)}</h3>
              <p class="text-xs text-slate-500 font-mono">${createdDate}</p>
            </div>
          </div>
        </div>
        
        <p class="text-sm text-slate-600 mb-4 min-h-[40px]">
          ${app.description ? this.escapeHtml(app.description) : 'No description provided'}
        </p>
        
        <div class="space-y-2 mb-4 text-xs font-mono">
          <div class="flex items-center gap-2 text-slate-600">
            <span class="material-symbols-outlined text-sm">code</span>
            <span>${this.escapeHtml(githubInfo)}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">notifications</span>
            <span class="${app.enableNotifications ? 'text-green-600' : 'text-slate-400'}">
              Notifications ${app.enableNotifications ? 'enabled' : 'disabled'}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">auto_fix_high</span>
            <span class="${app.enableAutoFix ? 'text-green-600' : 'text-slate-400'}">
              Auto-fix ${app.enableAutoFix ? 'enabled' : 'disabled'}
            </span>
          </div>
        </div>
        
        <div class="flex gap-2 pt-4 border-t border-slate-200">
          <button data-id="${app.id}" data-action="details" class="flex-1 px-3 py-2 text-xs font-bold border border-black bg-white hover:bg-black hover:text-white transition-all">
            View Details
          </button>
          <button data-id="${app.id}" data-action="settings" class="px-3 py-2 text-xs font-bold border border-black bg-white hover:bg-black hover:text-white transition-all">
            <span class="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Format date to readable string
   * @private
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show the Add Application modal
   */
  showAddApplicationModal() {
    // Create modal if it doesn't exist
    if (!this.addAppModal) {
      this.addAppModal = new Modal('add-application-modal');
    }
    
    // Set modal title
    this.addAppModal.setTitle('Add Application');
    
    // Set modal content with form
    this.addAppModal.setContent(this.createAddApplicationForm());
    
    // Set up form submission handler
    this.addAppModal.onSubmit((formData) => this.handleAddApplication(formData));
    
    // Open the modal
    this.addAppModal.open();
  }

  /**
   * Create the Add Application form HTML
   * @private
   * @returns {string} HTML for the form
   */
  createAddApplicationForm() {
    return `
      <form id="add-application-form" class="space-y-4">
        <!-- Application Name -->
        <div>
          <label for="app-name" class="block text-sm font-bold font-mono text-black mb-2">
            Application Name <span class="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="app-name"
            name="name"
            required
            class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all"
            placeholder="e.g., api-gateway"
          />
          <p class="text-xs text-slate-500 font-mono mt-1">A unique identifier for your application</p>
          <p class="text-xs text-red-600 font-mono mt-1 hidden" data-error="name"></p>
        </div>

        <!-- Description -->
        <div>
          <label for="app-description" class="block text-sm font-bold font-mono text-black mb-2">
            Description
          </label>
          <textarea
            id="app-description"
            name="description"
            rows="3"
            class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all resize-none"
            placeholder="Brief description of your application"
          ></textarea>
          <p class="text-xs text-slate-500 font-mono mt-1">Optional description</p>
        </div>

        <!-- GitHub Integration -->
        <div class="border-t border-slate-200 pt-4">
          <h4 class="text-sm font-bold font-mono text-black mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">code</span>
            GitHub Integration
          </h4>
          
          <div class="space-y-3">
            <div>
              <label for="github-owner" class="block text-xs font-bold font-mono text-slate-700 mb-1">
                GitHub Owner <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="github-owner"
                name="githubOwner"
                class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all"
                placeholder="e.g., vigilai"
              />
            </div>
            
            <div>
              <label for="github-repo" class="block text-xs font-bold font-mono text-slate-700 mb-1">
                GitHub Repository <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="github-repo"
                name="githubRepo"
                class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all"
                placeholder="e.g., api-gateway"
              />
            </div>
          </div>
        </div>

        <!-- Configuration -->
        <div class="border-t border-slate-200 pt-4">
          <h4 class="text-sm font-bold font-mono text-black mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">tune</span>
            Configuration
          </h4>
          
          <div class="space-y-3">
            <!-- Anomaly Threshold -->
            <div>
              <label for="anomaly-threshold" class="block text-xs font-bold font-mono text-slate-700 mb-1">
                Anomaly Threshold
              </label>
              <input
                type="number"
                id="anomaly-threshold"
                name="anomalyThreshold"
                min="0"
                max="10"
                step="0.1"
                value="2.0"
                class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all"
              />
              <p class="text-xs text-slate-500 font-mono mt-1">Sensitivity for anomaly detection (0-10)</p>
            </div>

            <!-- Enable Auto-Fix -->
            <div class="flex items-center gap-3 p-3 border border-slate-200 bg-slate-50">
              <input
                type="checkbox"
                id="enable-autofix"
                name="enableAutoFix"
                checked
                class="w-4 h-4 border-2 border-black focus:ring-0 focus:ring-offset-0 text-black"
              />
              <label for="enable-autofix" class="flex-1 text-xs font-mono text-slate-700 cursor-pointer">
                <span class="font-bold text-black">Enable Auto-Fix</span>
                <span class="block text-slate-500 mt-0.5">Automatically generate pull requests for detected issues</span>
              </label>
            </div>

            <!-- Enable Notifications -->
            <div class="flex items-center gap-3 p-3 border border-slate-200 bg-slate-50">
              <input
                type="checkbox"
                id="enable-notifications"
                name="enableNotifications"
                checked
                class="w-4 h-4 border-2 border-black focus:ring-0 focus:ring-offset-0 text-black"
              />
              <label for="enable-notifications" class="flex-1 text-xs font-mono text-slate-700 cursor-pointer">
                <span class="font-bold text-black">Enable Notifications</span>
                <span class="block text-slate-500 mt-0.5">Receive alerts when incidents are detected</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    `;
  }

  /**
   * Handle Add Application form submission
   * @private
   * @param {FormData} formData - The form data
   */
  async handleAddApplication(formData) {
    try {
      // Clear previous errors
      this.clearFormErrors();
      
      // Extract and validate form data
      const applicationData = this.extractFormData(formData);
      
      // Validate the data
      const validationErrors = this.validateApplicationData(applicationData);
      if (validationErrors.length > 0) {
        this.displayFormErrors(validationErrors);
        return;
      }
      
      // Show loading state
      const submitButton = document.querySelector('[data-modal-submit]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Creating...';
      submitButton.disabled = true;
      
      // Call API to create application
      // api-client already unwraps the {data: ...} envelope, so response IS the application object
      console.log('Creating application:', applicationData);
      const newApp = await this.apiClient.post('/applications', applicationData);
      
      // Close the modal
      this.addAppModal.close();
      
      // Show success message
      toast.success(`Application "${newApp.name || 'New Application'}" created successfully!`);
      
      // Refresh applications list
      await this.loadApplications();
      
      // Restore button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      
    } catch (error) {
      console.error('Failed to create application:', error);
      
      // Display error message
      const errorMessage = error.message || 'Failed to create application. Please try again.';
      toast.error(errorMessage);
      
      // Restore button state
      const submitButton = document.querySelector('[data-modal-submit]');
      if (submitButton) {
        submitButton.textContent = 'Submit';
        submitButton.disabled = false;
      }
    }
  }

  /**
   * Extract form data into application object
   * @private
   * @param {FormData} formData - The form data
   * @returns {Object} Application data object
   */
  extractFormData(formData) {
    return {
      name: formData.get('name')?.trim() || '',
      description: formData.get('description')?.trim() || null,
      githubOwner: formData.get('githubOwner')?.trim() || null,
      githubRepo: formData.get('githubRepo')?.trim() || null,
      anomalyThreshold: parseFloat(formData.get('anomalyThreshold')) || 2.0,
      enableAutoFix: formData.get('enableAutoFix') === 'on',
      enableNotifications: formData.get('enableNotifications') === 'on'
    };
  }

  /**
   * Validate application data
   * @private
   * @param {Object} data - Application data to validate
   * @returns {Array} Array of validation error objects
   */
  validateApplicationData(data) {
    const errors = [];
    
    // Validate name (required)
    if (!data.name) {
      errors.push({ field: 'name', message: 'Application name is required' });
    } else if (data.name.length < 2) {
      errors.push({ field: 'name', message: 'Application name must be at least 2 characters' });
    } else if (data.name.length > 100) {
      errors.push({ field: 'name', message: 'Application name must be less than 100 characters' });
    } else if (!/^[a-zA-Z0-9-_]+$/.test(data.name)) {
      errors.push({ field: 'name', message: 'Application name can only contain letters, numbers, hyphens, and underscores' });
    }
    
    // Validate GitHub integration (required)
    if (!data.githubOwner) {
      errors.push({ field: 'githubOwner', message: 'GitHub owner is required' });
    }
    if (!data.githubRepo) {
      errors.push({ field: 'githubRepo', message: 'GitHub repository is required' });
    }
    
    // Validate anomaly threshold
    if (isNaN(data.anomalyThreshold) || data.anomalyThreshold < 0 || data.anomalyThreshold > 10) {
      errors.push({ field: 'anomalyThreshold', message: 'Anomaly threshold must be between 0 and 10' });
    }
    
    return errors;
  }

  /**
   * Display form validation errors
   * @private
   * @param {Array} errors - Array of error objects
   */
  displayFormErrors(errors) {
    errors.forEach(error => {
      const errorElement = document.querySelector(`[data-error="${error.field}"]`);
      if (errorElement) {
        errorElement.textContent = error.message;
        errorElement.classList.remove('hidden');
      }
      
      // Highlight the input field
      const inputElement = document.querySelector(`[name="${error.field}"]`);
      if (inputElement) {
        inputElement.classList.add('border-red-600');
      }
    });
    
    // Show error toast
    toast.error('Please fix the validation errors');
  }

  /**
   * Clear form validation errors
   * @private
   */
  clearFormErrors() {
    // Hide all error messages
    const errorElements = document.querySelectorAll('[data-error]');
    errorElements.forEach(el => {
      el.classList.add('hidden');
      el.textContent = '';
    });
    
    // Remove error highlighting from inputs
    const inputs = document.querySelectorAll('input.border-red-600, textarea.border-red-600');
    inputs.forEach(input => {
      input.classList.remove('border-red-600');
    });
  }

  /**
   * Show read-only details modal for an application
   */
  showApplicationDetails(appId) {
    const app = this.applications.find(a => a.id === appId);
    if (!app) return;

    if (!this.detailsModal) {
      this.detailsModal = new Modal('application-details-modal');
    }
    
    this.detailsModal.setTitle(`Details: ${this.escapeHtml(app.name)}`);
    
    const content = `
      <div class="space-y-4 font-mono text-sm">
        <div><strong class="text-black">ID:</strong> <span class="text-slate-600">${app.id}</span></div>
        <div><strong class="text-black">Name:</strong> <span class="text-slate-600">${this.escapeHtml(app.name)}</span></div>
        <div><strong class="text-black">Description:</strong> <span class="text-slate-600">${app.description ? this.escapeHtml(app.description) : 'N/A'}</span></div>
        <div><strong class="text-black">Created:</strong> <span class="text-slate-600">${this.formatDate(app.createdAt)}</span></div>
        <div class="border-t border-slate-200 pt-4 mt-4">
          <h4 class="font-bold mb-2 text-black text-xs uppercase tracking-wider">GitHub Integration</h4>
          <div><strong class="text-black">Owner:</strong> <span class="text-slate-600">${app.githubOwner || 'N/A'}</span></div>
          <div><strong class="text-black">Repo:</strong> <span class="text-slate-600">${app.githubRepo || 'N/A'}</span></div>
        </div>
        <div class="border-t border-slate-200 pt-4 mt-4">
          <h4 class="font-bold mb-2 text-black text-xs uppercase tracking-wider">Configuration</h4>
          <div><strong class="text-black">Anomaly Threshold:</strong> <span class="text-slate-600">${app.anomalyThreshold}</span></div>
          <div><strong class="text-black">Auto-Fix:</strong> <span class="${app.enableAutoFix ? 'text-green-600' : 'text-slate-600'}">${app.enableAutoFix ? 'Enabled' : 'Disabled'}</span></div>
          <div><strong class="text-black">Notifications:</strong> <span class="${app.enableNotifications ? 'text-green-600' : 'text-slate-600'}">${app.enableNotifications ? 'Enabled' : 'Disabled'}</span></div>
        </div>
      </div>
    `;
    
    this.detailsModal.setContent(content);
    // Details read-only does not need a submit action, so we can override it to essentially close
    this.detailsModal.onSubmit(() => this.detailsModal.close());
    
    // Change submit button text
    this.detailsModal.open();
    // After opening, change the text of the main button to 'Close' since it's just info
    setTimeout(() => {
        const submitBtn = document.getElementById('application-details-modal').querySelector('[data-modal-submit]');
        if(submitBtn) submitBtn.textContent = 'Close';
    }, 50);
  }

  /**
   * Show settings modal for an application
   */
  showApplicationSettings(appId) {
    const app = this.applications.find(a => a.id === appId);
    if (!app) return;

    if (!this.settingsModal) {
      this.settingsModal = new Modal('application-settings-modal');
    }
    
    this.settingsModal.setTitle(`Settings: ${this.escapeHtml(app.name)}`);
    
    const content = `
      <form id="edit-application-form" class="space-y-4">
        <input type="hidden" name="id" value="${app.id}">
        
        <div>
          <label class="block text-sm font-bold font-mono text-black mb-2">Application Name</label>
          <input type="text" name="name" required value="${this.escapeHtml(app.name)}" class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all" />
        </div>

        <div>
           <label class="block text-sm font-bold font-mono text-black mb-2">Description</label>
           <textarea name="description" rows="2" class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all resize-none">${app.description ? this.escapeHtml(app.description) : ''}</textarea>
        </div>
        
        <div class="border-t border-slate-200 pt-4">
          <h4 class="text-sm font-bold font-mono text-black mb-3">Configuration</h4>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold font-mono text-slate-700 mb-1">Anomaly Threshold</label>
              <input type="number" name="anomalyThreshold" min="0" max="10" step="0.1" value="${app.anomalyThreshold}" class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm" />
            </div>
            <div class="flex items-center gap-3 p-3 border border-slate-200 bg-slate-50">
              <input type="checkbox" id="edit-autofix" name="enableAutoFix" ${app.enableAutoFix ? 'checked' : ''} class="w-4 h-4 border-2 border-black focus:ring-0 focus:ring-offset-0 text-black" />
              <label for="edit-autofix" class="flex-1 text-xs font-mono text-slate-700 cursor-pointer font-bold text-black">Enable Auto-Fix</label>
            </div>
            <div class="flex items-center gap-3 p-3 border border-slate-200 bg-slate-50">
              <input type="checkbox" id="edit-notifications" name="enableNotifications" ${app.enableNotifications ? 'checked' : ''} class="w-4 h-4 border-2 border-black focus:ring-0 focus:ring-offset-0 text-black" />
              <label for="edit-notifications" class="flex-1 text-xs font-mono text-slate-700 cursor-pointer font-bold text-black">Enable Notifications</label>
            </div>
          </div>
        </div>
        
        <div class="pt-4 border-t border-slate-200 mt-4 text-right">
             <button type="button" data-action="delete-app" data-id="${app.id}" class="text-xs text-red-600 font-bold hover:underline">Delete Application</button>
        </div>
      </form>
    `;
    
    this.settingsModal.setContent(content);
    this.settingsModal.onSubmit((formData) => this.handleUpdateApplication(formData, app.id));
    this.settingsModal.open();

    // After opening, change the text of the main button to 'Save Settings'
    setTimeout(() => {
        const submitBtn = document.getElementById('application-settings-modal').querySelector('[data-modal-submit]');
        if(submitBtn) submitBtn.textContent = 'Save Settings';
        
        // Attach delete action
        const deleteBtn = document.getElementById('application-settings-modal').querySelector('button[data-action="delete-app"]');
        if(deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDeleteApplication(app.id);
            });
        }
    }, 50);
  }

  /**
   * Handle Update Application
   */
  async handleUpdateApplication(formData, appId) {
    try {
      const updateData = {
        name: formData.get('name').trim(),
        description: formData.get('description').trim() || null,
        anomalyThreshold: parseFloat(formData.get('anomalyThreshold')) || 2.0,
        enableAutoFix: formData.get('enableAutoFix') === 'on',
        enableNotifications: formData.get('enableNotifications') === 'on'
      };

      const submitButton = document.getElementById('application-settings-modal').querySelector('[data-modal-submit]');
      submitButton.textContent = 'Saving...';
      submitButton.disabled = true;

      await this.apiClient.put(`/applications/${appId}`, updateData);
      
      this.settingsModal.close();
      toast.success('Application updated successfully!');
      await this.loadApplications();
    } catch (error) {
      console.error('Failed to update application:', error);
      toast.error(error.message || 'Failed to update application.');
      const submitButton = document.getElementById('application-settings-modal').querySelector('[data-modal-submit]');
      if (submitButton) {
        submitButton.textContent = 'Save Settings';
        submitButton.disabled = false;
      }
    }
  }

  /**
   * Handle Delete Application
   */
  async handleDeleteApplication(appId) {
    if(!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
        return;
    }

    try {
      const deleteBtn = document.getElementById('application-settings-modal').querySelector('button[data-action="delete-app"]');
      if(deleteBtn) {
          deleteBtn.textContent = 'Deleting...';
          deleteBtn.disabled = true;
      }

      await this.apiClient.delete(`/applications/${appId}`);
      
      this.settingsModal.close();
      toast.success('Application deleted successfully!');
      await this.loadApplications();
    } catch (error) {
      console.error('Failed to delete application:', error);
      toast.error(error.message || 'Failed to delete application.');
      const deleteBtn = document.getElementById('application-settings-modal').querySelector('button[data-action="delete-app"]');
      if (deleteBtn) {
        deleteBtn.textContent = 'Delete Application';
        deleteBtn.disabled = false;
      }
    }
  }
}

// Export for use in other modules
export default ApplicationsPage;
