// API Configuration for different environments
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000/api'
  },
  production: {
    baseURL: '/.netlify/functions'
  }
};

// Determine current environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const config = isProduction ? API_CONFIG.production : API_CONFIG.development;

// API endpoints
const API_ENDPOINTS = {
  auth: {
    login: `${config.baseURL}/auth-login-debug`,
    verify: `${config.baseURL}/auth-verify`,
    logout: `${config.baseURL}/auth-logout`
  },
  admin: {
    inscriptions: `${config.baseURL}/admin-inscriptions`,
    stats: `${config.baseURL}/admin-stats`
  },
  inscriptions: {
    create: `${config.baseURL}/inscriptions`
  }
};

// Export for use in other scripts
window.API_ENDPOINTS = API_ENDPOINTS;