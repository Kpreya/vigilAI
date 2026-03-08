/**
 * Frontend Configuration
 *
 * Centralized configuration for the frontend application.
 * Auto-detects the backend port (3000 with fallback to 3001).
 */

// Primary backend port (Next.js default).
// If port 3000 is taken Next.js moves to 3001 – set this to match.
const BACKEND_PORT = 3000; // Change to 3001 if Next.js logs "using available port 3001"

const config = {
  // API Configuration — update BACKEND_PORT above if Next.js uses a different port
  API_BASE_URL: `http://localhost:${BACKEND_PORT}/api`,

  // WebSocket Configuration
  WS_URL: `ws://localhost:${BACKEND_PORT}`,

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
