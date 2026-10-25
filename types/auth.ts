/**
 * Types & Schemas strictly aligned with docs/api-docs-swagger.json
 */

export type UserRole = "ADMIN" | "DRIVER" | "MANAGER";

export type AccountStatus = "ACTIVE" | "LOCKED" | "DISABLED";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface StaffAccountInfo {
  id?: string;
  username?: string;
  role?: UserRole;
  status?: AccountStatus;
}

export interface StaffResponse {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  email?: string;
  phone?: string;
  exactAddress?: string;
  commune?: string;
  province?: string;
  account?: StaffAccountInfo;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // yyyy-MM-dd
  gender?: Gender;
  phone: string;
  email?: string;
  exactAddress?: string;
  commune?: string;
  province?: string;
}

export interface AuthResponse {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  accountId?: string;
  username?: string;
  role?: UserRole;
  status?: AccountStatus;
  lastLoginAt?: string;
  staff?: StaffResponse;
}

export interface ApiResponseAuthResponse {
  success?: boolean;
  message?: string;
  data?: AuthResponse;
  errorCode?: string;
  timestamp?: string;
}
