import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';
import { handleApiError } from '../utils/apiError';

export const wishlistCategoryAPI = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get(API_URLS.WISHLIST_CATEGORIES);
      return response.data.categories;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create a new category
  createCategory: async (categoryData) => {
    try {
      const response = await api.post(API_URLS.WISHLIST_CATEGORIES, {
        name: categoryData.name,
        color: categoryData.color || '#8b5cf6',
        icon: categoryData.icon || 'gift'
      });
      return response.data.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Update a category
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`${API_URLS.WISHLIST_CATEGORIES}/${id}`, categoryData);
      return response.data.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Delete a category
  deleteCategory: async (id) => {
    try {
      await api.delete(`${API_URLS.WISHLIST_CATEGORIES}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Initialize default categories
  initDefaultCategories: async () => {
    try {
      const response = await api.post(`${API_URLS.WISHLIST_CATEGORIES}/init`);
      return response.data.categories;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default wishlistCategoryAPI;
