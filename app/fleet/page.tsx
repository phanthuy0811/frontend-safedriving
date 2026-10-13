"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRealtime } from "@/context/RealtimeContext";
import { getAllVehicles } from "@/services/vehicle.service";
import { VehicleResponse, VehicleStatus } from "@/types/vehicle";

// Dynamic import with SSR disabled for Leaflet Map
const LiveFleetMap = dynamic(
  () => import("@/components/fleet/LiveFleetMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] lg:h-[500px] rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center text-gray-500">
        <svg
          className="h-8 w-8 animate-spin text-blue-600 mb-2"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-xs">Đang tải bản đồ số...</span>
      </div>
    ),
  }
);

const DEFAULT_SEED_VEHICLES: VehicleResponse[] = [
  {
    id: "f8a12345-0000-0000-0000-000000000001",
    vehicleTypeId: 1, plateNumber: "30G-456.78",
    status: "IN_SERVICE",
    assignedDriverName: "Nguyễn Văn A (App Mobile)",
    vehicleTypeName: "VinFast VF8 Eco (Điện)",
    odometerKm: 12540,
  },
  {
    id: "f8a12345-0000-0000-0000-000000000002",
    vehicleTypeId: 2, plateNumber: "29A-888.99",
    status: "AVAILABLE",
    assignedDriverName: "Trần Tuấn Tài",
    vehicleTypeName: "Toyota HiAce 16 chỗ",
    odometerKm: 84200,
  },
  {
    id: "f8a12345-0000-0000-0000-000000000003",
    vehicleTypeId: 3, plateNumber: "51B-123.45",
    status: "IN_SERVICE",
    assignedDriverName: "Lê Hoàng Minh",
    vehicleTypeName: "Hyundai Universe 45 chỗ",
    odometerKm: 215600,
  },
];

export default function FleetPage() {
  const { vehiclesGps } = useRealtime();

  const [vehicles, setVehicles] = useState<VehicleResponse[]>(DEFAULT_SEED_VEHICLES);
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllVehicles();
      if (data && data.length > 0) {
        setVehicles(data);
      } else {
        setVehicles(DEFAULT_SEED_VEHICLES);
      }
    } catch {
      setVehicles(DEFAULT_SEED_VEHICLES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Filtered vehicles according to selected status
  const filteredVehicles = vehicles.filter((v) =>
    filterStatus === "ALL" ? true : v.status === filterStatus
  );

  // Quick stats computed on all vehicles
  const totalVehicles = vehicles.length;
  const inUseCount = vehicles.filter((v) => v.status === "IN_SERVICE").length;
  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const liveReportingCount = Object.keys(vehiclesGps).length;

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              Fleet Management & Live Telemetry
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Quản lý Đội xe & Giám sát Bản đồ Trực tuyến
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Bản đồ định vị GPS theo thời gian thực kết nối luồng SSE từ thiết bị Android Edge AI trên xe.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchVehicles}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Làm mới danh sách
          </button>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">Tổng số xe</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-gray-900">
              {totalVehicles}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Đăng ký trong đội xe
            </span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">Đang trong ca (IN_SERVICE)</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-600">
              {inUseCount}
            </div>
            <span className="text-[11px] text-blue-600/80 mt-1 block">
              Tài xế đang vận hành
            </span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="text-xs text-gray-500 block mb-1">Sẵn sàng (AVAILABLE)</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
              {availableCount}
            </div>
            <span className="text-[11px] text-emerald-600/80 mt-1 block">
              Có thể phân công ca mới
            </span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">GPS Live SSE</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-600">
              {liveReportingCount}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Thiết bị đang phát tọa độ
            </span>
          </div>
        </div>

        {/* Interactive Live Map Component */}
        <div className="mb-10">
          <LiveFleetMap
            vehicles={vehicles}
            vehiclesGps={vehiclesGps}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={(vId) => setSelectedVehicleId(vId)}
          />
        </div>

        {/* Filter Toolbar & Vehicles List Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {(["ALL", "IN_SERVICE", "AVAILABLE", "MAINTENANCE"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${filterStatus === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  {st === "ALL"
                    ? "Tất cả"
                    : st === "IN_SERVICE"
                      ? "Đang chạy (IN_SERVICE)"
                      : st === "AVAILABLE"
                        ? "Sẵn sàng (AVAILABLE)"
                        : "Bảo dưỡng (MAINTENANCE)"}
                </button>
              )
            )}
          </div>

          {selectedVehicleId && (
            <button
              type="button"
              onClick={() => setSelectedVehicleId(null)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Bỏ chọn xe đang ghim
            </button>
          )}
        </div>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="h-8 w-8 animate-spin text-blue-600 mb-3"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-xs text-gray-500">Đang tải danh sách đội xe...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Không tìm thấy phương tiện nào phù hợp với bộ lọc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((v) => {
              const liveGps = vehiclesGps[v.id] || vehiclesGps[v.plateNumber];
              const isSelected = selectedVehicleId === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`rounded-2xl border p-6 bg-white transition-all cursor-pointer flex flex-col justify-between shadow-sm ${isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold font-mono text-gray-900 tracking-wide">
                            {v.plateNumber}
                          </h3>
                          {liveGps && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              GPS Live
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {v.vehicleTypeName || "Xe vận chuyển tiêu chuẩn"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${v.status === "IN_SERVICE"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : v.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-2.5 text-xs border-t border-gray-100 pt-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tài xế phụ trách:</span>
                        <span className="font-semibold text-gray-800">
                          {v.assignedDriverName ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                              <span>👨‍✈️</span>
                              <span>{v.assignedDriverName}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Chưa gán tài xế</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Đồng hồ Odometer:</span>
                        <span className="font-mono text-gray-800">
                          {v.odometerKm !== undefined
                            ? `${v.odometerKm.toLocaleString()} km`
                            : "0 km"}
                        </span>
                      </div>
                    </div>

                    {/* Live Telemetry HUD if available */}
                    {liveGps && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 mb-4 text-xs">
                        <div className="flex items-center justify-between text-emerald-800 font-semibold mb-1">
                          <span>Tọa độ tức thời</span>
                          <span className="font-mono">
                            {liveGps.speed_kmh !== undefined
                              ? `${liveGps.speed_kmh.toFixed(1)} km/h`
                              : "Đang dừng"}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700">
                          Lat: {liveGps.latitude.toFixed(5)}, Lng:{" "}
                          {liveGps.longitude.toFixed(5)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions / Info */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {isSelected ? "● Đang xem trên bản đồ" : "Nhấn để định vị"}
                    </span>
                    {v.vin && (
                      <span className="text-[10px] font-mono text-gray-400">
                        VIN: {v.vin}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
