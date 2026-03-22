import axios from 'axios';
import { API_URLS } from '../config/api';

axios.defaults.withCredentials = true;

const handleApiError = (error) => {
  const message = error.response?.data?.error || error.message || 'An error occurred';
  const code = error.response?.data?.code || 'UNKNOWN_ERROR';
  throw { message, code, status: error.response?.status };
};

export const categoryAPI = {
  getCategories: async () => {
    try {
      const response = await axios.get(`${API_URLS.CATEGORIES}`);
      return response.data.categories;
    } catch (error) {
      handleApiError(error);
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await axios.post(`${API_URLS.CATEGORIES}`, {
        name: categoryData.name,
        color: categoryData.color || '#3B82F6',
        icon: categoryData.icon || '📅'
      });
      return response.data.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await axios.put(`${API_URLS.CATEGORIES}/${id}`, categoryData);
      return response.data.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteCategory: async (id) => {
    try {
      await axios.delete(`${API_URLS.CATEGORIES}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default categoryAPI;
