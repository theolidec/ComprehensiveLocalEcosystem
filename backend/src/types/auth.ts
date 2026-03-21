import { Request } from 'express';
import { IUser } from './user';

// Extended Request interface for authenticated requests
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  token?: string;
  refreshToken?: string;
  refreshTokenDoc?: any;
}

// Login request body
export interface LoginRequestBody {
  email: string;
  password: string;
}

// Register request body
export interface RegisterRequestBody {
  email: string;
  password: string;
  name: string;
}

// Refresh token request body
export interface RefreshTokenRequestBody {
  refreshToken?: string;
}

// Device info for refresh tokens
export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
}

// API response types
export interface SuccessResponse<T = any> {
  message: string;
  user?: T;
  data?: T;
}

export interface ErrorResponse {
  error: string;
  code: string;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
  stack?: string; // Only in development
}

// JWT payload types
export interface AccessTokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}
