import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../config/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        user: action.payload.user, 
        isAuthenticated: true 
      };
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload, 
        user: null, 
        isAuthenticated: false 
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        error: null 
      };
    case 'REGISTER_START':
      return { ...state, loading: true, error: null };
    case 'REGISTER_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        user: action.payload.user, 
        isAuthenticated: true 
      };
    case 'REGISTER_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload, 
        user: null, 
        isAuthenticated: false 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Configure axios to work with cookies
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status on mount
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await axios.get(API_URLS.ME);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user
        }
      });
    } catch (error) {
      // User is not authenticated, clear any invalid state
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post(API_URLS.LOGIN, {
        email,
        password
      });
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.data.user }
      });
      
      // Redirect to home after successful login
      navigate('/home');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, name) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await axios.post(API_URLS.REGISTER, {
        email,
        password,
        name
      });
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user: response.data.user }
      });
      
      // Redirect to home after successful registration
      navigate('/home');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await axios.post(API_URLS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  };

  const logoutAll = async () => {
    try {
      await axios.post(API_URLS.LOGOUT_ALL);
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  };

  const refreshToken = async () => {
    try {
      await axios.post(API_URLS.REFRESH);
      return { success: true };
    } catch (error) {
      // Refresh failed, user needs to login again
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
      return { success: false, error: 'Session expired' };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    refreshToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
