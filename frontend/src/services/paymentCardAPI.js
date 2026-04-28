import axios from 'axios';
import { API_URLS } from '../config/api';

axios.defaults.withCredentials = true;

const handleApiError = (error) => {
  const message = error.response?.data?.error || error.message || 'An error occurred';
  const code = error.response?.data?.code || 'UNKNOWN_ERROR';
  const err = new Error(message);
  err.code = code;
  err.status = error.response?.status;
  throw err;
};

export const paymentCardAPI = {
  getAllCards: async (params = {}) => {
    try {
      const { favorite, cardType } = params;
      const queryParams = new URLSearchParams();

      if (favorite === true) queryParams.append('favorite', 'true');
      if (cardType) queryParams.append('cardType', cardType);

      const url = `${API_URLS.PAYMENT_CARDS}?${queryParams.toString()}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getCardById: async (id) => {
    try {
      const response = await axios.get(`${API_URLS.PAYMENT_CARDS}/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  createCard: async (cardData) => {
    try {
      const response = await axios.post(API_URLS.PAYMENT_CARDS, {
        cardName: cardData.cardName,
        cardholderName: cardData.cardholderName,
        cardNumber: cardData.cardNumber,
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv,
        cardType: cardData.cardType,
        billingAddress: cardData.billingAddress,
        isDefault: cardData.isDefault || false
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateCard: async (id, cardData) => {
    try {
      const response = await axios.put(`${API_URLS.PAYMENT_CARDS}/${id}`, {
        cardName: cardData.cardName,
        cardholderName: cardData.cardholderName,
        cardNumber: cardData.cardNumber,
        expiryDate: cardData.expiryDate,
        cvv: cardData.cvv,
        cardType: cardData.cardType,
        billingAddress: cardData.billingAddress,
        isDefault: cardData.isDefault
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteCard: async (id) => {
    try {
      await axios.delete(`${API_URLS.PAYMENT_CARDS}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  decryptCard: async (id) => {
    try {
      const response = await axios.get(`${API_URLS.PAYMENT_CARDS}/${id}/decrypt`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  toggleFavorite: async (id) => {
    try {
      const response = await axios.post(`${API_URLS.PAYMENT_CARDS}/${id}/favorite`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  setDefaultCard: async (id) => {
    try {
      const response = await axios.post(`${API_URLS.PAYMENT_CARDS}/${id}/default`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};
