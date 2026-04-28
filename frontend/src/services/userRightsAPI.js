import axios from 'axios';
import { API_URLS } from '../config/api';

const userRightsAPI = {
  getUserData: async () => {
    const response = await axios.get(API_URLS.USER_DATA);
    return response.data;
  },

  updateUserData: async (data) => {
    const response = await axios.put(API_URLS.USER_DATA, data);
    return response.data;
  },

  deleteAccount: async (password) => {
    const response = await axios.delete(API_URLS.USER_ACCOUNT, { data: { password } });
    return response.data;
  },

  exportUserData: async () => {
    const response = await axios.get(API_URLS.USER_EXPORT, {
      responseType: 'blob'
    });
    return response;
  }
};

export default userRightsAPI;
