import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';

const settingsAPI = {
  getSettings: async () => {
    const response = await api.get(API_URLS.SETTINGS);
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put(API_URLS.SETTINGS, settings);
    return response.data;
  },

  updateProfile: async (profile) => {
    const response = await api.put(`${API_URLS.SETTINGS}/profile`, profile);
    return response.data;
  },

  updateCalendarSettings: async (calendar) => {
    const response = await api.put(`${API_URLS.SETTINGS}/calendar`, calendar);
    return response.data;
  },

  updateNotificationSettings: async (notifications) => {
    const response = await api.put(`${API_URLS.SETTINGS}/notifications`, notifications);
    return response.data;
  },

  updateDisplaySettings: async (display) => {
    const response = await api.put(`${API_URLS.SETTINGS}/display`, display);
    return response.data;
  },

  updatePrivacySettings: async (privacy) => {
    const response = await api.put(`${API_URLS.SETTINGS}/privacy`, privacy);
    return response.data;
  },

  updateWishlistSettings: async (wishlist) => {
    const response = await api.put(`${API_URLS.SETTINGS}/wishlist`, wishlist);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get(`${API_URLS.SETTINGS}/sessions`);
    return response.data;
  },

  revokeSession: async (sessionId) => {
    const response = await api.delete(`${API_URLS.SETTINGS}/sessions/${sessionId}`);
    return response.data;
  },

  updateRadiationSettings: async (radiation) => {
    const response = await api.put(`${API_URLS.SETTINGS}/radiation`, radiation);
    return response.data;
  },

  resetSettings: async () => {
    const response = await api.post(`${API_URLS.SETTINGS}/reset`);
    return response.data;
  }
};

export default settingsAPI;
