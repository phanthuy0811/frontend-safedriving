"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { VehicleResponse } from "@/types/vehicle";
import { GpsTelemetryEvent } from "@/types/realtime";
import { useRealtime } from "@/context/RealtimeContext";

interface LiveFleetMapProps {
  vehicles: VehicleResponse[];
  vehiclesGps: Record<string, GpsTelemetryEvent>;
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicleId: string) => void;
}

type MapLayerType = "street" | "satellite" | "dark";

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
  const hasFitRef = useRef(false);
  const [mapType, setMapType] = useState<MapLayerType>("street");
  const { requestStream, stopStream } = useRealtime();

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

    // Default center: Hanoi (Hoàn Kiếm)
    const defaultCenter: L.LatLngExpression = [21.0285, 105.8542];
    const mapInstance = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    const initialTiles = L.tileLayer(getTileUrl(mapType), {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(mapInstance);

    tileLayerRef.current = initialTiles;

    const markersGroup = L.featureGroup().addTo(mapInstance);
    markersGroupRef.current = markersGroup;

    setMap(mapInstance);

    const timer = setTimeout(() => {
      mapInstance.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      mapInstance.remove();
      setMap(null);
      markersGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Switch Tile Layer when mapType changes
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

  const hasCenteredOnRealPhoneRef = useRef(false);
  const latestLiveCoordsRef = useRef<[number, number] | null>(null);

  // 3. Render Vehicle Markers (Native SVG CircleMarker with Permanent Tooltip Plate)
  useEffect(() => {
    if (!map || !markersGroupRef.current) return;

    map.invalidateSize();

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // 1. Base vehicles from props or default fallback
    const DEFAULT_SEED_VEHICLES: VehicleResponse[] = [
      {
        id: "f8a12345-0000-0000-0000-000000000001",
        plateNumber: "30G-456.78",
        status: "IN_SERVICE" as const,
        assignedDriverName: "Nguyễn Văn A (App Mobile)",
        vehicleTypeId: 1,
        vehicleTypeName: "VinFast VF8 Eco (Điện)",
      },
      {
        id: "f8a12345-0000-0000-0000-000000000002",
        plateNumber: "29A-888.99",
        status: "AVAILABLE" as const,
        assignedDriverName: "Trần Tuấn Tài",
        vehicleTypeId: 2,
        vehicleTypeName: "Toyota HiAce 16 chỗ",
      },
      {
        id: "f8a12345-0000-0000-0000-000000000003",
        plateNumber: "51B-123.45",
        status: "IN_SERVICE" as const,
        assignedDriverName: "Lê Hoàng Minh",
        vehicleTypeId: 3,
        vehicleTypeName: "Hyundai Universe 45 chỗ",
      },
    ];

    const displayVehicles = vehicles.length > 0 ? [...vehicles] : [...DEFAULT_SEED_VEHICLES];

    // 2. Discover any active live devices broadcasting GPS that aren't yet in displayVehicles
    Object.entries(vehiclesGps).forEach(([vKey, gpsData]) => {
      const exists = displayVehicles.some(
        (v) => v.id === vKey || v.plateNumber === vKey || (gpsData.vehicle_id && v.id === gpsData.vehicle_id)
      );
      if (!exists && gpsData.latitude !== undefined && gpsData.longitude !== undefined) {
        displayVehicles.unshift({
          id: gpsData.vehicle_id || vKey,
          plateNumber: gpsData.plate_number || "30G-456.78",
          vehicleTypeId: 1, status: "IN_SERVICE",
          assignedDriverName: gpsData.driver_name || "Nguyễn Văn A (App Mobile)",
          assignedDriverId: gpsData.driver_id || "1",
          vehicleTypeName: "Thiết bị di động thật (GPS Live)",
        });
      }
    });

    const activeCoords: L.LatLngExpression[] = [];
    let realPhoneCoords: [number, number] | null = null;

    displayVehicles.forEach((vehicle, idx) => {
      const gps = vehiclesGps[vehicle.id] || vehiclesGps[vehicle.plateNumber];

      const isLive =
        !!gps &&
        gps.latitude !== undefined &&
        gps.longitude !== undefined &&
        !isNaN(Number(gps.latitude)) &&
        !isNaN(Number(gps.longitude));

      let lat: number;
      let lng: number;

      if (isLive) {
        lat = Number(gps.latitude);
        lng = Number(gps.longitude);
        realPhoneCoords = [lat, lng];
        latestLiveCoordsRef.current = [lat, lng];
      } else {
        // Fallback realistic points in Hanoi area for un-tracked sample cars
        const sampleLocations = [
          [21.0285, 105.8542], // Hoàn Kiếm (Nhà Hát Lớn)
          [21.0168, 105.8164], // Đống Đa (Láng Hạ)
          [21.0378, 105.7836], // Cầu Giấy (Duy Tân)
        ];
        const seed = sampleLocations[idx % sampleLocations.length];
        lat = seed[0];
        lng = seed[1];
      }

      const isInUse = vehicle.status === "IN_SERVICE";
      const isSelected = selectedVehicleId === vehicle.id;

      // Color coding:
      // Real Live Phone: Vibrant Emerald (#10b981) with halo
      // Seed In Use: Cyan/Green (#06b6d4)
      // Seed Available: Slate (#64748b)
      const dotColor = isSelected
        ? "#f59e0b"
        : isLive
          ? "#10b981"
          : isInUse
            ? "#0284c7"
            : "#64748b";

      const dotStatusLabel = isLive
        ? "ĐANG PHÁT GPS THỰC TẾ"
        : isInUse
          ? "Đang chạy (Mô phỏng)"
          : "Đang dừng";

      const speedText =
        gps?.speed_kmh !== undefined
          ? `${gps.speed_kmh.toFixed(1)} km/h`
          : isLive
            ? "0.0 km/h"
            : isInUse
              ? "40.0 km/h (Mô phỏng)"
              : "0.0 km/h";

      // 1. Radar Circle Halo if Live Phone
      if (isLive) {
        const radarHalo = L.circleMarker([lat, lng], {
          radius: 22,
          fillColor: "#10b981",
          color: "#34d399",
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.2,
        });
        markersGroup.addLayer(radarHalo);
      }

      // 2. Main Marker Dot
      const circleDot = L.circleMarker([lat, lng], {
        radius: isLive ? 15 : isSelected ? 13 : 10,
        fillColor: dotColor,
        color: "#ffffff",
        weight: isLive ? 4 : isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 1,
      });

      // 3. Permanent Tooltip showing Vehicle Plate & Car Emoji above the dot
      const tooltipContent = isLive
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
            border: 2px solid #10b981;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
            white-space: nowrap;
          ">
            <span class="pulse-beacon"></span>
            <span style="color:#059669;font-weight:bold;">[LIVE GPS THỰC TẾ]</span>
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
            <span style="color:#64748b;font-size:9px;font-weight:normal;">(Xe mẫu)</span>
          </div>`;

      circleDot.bindTooltip(tooltipContent, {
        permanent: true,
        direction: "top",
        offset: [0, isLive ? -16 : -12],
        className: "clean-plate-tooltip",
      });

      // 4. Popup on Click with details
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 6px;">
          <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span>🚗 ${vehicle.plateNumber}</span>
            <span style="font-size: 10px; background: ${isLive ? "#ecfdf5" : isInUse ? "#f0f9ff" : "#fef2f2"
        }; color: ${isLive ? "#059669" : isInUse ? "#0284c7" : "#dc2626"
        }; padding: 2px 8px; border-radius: 9999px; font-weight: bold;">
              ${dotStatusLabel}
            </span>
          </div>
          ${isLive
          ? `<div style="margin-bottom: 6px; padding: 4px 8px; background: #ecfdf5; border-radius: 6px; font-size: 11px; color: #065f46; font-weight: 600;">
                  🛰️ Tọa độ GPS thời gian thực từ Mobile App tại Vinhomes
                </div>`
          : ""
        }
          <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
            Tài xế: <strong style="color: #1e293b;">${vehicle.assignedDriverName || "Chưa gán tài xế"
        }</strong>
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
            Vận tốc: <strong style="color: ${dotColor};">${speedText}</strong>
          </div>
          <div style="font-size: 11px; color: #64748b; font-family: monospace; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
            Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
          ${isLive
          ? `<div style="margin-top: 8px; border-radius: 6px; overflow: hidden; background: #000; position: relative;">
                  <img id="camera-stream-${vehicle.assignedDriverId || '1'}" 
                       src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwMDAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5C4bqlbSBuw7p0IFhlbSBDYW1lcmEgxJHhu4MgecOqdSBj4bqndSBTVFJFQU08L3RleHQ+PC9zdmc+" 
                       alt="Live Stream" 
                       style="width: 100%; height: 120px; object-fit: cover; display: block;" />
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);" id="overlay-${vehicle.assignedDriverId || '1'}">
                     <button id="btn-req-${vehicle.assignedDriverId || '1'}" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 9999px; font-weight: bold; font-size: 11px; cursor: pointer;">▶ Xem Camera</button>
                  </div>
                </div>`
          : ''
        }
        </div>
      `;
      circleDot.bindPopup(popupHtml);

      circleDot.on("popupopen", () => {
        const dId = vehicle.assignedDriverId || '1';
        const btn = document.getElementById(`btn-req-${dId}`);
        const overlay = document.getElementById(`overlay-${dId}`);
        if (btn) {
          btn.onclick = () => {
            requestStream(dId);
            if (overlay) overlay.style.display = 'none'; // hide button overlay
          };
        }
      });

      circleDot.on("popupclose", () => {
        const dId = vehicle.assignedDriverId || '1';
        stopStream(dId);
      });

      circleDot.on("click", () => {
        if (onSelectVehicle) {
          onSelectVehicle(vehicle.id);
        }
      });

      markersGroup.addLayer(circleDot);
      activeCoords.push([lat, lng]);

      // If selected, auto fly to marker
      if (isSelected) {
        map.flyTo([lat, lng], 16, { duration: 1.0 });
        circleDot.openPopup();
      }
    });

    // 5. If Real Phone GPS is present, prioritize flying directly to it!
    if (realPhoneCoords && !hasCenteredOnRealPhoneRef.current) {
      map.flyTo(realPhoneCoords, 16, { animate: true, duration: 1.5 });
      hasCenteredOnRealPhoneRef.current = true;
    } else if (!hasFitRef.current && activeCoords.length > 0) {
      const bounds = L.latLngBounds(activeCoords);
      map.fitBounds(bounds.pad(0.3), { maxZoom: 14 });
      hasFitRef.current = true;
    }
  }, [map, vehicles, vehiclesGps, selectedVehicleId, onSelectVehicle, requestStream, stopStream]);

  // Quick Action: Focus directly on the Live Phone in Vinhomes
  const handleFocusRealPhone = () => {
    if (!map) return;
    if (latestLiveCoordsRef.current) {
      map.flyTo(latestLiveCoordsRef.current, 17, { animate: true, duration: 1.2 });
    } else {
      // If no live GPS signal yet, focus on vehicle with plate 30G-456.78
      handleFitAll();
    }
  };

  // Fit bounds helper button
  const handleFitAll = () => {
    if (!map || !markersGroupRef.current) return;
    const layers = markersGroupRef.current.getLayers();
    if (layers.length === 0) return;

    map.fitBounds(markersGroupRef.current.getBounds().pad(0.3));
  };

  return (
    <div
      className={`relative w-full h-[450px] lg:h-[500px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white ${mapType === "dark" ? "osm-dark-tiles" : ""
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
          animation: beacon-pulse 1.5s infinite ease-in-out;
        }
      `}</style>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="rounded-2xl border border-gray-200/90 bg-white/95 px-4 py-2.5 backdrop-blur-md shadow-md flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              Bản đồ Giám sát Đội xe Trực tuyến
            </h4>
            <p className="text-[10px] text-gray-500">
              Đã gán xe <strong className="text-emerald-600 font-semibold">30G-456.78</strong> cho ứng dụng điện thoại
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Map Layer Switcher, Focus Real Phone & Fit Bounds */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Quick Focus Real Phone */}
        <button
          type="button"
          onClick={handleFocusRealPhone}
          title="Tập trung vào vị trí điện thoại thật (Vinhomes)"
          className="rounded-xl border border-emerald-300 bg-emerald-50/95 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-md hover:bg-emerald-100 transition-all flex items-center gap-1.5"
        >
          <span className="pulse-beacon"></span>
          <span>🎯 Xe Thật (Vinhomes)</span>
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white/95 p-1 backdrop-blur-md shadow-sm flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMapType("street")}
            className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${mapType === "street"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
          >
            🗺️ Chuẩn
          </button>
          <button
            type="button"
            onClick={() => setMapType("dark")}
            className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${mapType === "dark"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
          >
            🌙 Tối
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${mapType === "satellite"
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
          title="Thu phóng xem toàn bộ xe"
          className="rounded-xl border border-gray-200 bg-white/95 p-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-md hover:bg-gray-100 transition-colors"
        >
          <svg
            className="h-4 w-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
      </div>

      {/* Map Legend Footer */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200/90 bg-white/90 px-4 py-2.5 backdrop-blur-md text-[11px] text-gray-600 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="pulse-beacon"></span>
            Xe Thật: Đang phát GPS từ điện thoại (Vinhomes)
          </span>
          <span className="flex items-center gap-1.5 font-medium text-blue-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 border border-white"></span>
            Xanh dương: Đang chạy
          </span>
          <span className="flex items-center gap-1.5 font-medium text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400 border border-white"></span>
            Xám: Đang dừng
          </span>
        </div>
        <span className="text-[10px] text-blue-600 font-medium">
          Xe 30G-456.78 liên kết trực tiếp ứng dụng AppDetect
        </span>
      </div>
    </div>
  );
}
