import { Types } from 'mongoose';
import { type ObjectIdString } from '../../types/global.types';

/**
 * Safely converts MongoDB ObjectId to string
 */
export function toObjectIdString(id: Types.ObjectId | string): ObjectIdString {
  if (typeof id === 'string') {
    return id;
  }
  return id.toString();
}

/**
 * Validates if a string is a valid ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Creates a new ObjectId from string
 */
export function toObjectId(id: string): Types.ObjectId {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new Types.ObjectId(id);
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type-safe environment variable getter
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

/**
 * Safely extract properties from Mongoose document
 */
export const extractUserData = (user: any) => {
  return {
    id: toObjectIdString(user._id),
    name: user.fullName,
    email: user.email,
    phone: user.phone,
    state: user.state,
    role: user.currentRole,
    ...(user.currentRole === 'farmer' && { farmAddress: user.farmAddress }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
