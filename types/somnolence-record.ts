// Sync với SomnolenceRecordResponse BE (id là Long → number)
export interface SomnolenceRecordResponse {
  id: number;
  driverId: string;
  vehicleId?: string;
  recordTime: string; // LocalDateTime → ISO string
  drowsinessLevel?: number; // 0–100
  imageUrl?: string;
  notes?: string;
}

// Sync với SomnolenceRecordRequest BE
export interface SomnolenceRecordRequest {
  driverId: string;
  vehicleId?: string;
  recordTime?: string;
  drowsinessLevel?: number;
  imageUrl?: string;
  notes?: string;
}
