import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Track if a token refresh is in progress to prevent multiple simultaneous refreshes
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add response interceptor for automatic token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Only handle TOKEN_EXPIRED errors that haven't been retried yet
    if (error.response?.status === 403 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trigger token refresh - new tokens are set as HttpOnly cookies automatically
        await axios.post(API_URLS.REFRESH);
        
        processQueue(null, 'refreshed');
        
        // Retry the original request - browser will use the new cookie
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed, logout user
        window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();

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
      
      // Check for return URL from session expiry redirect
      const searchParams = new URLSearchParams(location.search);
      const from = searchParams.get('from');
      
      // Redirect to original protected route or home
      navigate(from && from !== '/login' ? from : '/home');
      
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

  const register = async (email, password, name, consent = {}) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await axios.post(API_URLS.REGISTER, {
        email,
        password,
        name,
        // Affirmative-consent flags. The backend rejects registration unless all
        // three are the literal boolean `true` (GDPR Art. 7 demonstrable consent).
        acceptTerms: consent.acceptTerms === true,
        acceptPrivacy: consent.acceptPrivacy === true,
        confirmAge: consent.confirmAge === true
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
