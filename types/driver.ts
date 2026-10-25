import { StaffResponse } from "./staff";

export interface DriverVehicleInfo {
  id: string;
  plateNumber: string;
  vin?: string;
  capacity?: number;
  status?: string;
}

export interface DriverRequest {
  hireDate: string; // format: date
  urlImage?: string;
  isActive?: boolean;
  staffId?: string;
  staff?: { id: string };
  vehicleId?: string;
  vehicle?: { id: string };
}

export interface DriverCreateRequest {
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  email?: string;
  exactAddress?: string;
  commune?: string;
  province?: string;
  hireDate?: string;
  urlImage?: string;
  isActive?: boolean;
  vehicleId?: string;
}

export interface DriverResponse {
  id: string;
  hireDate?: string;
  urlImage?: string;
  isActive?: boolean;
  staff?: StaffResponse;
  vehicle?: DriverVehicleInfo;
}
