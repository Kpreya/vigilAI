// VigilAI Documentation JavaScript

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme or default to light
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('.material-symbols-outlined');
  icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
}

// Code Tabs
const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const lang = button.getAttribute('data-lang');
    
    // Update active tab
    button.parentElement.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
    
    // Show corresponding code block
    const container = button.closest('.content');
    container.querySelectorAll('.code-block[data-lang]').forEach(block => {
      if (block.getAttribute('data-lang') === lang) {
        block.classList.remove('hidden');
      } else {
        block.classList.add('hidden');
      }
    });
  });
});

// Copy Code Function
function copyCode(button) {
  const codeBlock = button.closest('.code-block');
  const code = codeBlock.querySelector('code').textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    const icon = button.querySelector('.material-symbols-outlined');
    const originalIcon = icon.textContent;
    
    icon.textContent = 'check';
    button.style.backgroundColor = '#22c55e';
    
    setTimeout(() => {
      icon.textContent = originalIcon;
      button.style.backgroundColor = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code:', err);
  });
}

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Update active sidebar link
      document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
      });
      this.classList.add('active');
    }
  });
});

// Highlight Active Section on Scroll
const sections = document.querySelectorAll('h2[id], h3[id]');
const sidebarLinks = document.querySelectorAll('.sidebar-link');

function highlightActiveSection() {
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= sectionTop - 100) {
      current = section.getAttribute('id');
    }
  });
  
  sidebarLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', highlightActiveSection);
highlightActiveSection(); // Initial call
