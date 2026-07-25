import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';
import { handleApiError } from '../utils/apiError';

export const categoryAPI = {
  getCategories: async () => {
    try {
      const response = await api.get(`${API_URLS.CATEGORIES}`);
      return response.data.categories;
    } catch (error) {
      handleApiError(error);
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await api.post(`${API_URLS.CATEGORIES}`, {
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
      const response = await api.put(`${API_URLS.CATEGORIES}/${id}`, categoryData);
      return response.data.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`${API_URLS.CATEGORIES}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default categoryAPI;
