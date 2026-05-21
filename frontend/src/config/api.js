// API configuration
// Derive the API base URL at runtime so that devices on the local network
// (phones, tablets) that load the app from e.g. https://192.168.1.128:3000
// will call the backend on the same host instead of their own `localhost`.
const _configuredApiUrl = process.env.REACT_APP_API_URL || 'https://localhost:3443';
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const pageHostname = window.location.hostname;
    try {
      const configuredUrl = new URL(_configuredApiUrl);
      if (configuredUrl.hostname !== pageHostname) {
        configuredUrl.hostname = pageHostname;
        return configuredUrl.origin;
      }
    } catch (_) {}
  }
  return _configuredApiUrl;
})();

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

  // Payment card endpoints
  PAYMENT_CARDS: '/api/payment-cards',

  // Wishlist endpoints
  WISHLIST: {
    ITEMS: '/api/wishlist',
    STATS: '/api/wishlist/stats',
    ANALYTICS: '/api/wishlist/analytics',
    PUBLIC: '/api/wishlist/public',
    EXPORT_PDF: '/api/wishlist/export/pdf',
    IMPORT_CSV: '/api/wishlist/import/csv',
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

  // User rights endpoints (GDPR)
  USER: {
    DATA: '/api/user/data',
    ACCOUNT: '/api/user/account',
    EXPORT: '/api/user/export',
  },

  // Tracker endpoints
  TRACKER: {
    TASKS: '/api/tracker/tasks',
    TASKS_TODAY: '/api/tracker/tasks/today',
    QUESTIONS: '/api/tracker/questions',
    RESPONSES: '/api/tracker/responses',
    RESPONSES_TODAY: '/api/tracker/responses/today',
    STATS: '/api/tracker/stats',
    ANALYTICS: '/api/tracker/analytics',
    HEATMAP: '/api/tracker/heatmap',
    EXPORT: '/api/tracker/export',
    IMPORT: '/api/tracker/import',
  },

  // Music endpoints
  MUSIC: {
    UPLOAD: '/api/music/upload',
    MY: '/api/music/my',
    PUBLIC: '/api/music/public',
    STREAM: '/api/music/stream',
    PLAYLIST: '/api/music/playlist',
    PLAYLIST_MY: '/api/music/playlist/my',
    PLAYLIST_PUBLIC: '/api/music/playlist/public',
    PLAYLIST_ADD: '/api/music/playlist/add',
    PLAYLIST_REMOVE: '/api/music/playlist/remove',
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
  CALENDAR_IMPORT: createApiUrl(API_ENDPOINTS.CALENDAR.IMPORT),
  CATEGORIES: createApiUrl(API_ENDPOINTS.CATEGORIES),
  SETTINGS: createApiUrl(API_ENDPOINTS.SETTINGS),
  PASSWORDS: createApiUrl(API_ENDPOINTS.PASSWORDS),
  PASSWORD_CATEGORIES: createApiUrl(API_ENDPOINTS.PASSWORD_CATEGORIES),
  PAYMENT_CARDS: createApiUrl(API_ENDPOINTS.PAYMENT_CARDS),
  WISHLIST_ITEMS: createApiUrl(API_ENDPOINTS.WISHLIST.ITEMS),
  WISHLIST_STATS: createApiUrl(API_ENDPOINTS.WISHLIST.STATS),
  WISHLIST_ANALYTICS: createApiUrl(API_ENDPOINTS.WISHLIST.ANALYTICS),
  WISHLIST_PUBLIC: createApiUrl(API_ENDPOINTS.WISHLIST.PUBLIC),
  WISHLIST_EXPORT_PDF: createApiUrl(API_ENDPOINTS.WISHLIST.EXPORT_PDF),
  WISHLIST_IMPORT_CSV: createApiUrl(API_ENDPOINTS.WISHLIST.IMPORT_CSV),
  WISHLIST_CATEGORIES: createApiUrl(API_ENDPOINTS.WISHLIST_CATEGORIES),
  WISHLISTS: createApiUrl(API_ENDPOINTS.WISHLISTS),
  FOLLOW: createApiUrl(API_ENDPOINTS.FOLLOW),
  WIKIS: createApiUrl(API_ENDPOINTS.WIKIS),
  WIKIS_PUBLIC: createApiUrl(API_ENDPOINTS.WIKIS_PUBLIC),
  USER_DATA: createApiUrl(API_ENDPOINTS.USER.DATA),
  USER_ACCOUNT: createApiUrl(API_ENDPOINTS.USER.ACCOUNT),
  USER_EXPORT: createApiUrl(API_ENDPOINTS.USER.EXPORT),
  TRACKER_TASKS: createApiUrl(API_ENDPOINTS.TRACKER.TASKS),
  TRACKER_TASKS_TODAY: createApiUrl(API_ENDPOINTS.TRACKER.TASKS_TODAY),
  TRACKER_QUESTIONS: createApiUrl(API_ENDPOINTS.TRACKER.QUESTIONS),
  TRACKER_RESPONSES: createApiUrl(API_ENDPOINTS.TRACKER.RESPONSES),
  TRACKER_RESPONSES_TODAY: createApiUrl(API_ENDPOINTS.TRACKER.RESPONSES_TODAY),
  TRACKER_STATS: createApiUrl(API_ENDPOINTS.TRACKER.STATS),
  TRACKER_ANALYTICS: createApiUrl(API_ENDPOINTS.TRACKER.ANALYTICS),
  TRACKER_HEATMAP: createApiUrl(API_ENDPOINTS.TRACKER.HEATMAP),
  TRACKER_EXPORT: createApiUrl(API_ENDPOINTS.TRACKER.EXPORT),
  TRACKER_IMPORT: createApiUrl(API_ENDPOINTS.TRACKER.IMPORT),
  MUSIC_UPLOAD: createApiUrl(API_ENDPOINTS.MUSIC.UPLOAD),
  MUSIC_MY: createApiUrl(API_ENDPOINTS.MUSIC.MY),
  MUSIC_PUBLIC: createApiUrl(API_ENDPOINTS.MUSIC.PUBLIC),
  MUSIC_STREAM: createApiUrl(API_ENDPOINTS.MUSIC.STREAM),
  MUSIC_PLAYLIST: createApiUrl(API_ENDPOINTS.MUSIC.PLAYLIST),
  MUSIC_PLAYLIST_MY: createApiUrl(API_ENDPOINTS.MUSIC.PLAYLIST_MY),
  MUSIC_PLAYLIST_PUBLIC: createApiUrl(API_ENDPOINTS.MUSIC.PLAYLIST_PUBLIC),
  MUSIC_PLAYLIST_ADD: createApiUrl(API_ENDPOINTS.MUSIC.PLAYLIST_ADD),
  MUSIC_PLAYLIST_REMOVE: createApiUrl(API_ENDPOINTS.MUSIC.PLAYLIST_REMOVE),
};
