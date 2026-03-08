/**
 * Data Formatting Utilities
 * 
 * Provides formatting functions for dates, numbers, and badges
 * to ensure consistent display across the application.
 */

/**
 * Format a date/time string to a human-readable relative time
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted relative time (e.g., "2 mins ago", "3 hours ago")
 */
export function formatRelativeTime(date) {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatAbsoluteDate(then);
  }
}

/**
 * Format a date to absolute format
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date (e.g., "Jan 15, 2024")
 */
export function formatAbsoluteDate(date) {
  if (!date) return 'Unknown';
  
  const d = new Date(date);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format a date to absolute date and time
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date and time (e.g., "Jan 15, 2024 at 3:45 PM")
 */
export function formatAbsoluteDateTime(date) {
  if (!date) return 'Unknown';
  
  const d = new Date(date);
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  
  const dateStr = d.toLocaleDateString('en-US', dateOptions);
  const timeStr = d.toLocaleTimeString('en-US', timeOptions);
  
  return `${dateStr} at ${timeStr}`;
}

/**
 * Format a number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., "1,234")
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Format a number as a percentage
 * @param {number} num - Number to format (0-1 or 0-100)
 * @param {boolean} isDecimal - Whether the input is a decimal (0-1) or percentage (0-100)
 * @returns {string} Formatted percentage (e.g., "85%")
 */
export function formatPercentage(num, isDecimal = true) {
  if (num === null || num === undefined) return '0%';
  const percentage = isDecimal ? num * 100 : num;
  return `${Math.round(percentage)}%`;
}

/**
 * Get severity badge configuration
 * @param {string} severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
 * @returns {object} Badge configuration with color classes
 */
export function getSeverityBadgeConfig(severity) {
  const configs = {
    CRITICAL: {
      borderColor: 'border-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'Critical'
    },
    HIGH: {
      borderColor: 'border-yellow-600',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      label: 'High'
    },
    MEDIUM: {
      borderColor: 'border-orange-600',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      label: 'Medium'
    },
    LOW: {
      borderColor: 'border-blue-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      label: 'Low'
    }
  };
  
  return configs[severity] || configs.LOW;
}

/**
 * Format severity as HTML badge
 * @param {string} severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
 * @returns {string} HTML string for severity badge
 */
export function formatSeverityBadge(severity) {
  if (!severity) return '<span class="text-slate-400 text-xs">Unknown</span>';
  
  const config = getSeverityBadgeConfig(severity);
  
  return `<span class="px-2 py-0.5 border ${config.borderColor} ${config.textColor} text-xs font-bold uppercase tracking-wider ${config.bgColor}">${config.label}</span>`;
}

/**
 * Get status badge configuration
 * @param {string} status - Status (OPEN, IN_PROGRESS, RESOLVED, IGNORED)
 * @returns {object} Badge configuration with color classes
 */
export function getStatusBadgeConfig(status) {
  const configs = {
    OPEN: {
      shadowColor: 'shadow-[2px_2px_0px_0px_#ef4444]',
      dotColor: 'bg-red-500',
      dotAnimation: 'animate-pulse',
      label: 'Open'
    },
    IN_PROGRESS: {
      shadowColor: 'shadow-[2px_2px_0px_0px_#eab308]',
      dotColor: 'bg-yellow-500',
      dotAnimation: '',
      label: "Ack'd"
    },
    RESOLVED: {
      shadowColor: 'shadow-[2px_2px_0px_0px_#22c55e]',
      dotColor: 'bg-green-500',
      dotAnimation: '',
      label: 'Resolved'
    },
    IGNORED: {
      shadowColor: 'shadow-[2px_2px_0px_0px_#94a3b8]',
      dotColor: 'bg-slate-400',
      dotAnimation: '',
      label: 'Ignored'
    }
  };
  
  return configs[status] || configs.OPEN;
}

/**
 * Format status as HTML badge
 * @param {string} status - Status (OPEN, IN_PROGRESS, RESOLVED, IGNORED)
 * @returns {string} HTML string for status badge
 */
export function formatStatusBadge(status) {
  if (!status) return '<span class="text-slate-400 text-xs">Unknown</span>';
  
  const config = getStatusBadgeConfig(status);
  
  return `<span class="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-black bg-white text-xs font-bold ${config.shadowColor}">
    <span class="w-2 h-2 rounded-full ${config.dotColor} ${config.dotAnimation}"></span>
    ${config.label}
  </span>`;
}
