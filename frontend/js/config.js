/**
 * Frontend Configuration
 *
 * Centralized configuration for the frontend application.
 * Auto-detects the backend port (3000 with fallback to 3001).
 */

// Auto-detect environment
// In production (Docker), nginx proxies to backend, so we use relative URLs
// In development, we connect directly to Next.js backend on port 3000
const isProduction = window.location.port === '' || window.location.port === '80' || window.location.port === '443';
const BACKEND_PORT = 3000;

const config = {
  // API Configuration - uses nginx proxy in production, direct connection in dev
  API_BASE_URL: isProduction ? '/api' : `http://localhost:${BACKEND_PORT}/api`,

  // WebSocket Configuration
  WS_URL: isProduction ? `ws://${window.location.host}` : `ws://localhost:${BACKEND_PORT}`,

  // Application Settings
  APP_NAME: 'VigilAI',
  APP_VERSION: '1.0.0',

  // Feature Flags
  ENABLE_REAL_TIME: true,
  ENABLE_NOTIFICATIONS: true,

  // Timeouts (milliseconds)
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Export for ES6 modules
export default config;

// Also make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.APP_CONFIG = config;
}
