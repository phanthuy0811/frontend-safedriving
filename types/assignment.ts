// Sync với AssignmentResponse BE
export interface AssignmentResponse {
  id: string;
  tripId: string;
  driverId: string;
  accountId?: string;
  assignmentAt: string; // LocalDateTime → ISO string
  driverName?: string;
  vehiclePlate?: string;
  vehicleId?: string;
  routeCode?: string;
  routeName?: string;
  startLocation?: string;
  endLocation?: string;
  distanceKm?: number;
  status?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
}

// Sync với AssignmentRequest BE
export interface AssignmentRequest {
  tripId: string;
  driverId: string;
  accountId: string;
}

