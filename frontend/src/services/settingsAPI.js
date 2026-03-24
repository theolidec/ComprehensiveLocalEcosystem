import axios from 'axios';
import { API_URLS } from '../config/api';

const settingsAPI = {
  getSettings: async () => {
    const response = await axios.get(API_URLS.SETTINGS);
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await axios.put(API_URLS.SETTINGS, settings);
    return response.data;
  },

  updateProfile: async (profile) => {
    const response = await axios.put(`${API_URLS.SETTINGS}/profile`, profile);
    return response.data;
  },

  updateCalendarSettings: async (calendar) => {
    const response = await axios.put(`${API_URLS.SETTINGS}/calendar`, calendar);
    return response.data;
  },

  updateNotificationSettings: async (notifications) => {
    const response = await axios.put(`${API_URLS.SETTINGS}/notifications`, notifications);
    return response.data;
  },

  updateDisplaySettings: async (display) => {
    const response = await axios.put(`${API_URLS.SETTINGS}/display`, display);
    return response.data;
  },

  updatePrivacySettings: async (privacy) => {
    const response = await axios.put(`${API_URLS.SETTINGS}/privacy`, privacy);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axios.get(`${API_URLS.SETTINGS}/sessions`);
    return response.data;
  },

  revokeSession: async (sessionId) => {
    const response = await axios.delete(`${API_URLS.SETTINGS}/sessions/${sessionId}`);
    return response.data;
  },

  resetSettings: async () => {
    const response = await axios.post(`${API_URLS.SETTINGS}/reset`);
    return response.data;
  }
};

export default settingsAPI;
