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
  AlcoholViolationAlertEvent,
} from "@/types/realtime";
import { getHitlQueue } from "@/services/hitl.service";

interface RealtimeContextType {
  connectionStatus: RealtimeConnectionStatus;
  vehiclesGps: Record<string, GpsTelemetryEvent>;
  deviceHeartbeats: Record<string, HeartbeatEvent>;
  recentAlerts: SafetyAlertEvent[];
  pendingHitlCount: number;
  latestNotification: SafetyAlertEvent | null;
  alcoholAlert: AlcoholViolationAlertEvent | null;
  dismissNotification: () => void;
  dismissAlcoholAlert: () => void;
  refreshPendingCount: () => Promise<void>;
  requestStream: (driverId: string) => void;
  stopStream: (driverId: string) => void;
  tripUpdateTimestamp: number;
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
  const [alcoholAlert, setAlcoholAlert] = useState<AlcoholViolationAlertEvent | null>(null);
  const [tripUpdateTimestamp, setTripUpdateTimestamp] = useState<number>(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playAlertSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playBeep(880, now, 0.2);
      playBeep(880, now + 0.25, 0.2);
      playBeep(1174.66, now + 0.5, 0.4);
    } catch {
      // Audio might be blocked by browser policy until user interaction
    }
  }, []);

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

      ws.onopen = () => {
        console.log("✅ Đã kết nối WebSocket Admin Realtime");
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "CAMERA_FRAME") {
            // High-fps stream: direct DOM update to avoid React re-renders
            const imgEl = document.getElementById(`camera-stream-${msg.driverId}`);
            if (imgEl) {
              imgEl.setAttribute("src", "data:image/jpeg;base64," + msg.data);
            }
          } else if (msg.type === "ALCOHOL_VIOLATION_ALERT") {
            console.warn("🚨 [WS] Cảnh báo vi phạm nồng độ cồn nhận được:", msg);
            setAlcoholAlert({
              type: "ALCOHOL_VIOLATION_ALERT",
              tripId: msg.tripId,
              driverId: msg.driverId,
              driverName: msg.driverName,
              alcoholLevel: msg.alcoholLevel,
              message: msg.message,
            });
            // Phát âm thanh cảnh báo
            playAlertSound();
            // Kích hoạt cập nhật chuyến đi
            setTripUpdateTimestamp(Date.now());
          }
        } catch(e) {}
      };

      ws.onerror = (err) => {
        console.error("WebSocket Admin Error:", err);
        ws.close();
      };
      
      ws.onclose = () => {
        if (wsReconnectTimeoutRef.current) {
          clearTimeout(wsReconnectTimeoutRef.current);
        }
        wsReconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 3000);
      };
      
    } catch(err) {
      console.error("WS error", err);
    }
  }, [playAlertSound]);

  
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

    const sseUrl = `${API_BASE_URL}/realtime/stream`;
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
        }, 5000);
      };
    } catch {
      setConnectionStatus("DISCONNECTED");
    }
  }, []);

  useEffect(() => {
    connectSse();
    connectWs();
    refreshPendingCount();

    const interval = setInterval(() => {
      refreshPendingCount();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
    };
  }, [connectSse, connectWs, refreshPendingCount]);

  const dismissNotification = () => {
    setLatestNotification(null);
  };

  const dismissAlcoholAlert = () => {
    setAlcoholAlert(null);
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
        alcoholAlert,
        dismissNotification,
        dismissAlcoholAlert,
        refreshPendingCount,
        requestStream,
        stopStream,
        tripUpdateTimestamp,
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
