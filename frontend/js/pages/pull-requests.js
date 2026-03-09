/**
 * Pull Requests Page Module
 * 
 * Handles pull requests page functionality including loading and displaying pull requests.
 * Integrates with the ApiClient to fetch data from /api/pull-requests.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import ApiClient from '../api-client.js';
import toast from '../toast.js';
import Modal from '../modal.js';

class PullRequestsPage {
  constructor() {
    this.apiClient = new ApiClient();
    this.pullRequests = [];
    this.newFixModal = null;
    this.openIncidents = [];
  }

  /**
   * Initialize the pull requests page
   * Sets up the page and loads initial data
   */
  async init() {
    console.log('Initializing pull requests page...');
    
    try {
      // Set up sync button handler
      this.setupSyncButton();
      this.setupNewFixButton();
      
      // Load pull requests
      await this.loadPullRequests();
    } catch (error) {
      console.error('Failed to initialize pull requests page:', error);
      toast.error('Failed to load pull requests. Please refresh the page.');
    }
  }

  /**
   * Load pull requests from the API
   * Fetches data from /api/pull-requests endpoint
   * @returns {Promise<void>}
   */
  async loadPullRequests() {
    try {
      console.log('Loading pull requests...');
      
      // Fetch pull requests from API
      // api-client already unwraps the {data: [...]} envelope
      const pullRequests = await this.apiClient.get('/pull-requests');
      
      // Store pull requests
      this.pullRequests = Array.isArray(pullRequests) ? pullRequests : [];
      
      // Render pull requests to the DOM
      this.renderPullRequests(this.pullRequests);
      
      // Update stats cards
      this.updateStatsCards(this.pullRequests);
      
      console.log('Pull requests loaded:', this.pullRequests.length, 'PRs');
    } catch (error) {
      console.error('Failed to load pull requests:', error);
      throw error;
    }
  }

  /**
   * Render pull requests to the DOM
   * Updates the pull requests table with fetched data
   * @param {Array} pullRequests - Array of pull request objects
   */
  renderPullRequests(pullRequests) {
    console.log('Rendering pull requests:', pullRequests);
    
    // Find containers
    const emptyState = document.getElementById('pr-empty-state');
    const tableContainer = document.getElementById('pr-table-container');
    const tbody = document.querySelector('table tbody');
    
    if (!tbody) {
      console.error('Table body not found');
      return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // If no pull requests, show empty state
    if (!pullRequests || pullRequests.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (tableContainer) tableContainer.classList.add('hidden');
      console.log('No pull requests to display');
      return;
    }
    
    // Hide empty state, show table
    if (emptyState) emptyState.classList.add('hidden');
    if (tableContainer) tableContainer.classList.remove('hidden');

    // Render each pull request as a table row
    pullRequests.forEach((pr, index) => {
      const row = this.createPullRequestRow(pr, index + 1);
      tbody.appendChild(row);
    });
    
    console.log('Pull requests rendered successfully');
  }

  /**
   * Create a table row for a pull request
   * @private
   * @param {Object} pr - Pull request object
   * @param {number} rowNumber - Row number for display
   * @returns {HTMLElement} Table row element
   */
  createPullRequestRow(pr, rowNumber) {
    const row = document.createElement('tr');
    row.className = 'group hover:bg-blue-50 transition-colors cursor-pointer';
    
    // Add click handler to open GitHub URL in new tab
    row.addEventListener('click', (e) => {
      // Don't navigate if clicking on a link or button
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
        return;
      }
      
      this.openGitHubPR(pr.githubPrUrl);
    });
    
    // Format status badge
    const statusBadge = this.formatStatusBadge(pr.status);
    
    // Format PR number
    const prNumber = `#${pr.githubPrNumber}`;
    
    // Get incident info
    const incidentTitle = pr.incident?.title || 'Unknown Incident';
    const incidentSeverity = pr.incident?.severity || 'MEDIUM';
    
    // Format created date
    const createdDate = this.formatDate(pr.createdAt);
    
    row.innerHTML = `
      <td class="p-4 border-r border-black text-center text-slate-500">${prNumber}</td>
      <td class="p-4 border-r border-black">
        <a class="font-sans font-bold text-black hover:underline text-base block mb-1" href="${this.escapeHtml(pr.githubPrUrl)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(pr.title)}</a>
        <span class="text-slate-500 text-xs">incident: ${this.escapeHtml(incidentTitle)} • severity: ${incidentSeverity.toLowerCase()}</span>
      </td>
      <td class="p-4 border-r border-black text-center">${statusBadge}</td>
      <td class="p-4 border-r border-black text-slate-600">${createdDate}</td>
      <td class="p-4">
        <a href="${this.escapeHtml(pr.githubPrUrl)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline text-sm font-mono">View on GitHub →</a>
      </td>
    `;
    
    return row;
  }

  /**
   * Open GitHub PR URL in new tab
   * @private
   * @param {string} url - GitHub PR URL
   */
  openGitHubPR(url) {
    console.log('Opening GitHub PR:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Format status badge HTML
   * @private
   * @param {string} status - PR status (OPEN, MERGED, CLOSED)
   * @returns {string} HTML for status badge
   */
  formatStatusBadge(status) {
    const statusMap = {
      'OPEN': {
        color: 'yellow',
        label: 'Open',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-600'
      },
      'MERGED': {
        color: 'green',
        label: 'Merged',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-600'
      },
      'CLOSED': {
        color: 'gray',
        label: 'Closed',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-600'
      }
    };
    
    const config = statusMap[status] || statusMap['OPEN'];
    
    return `
      <span class="px-2 py-0.5 border ${config.borderColor} ${config.textColor} ${config.bgColor} text-xs font-bold uppercase tracking-wider">${config.label}</span>
    `;
  }

  /**
   * Format date as readable string
   * @private
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted date
   */
  formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // Format as date string
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
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
   * Update stats cards with PR counts
   * @private
   * @param {Array} pullRequests - Array of pull request objects
   */
  updateStatsCards(pullRequests) {
    // Count PRs by status
    const openCount = pullRequests.filter(pr => pr.status === 'OPEN').length;
    const mergedCount = pullRequests.filter(pr => pr.status === 'MERGED').length;
    
    // Count merged PRs this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const mergedThisWeek = pullRequests.filter(pr => {
      return pr.status === 'MERGED' && pr.mergedAt && new Date(pr.mergedAt) >= oneWeekAgo;
    }).length;
    
    // Update the stats cards
    const statCards = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 > div');
    
    if (statCards.length >= 3) {
      // Open PRs card
      const openCountElement = statCards[0].querySelector('.text-3xl');
      if (openCountElement) {
        openCountElement.textContent = openCount;
      }
      
      // Merged card (this week)
      const mergedCountElement = statCards[1].querySelector('.text-3xl');
      if (mergedCountElement) {
        mergedCountElement.textContent = mergedThisWeek;
      }
      
      // Pending Review card (open PRs)
      const pendingCountElement = statCards[2].querySelector('.text-3xl');
      if (pendingCountElement) {
        pendingCountElement.textContent = openCount;
      }
    }
  }

  /**
   * Set up sync button event handler
   * @private
   */
  setupSyncButton() {
    // Find the sync button by ID
    const syncButton = document.getElementById('sync-github-btn');
    
    if (syncButton) {
      syncButton.addEventListener('click', () => {
        this.syncFromGitHub();
      });
      console.log('Sync button handler attached');
    } else {
      console.warn('Sync button not found in DOM');
    }
  }

  /**
   * Trigger GitHub sync operation
   * @returns {Promise<void>}
   */
  async syncFromGitHub() {
    console.log('Syncing pull requests from GitHub...');
    
    try {
      // Show loading toast
      toast.info('Syncing pull requests from GitHub...');
      
      // Call API to trigger sync
      const response = await this.apiClient.post('/pull-requests/sync');
      
      // Reload the pull requests
      await this.loadPullRequests();
      
      // Show success toast
      if (response && response.syncedCount > 0) {
        toast.success(`Successfully synced ${response.syncedCount} new pull requests`);
      } else {
        toast.success('Pull requests synced successfully (No new PRs found)');
      }
    } catch (error) {
      console.error('Failed to sync pull requests:', error);
      toast.error('Failed to sync pull requests. Please try again.');
    }
  }

  /**
   * Set up "New Fix" button
   */
  setupNewFixButton() {
    const newFixBtn = document.getElementById('new-fix-btn');
    if (newFixBtn) {
      newFixBtn.addEventListener('click', () => this.showNewFixModal());
    }
  }

  async showNewFixModal() {
    try {
      const response = await this.apiClient.get('/incidents?status=OPEN');
      this.openIncidents = Array.isArray(response) ? response : (response.data || []);
    } catch (error) {
      console.error('Failed to load incidents', error);
      toast.error('Could not load incidents. Try again.');
      return;
    }

    if (!this.newFixModal) {
      this.newFixModal = new Modal('new-fix-modal');
    }

    this.newFixModal.setTitle('Generate AI Fix for Incident');
    this.newFixModal.setContent(this.createFixForm());
    this.newFixModal.onSubmit((formData) => this.handleGenerateFix(formData));
    this.newFixModal.open();

    const submitBtn = document.getElementById('new-fix-modal').querySelector('[data-modal-submit]');
    if (submitBtn) submitBtn.textContent = 'Generate Fix';
  }

  createFixForm() {
    return `
      <form id="new-fix-form" class="space-y-4">
        <div>
          <label class="block text-sm font-bold font-mono text-black mb-2">
            Select Incident <span class="text-red-600">*</span>
          </label>
          <div class="relative">
            <select name="incidentId" required class="w-full px-4 py-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-blue-600 focus:shadow-brutal transition-all bg-white cursor-pointer appearance-none" size="8" style="min-height: 200px;">
              <option value="" disabled selected class="text-slate-400 italic">Select an incident to analyze and resolve...</option>
              ${this.openIncidents.map(inc => `
                <option value="${inc.id}" class="py-2 px-3 hover:bg-blue-50 text-black font-normal border-b border-slate-100">
                  ${this.escapeHtml(inc.title)}
                </option>
              `).join('')}
            </select>
            <div class="absolute top-3 right-3 pointer-events-none">
              <span class="material-symbols-outlined text-slate-400">expand_more</span>
            </div>
          </div>
          ${this.openIncidents.length === 0 ? '<p class="text-xs text-red-600 font-mono mt-2 bg-red-50 border border-red-200 p-2">No open incidents to fix.</p>' : ''}
          <p class="text-xs text-slate-600 font-mono mt-2 flex gap-1 items-center bg-blue-50 border border-blue-200 p-2">
             <span class="material-symbols-outlined text-[14px] text-blue-600">auto_awesome</span> VigilAI will use Claude 3 and your GitHub integration to generate a PR for this issue automatically.
          </p>
        </div>
      </form>
    `;
  }

  async handleGenerateFix(formData) {
    const incidentId = formData.get('incidentId');
    if (!incidentId) {
      toast.error('Please select an incident');
      return;
    }

    const submitButton = document.getElementById('new-fix-modal').querySelector('[data-modal-submit]');
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="flex items-center gap-2"><span class="material-symbols-outlined text-sm animate-spin">refresh</span> GENERATING...</span>';
    submitButton.disabled = true;

    try {
      toast.info('AI is generating a patch and preparing the GitHub Pull Request...');
      await this.apiClient.post(`/incidents/${incidentId}/analyze`);
      
      this.newFixModal.close();
      toast.success('Fix generated and PR created successfully! Syncing...');
      
      await this.syncFromGitHub();
    } catch (error) {
       console.error('Failed to generate fix:', error);
       toast.error('Failed to generate fix. Check logs for details.');
    } finally {
       if (submitButton) {
         submitButton.textContent = originalText;
         submitButton.disabled = false;
       }
    }
  }
}

// Export for use in other modules
export default PullRequestsPage;
