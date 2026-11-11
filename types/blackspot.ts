export type HazardType =
  | "ACCIDENT_PRONE"
  | "BLIND_SPOT"
  | "SHARP_CURVE"
  | "SLIPPERY_ROAD"
  | "STEEP_SLOPE"
  | "OTHER";

export interface AccidentBlackspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  hazardType: HazardType;
  description?: string;
  feedbackCount?: number;
  routeId?: string;
  isActive?: boolean;
}

export interface SimulationRouteData {
  route_id: string;
  route_code: string;
  route_name: string;
  distance_km: number;
  total_waypoints: number;
  waypoints: [number, number][]; // [lat, lng]
  blackspots: AccidentBlackspot[];
  is_running: boolean;
  current_index: number;
}

export interface SimulationStatus {
  is_running: boolean;
  current_index: number;
  total_points: number;
  trip_id: string;
  vehicle_id: string;
  plate_number: string;
  driver_name: string;
  current_lat?: number;
  current_lng?: number;
  message?: string;
}
