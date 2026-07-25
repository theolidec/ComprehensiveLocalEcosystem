import api from '../utils/fetchClient';
import { API_URLS } from '../config/api';

const handleError = (error) => {
  const err = new Error(error.response?.data?.error || error.message || 'An error occurred');
  err.code = error.response?.data?.code || 'UNKNOWN_ERROR';
  err.status = error.response?.status;
  err.details = error.response?.data?.errors;
  throw err;
};

const radiationAPI = {
  // ─── Locations ───────────────────────────────────────────────────────────────
  getLocations: async () => {
    try {
      const res = await api.get(API_URLS.RADIATION_LOCATIONS);
      return res.data;
    } catch (e) { handleError(e); }
  },

  createLocation: async (data) => {
    try {
      const res = await api.post(API_URLS.RADIATION_LOCATIONS, data);
      return res.data;
    } catch (e) { handleError(e); }
  },

  updateLocation: async (id, data) => {
    try {
      const res = await api.put(`${API_URLS.RADIATION_LOCATIONS}/${id}`, data);
      return res.data;
    } catch (e) { handleError(e); }
  },

  deleteLocation: async (id) => {
    try {
      const res = await api.delete(`${API_URLS.RADIATION_LOCATIONS}/${id}`);
      return res.data;
    } catch (e) { handleError(e); }
  },

  // ─── Measurements ─────────────────────────────────────────────────────────────
  getMeasurements: async (params = {}) => {
    try {
      const res = await api.get(API_URLS.RADIATION_MEASUREMENTS, { params });
      return res.data;
    } catch (e) { handleError(e); }
  },

  getPublicMeasurements: async (params = {}) => {
    try {
      const res = await api.get(API_URLS.RADIATION_MEASUREMENTS_PUBLIC, { params });
      return res.data;
    } catch (e) { handleError(e); }
  },

  createMeasurement: async (data) => {
    try {
      const res = await api.post(API_URLS.RADIATION_MEASUREMENTS, data);
      return res.data;
    } catch (e) { handleError(e); }
  },

  updateMeasurement: async (id, data) => {
    try {
      const res = await api.put(`${API_URLS.RADIATION_MEASUREMENTS}/${id}`, data);
      return res.data;
    } catch (e) { handleError(e); }
  },

  softDelete: async (id, reason = '') => {
    try {
      const res = await api.delete(`${API_URLS.RADIATION_MEASUREMENTS}/${id}`, { data: { reason } });
      return res.data;
    } catch (e) { handleError(e); }
  },

  hardDelete: async (id) => {
    try {
      const res = await api.delete(`${API_URLS.RADIATION_MEASUREMENTS}/${id}/hard`);
      return res.data;
    } catch (e) { handleError(e); }
  },

  restore: async (id) => {
    try {
      const res = await api.put(`${API_URLS.RADIATION_MEASUREMENTS}/${id}/restore`);
      return res.data;
    } catch (e) { handleError(e); }
  },

  toggleVisibility: async (id) => {
    try {
      const res = await api.put(`${API_URLS.RADIATION_MEASUREMENTS}/${id}/visibility`);
      return res.data;
    } catch (e) { handleError(e); }
  },

  // ─── Analytics ────────────────────────────────────────────────────────────────
  getTimeSeries: async (params = {}) => {
    try {
      const res = await api.get(API_URLS.RADIATION_ANALYTICS_TIMESERIES, { params });
      return res.data;
    } catch (e) { handleError(e); }
  },

  getByLocation: async () => {
    try {
      const res = await api.get(API_URLS.RADIATION_ANALYTICS_BY_LOCATION);
      return res.data;
    } catch (e) { handleError(e); }
  },

  getHeatmap: async (year) => {
    try {
      const params = year ? { year } : {};
      const res = await api.get(API_URLS.RADIATION_ANALYTICS_HEATMAP, { params });
      return res.data;
    } catch (e) { handleError(e); }
  },

  // ─── Settings ─────────────────────────────────────────────────────────────────
  updateSettings: async (data) => {
    try {
      const res = await api.put(API_URLS.RADIATION_SETTINGS, data);
      return res.data;
    } catch (e) { handleError(e); }
  },
};

export default radiationAPI;
