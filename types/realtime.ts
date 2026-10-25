import { IncidentSeverity, SafetyAlertType } from "./hitl";

export interface GpsTelemetryEvent {
  vehicle_id: string;
  plate_number?: string;
  driver_id?: string;
  driver_name?: string;
  timestamp?: number | string;
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading_deg?: number;
  is_real_device?: boolean;
}

export interface SafetyAlertEvent {
  alert_id?: string;
  vehicle_id: string;
  plate_number?: string;
  driver_id?: string;
  driver_name?: string;
  shift_id?: string;
  alert_type: SafetyAlertType;
  severity: IncidentSeverity;
  timestamp: string | number;
  telemetry?: {
    latitude?: number;
    longitude?: number;
    speed_kmh?: number;
  };
  biometrics?: {
    ear?: number;
    mar?: number;
    pitch_deg?: number;
    yaw_deg?: number;
    perclos_60s?: number;
  };
  evidence?: {
    snapshot_url?: string;
  };
}

export interface HeartbeatEvent {
  device_id: string;
  vehicle_id?: string;
  timestamp: number | string;
  health?: {
    battery_pct?: number;
    cpu_temperature?: number;
    camera_fps?: number;
  };
}

export interface PingEvent {
  type: string;
  timestamp: number;
  active_clients: number;
}

export type RealtimeConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";
