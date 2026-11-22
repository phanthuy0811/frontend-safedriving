export interface AlcoholRecordResponse {
  id: number;
  driverId: string;
  driverName?: string;
  tripId?: string;
  alcoholLevel: number;
  violation: boolean;
  measurementTime: string;
  notes?: string;
}

export interface AlcoholRecordFilter {
  driverId?: string;
}
