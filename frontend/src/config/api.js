// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    LOGOUT_ALL: '/api/auth/logout-all',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // Health check
  HEALTH: '/health',
  
  // Calendar endpoints
  CALENDAR: {
    EVENTS: '/api/calendar/events',
    UPCOMING: '/api/calendar/events/upcoming',
    STATS: '/api/calendar/events/stats',
    EXPORT: '/api/calendar/events/export',
  },
};

// Create full URLs for endpoints
const createApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

// Export configuration
export { API_BASE_URL, API_ENDPOINTS, createApiUrl };

// Export commonly used URLs
export const API_URLS = {
  LOGIN: createApiUrl(API_ENDPOINTS.AUTH.LOGIN),
  REGISTER: createApiUrl(API_ENDPOINTS.AUTH.REGISTER),
  LOGOUT: createApiUrl(API_ENDPOINTS.AUTH.LOGOUT),
  LOGOUT_ALL: createApiUrl(API_ENDPOINTS.AUTH.LOGOUT_ALL),
  REFRESH: createApiUrl(API_ENDPOINTS.AUTH.REFRESH),
  ME: createApiUrl(API_ENDPOINTS.AUTH.ME),
  HEALTH: createApiUrl(API_ENDPOINTS.HEALTH),
  CALENDAR_EVENTS: createApiUrl(API_ENDPOINTS.CALENDAR.EVENTS),
  CALENDAR_UPCOMING: createApiUrl(API_ENDPOINTS.CALENDAR.UPCOMING),
  CALENDAR_STATS: createApiUrl(API_ENDPOINTS.CALENDAR.STATS),
  CALENDAR_EXPORT: createApiUrl(API_ENDPOINTS.CALENDAR.EXPORT),
};
