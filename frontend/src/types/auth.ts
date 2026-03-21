// User type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  lastLogin?: string;
  isActive: boolean;
}

// Auth state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Auth action types
export type AuthActionType = 
  | 'LOGIN_START'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER_START'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILURE'
  | 'CLEAR_ERROR';

// Auth action interface
export interface AuthAction {
  type: AuthActionType;
  payload?: {
    user?: User;
    error?: string;
  };
}

// Login/Register credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

// API response types
export interface AuthResponse {
  message: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
  code: string;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
}

// Auth context value interface
export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}
