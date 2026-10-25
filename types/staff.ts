import { UserRole } from "./auth";

export interface IdReference {
  id: string;
}

export interface StaffAccountInfo {
  id?: string;
  username?: string;
  role?: UserRole;
  status?: string;
}

export interface StaffRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // format: date (yyyy-MM-dd)
  gender?: "MALE" | "FEMALE" | "OTHER";
  email?: string;
  phone: string;
  exactAddress?: string;
  commune?: string;
  province?: string;
  accountId?: string;
  account?: IdReference;
}

export interface StaffResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  email?: string;
  phone: string;
  exactAddress?: string;
  commune?: string;
  province?: string;
  account?: StaffAccountInfo;
  createdAt?: string;
}
