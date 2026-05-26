import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';

const userRightsAPI = {
  getUserData: async () => {
    const response = await api.get(API_URLS.USER_DATA);
    return response.data;
  },

  updateUserData: async (data) => {
    const response = await api.put(API_URLS.USER_DATA, data);
    return response.data;
  },

  deleteAccount: async (password) => {
    const response = await api.delete(API_URLS.USER_ACCOUNT, { data: { password } });
    return response.data;
  },

  exportUserData: async () => {
    const response = await api.get(API_URLS.USER_EXPORT, {
      responseType: 'blob'
    });
    return response;
  }
};

export default userRightsAPI;
