import { Document, Types } from 'mongoose';

// User interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  
  // Virtuals
  isLocked: boolean;
}

// User creation data
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

// User login data
export interface LoginInput {
  email: string;
  password: string;
}

// User response data (without sensitive info)
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
}

// User model static methods
export interface IUserModel {
  // Static methods
  findByEmailWithPassword(email: string): Promise<IUser | null>;
  updateLastLogin(userId: string): Promise<IUser | null>;
  incrementLoginAttempts(userId: string): Promise<IUser | null>;
  
  // Document creation
  create(data: CreateUserInput): Promise<IUser>;
}
