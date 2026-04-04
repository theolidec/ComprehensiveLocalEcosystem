import axios from 'axios';
import { API_URLS } from '../config/api';

axios.defaults.withCredentials = true;

const handleApiError = (error) => {
  const message = error.response?.data?.error || error.message || 'An error occurred';
  const code = error.response?.data?.code || 'UNKNOWN_ERROR';
  throw { message, code, status: error.response?.status };
};

export const passwordAPI = {
  getAllPasswords: async (params = {}) => {
    try {
      const { category, favorite, search } = params;
      const queryParams = new URLSearchParams();

      if (category) queryParams.append('category', category);
      if (favorite === true) queryParams.append('favorite', 'true');
      if (search) queryParams.append('search', search);

      const url = `${API_URLS.PASSWORDS}?${queryParams.toString()}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getPasswordById: async (id) => {
    try {
      const response = await axios.get(`${API_URLS.PASSWORDS}/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  createPassword: async (passwordData) => {
    try {
      const response = await axios.post(API_URLS.PASSWORDS, {
        title: passwordData.title,
        username: passwordData.username,
        password: passwordData.password,
        website: passwordData.website,
        category: passwordData.category || 'other',
        notes: passwordData.notes,
        isFavorite: passwordData.isFavorite || false
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updatePassword: async (id, passwordData) => {
    try {
      const response = await axios.put(`${API_URLS.PASSWORDS}/${id}`, {
        title: passwordData.title,
        username: passwordData.username,
        password: passwordData.password,
        website: passwordData.website,
        category: passwordData.category,
        notes: passwordData.notes,
        isFavorite: passwordData.isFavorite
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deletePassword: async (id) => {
    try {
      await axios.delete(`${API_URLS.PASSWORDS}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  decryptPassword: async (id) => {
    try {
      const response = await axios.get(`${API_URLS.PASSWORDS}/${id}/decrypt`);
      return response.data.password;
    } catch (error) {
      handleApiError(error);
    }
  },

  toggleFavorite: async (id) => {
    try {
      const response = await axios.post(`${API_URLS.PASSWORDS}/${id}/favorite`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  exportPasswords: async () => {
    try {
      const response = await axios.get(`${API_URLS.PASSWORDS}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data, null, 2)]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'passwords-backup.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  importPasswords: async (data) => {
    try {
      const response = await axios.post(`${API_URLS.PASSWORDS}/import`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getCategories: async () => {
    try {
      const response = await axios.get(API_URLS.PASSWORD_CATEGORIES);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axios.post(API_URLS.PASSWORD_CATEGORIES, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await axios.put(`${API_URLS.PASSWORD_CATEGORIES}/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axios.delete(`${API_URLS.PASSWORD_CATEGORIES}/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default passwordAPI;
