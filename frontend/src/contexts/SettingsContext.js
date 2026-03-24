import React, { createContext, useContext, useReducer, useEffect } from 'react';
import settingsAPI from '../services/settingsAPI';

const SettingsContext = createContext();

const settingsReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_SETTINGS':
      return { ...state, settings: action.payload, loading: false };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const defaultSettings = {
  profile: { name: '', bio: '', avatar: '' },
  calendar: {
    defaultView: 'month',
    weekStartsOn: 0,
    timezone: 'UTC',
    showWeekNumbers: false,
    defaultEventDuration: 60,
    workingHours: { start: '09:00', end: '17:00' }
  },
  notifications: {
    emailReminders: true,
    reminderTime: 15,
    eventUpdates: true,
    weeklyDigest: false
  },
  display: {
    theme: 'system',
    language: 'en',
    compactMode: false,
    showCompletedEvents: true
  },
  privacy: {
    shareCalendar: false,
    showBusyStatus: true
  }
};

const initialState = {
  settings: defaultSettings,
  loading: true,
  error: null
};

export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await settingsAPI.getSettings();
      dispatch({ type: 'LOAD_SETTINGS', payload: data.settings });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to load settings' });
    }
  };

  const updateSettings = async (settings) => {
    try {
      const data = await settingsAPI.updateSettings(settings);
      dispatch({ type: 'UPDATE_SETTINGS', payload: data.settings });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to update settings' });
      return { success: false, error: error.response?.data?.error };
    }
  };

  const updateProfile = async (profile) => {
    try {
      const data = await settingsAPI.updateProfile(profile);
      const newSettings = { ...state.settings, profile: data.profile };
      dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const updateCalendarSettings = async (calendar) => {
    try {
      const data = await settingsAPI.updateCalendarSettings(calendar);
      const newSettings = { ...state.settings, calendar: data.calendar };
      dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const updateNotificationSettings = async (notifications) => {
    try {
      const data = await settingsAPI.updateNotificationSettings(notifications);
      const newSettings = { ...state.settings, notifications: data.notifications };
      dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const updateDisplaySettings = async (display) => {
    try {
      const data = await settingsAPI.updateDisplaySettings(display);
      const newSettings = { ...state.settings, display: data.display };
      dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const updatePrivacySettings = async (privacy) => {
    try {
      const data = await settingsAPI.updatePrivacySettings(privacy);
      const newSettings = { ...state.settings, privacy: data.privacy };
      dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const resetSettings = async () => {
    try {
      const data = await settingsAPI.resetSettings();
      dispatch({ type: 'UPDATE_SETTINGS', payload: data.settings });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    loadSettings,
    updateSettings,
    updateProfile,
    updateCalendarSettings,
    updateNotificationSettings,
    updateDisplaySettings,
    updatePrivacySettings,
    resetSettings,
    clearError
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
