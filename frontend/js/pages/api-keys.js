/**
 * API Keys Page Module
 * 
 * Handles API keys page functionality including loading, displaying, generating, and revoking API keys.
 * Integrates with the ApiClient to fetch data from /api/api-keys.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import ApiClient from '../api-client.js';
import toast from '../toast.js';
import Modal from '../modal.js';

class ApiKeysPage {
  constructor() {
    this.apiClient = new ApiClient();
    this.apiKeys = [];
    this.generateKeyModal = null;
    this.keyDisplayModal = null;
    this.applications = [];
  }

  /**
   * Initialize the API keys page
   * Sets up the page and loads initial data
   */
  async init() {
    console.log('Initializing API keys page...');
    
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Load applications first (needed for the form)
      await this.loadApplications();
      
      // Load API keys
      await this.loadApiKeys();
    } catch (error) {
      console.error('Failed to initialize API keys page:', error);
      toast.error('Failed to load API keys. Please refresh the page.');
    }
  }

  /**
   * Set up event listeners for page interactions
   */
  setupEventListeners() {
    // Generate API Key button in header
    const generateKeyButton = document.querySelector('header button');
    if (generateKeyButton) {
      generateKeyButton.addEventListener('click', () => this.showGenerateKeyModal());
    }
    
    // Generate Your First API Key button (in empty state)
    const generateFirstKeyButton = document.getElementById('generate-first-key-btn');
    if (generateFirstKeyButton) {
      generateFirstKeyButton.addEventListener('click', () => this.showGenerateKeyModal());
    }
  }

  /**
   * Load applications from the API
   * Needed for the application dropdown in the generate key form
   * @returns {Promise<void>}
   */
  async loadApplications() {
    try {
      console.log('Loading applications...');
      const response = await this.apiClient.get('/applications');
      this.applications = Array.isArray(response) ? response : (response.data || []);
      console.log('Applications loaded:', this.applications);
    } catch (error) {
      console.error('Failed to load applications:', error);
      // Don't throw - we can still show the page
    }
  }

  /**
   * Load API keys from the API
   * Fetches data from /api/api-keys endpoint
   * @returns {Promise<void>}
   */
  async loadApiKeys() {
    try {
      console.log('Loading API keys...');
      
      // Fetch API keys from API
      const response = await this.apiClient.get('/api-keys');
      
      // Store API keys
      this.apiKeys = Array.isArray(response) ? response : (response.data || []);
      
      // Render API keys to the DOM
      this.renderApiKeys(this.apiKeys);
      
      console.log('API keys loaded successfully:', this.apiKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      throw error;
    }
  }

  /**
   * Render API keys to the DOM
   * Updates the API keys display with fetched data
   * @param {Array} apiKeys - Array of API key objects
   */
  renderApiKeys(apiKeys) {
    console.log('Rendering API keys:', apiKeys);
    
    // Find the main content container
    const mainContent = document.querySelector('main .p-8');
    
    if (!mainContent) {
      console.error('Main content container not found');
      return;
    }
    
    // If no API keys, show empty state (already in HTML)
    if (!apiKeys || apiKeys.length === 0) {
      console.log('No API keys to display, showing empty state');
      return;
    }
    
    // Clear the empty state and render API keys list
    mainContent.innerHTML = this.createApiKeysTable(apiKeys);
    
    // Set up event listeners for revoke buttons
    this.setupRevokeHandlers();
    
    console.log('API keys rendered successfully');
  }

  /**
   * Create the API keys table HTML
   * @private
   * @param {Array} apiKeys - Array of API key objects
   * @returns {string} HTML for API keys table
   */
  createApiKeysTable(apiKeys) {
    return `
      <div class="bg-white border border-black shadow-brutal overflow-hidden">
        <div class="bg-slate-100 border-b border-black p-4">
          <h3 class="font-display font-bold text-lg flex items-center gap-2">
            <span class="material-symbols-outlined">vpn_key</span> Your API Keys
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full font-mono text-sm">
            <thead class="bg-slate-50 border-b border-black">
              <tr>
                <th class="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">Name</th>
                <th class="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">Key Prefix</th>
                <th class="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">Application</th>
                <th class="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">Created</th>
                <th class="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">Last Used</th>
                <th class="text-left px-6 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">Status</th>
                <th class="text-right px-6 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${apiKeys.map(key => this.createApiKeyRow(key)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- How to use section -->
      <div class="bg-white border border-black shadow-brutal-sm overflow-hidden mt-8">
        <div class="bg-slate-100 border-b border-black p-4">
          <h4 class="font-display font-bold text-lg flex items-center gap-2">
            <span class="material-symbols-outlined">help</span> How to use API Keys
          </h4>
        </div>
        <div class="p-6 font-mono text-sm space-y-4 bg-white">
          <div class="flex gap-4 items-start">
            <span class="bg-black text-white px-2 py-0.5 font-bold">01</span>
            <p class="text-slate-700">Generate an API key for each application you want to monitor.</p>
          </div>
          <div class="flex gap-4 items-start">
            <span class="bg-black text-white px-2 py-0.5 font-bold">02</span>
            <p class="text-slate-700">Install the VigilAI SDK in your application.</p>
          </div>
          <div class="flex gap-4 items-start">
            <span class="bg-black text-white px-2 py-0.5 font-bold">03</span>
            <div class="flex-1 space-y-2">
              <p class="text-slate-700">Configure the SDK with your API key:</p>
              <div class="bg-slate-50 border border-black p-3 font-mono text-xs text-slate-600 overflow-x-auto">
                vigilai.init({<br/>
                  apiKey: 'YOUR_SECRET_API_KEY',<br/>
                  environment: 'production'<br/>
                });
              </div>
            </div>
          </div>
          <div class="flex gap-4 items-start">
            <span class="bg-black text-white px-2 py-0.5 font-bold">04</span>
            <p class="text-slate-700">Start monitoring errors and performance metrics automatically.</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create an API key table row HTML
   * @private
   * @param {Object} key - API key object
   * @returns {string} HTML for API key row
   */
  createApiKeyRow(key) {
    const createdDate = this.formatDate(key.createdAt);
    const lastUsedDate = key.lastUsedAt ? this.formatDate(key.lastUsedAt) : 'Never';
    const applicationName = key.application ? this.escapeHtml(key.application.name) : 'All applications';
    const isRevoked = !!key.revokedAt;
    const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
    
    let statusBadge;
    if (isRevoked) {
      statusBadge = '<span class="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-800">REVOKED</span>';
    } else if (isExpired) {
      statusBadge = '<span class="px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-800">EXPIRED</span>';
    } else {
      statusBadge = '<span class="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 border border-green-800">ACTIVE</span>';
    }
    
    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-6 py-4 text-black font-semibold">${this.escapeHtml(key.name)}</td>
        <td class="px-6 py-4 text-slate-600">
          <code class="bg-slate-100 px-2 py-1 border border-slate-300">${this.escapeHtml(key.keyPrefix)}••••••••</code>
        </td>
        <td class="px-6 py-4 text-slate-600">${applicationName}</td>
        <td class="px-6 py-4 text-slate-600">${createdDate}</td>
        <td class="px-6 py-4 text-slate-600">${lastUsedDate}</td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4 text-right">
          ${!isRevoked ? `
            <button 
              class="px-3 py-1.5 text-xs font-bold border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all"
              data-revoke-key="${key.id}"
            >
              REVOKE
            </button>
          ` : '<span class="text-xs text-slate-400">—</span>'}
        </td>
      </tr>
    `;
  }

  /**
   * Set up event listeners for revoke buttons
   * @private
   */
  setupRevokeHandlers() {
    const revokeButtons = document.querySelectorAll('[data-revoke-key]');
    revokeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const keyId = e.target.getAttribute('data-revoke-key');
        this.showRevokeConfirmation(keyId);
      });
    });
  }

  /**
   * Show confirmation dialog for revoking an API key
   * @private
   * @param {string} keyId - The ID of the key to revoke
   */
  showRevokeConfirmation(keyId) {
    const key = this.apiKeys.find(k => k.id === keyId);
    if (!key) return;
    
    const confirmed = confirm(
      `Are you sure you want to revoke the API key "${key.name}"?\n\n` +
      `This action cannot be undone. Applications using this key will no longer be able to send data to VigilAI.`
    );
    
    if (confirmed) {
      this.revokeApiKey(keyId);
    }
  }

  /**
   * Revoke an API key
   * @private
   * @param {string} keyId - The ID of the key to revoke
   */
  async revokeApiKey(keyId) {
    try {
      console.log('Revoking API key:', keyId);
      
      // Call API to revoke key
      await this.apiClient.delete(`/api-keys/${keyId}`);
      
      // Show success message
      toast.success('API key revoked successfully');
      
      // Refresh API keys list
      await this.loadApiKeys();
      
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      const errorMessage = error.message || 'Failed to revoke API key. Please try again.';
      toast.error(errorMessage);
    }
  }

  /**
   * Show the Generate API Key modal
   */
  showGenerateKeyModal() {
    // Create modal if it doesn't exist
    if (!this.generateKeyModal) {
      this.generateKeyModal = new Modal('generate-api-key-modal');
    }
    
    // Set modal title
    this.generateKeyModal.setTitle('Generate API Key');
    
    // Set modal content with form
    this.generateKeyModal.setContent(this.createGenerateKeyForm());
    
    // Set up form submission handler
    this.generateKeyModal.onSubmit((formData) => this.handleGenerateKey(formData));
    
    // Open the modal
    this.generateKeyModal.open();
  }

  /**
   * Create the Generate API Key form HTML
   * @private
   * @returns {string} HTML for the form
   */
  createGenerateKeyForm() {
    return `
      <form id="generate-key-form" class="space-y-4">
        <!-- Key Name -->
        <div>
          <label for="key-name" class="block text-sm font-bold font-mono text-black mb-2">
            Key Name <span class="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="key-name"
            name="name"
            required
            class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all"
            placeholder="e.g., Production Key"
          />
          <p class="text-xs text-slate-500 font-mono mt-1">A descriptive name for this API key</p>
          <p class="text-xs text-red-600 font-mono mt-1 hidden" data-error="name"></p>
        </div>

        <!-- Application -->
        <div>
          <label for="key-application" class="block text-sm font-bold font-mono text-black mb-2">
            Application
          </label>
          <select
            id="key-application"
            name="applicationId"
            class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all"
          >
            <option value="">All applications</option>
            ${this.applications.map(app => `
              <option value="${app.id}">${this.escapeHtml(app.name)}</option>
            `).join('')}
          </select>
          <p class="text-xs text-slate-500 font-mono mt-1">Optional: Restrict this key to a specific application</p>
        </div>

        <!-- Expiration -->
        <div>
          <label for="key-expiration" class="block text-sm font-bold font-mono text-black mb-2">
            Expiration
          </label>
          <select
            id="key-expiration"
            name="expiration"
            class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all"
          >
            <option value="">Never</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
          </select>
          <p class="text-xs text-slate-500 font-mono mt-1">Optional: Set an expiration date for this key</p>
        </div>

        <!-- Warning -->
        <div class="bg-yellow-50 border border-yellow-600 p-4 flex gap-3">
          <span class="material-symbols-outlined text-yellow-600">warning</span>
          <div class="flex-1 text-xs font-mono text-yellow-800">
            <p class="font-bold mb-1">Important Security Notice</p>
            <p>The full API key will only be shown once. Make sure to copy and store it securely.</p>
          </div>
        </div>
      </form>
    `;
  }

  /**
   * Handle Generate API Key form submission
   * @private
   * @param {FormData} formData - The form data
   */
  async handleGenerateKey(formData) {
    try {
      // Clear previous errors
      this.clearFormErrors();
      
      // Extract and validate form data
      const keyData = this.extractKeyFormData(formData);
      
      // Validate the data
      const validationErrors = this.validateKeyData(keyData);
      if (validationErrors.length > 0) {
        this.displayFormErrors(validationErrors);
        return;
      }
      
      // Show loading state
      const submitButton = document.querySelector('[data-modal-submit]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Generating...';
      submitButton.disabled = true;
      
      // Call API to generate key
      console.log('Generating API key:', keyData);
      
      // api-client unwraps {data: ...} envelope
      const newKey = await this.apiClient.post('/api-keys', keyData);
      
      // Close the generate modal
      this.generateKeyModal.close();
      
      // Reload the API keys list to show the new key in the background
      await this.loadApiKeys();
      
      // Show the key display modal with the full key
      // since the api-client unwraps {data: {...}}, newKey is the object directly
      this.showKeyDisplayModal(newKey);
      
      // Restore button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      
    } catch (error) {
      console.error('Failed to generate API key:', error);
      
      // Display error message
      const errorMessage = error.message || 'Failed to generate API key. Please try again.';
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
   * Extract form data into key object
   * @private
   * @param {FormData} formData - The form data
   * @returns {Object} Key data object
   */
  extractKeyFormData(formData) {
    const expirationDays = formData.get('expiration');
    let expiresAt = null;
    
    if (expirationDays) {
      const days = parseInt(expirationDays);
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      expiresAt = expirationDate.toISOString();
    }
    
    return {
      name: formData.get('name')?.trim() || '',
      applicationId: formData.get('applicationId')?.trim() || null,
      expiresAt: expiresAt
    };
  }

  /**
   * Validate key data
   * @private
   * @param {Object} data - Key data to validate
   * @returns {Array} Array of validation error objects
   */
  validateKeyData(data) {
    const errors = [];
    
    // Validate name (required)
    if (!data.name) {
      errors.push({ field: 'name', message: 'Key name is required' });
    } else if (data.name.length < 2) {
      errors.push({ field: 'name', message: 'Key name must be at least 2 characters' });
    } else if (data.name.length > 100) {
      errors.push({ field: 'name', message: 'Key name must be less than 100 characters' });
    }
    
    return errors;
  }

  /**
   * Show modal displaying the newly generated API key
   * @private
   * @param {Object} keyData - The generated key data including the full key
   */
  showKeyDisplayModal(keyData) {
    // Create modal if it doesn't exist
    if (!this.keyDisplayModal) {
      this.keyDisplayModal = new Modal('key-display-modal');
    }
    
    // Set modal title
    this.keyDisplayModal.setTitle('API Key Generated Successfully');
    
    // Set modal content with the key display
    this.keyDisplayModal.setContent(this.createKeyDisplayContent(keyData));
    
    // Override the submit button to be a "Done" button
    const modalElement = document.getElementById('key-display-modal');
    if (modalElement) {
      const submitButton = modalElement.querySelector('[data-modal-submit]');
      if (submitButton) {
        submitButton.textContent = 'Done';
        submitButton.onclick = () => {
          this.keyDisplayModal.close();
          // Refresh the keys list
          this.loadApiKeys();
        };
      }
    }
    
    // Set up copy button handler
    setTimeout(() => {
      const copyButton = document.getElementById('copy-key-button');
      if (copyButton) {
        copyButton.addEventListener('click', () => this.copyKeyToClipboard(keyData.key));
      }
    }, 100);
    
    // Open the modal
    this.keyDisplayModal.open();
  }

  /**
   * Create the key display content HTML
   * @private
   * @param {Object} keyData - The generated key data
   * @returns {string} HTML for the key display
   */
  createKeyDisplayContent(keyData) {
    return `
      <div class="space-y-4">
        <!-- Warning -->
        <div class="bg-red-50 border border-red-600 p-4 flex gap-3">
          <span class="material-symbols-outlined text-red-600">warning</span>
          <div class="flex-1 text-xs font-mono text-red-800">
            <p class="font-bold mb-1">Save This Key Now!</p>
            <p>This is the only time you'll see the full API key. Copy it and store it securely.</p>
          </div>
        </div>

        <!-- Key Display -->
        <div>
          <label class="block text-sm font-bold font-mono text-black mb-2">
            Your API Key
          </label>
          <div class="relative">
            <input
              type="text"
              id="api-key-value"
              value="${this.escapeHtml(keyData.key)}"
              readonly
              class="w-full px-3 py-3 pr-24 border-2 border-black font-mono text-sm bg-slate-50 focus:outline-none select-all"
            />
            <button
              id="copy-key-button"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold border border-black bg-white hover:bg-black hover:text-white transition-all flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-sm">content_copy</span>
              COPY
            </button>
          </div>
        </div>

        <!-- Key Details -->
        <div class="bg-slate-50 border border-slate-300 p-4 space-y-2 font-mono text-xs">
          <div class="flex justify-between">
            <span class="text-slate-600">Name:</span>
            <span class="text-black font-bold">${this.escapeHtml(keyData.name)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Key Prefix:</span>
            <span class="text-black font-bold">${this.escapeHtml(keyData.keyPrefix)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Created:</span>
            <span class="text-black">${this.formatDate(keyData.createdAt)}</span>
          </div>
        </div>

        <!-- Usage Instructions -->
        <div class="border-t border-slate-200 pt-4">
          <p class="text-xs font-mono text-slate-600 mb-2">Use this key in your application:</p>
          <div class="bg-slate-900 text-green-400 p-3 font-mono text-xs overflow-x-auto">
            vigilai.init({<br/>
            &nbsp;&nbsp;apiKey: '${this.escapeHtml(keyData.key)}',<br/>
            &nbsp;&nbsp;environment: 'production'<br/>
            });
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Copy API key to clipboard
   * @private
   * @param {string} key - The API key to copy
   */
  async copyKeyToClipboard(key) {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('API key copied to clipboard!');
      
      // Update button text temporarily
      const copyButton = document.getElementById('copy-key-button');
      if (copyButton) {
        const originalHTML = copyButton.innerHTML;
        copyButton.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> COPIED';
        setTimeout(() => {
          copyButton.innerHTML = originalHTML;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard. Please copy manually.');
    }
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
    const inputs = document.querySelectorAll('input.border-red-600, select.border-red-600');
    inputs.forEach(input => {
      input.classList.remove('border-red-600');
    });
  }
}

// Export for use in other modules
export default ApiKeysPage;
