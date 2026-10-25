// Sync với TripStatus enum BE
export type TripStatus =
  | "PLANNED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

// Sync với TripResponse BE
export interface TripResponse {
  id: string;
  startLocation: string;
  endLocation: string;
  vehicleId?: string;
  vehiclePlateNumber?: string;
  vehicleTypeName?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  distanceKm?: number;
  status: TripStatus;
  plannedStartTime?: string;
  plannedEndTime?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  routeId?: string;
  routeName?: string;
  somnolenceCount?: number;
  incidentCount?: number;
  gpsTrackCount?: number;
  createdAt?: string;
}

// Sync với TripRequest BE
export interface TripRequest {
  startLocation: string;
  endLocation: string;
  vehicleId?: string;
  driverId?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  status?: TripStatus;
  distanceKm?: number;
  note?: string;
  routeId?: string;
}

export interface TripGpsTrackResponse {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  recordedAt: string;
}
