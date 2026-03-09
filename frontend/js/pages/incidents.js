/**
 * Incidents Page Module
 * 
 * Handles incidents page functionality including loading and displaying incidents.
 * Integrates with the ApiClient to fetch data from /api/incidents.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */

import ApiClient from '../api-client.js';
import toast from '../toast.js';
import Modal from '../modal.js';

class IncidentsPage {
  constructor() {
    this.apiClient = new ApiClient();
    this.incidents = [];
    this.applications = [];
    this.createIncidentModal = null;
    this.currentPage = 1;
    this.pageSize = 20;
    this.totalPages = 1;
    this.totalCount = 0;
    this.filters = {
      status: null,
      severity: null
    };
  }

  /**
   * Initialize the incidents page
   * Sets up the page and loads initial data
   */
  async init() {
    console.log('Initializing incidents page...');
    
    try {
      // Check if we're viewing a specific incident detail
      const urlParams = new URLSearchParams(window.location.search);
      const incidentId = urlParams.get('id');
      
      if (incidentId) {
        // Load and display incident detail
        await this.loadIncidentDetail(incidentId);
        return;
      }
      
      // Otherwise, show the incidents list
      // Get page and filters from URL if present
      const pageParam = urlParams.get('page');
      if (pageParam) {
        this.currentPage = parseInt(pageParam, 10) || 1;
      }
      
      // Get filters from URL
      const statusParam = urlParams.get('status');
      if (statusParam) {
        this.filters.status = statusParam;
      }
      
      const severityParam = urlParams.get('severity');
      if (severityParam) {
        this.filters.severity = severityParam;
      }
      
      // Set up pagination controls
      this.setupPaginationControls();
      
      // Set up filter controls
      this.setupFilterControls();
      
      this.setupEventListeners();
      await this.loadApplications();

      // Load stats and incidents
      await this.loadStats();
      await this.loadIncidents();
    } catch (error) {
      console.error('Failed to initialize incidents page:', error);
      toast.error('Failed to load incidents. Please refresh the page.');
    }
  }

