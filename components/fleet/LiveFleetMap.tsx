"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { VehicleResponse } from "@/types/vehicle";
import { GpsTelemetryEvent } from "@/types/realtime";
import { useRealtime } from "@/context/RealtimeContext";
import { AccidentBlackspot } from "@/types/blackspot";
import {
  getActiveBlackspots,
  getSimulationRoute,
  startGpsSimulation,
  stopGpsSimulation,
  getSimulationStatus,
} from "@/services/simulation.service";

interface LiveFleetMapProps {
  vehicles: VehicleResponse[];
  vehiclesGps: Record<string, GpsTelemetryEvent>;
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicleId: string) => void;
}

type MapLayerType = "street" | "satellite" | "dark";

// Danh sách 3 Điểm đen tai nạn mặc định (Hà Nội E2E)
const DEFAULT_BLACKSPOTS: AccidentBlackspot[] = [
  {
    id: "blackspot-hn-01",
    name: "Điểm đen Ngã tư Cầu Giấy (Chùa Hà - Trần Đăng Ninh)",
    latitude: 21.031303,
    longitude: 105.791393,
    radiusMeters: 200,
    hazardType: "ACCIDENT_PRONE",
    description: "Nút giao mật độ phương tiện đông, tài xế phản hồi hay xảy ra va chạm do xe máy tạt đầu khi chuyển làn.",
    feedbackCount: 28,
  },
  {
    id: "blackspot-hn-02",
    name: "Nút giao Daewoo Liễu Giai - Kim Mã",
    latitude: 21.031284,
    longitude: 105.813089,
    radiusMeters: 250,
    hazardType: "BLIND_SPOT",
    description: "Góc cua rộng dưới chân cầu vượt, điểm mù xe buýt và ô tô lớn khi nhập làn giờ tan tầm.",
    feedbackCount: 35,
  },
  {
    id: "blackspot-hn-03",
    name: "Khúc cua dốc hẹp Cửa Nam - Điện Biên Phủ",
    latitude: 21.026883,
    longitude: 105.843878,
    radiusMeters: 200,
    hazardType: "SHARP_CURVE",
    description: "Khúc cua gắt góc hẹp, tầm quan sát bị cây và nhà che khuất, mặt đường trơn trượt khi mưa lớn.",
    feedbackCount: 19,
  },
];

function calcDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LiveFleetMap({
  vehicles,
  vehiclesGps,
  selectedVehicleId,
  onSelectVehicle,
}: LiveFleetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const blackspotsGroupRef = useRef<L.FeatureGroup | null>(null);
  const routeTrackGroupRef = useRef<L.FeatureGroup | null>(null);
  const trailPolylineRef = useRef<L.Polyline | null>(null);
  const liveTrailCoordsRef = useRef<[number, number][]>([]);

  const hasFitRef = useRef(false);
  const [mapType, setMapType] = useState<MapLayerType>("street");
  const { vehiclesGps: realtimeGps } = useRealtime();

  // Điểm đen tai nạn và Trạng thái Mô phỏng E2E
  const [blackspots, setBlackspots] = useState<AccidentBlackspot[]>(DEFAULT_BLACKSPOTS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simStartIndex, setSimStartIndex] = useState<number>(105);
  const [simSpeed, setSimSpeed] = useState<number>(2.0);
  const [activeGeofenceAlert, setActiveGeofenceAlert] = useState<{
    spotName: string;
    distance: number;
    hazardType: string;
    description?: string;
  } | null>(null);

  // Tọa độ tuyến đường 9.4 km OSRM
  const waypointsRef = useRef<[number, number][]>([]);
  const simIndexRef = useRef<number>(0);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Vị trí tức thời của xe mô phỏng 30F-13579
  const [simCarPosition, setSimCarPosition] = useState<[number, number]>([21.0288, 105.7781]);
  const [simCarSpeed, setSimCarSpeed] = useState<number>(40.0);

  // Tile layer URLs (100% accessible in VN without API keys)
  const getTileUrl = (type: MapLayerType) => {
    switch (type) {
      case "satellite":
        return "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
      case "dark":
      case "street":
      default:
        return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    }
  };

  // 1. Initialize Map instance and store in state (React 19 / StrictMode safe)
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    // Default center: Ngã tư Cầu Giấy (Điểm đen 1)
    const defaultCenter: L.LatLngExpression = [21.0313, 105.7913];
    const mapInstance = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    const initialTiles = L.tileLayer(getTileUrl(mapType), {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(mapInstance);
    tileLayerRef.current = initialTiles;

    // Feature Groups
    const blackspotsGroup = L.featureGroup().addTo(mapInstance);
    blackspotsGroupRef.current = blackspotsGroup;

    const routeTrackGroup = L.featureGroup().addTo(mapInstance);
    routeTrackGroupRef.current = routeTrackGroup;

    // Đường line xanh lộ trình GPS đã lăn bánh
    const trail = L.polyline([], {
      color: "#0284c7",
      weight: 6,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(routeTrackGroup);
    trailPolylineRef.current = trail;

    const markersGroup = L.featureGroup().addTo(mapInstance);
    markersGroupRef.current = markersGroup;

    setMap(mapInstance);

    const timer = setTimeout(() => {
      mapInstance.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      mapInstance.remove();
      setMap(null);
      markersGroupRef.current = null;
      blackspotsGroupRef.current = null;
      routeTrackGroupRef.current = null;
      trailPolylineRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Fetch Blackspots & Simulation route waypoints on mount
  useEffect(() => {
    // 2.1 Lấy điểm đen từ Backend API
    getActiveBlackspots().then((spots) => {
      if (spots && spots.length > 0) {
        setBlackspots(spots);
      }
    });

    // 2.2 Nạp 393 tọa độ tim đường từ Backend hoặc file static
    const loadWaypoints = async () => {
      try {
        const routeData = await getSimulationRoute();
        if (routeData && routeData.waypoints && routeData.waypoints.length > 0) {
          waypointsRef.current = routeData.waypoints;
          return;
        }
      } catch (e) {
        // Fallback static
      }

      try {
        const res = await fetch("/data/hn_route_e2e.json");
        const json = await res.json();
        const coords = json?.geometry?.coordinates;
        if (Array.isArray(coords)) {
          // Chuyển đổi [lng, lat] sang Leaflet [lat, lng]
          waypointsRef.current = coords.map((c: [number, number]) => [c[1], c[0]]);
        }
      } catch (err) {
        console.error("Không thể nạp hn_route_e2e.json", err);
      }
    };

    loadWaypoints();

    // 2.3 Kiểm tra trạng thái mô phỏng
    getSimulationStatus().then((st) => {
      if (st?.is_running) {
        setIsSimulating(true);
        if (st.current_lat && st.current_lng) {
          setSimCarPosition([st.current_lat, st.current_lng]);
        }
      }
    });
  }, []);

  // 3. Switch Tile Layer when mapType changes
  useEffect(() => {
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const newTiles = L.tileLayer(getTileUrl(mapType), {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    tileLayerRef.current = newTiles;
    map.invalidateSize();
  }, [map, mapType]);

  // 4. Render Accident Blackspots (Red Circles 200m & Warning Flags)
  useEffect(() => {
    if (!map || !blackspotsGroupRef.current || blackspots.length === 0) return;
    const group = blackspotsGroupRef.current;
    group.clearLayers();

    blackspots.forEach((spot) => {
      const isAlerting = activeGeofenceAlert?.spotName === spot.name;

      // 1. Red circle for warning radius (200m / 250m)
      const circle = L.circle([spot.latitude, spot.longitude], {
        radius: spot.radiusMeters || 200,
        color: isAlerting ? "#b91c1c" : "#dc2626",
        fillColor: isAlerting ? "#ef4444" : "#f87171",
        fillOpacity: isAlerting ? 0.45 : 0.22,
        weight: isAlerting ? 3 : 2,
        dashArray: isAlerting ? undefined : "6, 6",
      });

      // 2. Custom Flag / Hazard Icon
      const flagHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transform: translate(-50%, -50%);
        ">
          <span style="
            position: absolute;
            width: ${isAlerting ? "46px" : "32px"};
            height: ${isAlerting ? "46px" : "32px"};
            border-radius: 50%;
            background: rgba(239, 68, 68, ${isAlerting ? "0.6" : "0.3"});
            animation: beacon-pulse 1.3s infinite ease-in-out;
          "></span>
          <div style="
            background: ${isAlerting ? "#991b1b" : "#dc2626"};
            color: white;
            border-radius: 9999px;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
            border: 2px solid #ffffff;
            transition: all 0.3s ease;
          ">
            🚩
          </div>
        </div>
      `;

      const flagIcon = L.divIcon({
        className: "clean-plate-tooltip",
        html: flagHtml,
        iconSize: [30, 30],
      });

      const marker = L.marker([spot.latitude, spot.longitude], { icon: flagIcon });

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 240px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 16px;">🚩</span>
            <span style="font-size: 13px; font-weight: bold; color: #0f172a;">${spot.name}</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
            <span style="background: #fee2e2; color: #b91c1c; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; border: 1px solid #fca5a5;">
              BÁN KÍNH: ${spot.radiusMeters}M
            </span>
            <span style="background: #fef3c7; color: #92400e; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 9999px;">
              ${spot.hazardType}
            </span>
          </div>
          <p style="font-size: 11px; color: #475569; margin-bottom: 8px; line-height: 1.4;">
            ${spot.description || "Điểm giao cắt nguy hiểm cần chú ý quan sát và giảm tốc độ."}
          </p>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            🗣️ ${spot.feedbackCount || 0} lượt tài xế phản hồi va chạm
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      group.addLayer(circle);
      group.addLayer(marker);
    });
  }, [map, blackspots, activeGeofenceAlert]);

  // 5. Render Vehicles & Update Realtime Markers
  useEffect(() => {
    if (!map || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // Danh sách xe: Đảm bảo xe thử nghiệm 30F-13579 LUÔN CÓ MẶT ở đầu danh sách
    const SIM_VEHICLE: VehicleResponse = {
      id: "58591121-1660-44c0-9ca6-94eeff2b3d5b",
      plateNumber: "30F-13579",
      status: "IN_SERVICE" as const,
      assignedDriverName: "Nguyễn Văn A (App Mobile)",
      vehicleTypeId: 1,
      vehicleTypeName: "VinFast VF8 Eco (Xe Thử Nghiệm E2E)",
    };

    const combinedVehicles = [SIM_VEHICLE];
    (vehicles || []).forEach((v) => {
      if (v.plateNumber !== "30F-13579" && v.id !== SIM_VEHICLE.id) {
        combinedVehicles.push(v);
      }
    });

    combinedVehicles.forEach((vehicle, idx) => {
      const isSimCar = vehicle.plateNumber === "30F-13579" || vehicle.id === SIM_VEHICLE.id;
      const liveGps = (vehiclesGps && vehiclesGps[vehicle.id]) || (realtimeGps && realtimeGps[vehicle.id]);

      let lat: number;
      let lng: number;
      let speedText: string;

      if (isSimCar) {
        lat = simCarPosition[0];
        lng = simCarPosition[1];
        speedText = `${simCarSpeed.toFixed(1)} km/h`;
      } else if (liveGps?.latitude && liveGps?.longitude) {
        lat = Number(liveGps.latitude);
        lng = Number(liveGps.longitude);
        speedText = `${liveGps.speed_kmh?.toFixed(1) || "0.0"} km/h`;
      } else {
        // Tọa độ mẫu của các xe khác trong đội xe
        const sampleLocations = [
          [21.0168, 105.8164], // Đống Đa
          [21.0244, 105.8536], // Nhà Hát Lớn
          [21.0360, 105.7830], // Cầu Giấy
        ];
        const seed = sampleLocations[idx % sampleLocations.length];
        lat = seed[0];
        lng = seed[1];
        speedText = "0.0 km/h";
      }

      const isSelected = selectedVehicleId === vehicle.id;

      // 1. Radar Circle Halo for Sim Car
      if (isSimCar) {
        const radarHalo = L.circleMarker([lat, lng], {
          radius: isSimulating ? 24 : 18,
          fillColor: isSimulating ? "#10b981" : "#0284c7",
          color: isSimulating ? "#34d399" : "#38bdf8",
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.25,
        });
        markersGroup.addLayer(radarHalo);
      }

      // 2. Main Marker Dot
      const circleDot = L.circleMarker([lat, lng], {
        radius: isSimCar ? 14 : isSelected ? 12 : 9,
        fillColor: isSimCar ? (isSimulating ? "#10b981" : "#0284c7") : isSelected ? "#f59e0b" : "#64748b",
        color: "#ffffff",
        weight: isSimCar ? 3.5 : 2,
        opacity: 1,
        fillOpacity: 1,
      });

      // 3. Tooltip showing Plate Number & Badge
      const tooltipContent = isSimCar
        ? `<div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            color: #065f46;
            font-family: monospace, sans-serif;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 9999px;
            border: 2px solid ${isSimulating ? "#10b981" : "#0284c7"};
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
            white-space: nowrap;
          ">
            <span class="pulse-beacon" style="background:${isSimulating ? "#10b981" : "#0284c7"}"></span>
            <span style="color:${isSimulating ? "#059669" : "#0369a1"};font-weight:bold;">${
            isSimulating ? "[ĐANG LĂN BÁNH]" : "[XE MÔ PHỎNG]"
          }</span>
            <span style="color:#0f172a;">🚗 ${vehicle.plateNumber}</span>
          </div>`
        : `<div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: #ffffff;
            color: #0f172a;
            font-family: monospace, sans-serif;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 8px;
            border: 1.5px solid #cbd5e1;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            white-space: nowrap;
          ">
            <span>🚗 ${vehicle.plateNumber}</span>
          </div>`;

      circleDot.bindTooltip(tooltipContent, {
        permanent: true,
        direction: "top",
        offset: [0, isSimCar ? -16 : -10],
        className: "clean-plate-tooltip",
      });

      // 4. Popup on click
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 6px;">
          <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span>🚗 ${vehicle.plateNumber}</span>
            <span style="font-size: 10px; background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 9999px; font-weight: bold;">
              ${isSimCar ? (isSimulating ? "Mô phỏng chạy" : "Sẵn sàng thử nghiệm") : "Đang kết nối"}
            </span>
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
            Tài xế: <strong style="color: #1e293b;">${vehicle.assignedDriverName || "Nguyễn Văn A"}</strong>
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
            Vận tốc: <strong style="color: #0284c7;">${speedText}</strong>
          </div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
            Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
        </div>
      `;
      circleDot.bindPopup(popupHtml);

      circleDot.on("click", () => {
        if (onSelectVehicle) onSelectVehicle(vehicle.id);
      });

      markersGroup.addLayer(circleDot);
    });

    if (!hasFitRef.current && map) {
      map.setView([21.0313, 105.7913], 14);
      hasFitRef.current = true;
    }
  }, [map, vehicles, vehiclesGps, realtimeGps, selectedVehicleId, simCarPosition, simCarSpeed, isSimulating, onSelectVehicle]);

  // 6. Kiểm tra khoảng cách Geofence khi xe di chuyển
  const evaluateGeofence = (lat: number, lng: number) => {
    let alertFound: {
      spotName: string;
      distance: number;
      hazardType: string;
      description?: string;
    } | null = null;

    for (const spot of blackspots) {
      const d = calcDistanceMeters(lat, lng, spot.latitude, spot.longitude);
      if (d <= (spot.radiusMeters || 200)) {
        alertFound = {
          spotName: spot.name,
          distance: Math.round(d),
          hazardType: spot.hazardType,
          description: spot.description,
        };
        break;
      }
    }
    setActiveGeofenceAlert(alertFound);
  };

  // 6.1 Tự động đồng bộ vị trí xe với Backend khi người dùng chuyển tab và quay trở lại (Page Visibility API)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isSimulating) {
        try {
          const st = await getSimulationStatus();
          if (st) {
            if (st.is_running && typeof st.current_index === "number") {
              const allPts = waypointsRef.current;
              if (allPts && allPts.length > st.current_index) {
                const targetIdx = st.current_index;
                simIndexRef.current = targetIdx;
                const pt = allPts[targetIdx];
                setSimCarPosition(pt);

                // Nối đầy đủ các điểm vệt xanh từ điểm bắt đầu đến điểm hiện tại
                const updatedTrail = allPts.slice(simStartIndex, targetIdx + 1);
                liveTrailCoordsRef.current = updatedTrail;
                if (trailPolylineRef.current) {
                  trailPolylineRef.current.setLatLngs(updatedTrail);
                }
                evaluateGeofence(pt[0], pt[1]);
              }
            } else if (st.is_running === false && simIndexRef.current < (st.total_points || 393)) {
              // Backend đã chạy đến đích
              if (simIntervalRef.current) {
                clearInterval(simIntervalRef.current);
                simIntervalRef.current = null;
              }
              setIsSimulating(false);
              setActiveGeofenceAlert(null);
            }
          }
        } catch (e) {
          // Ignore transient sync error
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSimulating, simStartIndex]);

  // 7. Handler: Bắt đầu / Dừng mô phỏng GPS (Chạy mượt cả trên Frontend lẫn Backend)
  const handleToggleSimulation = async () => {
    setSimLoading(true);

    if (isSimulating) {
      // Dừng mô phỏng
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setIsSimulating(false);
      setActiveGeofenceAlert(null);
      try {
        await stopGpsSimulation();
      } catch (err) {
        console.error("Lỗi dừng simulation backend:", err);
      }
      setSimLoading(false);
      return;
    }

    // Bắt đầu mô phỏng
    try {
      // Reset vệt đường màu xanh
      liveTrailCoordsRef.current = [];
      if (trailPolylineRef.current) {
        trailPolylineRef.current.setLatLngs([]);
      }

      // Xác định điểm bắt đầu
      let pts = waypointsRef.current;
      if (!pts || pts.length === 0) {
        // Fallback nạp ngay nếu chưa có
        const res = await fetch("/data/hn_route_e2e.json");
        const json = await res.json();
        const coords = json?.geometry?.coordinates;
        if (Array.isArray(coords)) {
          pts = coords.map((c: [number, number]) => [c[1], c[0]]);
          waypointsRef.current = pts;
        }
      }

      const startIdx = Math.min(simStartIndex, pts.length - 1);
      simIndexRef.current = startIdx;

      // Di chuyển xe tới điểm xuất phát
      const firstPt = pts[startIdx];
      setSimCarPosition(firstPt);
      liveTrailCoordsRef.current = [firstPt];
      if (trailPolylineRef.current) {
        trailPolylineRef.current.setLatLngs([firstPt]);
      }

      // Di chuyển bản đồ tới điểm xuất phát
      if (map) {
        map.panTo(firstPt, { animate: true, duration: 1.0 });
      }

      // Bật trạng thái mô phỏng
      setIsSimulating(true);

      // Thông báo backend chạy song song để lưu TripGpsTrack & phát MQTT
      startGpsSimulation("trip-e2e-001", simSpeed, startIdx).catch((e) =>
        console.warn("Backend sim trigger note:", e)
      );

      // Chạy vòng lặp Animation trên Frontend (mỗi 1000ms / simSpeed)
      const intervalMs = Math.max(200, Math.round(1000 / simSpeed));
      simIntervalRef.current = setInterval(() => {
        const nextIdx = simIndexRef.current + 1;
        const allPts = waypointsRef.current;

        if (nextIdx >= allPts.length) {
          // Đến đích (Nhà Hát Lớn Hà Nội)
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
          setIsSimulating(false);
          setActiveGeofenceAlert(null);
          return;
        }

        simIndexRef.current = nextIdx;
        const pt = allPts[nextIdx];

        // 1. Cập nhật vị trí xe
        setSimCarPosition(pt);
        setSimCarSpeed(38.0 + (nextIdx % 8));

        // 2. Vẽ vệt đường màu xanh (GPS Trail) kéo dài phía sau xe
        liveTrailCoordsRef.current.push(pt);
        if (trailPolylineRef.current) {
          trailPolylineRef.current.setLatLngs([...liveTrailCoordsRef.current]);
        }

        // 3. Tự động kiểm tra Geofence điểm đen 200m
        evaluateGeofence(pt[0], pt[1]);

        // 4. Theo dõi camera theo xe
        if (map && nextIdx % 4 === 0) {
          map.panTo(pt, { animate: true, duration: 0.5 });
        }
      }, intervalMs);
    } catch (err) {
      console.error("Lỗi khi khởi chạy mô phỏng:", err);
    } finally {
      setSimLoading(false);
    }
  };

  // Quick Action: Focus directly on the simulated car
  const handleFocusSimCar = () => {
    if (!map) return;
    map.flyTo(simCarPosition, 16, { animate: true, duration: 1.2 });
  };

  // Fit bounds helper button
  const handleFitAll = () => {
    if (!map) return;
    map.fitBounds(
      [
        [21.0288, 105.7781], // Mỹ Đình
        [21.0313, 105.7913], // Cầu Giấy
        [21.0312, 105.8130], // Liễu Giai
        [21.0268, 105.8438], // Cửa Nam
        [21.0244, 105.8536], // Nhà Hát Lớn
      ],
      { padding: [50, 50] }
    );
  };

  return (
    <div
      className={`relative w-full h-[540px] lg:h-[620px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white ${
        mapType === "dark" ? "osm-dark-tiles" : ""
      }`}
    >
      <style jsx global>{`
        .clean-plate-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .clean-plate-tooltip:before {
          display: none !important;
        }
        @keyframes beacon-pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
          100% { transform: scale(0.9); opacity: 1; }
        }
        .pulse-beacon {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: beacon-pulse 1.4s infinite ease-in-out;
        }
      `}</style>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-Left Floating Panel: Header + Simulation Controller Widget */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm w-full">
        {/* Status Header */}
        <div className="rounded-2xl border border-gray-200/90 bg-white/95 px-3.5 py-2 backdrop-blur-md shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <h4 className="text-xs font-bold text-gray-900 leading-tight">
                Giám sát Bản đồ Số Trực tuyến
              </h4>
              <p className="text-[10px] text-gray-500">
                Xe thử nghiệm: <strong className="text-emerald-700 font-semibold">30F-13579</strong>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            Realtime
          </span>
        </div>

        {/* E2E Simulation & Accident Blackspot Control Card */}
        <div className="rounded-2xl border border-blue-200 bg-white/95 p-3 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🚗</span>
              <span className="text-xs font-bold text-gray-900">Mô phỏng Lộ trình & Geofence</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              9.4 km (OSRM)
            </span>
          </div>

          {/* Quick Jump Selector */}
          <div className="mb-2">
            <label className="text-[10px] text-gray-500 font-medium block mb-1">
              Điểm bắt đầu xe lăn bánh:
            </label>
            <select
              value={simStartIndex}
              onChange={(e) => setSimStartIndex(Number(e.target.value))}
              disabled={isSimulating}
              className="w-full text-xs rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500 transition-all font-medium"
            >
              <option value={0}>🏁 Từ đầu: Bến xe Mỹ Đình (km 0)</option>
              <option value={105}>⚠️ Sát Điểm 1: Ngã tư Cầu Giấy (cách 120m)</option>
              <option value={215}>⚠️ Sát Điểm 2: Daewoo Liễu Giai (cách 120m)</option>
              <option value={325}>⚠️ Sát Điểm 3: Dốc Cửa Nam (cách 120m)</option>
            </select>
          </div>

          {/* Action buttons & Speed */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSimulation}
              disabled={simLoading}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                isSimulating
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {simLoading ? (
                <span className="text-xs">Đang tải...</span>
              ) : isSimulating ? (
                <>
                  <span>⏹️</span>
                  <span>Dừng mô phỏng</span>
                </>
              ) : (
                <>
                  <span>▶️</span>
                  <span>Bắt đầu lái xe thử</span>
                </>
              )}
            </button>

            {/* Speed toggle */}
            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-[10px] font-semibold">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSimSpeed(s)}
                  disabled={isSimulating}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    simSpeed === s
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Live Warning Notification Banner */}
          {activeGeofenceAlert && (
            <div className="mt-2.5 rounded-xl border border-red-300 bg-red-50 p-2.5 text-xs text-red-900 animate-pulse flex items-start gap-2 shadow-sm">
              <span className="text-base leading-none">🚨</span>
              <div>
                <div className="font-bold text-red-900 leading-tight">
                  VÀO VÙNG ĐIỂM ĐEN: {activeGeofenceAlert.spotName}!
                </div>
                <div className="text-[11px] text-red-700 mt-0.5">
                  Khoảng cách: <strong>{activeGeofenceAlert.distance} mét</strong> (Bán kính nguy hiểm 200m).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Map Layer Switcher, Focus Sim Car & Fit Bounds */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Quick Focus Sim Car */}
        <button
          type="button"
          onClick={handleFocusSimCar}
          title="Tập trung vào xe thử nghiệm 30F-13579"
          className="rounded-xl border border-emerald-300 bg-emerald-50/95 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-md hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="pulse-beacon"></span>
          <span>🎯 Định vị xe</span>
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white/95 p-1 backdrop-blur-md shadow-sm flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMapType("street")}
            className={`rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer ${
              mapType === "street"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            🗺️ Chuẩn
          </button>
          <button
            type="button"
            onClick={() => setMapType("dark")}
            className={`rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer ${
              mapType === "dark"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            🌙 Tối
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer ${
              mapType === "satellite"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            🛰️ Vệ tinh
          </button>
        </div>

        <button
          type="button"
          onClick={handleFitAll}
          title="Thu phóng xem toàn bộ lộ trình"
          className="rounded-xl border border-gray-200 bg-white/95 p-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-md hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Map Legend Footer */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200/90 bg-white/90 px-4 py-2.5 backdrop-blur-md text-[11px] text-gray-600 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-red-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 border border-white"></span>
            🚩 Vùng tròn đỏ: Điểm đen tai nạn (Bán kính 200m)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-blue-700">
            <span className="h-2 w-5 rounded-full bg-blue-600"></span>
            Line xanh: Vệt lộ trình GPS xe đã lăn bánh
          </span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            Chấm xanh: Xe 30F-13579 đang phát tọa độ Realtime
          </span>
        </div>
        <div className="text-[10px] font-mono text-gray-400">
          E2E Geofencing & Alerting Engine v2.0
        </div>
      </div>
    </div>
  );
}
