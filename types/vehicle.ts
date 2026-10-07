export type VehicleStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "MAINTENANCE"
  | "DECOMMISSIONED";

export interface VehicleBasicResponse {
  id: string;
  plate_number: string;
  model?: string;
  status: string;
}

export interface VehicleResponse {
  id: string;
  plate_number: string;
  vin?: string;
  capacity?: number;
  vehicle_type_name?: string;
  status: VehicleStatus;
  device_id?: string;
  odometer_km?: number;
  assigned_driver_id?: string;
  assigned_driver_name?: string;
}

export interface AssignDriverRequest {
  driver_id: string;
}
