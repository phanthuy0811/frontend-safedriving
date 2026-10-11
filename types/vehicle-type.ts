// Sync với VehicleTypeResponse BE
export interface VehicleTypeResponse {
  id: number;
  code: string;
  name: string;
  capacity: number;
}

// Sync với VehicleTypeRequest BE
export interface VehicleTypeRequest {
  code: string;
  name: string;
  capacity: number;
}
