export type IncidentType =
  | "ACCIDENT"
  | "BREAKDOWN"
  | "DELAY"
  | "WEATHER"
  | "PASSENGER";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Sync với IncidentResponse BE
export interface IncidentResponse {
  id: string;
  tripId: string;
  timeIncident: string; // LocalDateTime → ISO string
  type: IncidentType;
  description?: string;
  severity: IncidentSeverity;
  // Thông tin chuyến đi
  tripStartLocation?: string;
  tripEndLocation?: string;
  tripPlannedStartTime?: string;
}

// Sync với IncidentRequest BE
export interface IncidentRequest {
  tripId: string;
  timeIncident: string;
  type: IncidentType;
  description?: string;
  severity: IncidentSeverity;
}
