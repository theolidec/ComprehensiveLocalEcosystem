import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';
import { handleApiError } from '../utils/apiError';

export const trackerAPI = {
  // ===== TASKS =====
  getTasks: async (params = {}) => {
    try {
      const { status, recurrence, priority, category, search, sort, page = 1, limit = 50 } = params;
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (recurrence) queryParams.append('recurrence', recurrence);
      if (priority) queryParams.append('priority', priority);
      if (category) queryParams.append('category', category);
      if (search) queryParams.append('search', search);
      if (sort) queryParams.append('sort', sort);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      const response = await api.get(`${API_URLS.TRACKER_TASKS}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getTodayTasks: async () => {
    try {
      const response = await api.get(API_URLS.TRACKER_TASKS_TODAY);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await api.post(API_URLS.TRACKER_TASKS, taskData);
      return response.data.task;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const response = await api.put(`${API_URLS.TRACKER_TASKS}/${id}`, taskData);
      return response.data.task;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`${API_URLS.TRACKER_TASKS}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ===== QUESTIONS =====
  getQuestions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append('category', params.category);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
      const url = `${API_URLS.TRACKER_QUESTIONS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data.questions;
    } catch (error) {
      handleApiError(error);
    }
  },

  createQuestion: async (questionData) => {
    try {
      const response = await api.post(API_URLS.TRACKER_QUESTIONS, questionData);
      return response.data.question;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateQuestion: async (id, questionData) => {
    try {
      const response = await api.put(`${API_URLS.TRACKER_QUESTIONS}/${id}`, questionData);
      return response.data.question;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteQuestion: async (id) => {
    try {
      await api.delete(`${API_URLS.TRACKER_QUESTIONS}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ===== RESPONSES / CHECK-IN =====
  getResponses: async (params = {}) => {
    try {
      const { startDate, endDate, page = 1, limit = 30 } = params;
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      const response = await api.get(`${API_URLS.TRACKER_RESPONSES}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getTodayResponse: async () => {
    try {
      const response = await api.get(API_URLS.TRACKER_RESPONSES_TODAY);
      return response.data.response;
    } catch (error) {
      handleApiError(error);
    }
  },

  saveResponse: async (responseData) => {
    try {
      const response = await api.post(API_URLS.TRACKER_RESPONSES, responseData);
      return response.data.response;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ===== STATS & ANALYTICS =====
  getStats: async () => {
    try {
      const response = await api.get(API_URLS.TRACKER_STATS);
      return response.data.stats;
    } catch (error) {
      handleApiError(error);
    }
  },

  getAnalytics: async () => {
    try {
      const response = await api.get(API_URLS.TRACKER_ANALYTICS);
      return response.data.analytics;
    } catch (error) {
      handleApiError(error);
    }
  },

  getHeatmap: async (year) => {
    try {
      const queryParams = new URLSearchParams();
      if (year) queryParams.append('year', year);
      const response = await api.get(`${API_URLS.TRACKER_HEATMAP}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ===== EXPORT / IMPORT =====
  exportData: async () => {
    try {
      const response = await api.get(API_URLS.TRACKER_EXPORT);
      return response.data.export;
    } catch (error) {
      handleApiError(error);
    }
  },

  importData: async (data) => {
    try {
      const response = await api.post(API_URLS.TRACKER_IMPORT, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default trackerAPI;