  /**
   * Load incident statistics from the API
   * Fetches data from /api/dashboard/stats endpoint
   * @returns {Promise<void>}
   */
  async loadStats() {
    try {
      console.log('Loading incident statistics...');
      
      // Fetch stats from API
      const response = await this.apiClient.get('/dashboard/stats');
      const stats = response.data || response;
      
      // Update stat cards with real data
      this.updateStatCards(stats);
      
      console.log('Stats loaded successfully:', stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Don't show error toast, just leave the stats as "-"
    }
  }

  /**
   * Update stat cards with fetched data
   * @private
   * @param {Object} stats - Stats object from API
   */
  updateStatCards(stats) {
    // Update Open Incidents
    const openElement = document.getElementById('stat-open');
    if (openElement) {
      openElement.textContent = stats.openIncidents || 0;
    }
    
    // Update Acknowledged
    const acknowledgedElement = document.getElementById('stat-acknowledged');
    if (acknowledgedElement) {
      acknowledgedElement.textContent = stats.acknowledgedIncidents || 0;
    }
    
    // Update Resolved
    const resolvedElement = document.getElementById('stat-resolved');
    if (resolvedElement) {
      resolvedElement.textContent = stats.resolvedIncidents || 0;
    }
    
    // Update MTTR (Mean Time To Resolution)
    const mttrElement = document.getElementById('stat-mttr');
    if (mttrElement) {
      const mttr = stats.averageMTTR || 0;
      if (mttr === 0) {
        mttrElement.textContent = '-';
      } else if (mttr < 60) {
        mttrElement.textContent = `${mttr}m`;
      } else {
        const hours = Math.floor(mttr / 60);
        const mins = mttr % 60;
        mttrElement.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      }
    }
  }

  /**
   * Load and display incident detail
   * Fetches a specific incident and shows its details including AI diagnosis
   * @param {string} incidentId - ID of the incident to load
   * @returns {Promise<void>}
   */
  async loadIncidentDetail(incidentId) {
    try {
      console.log('Loading incident detail:', incidentId);
      
      // Fetch incident from API
      const response = await this.apiClient.get(`/incidents/${incidentId}`);
      const incident = response.data;
      
      // Render incident detail view
      this.renderIncidentDetail(incident);
      
      console.log('Incident detail loaded successfully:', incident);
    } catch (error) {
      console.error('Failed to load incident detail:', error);
      toast.error('Failed to load incident details. Please try again.');
      
      // Navigate back to incidents list
      window.location.href = '/incidents.html';
    }
  }

  /**
   * Render incident detail view
   * Displays full incident information including AI diagnosis
   * @param {Object} incident - Incident object
   */
  renderIncidentDetail(incident) {
    console.log('Rendering incident detail:', incident);
    
    // Find the main content area
    const main = document.querySelector('main');
    
    if (!main) {
      console.error('Main content area not found');
      return;
    }
    
    // Format severity badge
    const severityBadge = this.formatSeverityBadge(incident.severity);
    
    // Format status badge
    const statusBadge = this.formatStatusBadge(incident.status);
    
    // Format time
    const timeAgo = this.formatTimeAgo(incident.firstSeenAt);
    
    // Get application name
    const appName = incident.application?.name || 'Unknown';
    
    // Check if AI diagnosis is available
    const hasAIDiagnosis = incident.aiDiagnosis && incident.confidence !== null;
    
    // Format confidence score as percentage
    const confidencePercent = hasAIDiagnosis ? Math.round(incident.confidence * 100) : 0;
    
    // Create AI diagnosis section HTML
    const aiDiagnosisSection = hasAIDiagnosis ? `
      <div class="bg-blue-50 border-2 border-blue-600 p-6 shadow-brutal">
        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-blue-600 text-3xl">psychology</span>
          <div>
            <h3 class="text-xl font-display font-bold text-black">AI Diagnosis</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm font-mono text-slate-600">Confidence:</span>
              <div class="flex items-center gap-2">
                <div class="w-32 h-2 bg-white border border-black">
                  <div class="h-full bg-blue-600" style="width: ${confidencePercent}%"></div>
                </div>
                <span class="text-sm font-mono font-bold text-blue-600">${confidencePercent}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white border border-black p-4 font-mono text-sm">
          <p class="text-black whitespace-pre-wrap">${this.escapeHtml(incident.aiDiagnosis)}</p>
        </div>
        ${incident.suggestedFix ? `
          <div class="mt-4">
            <h4 class="text-sm font-bold font-mono text-slate-700 mb-2">SUGGESTED FIX:</h4>
            <div class="bg-white border border-black p-4 font-mono text-sm">
              <p class="text-black whitespace-pre-wrap">${this.escapeHtml(incident.suggestedFix)}</p>
            </div>
          </div>
        ` : ''}
      </div>
    ` : `
      <div class="bg-slate-50 border-2 border-dashed border-slate-300 p-6 hover:bg-slate-100 transition-colors">
        <div class="flex items-center justify-between gap-3 text-slate-500">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-3xl">psychology</span>
            <div>
              <h3 class="text-lg font-display font-bold">AI Diagnosis Unavailable</h3>
              <p class="text-sm font-mono mt-1">No AI diagnosis is available for this incident.</p>
            </div>
          </div>
          <button id="analyze-incident-btn" data-incident-id="${incident.id}" class="bg-black text-white px-5 py-2.5 font-mono text-sm border-2 border-black hover:bg-white hover:text-black transition-all shadow-brutal active:shadow-none active:translate-x-1 active:translate-y-1 whitespace-nowrap">
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">auto_awesome</span> ANALYZE NOW
            </span>
          </button>
        </div>
      </div>
    `;
    
    // Replace main content with incident detail view
    main.innerHTML = `
      <header class="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-black px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button onclick="window.location.href='/incidents.html'" class="p-2 border border-black bg-white hover:bg-gray-50 text-black">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 class="text-2xl font-display font-bold text-black">Incident Detail</h2>
              <p class="text-sm font-mono text-slate-500 mt-1">ID: ${this.escapeHtml(incident.id)}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            ${statusBadge}
            ${severityBadge}
          </div>
        </div>
      </header>
      
      <div class="p-8 max-w-7xl mx-auto space-y-6">
        <!-- Incident Title -->
        <div class="bg-white border border-black p-6 shadow-brutal">
          <h1 class="text-3xl font-display font-bold text-black mb-2">${this.escapeHtml(incident.title)}</h1>
          <div class="flex items-center gap-4 text-sm font-mono text-slate-600">
            <span>Application: ${this.escapeHtml(appName)}</span>
            <span>•</span>
            <span>First seen: ${timeAgo}</span>
            <span>•</span>
            <span>Error count: ${incident.errorCount || 1}</span>
          </div>
        </div>
        
        <!-- AI Diagnosis Section -->
        ${aiDiagnosisSection}
        
        <!-- Description -->
        ${incident.description ? `
          <div class="bg-white border border-black p-6 shadow-brutal">
            <h3 class="text-lg font-display font-bold text-black mb-3">Description</h3>
            <p class="font-mono text-sm text-black whitespace-pre-wrap">${this.escapeHtml(incident.description)}</p>
          </div>
        ` : ''}
        
        <!-- Stack Trace -->
        ${incident.stackTrace ? `
          <div class="bg-white border border-black p-6 shadow-brutal">
            <h3 class="text-lg font-display font-bold text-black mb-3">Stack Trace</h3>
            <pre class="bg-black text-green-400 p-4 font-mono text-xs overflow-x-auto border border-black"><code>${this.escapeHtml(incident.stackTrace)}</code></pre>
          </div>
        ` : ''}
      </div>
    `;
    
    // Add event listener for AI analyze button
    const analyzeBtn = document.getElementById('analyze-incident-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', (e) => {
        const originalHtml = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<span class="flex items-center gap-2"><span class="material-symbols-outlined text-sm animate-spin">refresh</span> ANALYZING...</span>';
        analyzeBtn.disabled = true;
        this.analyzeIncident(incident.id);
      });
    }
    
    console.log('Incident detail rendered successfully');
  }

