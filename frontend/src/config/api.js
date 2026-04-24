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
    IMPORT: '/api/calendar/events/import',
  },

  // Categories endpoints
  CATEGORIES: '/api/categories',

  // Settings endpoints
  SETTINGS: '/api/settings',
  SETTINGS_SESSIONS: '/api/settings/sessions',

  // Password endpoints
  PASSWORDS: '/api/passwords',
  PASSWORD_CATEGORIES: '/api/password-categories',

  // Wishlist endpoints
  WISHLIST: {
    ITEMS: '/api/wishlist',
    STATS: '/api/wishlist/stats',
    ANALYTICS: '/api/wishlist/analytics',
    PUBLIC: '/api/wishlist/public',
    EXPORT_PDF: '/api/wishlist/export/pdf',
  },

  // Wishlist categories endpoints
  WISHLIST_CATEGORIES: '/api/wishlist-categories',
  
  // Multiple wishlists endpoints
  WISHLISTS: '/api/wishlists',
  
  // Follow/social endpoints
  FOLLOW: '/api/follow',

  // Wiki endpoints
  WIKIS: '/api/wikis',
  WIKIS_PUBLIC: '/api/wikis/public',
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
  CALENDAR_IMPORT: createApiUrl(API_ENDPOINTS.CALENDAR.IMPORT),
  CATEGORIES: createApiUrl(API_ENDPOINTS.CATEGORIES),
  SETTINGS: createApiUrl(API_ENDPOINTS.SETTINGS),
  PASSWORDS: createApiUrl(API_ENDPOINTS.PASSWORDS),
  PASSWORD_CATEGORIES: createApiUrl(API_ENDPOINTS.PASSWORD_CATEGORIES),
  WISHLIST_ITEMS: createApiUrl(API_ENDPOINTS.WISHLIST.ITEMS),
  WISHLIST_STATS: createApiUrl(API_ENDPOINTS.WISHLIST.STATS),
  WISHLIST_ANALYTICS: createApiUrl(API_ENDPOINTS.WISHLIST.ANALYTICS),
  WISHLIST_PUBLIC: createApiUrl(API_ENDPOINTS.WISHLIST.PUBLIC),
  WISHLIST_EXPORT_PDF: createApiUrl(API_ENDPOINTS.WISHLIST.EXPORT_PDF),
  WISHLIST_CATEGORIES: createApiUrl(API_ENDPOINTS.WISHLIST_CATEGORIES),
  WISHLISTS: createApiUrl(API_ENDPOINTS.WISHLISTS),
  FOLLOW: createApiUrl(API_ENDPOINTS.FOLLOW),
  WIKIS: createApiUrl(API_ENDPOINTS.WIKIS),
  WIKIS_PUBLIC: createApiUrl(API_ENDPOINTS.WIKIS_PUBLIC),
};
