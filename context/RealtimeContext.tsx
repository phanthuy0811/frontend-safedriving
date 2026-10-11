"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  GpsTelemetryEvent,
  HeartbeatEvent,
  PingEvent,
  RealtimeConnectionStatus,
  SafetyAlertEvent,
} from "@/types/realtime";
import { getHitlQueue } from "@/services/hitl.service";

interface RealtimeContextType {
  connectionStatus: RealtimeConnectionStatus;
  vehiclesGps: Record<string, GpsTelemetryEvent>;
  deviceHeartbeats: Record<string, HeartbeatEvent>;
  recentAlerts: SafetyAlertEvent[];
  pendingHitlCount: number;
  latestNotification: SafetyAlertEvent | null;
  dismissNotification: () => void;
  refreshPendingCount: () => Promise<void>;
  requestStream: (driverId: string) => void;
  stopStream: (driverId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("CONNECTING");
  const [vehiclesGps, setVehiclesGps] = useState<
    Record<string, GpsTelemetryEvent>
  >({});
  const [deviceHeartbeats, setDeviceHeartbeats] = useState<
    Record<string, HeartbeatEvent>
  >({});
  const [recentAlerts, setRecentAlerts] = useState<SafetyAlertEvent[]>([]);
  const [pendingHitlCount, setPendingHitlCount] = useState<number>(0);
  const [latestNotification, setLatestNotification] =
    useState<SafetyAlertEvent | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const queue = await getHitlQueue("PENDING", 0, 1);
      setPendingHitlCount(queue.totalElements ?? 0);
    } catch {
      // Backend might be warming up or auth token not yet present
    }
  }, []);

  
  const connectWs = useCallback(() => {
    if (typeof window === "undefined") return;
    const wsUrl = API_BASE_URL.replace("http://", "ws://").replace("https://", "wss://") + "/ws/realtime";
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "CAMERA_FRAME") {
            // High-fps stream: direct DOM update to avoid React re-renders
            const imgEl = document.getElementById(`camera-stream-${msg.driverId}`);
            if (imgEl) {
              imgEl.setAttribute("src", "data:image/jpeg;base64," + msg.data);
            }
          }
        } catch(e) {}
      };

      ws.onerror = () => {
        ws.close();
      };
      
      ws.onclose = () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 3000);
      };
      
    } catch(err) {
      console.error("WS error", err);
    }
  }, []);

  
  const requestStream = useCallback((driverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && driverId) {
      wsRef.current.send(JSON.stringify({ type: "REQUEST_STREAM", driverId: Number(driverId) }));
    }
  }, []);

  const stopStream = useCallback((driverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && driverId) {
      wsRef.current.send(JSON.stringify({ type: "STOP_STREAM", driverId: Number(driverId) }));
    }
  }, []);

  const connectSse = useCallback(() => {
    if (typeof window === "undefined") return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = `${API_BASE_URL}/api/v1/realtime/stream`;
    setConnectionStatus("CONNECTING");

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionStatus("CONNECTED");
      };

      es.addEventListener("connected", () => {
        setConnectionStatus("CONNECTED");
      });

      es.addEventListener("gps", (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data);
          const vId = raw.vehicle_id;
          if (vId) {
            // Extract coordinates safely from both flat and nested { gps: { latitude, longitude } } format
            const lat = raw.latitude ?? raw.gps?.latitude;
            const lng = raw.longitude ?? raw.gps?.longitude;
            const speed = raw.speed_kmh ?? raw.gps?.speed_kmh ?? 0;
            const heading = raw.heading_deg ?? raw.gps?.heading ?? 0;

            if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
              const normalized: GpsTelemetryEvent = {
                vehicle_id: vId,
                plate_number: raw.plate_number,
                driver_id: raw.driver_id,
                driver_name: raw.driver_name,
                timestamp: raw.timestamp || Date.now(),
                latitude: Number(lat),
                longitude: Number(lng),
                speed_kmh: Number(speed),
                heading_deg: Number(heading),
                is_real_device: true,
              };

              setVehiclesGps((prev) => {
                const next: Record<string, GpsTelemetryEvent> = { ...prev, [vId]: normalized };
                if (raw.plate_number && typeof raw.plate_number === "string") {
                  next[raw.plate_number] = normalized;
                }
                return next;
              });
            }
          }
        } catch (err) {
          console.error("Lỗi parse SSE gps:", err);
        }
      });

      es.addEventListener("alert", (e: MessageEvent) => {
        try {
          const payload: SafetyAlertEvent = JSON.parse(e.data);
          setRecentAlerts((prev) => [payload, ...prev.slice(0, 49)]);
          setPendingHitlCount((prev) => prev + 1);
          setLatestNotification(payload);
        } catch (err) {
          console.error("Lỗi parse SSE alert:", err);
        }
      });

      es.addEventListener("heartbeat", (e: MessageEvent) => {
        try {
          const payload: HeartbeatEvent = JSON.parse(e.data);
          const key = payload.vehicle_id || payload.device_id;
          if (key) {
            setDeviceHeartbeats((prev) => ({
              ...prev,
              [key]: payload,
            }));
          }
        } catch (err) {
          console.error("Lỗi parse SSE heartbeat:", err);
        }
      });

      es.addEventListener("ping", () => {
        setConnectionStatus("CONNECTED");
      });

      es.onerror = () => {
        setConnectionStatus("DISCONNECTED");
        es.close();
        // Schedule auto reconnect after 5s
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSse();
    connectWs();
        }, 5000);
      };
    } catch {
      setConnectionStatus("DISCONNECTED");
    }
  }, []);

  useEffect(() => {
    connectSse();
    refreshPendingCount();

    const interval = setInterval(() => {
      refreshPendingCount();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSse, connectWs, refreshPendingCount]);

  const dismissNotification = () => {
    setLatestNotification(null);
  };

  return (
    <RealtimeContext.Provider
      value={{
        connectionStatus,
        vehiclesGps,
        deviceHeartbeats,
        recentAlerts,
        pendingHitlCount,
        latestNotification,
        dismissNotification,
        refreshPendingCount,
        requestStream,
        stopStream,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
