# VigilAI Frontend JavaScript Modules

This directory contains the JavaScript modules for the VigilAI frontend application.

## Structure

```
js/
├── app.js              # Main application entry point & router
├── api-client.js       # HTTP client with auth & error handling
├── auth.js             # Authentication utilities
├── storage.js          # LocalStorage wrapper
├── toast.js            # Toast notification system
├── modal.js            # Modal dialog utilities
├── pages/              # Page-specific modules
│   ├── dashboard.js    # Dashboard page logic
│   ├── incidents.js    # Incidents page logic
│   ├── pull-requests.js # Pull requests page logic
│   ├── applications.js # Applications page logic
│   ├── api-keys.js     # API keys page logic
│   └── settings.js     # Settings page logic
└── utils/              # Utility modules
    ├── validators.js   # Form validation utilities
    └── formatters.js   # Data formatting utilities
```

## Module System

This project uses **ES6 modules** (native JavaScript modules) for better organization and maintainability.

### Benefits of ES6 Modules:
- Native browser support (no bundler required)
- Clear dependency management
- Better code organization
- Tree-shaking support
- Async loading

### Usage

All JavaScript files are loaded as modules using `type="module"`:

```html
<script type="module" src="/js/app.js"></script>
```

### Importing Modules

```javascript
// Import default export
import ApiClient from './api-client.js';

// Import named exports
import { validateEmail, validatePassword } from './utils/validators.js';

// Import everything
import * as formatters from './utils/formatters.js';
```

### Exporting Modules

```javascript
// Default export
export default class ApiClient {
  // ...
}

// Named exports
export function validateEmail(email) {
  // ...
}

export function validatePassword(password) {
  // ...
}
```

## Development

### Installing Dependencies

```bash
cd frontend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Framework

- **Jest**: Unit testing framework
- **fast-check**: Property-based testing library
- **jsdom**: DOM testing environment

## Architecture

The frontend follows a modular architecture:

1. **Presentation Layer**: HTML/CSS (existing brutal design)
2. **Application Layer**: JavaScript modules (routing, state, UI)
3. **Data Layer**: API client (backend communication)

### Key Principles

- Progressive enhancement
- Modular architecture
- Centralized API communication
- Client-side routing
- Token-based authentication
- Error resilience

## Browser Compatibility

ES6 modules are supported in all modern browsers:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

For older browsers, consider using a bundler like Vite or Webpack.

## Next Steps

The following modules will be implemented in subsequent tasks:

1. Core utilities (storage, toast, modal, validators, formatters)
2. Authentication module
3. API client module
4. Router module
5. Page-specific modules
6. Backend API endpoints

See `.kiro/specs/html-frontend-implementation/tasks.md` for the complete implementation plan.
