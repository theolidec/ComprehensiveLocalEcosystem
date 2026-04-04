import axios from 'axios';
import { API_URLS } from '../config/api';

axios.defaults.withCredentials = true;

const handleApiError = (error) => {
  const message = error.response?.data?.error || error.message || 'An error occurred';
  const code = error.response?.data?.code || 'UNKNOWN_ERROR';
  throw { message, code, status: error.response?.status };
};

export const calendarAPI = {
  getEvents: async (params = {}) => {
    try {
      const { startDate, endDate, category, search } = params;
      const queryParams = new URLSearchParams();
      
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (category && category !== 'all') queryParams.append('category', category);
      if (search) queryParams.append('search', search);
      
      const url = `${API_URLS.CALENDAR_EVENTS}?${queryParams.toString()}`;
      const response = await axios.get(url);
      return response.data.events;
    } catch (error) {
      handleApiError(error);
    }
  },

  getEventById: async (id) => {
    try {
      const response = await axios.get(`${API_URLS.CALENDAR_EVENTS}/${id}`);
      return response.data.event;
    } catch (error) {
      handleApiError(error);
    }
  },

  createEvent: async (eventData) => {
    try {
      const response = await axios.post(API_URLS.CALENDAR_EVENTS, {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        category: eventData.category || 'work',
        attendees: eventData.attendees || [],
        reminder: eventData.reminder || 15,
        isRecurring: eventData.isRecurring || false,
        recurringPattern: eventData.recurringPattern || null,
        recurringEndDate: eventData.recurringEndDate || null,
        recurringOccurrences: eventData.recurringOccurrences || null,
        timezone: eventData.timezone || null,
        isAllDay: eventData.isAllDay || false,
        duration: eventData.duration || null
      });
      return response.data.event;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateEvent: async (id, eventData) => {
    try {
      const response = await axios.put(`${API_URLS.CALENDAR_EVENTS}/${id}`, eventData);
      return response.data.event;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteEvent: async (id) => {
    try {
      await axios.delete(`${API_URLS.CALENDAR_EVENTS}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  getUpcomingEvents: async (limit = 5) => {
    try {
      const response = await axios.get(`${API_URLS.CALENDAR_UPCOMING}?limit=${limit}`);
      return response.data.events;
    } catch (error) {
      handleApiError(error);
    }
  },

  getEventStats: async (month, year) => {
    try {
      const queryParams = new URLSearchParams();
      if (month !== undefined) queryParams.append('month', month);
      if (year !== undefined) queryParams.append('year', year);
      
      const url = `${API_URLS.CALENDAR_STATS}?${queryParams.toString()}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  exportEvents: async () => {
    try {
      const response = await axios.get(API_URLS.CALENDAR_EXPORT, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calendar-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      handleApiError(error);
    }
  },

  importEvents: async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await axios.post(API_URLS.CALENDAR_IMPORT, {
        events: data.events || []
      });
      
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

export default calendarAPI;
