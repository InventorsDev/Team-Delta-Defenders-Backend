import { type Document } from 'mongoose';
import { type UserRole } from '../auth/schemas/user.schema';

// Base Mongoose Document types
export type MongooseDocument<T> = T & Document;

// User-related types
export interface UserPayload {
  id: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

// Environment variables type
export interface EnvironmentVariables {
  JWT_SECRET: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  PORT?: string;
}

// Utility type for ObjectId conversion
export type ObjectIdString = string;

// Request with user type (for guards and decorators)
export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

// Generic API response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
