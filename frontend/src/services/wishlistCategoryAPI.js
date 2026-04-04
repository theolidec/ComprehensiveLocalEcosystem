import axios from 'axios';
import { API_URLS } from '../config/api';

axios.defaults.withCredentials = true;

const handleApiError = (error) => {
  const message = error.response?.data?.error || error.message || 'An error occurred';
  const code = error.response?.data?.code || 'UNKNOWN_ERROR';
  throw { message, code, status: error.response?.status };
};

export const wishlistCategoryAPI = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await axios.get(API_URLS.WISHLIST_CATEGORIES);
      return response.data.categories;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create a new category
  createCategory: async (categoryData) => {
    try {
      const response = await axios.post(API_URLS.WISHLIST_CATEGORIES, {
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
      const response = await axios.put(`${API_URLS.WISHLIST_CATEGORIES}/${id}`, categoryData);
      return response.data.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Delete a category
  deleteCategory: async (id) => {
    try {
      await axios.delete(`${API_URLS.WISHLIST_CATEGORIES}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Initialize default categories
  initDefaultCategories: async () => {
    try {
      const response = await axios.post(`${API_URLS.WISHLIST_CATEGORIES}/init`);
      return response.data.categories;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default wishlistCategoryAPI;
