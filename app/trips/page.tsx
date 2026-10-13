"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  startTrip,
  endTrip,
  autoDispatchTrip,
  getTripGpsTracks,
} from "@/services/trip.service";
import { getAllVehicles } from "@/services/vehicle.service";
import { TripResponse, TripRequest, TripStatus, TripGpsTrackResponse } from "@/types/trip";
import { VehicleResponse } from "@/types/vehicle";
import { ApiError } from "@/services/api.client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: "Lên kế hoạch",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang di chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

const STATUS_COLORS: Record<TripStatus, string> = {
  PLANNED: "bg-gray-100 text-gray-700 border-gray-300",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse",
  COMPLETED: "bg-purple-50 text-purple-700 border-purple-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const ALL_STATUSES: TripStatus[] = [
  "PLANNED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function toLocalDateTime(dtLocal: string): string {
  return dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
}

const now = new Date();
const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

const EMPTY_FORM: TripRequest = {
  startLocation: "",
  endLocation: "",
  vehicleId: "",
  driverId: "",
  plannedStartTime: toLocalDateTime(now.toISOString().slice(0, 16)),
  plannedEndTime: toLocalDateTime(inOneHour.toISOString().slice(0, 16)),
  status: "PLANNED",
  distanceKm: 0,
  note: "",
};

// ─── Trip Modal ───────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: TripRequest;
  setForm: (f: TripRequest) => void;
  vehicles: VehicleResponse[];
  loading: boolean;
  error: string | null;
  isEdit: boolean;
}