  /**
   * Request AI diagnosis for an incident
   * @param {string} incidentId - ID of incident to analyze
   */
  async analyzeIncident(incidentId) {
    try {
      toast.info('Agentic AI is analyzing the incident stack trace...');
      
      const response = await this.apiClient.post(`/incidents/${incidentId}/analyze`);
      
      toast.success('AI Analysis complete. Refined insights are now available.');
      
      // The response.data contains the updated incident! We can just pass it directly.
      // Wait, let's just reload this specific incident detail view:
      const updatedIncident = Array.isArray(this.incidents) ? 
        this.incidents.find(i => i.id === incidentId) : null;
        
      if (updatedIncident) {
        // Update local state with the returned AI data
        Object.assign(updatedIncident, response || response.data);
        this.renderIncidentDetail(updatedIncident);
      } else {
        // Fallback: just reload the list which forces re-render
        this.loadIncidents();
      }
    } catch (error) {
      console.error('Failed to trigger AI diagnosis:', error);
      toast.error('AI diagnosis failed. Please try again.');
      
      // Reset button state
      const analyzeBtn = document.getElementById('analyze-incident-btn');
      if (analyzeBtn) {
        analyzeBtn.innerHTML = '<span class="flex items-center gap-2"><span class="material-symbols-outlined text-sm">auto_awesome</span> ANALYZE NOW</span>';
        analyzeBtn.disabled = false;
      }
    }
  }

  /**
   * Load incidents from the API
   * Fetches data from /api/incidents endpoint with pagination and filters
   * @returns {Promise<void>}
   */
  async loadIncidents() {
    try {
      console.log(`Loading incidents page ${this.currentPage} with filters:`, this.filters);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: this.currentPage.toString(),
        pageSize: this.pageSize.toString()
      });
      
