import { StaffResponse } from "./auth";
import { VehicleStatus } from "./vehicle";

export interface DriverVehicleInfo {
  id: string;
  plateNumber: string;
  vin?: string;
  capacity?: number;
  status?: VehicleStatus;
}

export interface DriverResponse {
  id: string;
  hireDate: string; // YYYY-MM-DD
  urlImage?: string;
  isActive: boolean;
  staff?: StaffResponse;
  vehicle?: DriverVehicleInfo;
}

export interface DriverRequest {
  hireDate: string; // YYYY-MM-DD
  urlImage?: string;
  isActive?: boolean;
  staffId?: string;
  vehicleId?: string;
}
