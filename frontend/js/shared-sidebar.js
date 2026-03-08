/**
 * shared-sidebar.js
 * Shared utility: initialises sidebar user info, active nav, logout
 * Include as: <script type="module" src="/js/shared-sidebar.js"></script>
 */

const API_BASE = 'http://localhost:3000/api';

export function initSidebar() {
  // Global error logger to surface JS errors on screen
  window.addEventListener('error', function(e) {
    const errDiv = document.createElement('div');
    errDiv.style = 'position:fixed; bottom:10px; right:10px; max-width:400px; background:#fee2e2; border:2px solid #ef4444; color:#7f1d1d; padding:10px; z-index:9999; font-family:monospace; font-size:12px; white-space:pre-wrap; max-height:200px; overflow:auto; box-shadow:4px 4px 0 #000;';
    errDiv.textContent = '❌ JS ERROR:\n' + (e.error ? e.error.stack : e.message);
    document.body.appendChild(errDiv);
  });
  window.addEventListener('unhandledrejection', function(e) {
    const errDiv = document.createElement('div');
    errDiv.style = 'position:fixed; bottom:10px; right:10px; max-width:400px; background:#fef3c7; border:2px solid #f59e0b; color:#92400e; padding:10px; z-index:9999; font-family:monospace; font-size:12px; white-space:pre-wrap; max-height:200px; overflow:auto; box-shadow:4px 4px 0 #000;';
    errDiv.textContent = '⚠️ UNHANDLED PROMISE REJECTION:\n' + (e.reason ? e.reason.stack || e.reason : 'Unknown reason');
    document.body.appendChild(errDiv);
  });

  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');

  // Auth guard — redirect to login if not logged in
  if (!token) {
    window.location.href = '/login.html';
    return false;
  }

  // Populate user info
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const nameEls = document.querySelectorAll('[data-user-name]');
      const emailEls = document.querySelectorAll('[data-user-email]');
      nameEls.forEach(el => { el.textContent = user.name || user.email; });
      emailEls.forEach(el => { el.textContent = user.email; });
    } catch (_) {}
  }

  // Highlight active nav link based on current page
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('aside nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    const isActive = href === path;
    a.classList.toggle('bg-white', isActive);
    a.classList.toggle('border', isActive);
    a.classList.toggle('border-black', isActive);
    a.classList.toggle('shadow-brutal-sm', isActive);
    a.classList.toggle('font-semibold', isActive);
    a.classList.toggle('text-black', isActive);
    a.classList.toggle('text-slate-600', !isActive);
  });

  // Logout buttons
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login.html';
    });
  });

  return true;
}

export function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'Content-Type': 'application/json'
  };
}

export { API_BASE };
