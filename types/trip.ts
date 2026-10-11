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
  routeId: string;
  status: TripStatus;
  plannedStartTime: string; // ISO 8601 string từ JSON
  plannedEndTime: string;
  startTime?: string;
  endTime?: string;
  currentOrder?: number;
}

// Sync với TripRequest BE
export interface TripRequest {
  routeId: string;
  plannedStartTime: string; // LocalDateTime -> gửi dạng "2024-01-15T08:00:00"
  plannedEndTime: string;
  status?: TripStatus;
}
