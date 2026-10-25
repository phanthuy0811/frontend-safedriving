// Sync với VehicleStatus enum BE
export type VehicleStatus =
  | "AVAILABLE"
  | "IN_SERVICE"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";

// Sync với VehicleResponse BE
export interface VehicleResponse {
  id: string;
  plateNumber: string;
  vin?: string;
  capacity?: number;
  vehicleTypeId: number;
  vehicleTypeName: string;
  status: VehicleStatus;
  odometerKm?: number;
  // Các trường phục vụ module Fleet
  deviceId?: string;
  assignedDriverName?: string;
  assignedDriverId?: string;
}

export interface AssignDriverRequest {
  driver_id: string;
}

// Sync với VehicleRequest BE
export interface VehicleRequest {
  plateNumber: string;
  vin?: string;
  capacity?: number;
  vehicleTypeId: number;
  status?: VehicleStatus;
  odometerKm?: number;
}
