export type HitlStatus = "PENDING" | "APPROVED" | "REJECTED";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SafetyAlertType =
  | "DROWSINESS"
  | "DISTRACTION"
  | "YAWN"
  | "PHONE_USE"
  | "SEATBELT"
  | "NO_FACE";

export interface SafetyAlertDetailResponse {
  id: string;
  vehicle_id?: string;
  plate_number?: string;
  driver_id?: string;
  driver_name?: string;
  alert_type: SafetyAlertType;
  severity: IncidentSeverity;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  speed_kmh?: number;
  ear_value?: number;
  mar_value?: number;
  pitch_value?: number;
  yaw_value?: number;
  perclos_value?: number;
  snapshot_url?: string;
}

export interface HitlCaseResponse {
  id: string;
  alert_id?: string;
  status: HitlStatus;
  reviewer_id?: string;
  reviewer_username?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  alert?: SafetyAlertDetailResponse;
}

export interface HitlReviewDecisionRequest {
  decision: HitlStatus;
  notes?: string;
}