function TripModal({
  title,
  onClose,
  onSubmit,
  form,
  setForm,
  vehicles,
  loading,
  error,
  isEdit,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">Chuyến đi theo yêu cầu khách đặt, đo quãng đường bằng GPS</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Start Location */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              📍 Điểm đón / Xuất phát (Điểm A) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Sân bay Nội Bài, Hà Nội"
              value={form.startLocation}
              onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* End Location */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              🎯 Điểm đến / Trả khách (Điểm B) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Khu đô thị Vinhomes Ocean Park, Gia Lâm"
              value={form.endLocation}
              onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Vehicle Select */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              🚗 Phương tiện thực hiện
            </label>
            <select
              value={form.vehicleId || ""}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">-- Chưa gán xe (gán sau) --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.vehicleTypeName || "Xe"} - {v.status === "AVAILABLE" ? "Sẵn sàng" : "Đang chạy"})
                </option>
              ))}
            </select>
          </div>

          {/* Times Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Xuất phát (dự kiến)
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.plannedStartTime)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    plannedStartTime: toLocalDateTime(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Đến nơi (dự kiến)
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.plannedEndTime)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    plannedEndTime: toLocalDateTime(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Status (when edit) */}
          {isEdit && (
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Trạng thái chuyến đi
              </label>
              <select
                value={form.status ?? "PLANNED"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TripStatus })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              Ghi chú
            </label>
            <input
              type="text"
              placeholder="VD: Đón khách VIP, mang theo hành lý"
              value={form.note || ""}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50/50">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo chuyến đi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GPS Tracks Modal (Vẽ vệt đường) ───────────────────────────────────────────

interface TracksModalProps {
  trip: TripResponse;
  tracks: TripGpsTrackResponse[];
  onClose: () => void;
}

function TracksModal({ trip, tracks, onClose }: TracksModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Lộ trình tọa độ GPS (Vệt đường di chuyển)
            </h3>
            <p className="text-xs text-gray-500">
              Chuyến: <strong className="text-gray-800">{trip.startLocation || "Điểm đi"}</strong> ➔ <strong className="text-gray-800">{trip.endLocation || "Điểm đến"}</strong> ({tracks.length} điểm GPS)
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tracks.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Chưa có dữ liệu GPS nào được ghi nhận cho chuyến đi này.
              <p className="text-xs text-gray-500 mt-1">Khi xe di chuyển và app Android phát GPS, hệ thống sẽ tự động vẽ vệt đường tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
                <span>Tổng quãng đường đo theo GPS: <strong>{trip.distanceKm?.toFixed(2) || 0} km</strong></span>
                <span>Tổng số tọa độ: <strong>{tracks.length} điểm</strong></span>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs font-mono">
                {tracks.map((t, idx) => (
                  <div key={t.id || idx} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                    <span className="text-gray-500">#{idx + 1}</span>
                    <span className="text-blue-600 font-semibold">{t.latitude.toFixed(6)}, {t.longitude.toFixed(6)}</span>
                    <span className="text-gray-600">{t.speedKmh ? `${t.speedKmh.toFixed(1)} km/h` : "0.0 km/h"}</span>
                    <span className="text-gray-400 text-[11px]">{formatDateTime(t.recordedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-3.5 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Trips Page ──────────────────────────────────────────────────────────

export default function TripsPage() {
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<TripStatus | "ALL">("ALL");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TripRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Tracks Modal
  const [trackModalTrip, setTrackModalTrip] = useState<TripResponse | null>(null);
  const [trackPoints, setTrackPoints] = useState<TripGpsTrackResponse[]>([]);

  // Load Trips
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripsData, vehiclesData] = await Promise.all([
        getAllTrips(selectedStatus === "ALL" ? undefined : selectedStatus),
        getAllVehicles(),
      ]);
      setTrips(tripsData);
      setVehicles(vehiclesData);
    } catch (err) {
      const e = err as ApiError;
      setError(e.message || "Không thể tải danh sách chuyến đi");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Create / Edit Submit
  const handleSubmit = async () => {
    if (!form.startLocation?.trim()) {
      setModalError("Vui lòng nhập điểm đón / xuất phát");
      return;
    }
    if (!form.endLocation?.trim()) {
      setModalError("Vui lòng nhập điểm đến / trả khách");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      if (isEdit && editId) {
        await updateTrip(editId, form);
      } else {
        await createTrip(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      const e = err as ApiError;
      setModalError(e.message || "Lỗi lưu chuyến đi");
    } finally {
      setModalLoading(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setIsEdit(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (t: TripResponse) => {
    setIsEdit(true);
    setEditId(t.id);
    setForm({
      startLocation: t.startLocation || "",
      endLocation: t.endLocation || "",
      vehicleId: t.vehicleId || "",
      driverId: t.driverId || "",
      plannedStartTime: t.plannedStartTime ? toLocalDateTime(t.plannedStartTime) : "",
      plannedEndTime: t.plannedEndTime ? toLocalDateTime(t.plannedEndTime) : "",
      status: t.status,
      distanceKm: t.distanceKm || 0,
      note: t.note || "",
    });
    setModalError(null);
    setModalOpen(true);
  };

  // Start Trip
  const handleStartTrip = async (id: string) => {
    try {
      await startTrip(id);
      loadData();
    } catch (err) {
      alert("Không thể bắt đầu chuyến: " + (err as ApiError).message);
    }
  };

  // End Trip
  const handleEndTrip = async (id: string) => {
    if (!confirm("Xác nhận hoàn thành chuyến đi này? Xe sẽ được giải phóng về trạng thái Sẵn sàng.")) return;
    try {
      await endTrip(id);
      loadData();
    } catch (err) {
      alert("Không thể kết thúc chuyến: " + (err as ApiError).message);
    }
  };

  // Delete Trip
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chuyến đi này không?")) return;
    try {
      await deleteTrip(id);
      loadData();
    } catch (err) {
      alert("Lỗi xóa chuyến đi: " + (err as ApiError).message);
    }
  };

  // Auto-dispatch Trip
  const handleAutoDispatch = async (id: string) => {
    try {
      await autoDispatchTrip(id);
      loadData();
    } catch (err) {
      alert("Lỗi nổ đơn tự động: " + (err as ApiError).message);
    }
  };

  // View GPS Tracks
  const handleViewTracks = async (t: TripResponse) => {
    try {
      const tracks = await getTripGpsTracks(t.id);
      setTrackPoints(tracks);
      setTrackModalTrip(t);
    } catch (err) {
      alert("Lỗi tải tọa độ: " + (err as ApiError).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              Hành trình & Quản lý Chuyến đi Thực tế
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Quản lý Chuyến đi & Vệt đường GPS
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Quản lý hành trình di chuyển thực tế theo đơn khách đặt (Điểm A ➔ Điểm B), đo km theo GPS và theo dõi an toàn lái xe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-sm transition-colors"
            >
              🔄 Tải lại
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              + Tạo Chuyến Đi Mới
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedStatus("ALL")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedStatus === "ALL"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Tất cả ({trips.length})
          </button>
          {ALL_STATUSES.map((st) => {
            const count = trips.filter((t) => t.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedStatus === st
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {STATUS_LABELS[st]} ({count})
              </button>
            );
          })}
        </div>

        {/* Table Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              Đang tải danh sách chuyến đi...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-sm">
              {error}
            </div>
          ) : trips.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              Không có chuyến đi nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Hành trình (A ➔ B)</th>
                    <th className="px-5 py-3.5">Phương tiện & Tài xế</th>
                    <th className="px-5 py-3.5">Quãng đường</th>
                    <th className="px-5 py-3.5">Thời gian</th>
                    <th className="px-5 py-3.5">An toàn & AI</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trips.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Route A -> B */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span>📍</span>
                          <span>{t.startLocation || "Điểm đón"}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                          <span>➔ 🎯</span>
                          <span>{t.endLocation || "Điểm đến"}</span>
                        </div>
                        {t.note && (
                          <div className="text-[11px] text-gray-400 mt-1 italic">
                            Ghi chú: {t.note}
                          </div>
                        )}
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {t.vehiclePlateNumber ? (
                            <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                              🚗 {t.vehiclePlateNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Chưa gán xe</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {t.driverName ? `Tài xế: ${t.driverName}` : <span className="text-gray-400 italic">Chưa gán tài xế</span>}
                        </div>
                      </td>

                      {/* Distance */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-gray-800">
                          {t.distanceKm ? `${t.distanceKm.toFixed(1)} km` : "0.0 km"}
                        </span>
                        <div className="text-[11px] text-gray-400">Đo bằng GPS</div>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4 text-xs space-y-1">
                        <div className="text-gray-500">
                          Dự kiến: {formatDateTime(t.plannedStartTime)}
                        </div>
                        {t.startTime && (
                          <div className="text-emerald-700 font-medium">
                            Bắt đầu: {formatDateTime(t.startTime)}
                          </div>
                        )}
                        {t.endTime && (
                          <div className="text-gray-700">
                            Kết thúc: {formatDateTime(t.endTime)}
                          </div>
                        )}
                      </td>

                      {/* Safety & AI Badges */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded-full border ${
                            (t.somnolenceCount || 0) > 0
                              ? "bg-red-50 text-red-600 border-red-200 font-bold"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}>
                            💤 {t.somnolenceCount || 0} Ngủ gật
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border ${
                            (t.incidentCount || 0) > 0
                              ? "bg-amber-50 text-amber-600 border-amber-200 font-bold"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}>
                            ⚠️ {t.incidentCount || 0} Sự cố
                          </span>
                        </div>
                        <button
                          onClick={() => handleViewTracks(t)}
                          className="mt-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          📍 {t.gpsTrackCount || 0} Tọa độ GPS (Xem vệt đường)
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            STATUS_COLORS[t.status]
                          }`}
                        >
                          {STATUS_LABELS[t.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right space-x-2">
                        {t.status === "PLANNED" && !t.vehicleId && (
                          <button
                            onClick={() => handleAutoDispatch(t.id)}
                            title="Tự động tìm xe và tài xế rảnh nổ đơn"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                          >
                            ⚡ Nổ đơn
                          </button>
                        )}

                        {t.status === "PLANNED" || t.status === "ASSIGNED" ? (
                          <button
                            onClick={() => handleStartTrip(t.id)}
                            title="Bắt đầu chuyến đi"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            ▶ Bắt đầu
                          </button>
                        ) : null}

                        {t.status === "IN_PROGRESS" ? (
                          <button
                            onClick={() => handleEndTrip(t.id)}
                            title="Kết thúc chuyến đi"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                          >
                            🏁 Kết thúc
                          </button>
                        ) : null}

                        <button
                          onClick={() => openEditModal(t)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDelete(t.id)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Trip Modal */}
      {modalOpen && (
        <TripModal
          title={isEdit ? "Cập nhật Chuyến Đi" : "Tạo Chuyến Đi Mới"}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          vehicles={vehicles}
          loading={modalLoading}
          error={modalError}
          isEdit={isEdit}
        />
      )}

      {/* GPS Tracks Modal */}
      {trackModalTrip && (
        <TracksModal
          trip={trackModalTrip}
          tracks={trackPoints}
          onClose={() => setTrackModalTrip(null)}
        />
      )}
    </div>
  );
}