      // Add filters if set
      if (this.filters.status) {
        params.append('status', this.filters.status);
      }
      
      if (this.filters.severity) {
        params.append('severity', this.filters.severity);
      }
      
      // Fetch incidents from API with pagination and filters
      // NOTE: The incidents API returns {data: [], pagination: {}} 
      // api-client's handleResponse returns data.data only if data.data exists
      // But for the incidents response, data.data is the array AND data.pagination exists at top level
      // So we do a raw fetch to preserve pagination metadata
      const rawResponse = await fetch(
        `${(await import('../config.js')).default.API_BASE_URL}/incidents?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${this.apiClient.auth.getToken()}`, 'Content-Type': 'application/json' }}
      );
      const json = await rawResponse.json();
      const incidents = Array.isArray(json.data) ? json.data : [];
      const pagination = json.pagination || {};
      
      // Store incidents and pagination info
      this.incidents = incidents;
      
      // Handle pagination metadata
      if (pagination.page !== undefined) {
        this.currentPage = pagination.page;
        this.pageSize = pagination.pageSize;
        this.totalPages = pagination.totalPages;
        this.totalCount = pagination.totalCount;
      }
      
      // Render incidents to the DOM
      this.renderIncidents(this.incidents);
      
      // Update pagination controls
      this.updatePaginationControls();
      
      console.log('Incidents loaded successfully:', this.incidents);
    } catch (error) {
      console.error('Failed to load incidents:', error);
      throw error;
    }
  }

  /**
   * Render incidents to the DOM
   * Updates the incidents table with fetched data
   * @param {Array} incidents - Array of incident objects
   */
  renderIncidents(incidents) {
    console.log('Rendering incidents:', incidents);
    
    // Find the table body
    const tbody = document.querySelector('table tbody');
    
    if (!tbody) {
      console.error('Table body not found');
      return;
    }
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // If no incidents, show empty state
    if (!incidents || incidents.length === 0) {
      console.log('No incidents to display');
      return;
    }
    
    // Render each incident as a table row
    incidents.forEach((incident, index) => {
      const row = this.createIncidentRow(incident, index + 1);
      tbody.appendChild(row);
    });
    
    console.log('Incidents rendered successfully');
  }

  /**
   * Create a table row for an incident
   * @private
   * @param {Object} incident - Incident object
   * @param {number} rowNumber - Row number for display
   * @returns {HTMLElement} Table row element
   */
  createIncidentRow(incident, rowNumber) {
    const row = document.createElement('tr');
    row.className = 'group hover:bg-blue-50 transition-colors cursor-pointer';
    
    // Add click handler to navigate to incident detail page
    row.addEventListener('click', (e) => {
      // Don't navigate if clicking on a link, button, or select
      if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') {
        return;
      }
      
      // Don't navigate if clicking inside the status dropdown
      if (e.target.closest('.status-dropdown')) {
        return;
      }
      
      this.navigateToIncidentDetail(incident.id);
    });
    
    // Format status dropdown
    const statusDropdown = this.createStatusDropdown(incident);
    
    // Format severity badge
    const severityBadge = this.formatSeverityBadge(incident.severity);
    
    // Format time
    const timeAgo = this.formatTimeAgo(incident.firstSeenAt);
    
    // Get application name
    const appName = incident.application?.name || 'Unknown';
    
    row.innerHTML = `
      <td class="p-4 border-r border-black text-center text-slate-500">${rowNumber}</td>
      <td class="p-4 border-r border-black status-dropdown">${statusDropdown}</td>
      <td class="p-4 border-r border-black">${severityBadge}</td>
      <td class="p-4 border-r border-black">
        <a class="font-sans font-bold text-black hover:underline text-base block mb-1" href="#">${this.escapeHtml(incident.title)}</a>
        <span class="text-slate-500 text-xs">service: ${this.escapeHtml(appName)} • errors: ${incident.errorCount || 1}</span>
      </td>
      <td class="p-4 border-r border-black text-slate-600">${timeAgo}</td>
      <td class="p-4">
        <span class="text-xs text-slate-400 font-style-italic">Unassigned</span>
      </td>
    `;
    
    // Add event listener to the status dropdown after the row is created
    const statusSelect = row.querySelector('.status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        e.stopPropagation(); // Prevent row click
        this.handleStatusChange(incident.id, e.target.value);
      });
    }
    
    return row;
  }

  /**
   * Navigate to incident detail page
   * @private
   * @param {string} incidentId - ID of the incident to view
   */
  navigateToIncidentDetail(incidentId) {
    console.log('Navigating to incident detail:', incidentId);
    
    // Navigate to incident detail page with incident ID as query parameter
    // The detail page will be implemented in a future task
    window.location.href = `/incidents.html?id=${incidentId}`;
  }

  /**
   * Create a status dropdown for an incident
   * @private
   * @param {Object} incident - Incident object
   * @returns {string} HTML for status dropdown
   */
  createStatusDropdown(incident) {
    const statusOptions = [
      { value: 'OPEN', label: 'Open', color: 'red' },
      { value: 'IN_PROGRESS', label: "Ack'd", color: 'yellow' },
      { value: 'RESOLVED', label: 'Solved', color: 'green' },
      { value: 'IGNORED', label: 'Ignored', color: 'gray' }
    ];
    
    const currentStatus = statusOptions.find(s => s.value === incident.status) || statusOptions[0];
    const pulseClass = currentStatus.value === 'OPEN' ? 'animate-pulse' : '';
    
    // Create a select dropdown styled to look like a badge
    return `
      <select class="status-select px-2 py-1 rounded-full border border-black bg-white text-xs font-bold cursor-pointer focus:ring-0 focus:border-black appearance-none pr-6" 
              style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 0.25rem center; background-size: 1em;">
        ${statusOptions.map(option => `
          <option value="${option.value}" ${option.value === incident.status ? 'selected' : ''}>
            ${option.label}
          </option>
        `).join('')}
      </select>
    `;
  }

  /**
   * Handle status change for an incident
   * @private
   * @param {string} incidentId - ID of the incident
   * @param {string} newStatus - New status value
   */
  async handleStatusChange(incidentId, newStatus) {
    console.log(`Changing status of incident ${incidentId} to ${newStatus}`);
    
    try {
      // Call API to update incident status
      await this.apiClient.patch(`/incidents/${incidentId}/status`, {
        status: newStatus
      });
      
      // Show success toast
      toast.success('Incident status updated successfully');
      
      // Refresh the incident list to show updated data
      await this.loadIncidents();
    } catch (error) {
      console.error('Failed to update incident status:', error);
      
      // Show error toast
      toast.error('Failed to update incident status. Please try again.');
      
      // Refresh the incident list to revert the dropdown to the correct state
      await this.loadIncidents();
    }
  }

  /**
   * Format status badge HTML
   * @private
   * @param {string} status - Incident status
   * @returns {string} HTML for status badge
   */
  formatStatusBadge(status) {
    const statusMap = {
      'OPEN': {
        color: 'red',
        label: 'Open',
        pulse: true
      },
      'IN_PROGRESS': {
        color: 'yellow',
        label: "Ack'd",
        pulse: false
      },
      'RESOLVED': {
        color: 'green',
        label: 'Solved',
        pulse: false
      },
      'IGNORED': {
        color: 'gray',
        label: 'Ignored',
        pulse: false
      }
    };
    
    const config = statusMap[status] || statusMap['OPEN'];
    const pulseClass = config.pulse ? 'animate-pulse' : '';
    
    return `
      <span class="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-black bg-white text-xs font-bold shadow-[2px_2px_0px_0px_#${config.color === 'red' ? 'ef4444' : config.color === 'yellow' ? 'eab308' : config.color === 'green' ? '22c55e' : '6b7280'}]">
        <span class="w-2 h-2 rounded-full bg-${config.color}-500 ${pulseClass}"></span>
        ${config.label}
      </span>
    `;
  }

  /**
   * Format severity badge HTML
   * @private
   * @param {string} severity - Incident severity
   * @returns {string} HTML for severity badge
   */
  formatSeverityBadge(severity) {
    const severityMap = {
      'CRITICAL': {
        color: 'red',
        label: 'Critical'
      },
      'HIGH': {
        color: 'yellow',
        label: 'High'
      },
      'MEDIUM': {
        color: 'blue',
        label: 'Medium'
      },
      'LOW': {
        color: 'slate',
        label: 'Minor'
      }
    };
    
    const config = severityMap[severity] || severityMap['LOW'];
    
    return `
      <span class="px-2 py-0.5 border border-${config.color}-600 text-${config.color}-${config.color === 'slate' ? '600' : '700'} text-xs font-bold uppercase tracking-wider bg-${config.color}-50">${config.label}</span>
    `;
  }

  /**
   * Format timestamp as relative time
   * @private
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted relative time
   */
  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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
   * Set up pagination control event listeners
   * @private
   */
  setupPaginationControls() {
    // Find pagination buttons
    const prevButton = document.querySelector('.p-4.bg-slate-50 button:first-of-type');
    const nextButton = document.querySelector('.p-4.bg-slate-50 button:last-of-type');
    
    if (prevButton) {
      prevButton.addEventListener('click', () => this.goToPreviousPage());
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => this.goToNextPage());
    }
  }

  /**
   * Set up filter control event listeners
   * @private
   */
  setupFilterControls() {
    // Find filter buttons (All, Active, Resolved)
    const filterButtons = document.querySelectorAll('.flex.flex-wrap.gap-2 button');
    
    if (filterButtons.length >= 3) {
      // All button
      filterButtons[0].addEventListener('click', () => this.applyStatusFilter(null));
      
      // Active button (OPEN or IN_PROGRESS)
      filterButtons[1].addEventListener('click', () => this.applyStatusFilter('OPEN'));
      
      // Resolved button
      filterButtons[2].addEventListener('click', () => this.applyStatusFilter('RESOLVED'));
    }
    
    // Find severity dropdown
    const severitySelect = document.querySelector('select');
    if (severitySelect) {
      severitySelect.addEventListener('change', (e) => this.applySeverityFilter(e.target.value));
      
      // Set initial value from filters
      if (this.filters.severity) {
        severitySelect.value = this.filters.severity;
      }
    }
    
    // Update button states based on current filters
    this.updateFilterButtonStates();
  }

  /**
   * Apply status filter
   * @private
   * @param {string|null} status - Status to filter by (OPEN, IN_PROGRESS, RESOLVED, IGNORED) or null for all
   */
  async applyStatusFilter(status) {
    console.log('Applying status filter:', status);
    
    this.filters.status = status;
    this.currentPage = 1; // Reset to first page when filtering
    
    this.updateFilterButtonStates();
    this.updateURL();
    
    await this.loadIncidents();
  }

  /**
   * Apply severity filter
   * @private
   * @param {string} value - Dropdown value
   */
  async applySeverityFilter(value) {
    console.log('Applying severity filter:', value);
    
    // Parse the dropdown value
    let severity = null;
    if (value === 'Critical') {
      severity = 'CRITICAL';
    } else if (value === 'Major') {
      severity = 'HIGH';
    } else if (value === 'Minor') {
      severity = 'LOW';
    }
    // "Severity: All" or any other value means no filter
    
    this.filters.severity = severity;
    this.currentPage = 1; // Reset to first page when filtering
    
    this.updateURL();
    
    await this.loadIncidents();
  }

  /**
   * Update filter button states based on current filters
   * @private
   */
  updateFilterButtonStates() {
    const filterButtons = document.querySelectorAll('.flex.flex-wrap.gap-2 button');
    
    if (filterButtons.length >= 3) {
      // Remove active state from all buttons
      filterButtons.forEach(btn => {
        btn.classList.remove('bg-black', 'text-white');
        btn.classList.add('bg-white', 'text-slate-600', 'hover:text-black');
      });
      
      // Add active state to the appropriate button
      if (!this.filters.status) {
        // All button
        filterButtons[0].classList.add('bg-black', 'text-white');
        filterButtons[0].classList.remove('bg-white', 'text-slate-600', 'hover:text-black');
      } else if (this.filters.status === 'OPEN') {
        // Active button
        filterButtons[1].classList.add('bg-black', 'text-white');
        filterButtons[1].classList.remove('bg-white', 'text-slate-600', 'hover:text-black');
      } else if (this.filters.status === 'RESOLVED') {
        // Resolved button
        filterButtons[2].classList.add('bg-black', 'text-white');
        filterButtons[2].classList.remove('bg-white', 'text-slate-600', 'hover:text-black');
      }
    }
  }

  /**
   * Update pagination controls with current state
   * @private
   */
  updatePaginationControls() {
    // Update pagination text
    const paginationText = document.querySelector('.p-4.bg-slate-50 span');
    if (paginationText) {
      const startItem = (this.currentPage - 1) * this.pageSize + 1;
      const endItem = Math.min(this.currentPage * this.pageSize, this.totalCount);
      paginationText.textContent = `Showing ${startItem}-${endItem} of ${this.totalCount} incidents`;
    }
    
    // Update button states
    const prevButton = document.querySelector('.p-4.bg-slate-50 button:first-of-type');
    const nextButton = document.querySelector('.p-4.bg-slate-50 button:last-of-type');
    
    if (prevButton) {
      prevButton.disabled = this.currentPage <= 1;
      if (this.currentPage <= 1) {
        prevButton.classList.add('opacity-50', 'cursor-not-allowed');
        prevButton.classList.remove('hover:bg-black', 'hover:text-white');
      } else {
        prevButton.classList.remove('opacity-50', 'cursor-not-allowed');
        prevButton.classList.add('hover:bg-black', 'hover:text-white');
      }
    }
    
    if (nextButton) {
      nextButton.disabled = this.currentPage >= this.totalPages;
      if (this.currentPage >= this.totalPages) {
        nextButton.classList.add('opacity-50', 'cursor-not-allowed');
        nextButton.classList.remove('hover:bg-black', 'hover:text-white');
      } else {
        nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
        nextButton.classList.add('hover:bg-black', 'hover:text-white');
      }
    }
  }

  /**
   * Navigate to the previous page
   * @private
   */
  async goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateURL();
      await this.loadIncidents();
    }
  }

  /**
   * Navigate to the next page
   * @private
   */
  async goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateURL();
      await this.loadIncidents();
    }
  }

  /**
   * Update the URL with the current page and filter parameters
   * @private
   */
  updateURL() {
    const url = new URL(window.location);
    url.searchParams.set('page', this.currentPage.toString());
    
    // Add filter parameters
    if (this.filters.status) {
      url.searchParams.set('status', this.filters.status);
    } else {
      url.searchParams.delete('status');
    }
    
    if (this.filters.severity) {
      url.searchParams.set('severity', this.filters.severity);
    } else {
      url.searchParams.delete('severity');
    }
    
    window.history.pushState({}, '', url);
  }

  /**
   * Load applications from the API
   * Needed for the application dropdown
   */
  async loadApplications() {
    try {
      console.log('Loading applications for incident creation...');
      const response = await this.apiClient.get('/applications');
      this.applications = Array.isArray(response) ? response : (response.data || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }

  /**
   * Set up event listeners (including the Create Incident button)
   */
  setupEventListeners() {
    const createBtn = document.getElementById('create-incident-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateIncidentModal());
    }
  }

  /**
   * Show the modal for creating a manual incident
   */
  showCreateIncidentModal() {
    if (!this.createIncidentModal) {
      this.createIncidentModal = new Modal('create-incident-modal');
    }

    this.createIncidentModal.setTitle('Create Manual Incident');
    this.createIncidentModal.setContent(this.createIncidentForm());
    this.createIncidentModal.onSubmit((formData) => this.handleCreateIncident(formData));
    this.createIncidentModal.open();

    const submitBtn = document.getElementById('create-incident-modal').querySelector('[data-modal-submit]');
    if (submitBtn) submitBtn.textContent = 'Create Incident';
  }

  createIncidentForm() {
    return `
      <form id="create-incident-form" class="space-y-4">
        <div>
          <label class="block text-sm font-bold font-mono text-black mb-2">
            Incident Title <span class="text-red-600">*</span>
          </label>
          <input type="text" name="title" required class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all" placeholder="e.g., Database connection timeout" />
          <p class="text-xs text-red-600 font-mono mt-1 hidden" data-error="title"></p>
        </div>

        <div>
          <label class="block text-sm font-bold font-mono text-black mb-2">
            Application <span class="text-red-600">*</span>
          </label>
          <select name="applicationId" required class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all bg-white cursor-pointer">
            <option value="" disabled selected>Select an application</option>
            ${this.applications.map(app => `<option value="${app.id}">${this.escapeHtml(app.name)}</option>`).join('')}
          </select>
          <p class="text-xs text-red-600 font-mono mt-1 hidden" data-error="applicationId"></p>
          ${this.applications.length === 0 ? '<p class="text-xs text-red-600 font-mono mt-1">You must create an Application first.</p>' : ''}
        </div>

        <div>
          <label class="block text-sm font-bold font-mono text-black mb-2">Severity</label>
          <select name="severity" class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all bg-white cursor-pointer">
            <option value="LOW">Minor</option>
            <option value="MEDIUM" selected>Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold font-mono text-black mb-2">Description</label>
          <textarea name="description" rows="3" class="w-full px-3 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-0 focus:border-black focus:shadow-brutal-sm transition-all resize-none" placeholder="Provide details about the incident..."></textarea>
        </div>
      </form>
    `;
  }

  async handleCreateIncident(formData) {
    try {
      this.clearFormErrors();

      const data = {
        title: formData.get('title')?.trim(),
        applicationId: formData.get('applicationId'),
        severity: formData.get('severity'),
        description: formData.get('description')?.trim() || null
      };

      const errors = [];
      if (!data.title) errors.push({ field: 'title', message: 'Title is required' });
      if (!data.applicationId) errors.push({ field: 'applicationId', message: 'Application selection is required' });

      if (errors.length > 0) {
        this.displayFormErrors(errors);
        return;
      }

      const submitButton = document.getElementById('create-incident-modal').querySelector('[data-modal-submit]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Creating...';
      submitButton.disabled = true;

      await this.apiClient.post('/incidents', data);
      
      this.createIncidentModal.close();
      toast.success('Incident created successfully!');
      this.currentPage = 1;
      await this.loadIncidents();
    } catch (error) {
      console.error('Failed to create manual incident:', error);
      toast.error(error.message || 'Failed to create incident.');
      const submitButton = document.getElementById('create-incident-modal').querySelector('[data-modal-submit]');
      if (submitButton) {
        submitButton.textContent = 'Create Incident';
        submitButton.disabled = false;
      }
    }
  }

  displayFormErrors(errors) {
    errors.forEach(error => {
      const errorElement = document.querySelector(`[data-error="${error.field}"]`);
      if (errorElement) {
        errorElement.textContent = error.message;
        errorElement.classList.remove('hidden');
      }
      const inputElement = document.querySelector(`[name="${error.field}"]`);
      if (inputElement) {
        inputElement.classList.add('border-red-600');
      }
    });
    toast.error('Please fix the validation errors');
  }

  clearFormErrors() {
    const errorElements = document.querySelectorAll('[data-error]');
    errorElements.forEach(el => {
      el.classList.add('hidden');
      el.textContent = '';
    });
    const inputs = document.querySelectorAll('input.border-red-600, select.border-red-600');
    inputs.forEach(input => {
      input.classList.remove('border-red-600');
    });
  }
}

// Export for use in other modules
export default IncidentsPage;
