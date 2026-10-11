// Sync với AssignmentResponse BE
export interface AssignmentResponse {
  id: string;
  tripId: string;
  driverId: string;
  accountId: string;
  assignmentAt: string; // LocalDateTime → ISO string
}

// Sync với AssignmentRequest BE
export interface AssignmentRequest {
  tripId: string;
  driverId: string;
  accountId: string;
}
