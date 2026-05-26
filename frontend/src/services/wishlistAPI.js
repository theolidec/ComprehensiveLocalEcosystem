import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';

const handleApiError = (error) => {
  const message = error.response?.data?.error || error.message || 'An error occurred';
  const code = error.response?.data?.code || 'UNKNOWN_ERROR';
  throw { message, code, status: error.response?.status };
};

export const wishlistsAPI = {
  getAll: async () => {
    try {
      const response = await api.get(API_URLS.WISHLISTS);
      return response.data.wishlists;
    } catch (error) {
      handleApiError(error);
    }
  },

  getTemplates: async () => {
    try {
      const response = await api.get(`${API_URLS.WISHLISTS}/templates`);
      return response.data.templates;
    } catch (error) {
      handleApiError(error);
    }
  },

  createFromTemplate: async (template, name) => {
    try {
      const response = await api.post(`${API_URLS.WISHLISTS}/from-template`, { template, name });
      return response.data.wishlist;
    } catch (error) {
      handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`${API_URLS.WISHLISTS}/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      const response = await api.post(API_URLS.WISHLISTS, data);
      return response.data.wishlist;
    } catch (error) {
      handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`${API_URLS.WISHLISTS}/${id}`, data);
      return response.data.wishlist;
    } catch (error) {
      handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`${API_URLS.WISHLISTS}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export const wishlistAPI = {
  // Get all wishlist items
  getItems: async (params = {}) => {
    try {
      const { category, status, priority, search, page = 1, limit = 20 } = params;
      const queryParams = new URLSearchParams();

      if (category && category !== 'all') queryParams.append('category', category);
      if (status && status !== 'all') queryParams.append('status', status);
      if (priority && priority !== 'all') queryParams.append('priority', priority);
      if (search) queryParams.append('search', search);
      queryParams.append('page', page);
      queryParams.append('limit', limit);

      const url = `${API_URLS.WISHLIST_ITEMS}?${queryParams.toString()}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get wishlist stats
  getStats: async () => {
    try {
      const response = await api.get(API_URLS.WISHLIST_STATS);
      return response.data.stats;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get wishlist analytics for charts
  getAnalytics: async () => {
    try {
      const response = await api.get(API_URLS.WISHLIST_ANALYTICS);
      return response.data.analytics;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get a single wishlist item by ID
  getItemById: async (id) => {
    try {
      const response = await api.get(`${API_URLS.WISHLIST_ITEMS}/${id}`);
      return response.data.item;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create a new wishlist item
  createItem: async (itemData) => {
    try {
      const response = await api.post(API_URLS.WISHLIST_ITEMS, {
        title: itemData.title,
        description: itemData.description,
        url: itemData.url,
        price: itemData.price,
        currency: itemData.currency || 'USD',
        priority: itemData.priority || 'medium',
        category: itemData.category || 'birthday',
        imageUrl: itemData.imageUrl,
        isPublic: itemData.isPublic || false
      });
      return response.data.item;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Update a wishlist item
  updateItem: async (id, itemData) => {
    try {
      const response = await api.put(`${API_URLS.WISHLIST_ITEMS}/${id}`, itemData);
      return response.data.item;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Delete a wishlist item
  deleteItem: async (id) => {
    try {
      await api.delete(`${API_URLS.WISHLIST_ITEMS}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Share/unshare wishlist item
  toggleShare: async (id) => {
    try {
      const response = await api.post(`${API_URLS.WISHLIST_ITEMS}/${id}/share`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get reservations for an item
  getReservations: async (id) => {
    try {
      const response = await api.get(`${API_URLS.WISHLIST_ITEMS}/${id}/reservations`);
      return response.data.reservations;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create a reservation for an item (public)
  createReservation: async (id, reservationData) => {
    try {
      const response = await api.post(`${API_URLS.WISHLIST_ITEMS}/${id}/reserve`, {
        name: reservationData.name,
        email: reservationData.email,
        message: reservationData.message,
        status: reservationData.status || 'reserved'
      });
      return response.data.reservation;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Cancel a reservation
  cancelReservation: async (reservationId) => {
    try {
      await api.delete(`${API_URLS.WISHLIST_ITEMS}/reservations/${reservationId}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get public wishlist item by share token
  getPublicItem: async (token) => {
    try {
      const response = await api.get(`${API_URLS.WISHLIST_PUBLIC}/${token}`);
      return response.data.item;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Export wishlist to PDF
  exportPDF: async (params = {}) => {
    try {
      const { category, status, priority, search, selectedItems } = params;
      const queryParams = new URLSearchParams();

      if (selectedItems && selectedItems.length > 0) {
        queryParams.append('items', selectedItems.join(','));
      } else {
        if (category && category !== 'all') queryParams.append('category', category);
        if (status && status !== 'all') queryParams.append('status', status);
        if (priority && priority !== 'all') queryParams.append('priority', priority);
        if (search) queryParams.append('search', search);
      }

      const url = `${API_URLS.WISHLIST_EXPORT_PDF}?${queryParams.toString()}`;
      const response = await api.get(url, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `wishlist-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Import wishlist from CSV
  importCSV: async (csv) => {
    try {
      const response = await api.post(API_URLS.WISHLIST_IMPORT_CSV, { csv });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export const followAPI = {
  searchUsers: async (query, page = 1, limit = 20) => {
    try {
      const response = await api.get(`${API_URLS.FOLLOW}/search`, { params: { q: query, page, limit } });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getFollowers: async (userId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`${API_URLS.FOLLOW}/${userId}/followers`, { params: { page, limit } });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getFollowing: async (userId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`${API_URLS.FOLLOW}/${userId}/following`, { params: { page, limit } });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  follow: async (userId) => {
    try {
      const response = await api.post(`${API_URLS.FOLLOW}/follow/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  unfollow: async (userId) => {
    try {
      const response = await api.delete(`${API_URLS.FOLLOW}/follow/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  isFollowing: async (userId) => {
    try {
      const response = await api.get(`${API_URLS.FOLLOW}/following/${userId}`);
      return response.data.isFollowing;
    } catch (error) {
      handleApiError(error);
    }
  },

  getPublicProfile: async (userId) => {
    try {
      const response = await api.get(`${API_URLS.FOLLOW}/public/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default wishlistAPI;
