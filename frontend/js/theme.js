/**
 * Theme Management for VigilAI
 * Professional dark/light mode without floating button
 */

class ThemeManager {
  constructor() {
    this.html = document.documentElement;
    this.currentTheme = localStorage.getItem('vigilai-theme') || 'light';
    this.init();
  }

  init() {
    // Set initial theme
    this.html.setAttribute('data-theme', this.currentTheme);
    
    // Listen for theme changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'vigilai-theme') {
        this.currentTheme = e.newValue || 'light';
        this.html.setAttribute('data-theme', this.currentTheme);
      }
    });
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.html.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('vigilai-theme', this.currentTheme);
    
    // Dispatch event for settings page to update UI
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: this.currentTheme } }));
    
    return this.currentTheme;
  }

  getTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.currentTheme = theme;
      this.html.setAttribute('data-theme', theme);
      localStorage.setItem('vigilai-theme', theme);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
export default themeManager;
