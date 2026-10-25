"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/services/assignment.service";
import { getAllTrips } from "@/services/trip.service";
import { getAllDrivers } from "@/services/driver.service";
import { AssignmentResponse, AssignmentRequest } from "@/types/assignment";
import { TripResponse, TripStatus } from "@/types/trip";
import { DriverResponse } from "@/types/driver";
import { ApiError } from "@/services/api.client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const EMPTY_FORM: AssignmentRequest = {
  tripId: "",
  driverId: "",
  accountId: "",
};

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: AssignmentRequest;
  setForm: (f: AssignmentRequest) => void;
  trips: TripResponse[];
  drivers: DriverResponse[];
  assignments?: AssignmentResponse[];
  loading: boolean;
  error: string | null;
  isEdit: boolean;
}

function AssignmentModal({
  title,
  onClose,
  onSubmit,
  form,
  setForm,
  trips,
  drivers,
  assignments,
  loading,
  error,
  isEdit,
}: ModalProps) {
  // 1. Chỉ lấy chuyến đi chưa phân công (PLANNED)
  const availableTrips = trips.filter((t) => {
    if (isEdit && t.id === form.tripId) return true;
    return t.status === "PLANNED";
  });

  // 2. Chỉ lấy tài xế đang rảnh (hoạt động, chưa có phân công nào, không bận chuyến)
  const availableDrivers = drivers.filter((d) => {
    if (d.isActive === false) return false;
    if (isEdit && d.id === form.driverId) return true;
    const hasAssignment = assignments?.some((a) => a.driverId === d.id);
    if (hasAssignment) return false;
    const hasActiveTrip = trips.some(
      (t) => t.driverId === d.id && (t.status === "IN_PROGRESS" || t.status === "ASSIGNED")
    );
    if (hasActiveTrip) return false;
    return true;
  });

  const selectedTrip = trips.find((t) => t.id === form.tripId);
  const selectedDriver = drivers.find((d) => d.id === form.driverId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chọn chuyến đi và tài xế phụ trách từ danh sách hệ thống
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

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Info banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-800">
            💡 Khi phân công thành công, trạng thái chuyến đi sẽ tự động chuyển sang <strong>ASSIGNED</strong> và liên kết với phương tiện của tài xế.
          </div>

          {/* Chọn Chuyến đi (Dropdown Menu) */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              🛣️ Chuyến đi cần phân công <span className="text-red-500">*</span>
            </label>
            <select
              id="assignment-trip-select"
              value={form.tripId}
              onChange={(e) => setForm({ ...form, tripId: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
            >
              <option value="">
                {availableTrips.length === 0
                  ? "-- Không có chuyến đi nào chưa phân công --"
                  : "-- Nhấn để chọn chuyến đi --"}
              </option>
              {availableTrips.map((t) => {
                const routeTitle =
                  t.routeName ||
                  (t.startLocation && t.endLocation
                    ? `${t.startLocation} ➔ ${t.endLocation}`
                    : `Chuyến #${t.id.slice(0, 8)}`);
                const timeStr = t.plannedStartTime
                  ? ` (${formatDateTime(t.plannedStartTime)})`
                  : "";
                return (
                  <option key={t.id} value={t.id}>
                    {routeTitle}{timeStr}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Chi tiết chuyến đi được chọn */}
          {selectedTrip && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Lộ trình:</span>
                <span className="font-semibold text-gray-900">
                  {selectedTrip.startLocation} ➔ {selectedTrip.endLocation}
                </span>
              </div>
              {selectedTrip.routeName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tuyến đường:</span>
                  <span className="font-medium text-amber-700">{selectedTrip.routeName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Khởi hành dự kiến:</span>
                <span className="font-medium text-gray-700">
                  {formatDateTime(selectedTrip.plannedStartTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Trạng thái hiện tại:</span>
                <span className="inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                  {selectedTrip.status}
                </span>
              </div>
            </div>
          )}

          {/* Chọn Tài xế (Dropdown Menu) */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              👨‍✈️ Tài xế phụ trách <span className="text-red-500">*</span>
            </label>
            <select
              id="assignment-driver-select"
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
            >
              <option value="">
                {availableDrivers.length === 0
                  ? "-- Không có tài xế nào đang rảnh --"
                  : "-- Nhấn để chọn tài xế --"}
              </option>
              {availableDrivers.map((d) => {
                const fullName =
                  d.staff?.fullName ||
                  `${d.staff?.lastName || ""} ${d.staff?.firstName || ""}`.trim() ||
                  `Tài xế #${d.id.slice(0, 8)}`;
                const phone = d.staff?.phone ? ` (${d.staff.phone})` : "";
                const vehicleTag = d.vehicle
                  ? ` — [Xe: ${d.vehicle.plateNumber}]`
                  : " — [⚠️ Chưa có xe]";
                return (
                  <option key={d.id} value={d.id}>
                    {fullName}{phone}{vehicleTag}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Chi tiết tài xế được chọn */}
          {selectedDriver && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Họ và tên:</span>
                <span className="font-semibold text-gray-900">
                  👨‍✈️ {selectedDriver.staff?.fullName || `${selectedDriver.staff?.lastName || ""} ${selectedDriver.staff?.firstName || ""}`.trim() || "Tài xế"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="font-medium text-gray-700">
                  {selectedDriver.staff?.phone || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                <span className="text-gray-500">Phương tiện phụ trách:</span>
                <span>
                  {selectedDriver.vehicle ? (
                    <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                      🚐 {selectedDriver.vehicle.plateNumber}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Chưa có xe
                    </span>
                  )}
                </span>
              </div>

              {!selectedDriver.vehicle && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800 font-medium">
                  ⚠️ Tài xế này chưa được gán phương tiện trong hồ sơ. Theo quy định, tài xế phải được gán xe tại trang Phương tiện trước khi phân công chuyến đi!
                </div>
              )}
            </div>
          )}
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
            id="assignment-modal-submit"
            onClick={onSubmit}
            disabled={loading || !form.tripId || !form.driverId}
            className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật phân công" : "Xác nhận phân công"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  assignment, onClose, onConfirm, loading,
}: { assignment: AssignmentResponse; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-300 bg-white shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/30">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Huỷ phân công?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Soft delete — dữ liệu sẽ bị ẩn</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-2">
          Tài xế <span className="font-bold text-amber-600">{assignment.driverName || assignment.driverId.slice(0, 8) + "…"}</span>{" "}
          {assignment.vehiclePlate && (
            <span className="font-mono text-xs text-blue-600 font-semibold">(Xe {assignment.vehiclePlate})</span>
          )}{" "}
          → Chuyến <span className="font-bold text-gray-900">{assignment.routeCode ? `${assignment.routeCode} - ${assignment.routeName}` : assignment.tripId.slice(0, 8) + "…"}</span>
        </p>
        <p className="text-xs text-gray-400 mb-6">Phân công lúc {formatDateTime(assignment.assignmentAt)}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Huỷ</button>
          <button
            id="assignment-delete-confirm"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang xoá..." : "Xoá phân công"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDriverId, setFilterDriverId] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AssignmentResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentsData, tripsData, driversData] = await Promise.all([
        getAllAssignments(),
        getAllTrips(),
        getAllDrivers().catch(() => []),
      ]);
      const enrichedTrips = tripsData.map((t) => {
        const assignment = assignmentsData.find((a) => a.tripId === t.id);
        if (assignment) {
          return {
            ...t,
            driverName: t.driverName || assignment.driverName,
            vehiclePlateNumber: t.vehiclePlateNumber || assignment.vehiclePlate,
            driverId: t.driverId || assignment.driverId,
            vehicleId: t.vehicleId || assignment.vehicleId,
            status: (t.status === "PLANNED" ? "ASSIGNED" : t.status) as TripStatus,
          };
        }
        if (t.status === "ASSIGNED") {
          return {
            ...t,
            driverName: undefined,
            driverId: undefined,
            vehicleId: undefined,
            vehiclePlateNumber: undefined,
            status: "PLANNED" as TripStatus,
          };
        }
        return t;
      });
      setAssignments(assignmentsData);
      setTrips(enrichedTrips);
      setDrivers(driversData);
    } catch {
      showToast("Không thể tải danh sách phân công.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ── Unique drivers for quick filter ──
  const uniqueDriverIds = Array.from(new Set(assignments.map((a) => a.driverId)));

  // ── Filter ──
  const filtered = assignments.filter((a) => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q ||
      a.tripId?.toLowerCase().includes(q) ||
      a.driverId?.toLowerCase().includes(q) ||
      a.accountId?.toLowerCase().includes(q) ||
      a.id?.toLowerCase().includes(q) ||
      a.driverName?.toLowerCase().includes(q) ||
      a.vehiclePlate?.toLowerCase().includes(q) ||
      a.routeName?.toLowerCase().includes(q) ||
      a.routeCode?.toLowerCase().includes(q);
    const matchDriver = !filterDriverId || a.driverId === filterDriverId;
    return matchSearch && matchDriver;
  });

  const openCreate = () => {
    setForm({
      tripId: "",
      driverId: "",
      accountId: user?.accountId || "",
    });
    setIsEdit(false);
    setEditingId(null);
    setModalError(null);
    setShowModal(true);
  };

  const openEdit = (a: AssignmentResponse) => {
    setForm({ tripId: a.tripId, driverId: a.driverId, accountId: a.accountId || user?.accountId || "" });
    setIsEdit(true);
    setEditingId(a.id);
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const accountId = form.accountId.trim() || user?.accountId || "";
    if (!form.tripId.trim()) { setModalError("Vui lòng chọn chuyến đi từ danh sách."); return; }
    if (!form.driverId.trim()) { setModalError("Vui lòng chọn tài xế từ danh sách."); return; }
    if (!accountId) { setModalError("Không xác định được ID người phân công. Vui lòng đăng nhập lại."); return; }

    setModalLoading(true);
    setModalError(null);
    try {
      const payload: AssignmentRequest = {
        tripId: form.tripId.trim(),
        driverId: form.driverId.trim(),
        accountId: accountId,
      };
      if (isEdit && editingId) {
        await updateAssignment(editingId, payload);
        showToast("Cập nhật phân công thành công!", "success");
      } else {
        await createAssignment(payload);
        showToast("Phân công tài xế thành công! Chuyến đi đã chuyển sang ASSIGNED.", "success");
      }
      setShowModal(false);
      fetchAllData();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "Đã xảy ra lỗi khi phân công.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAssignment(deleteTarget.id);
      showToast("Đã huỷ phân công thành công!", "success");
      setDeleteTarget(null);
      fetchAllData();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Huỷ phân công thất bại.", "error");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-900">

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Quản lý Phân công
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Giao chuyến đi cho tài xế — mỗi phân công sẽ tự động cập nhật trạng thái chuyến sang{" "}
              <span className="text-blue-600 font-semibold">ASSIGNED</span>
            </p>
          </div>
          <button
            id="assignment-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-amber-700 transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Phân công mới
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-1">Tổng phân công</div>
            <div className="text-3xl font-extrabold font-mono text-amber-600">{assignments.length}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-1">Số tài xế được phân công</div>
            <div className="text-3xl font-extrabold font-mono text-blue-600">{uniqueDriverIds.length}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-500 mb-1">Chuyến đã phân công</div>
            <div className="text-3xl font-extrabold font-mono text-blue-600">
              {new Set(assignments.map((a) => a.tripId)).size}
            </div>
          </div>
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="assignment-search"
              type="text"
              placeholder="Tìm theo tên tuyến, tên tài xế, biển số xe, mã chuyến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-colors"
            />
          </div>
          <select
            id="assignment-driver-filter"
            value={filterDriverId}
            onChange={(e) => setFilterDriverId(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none transition-colors max-w-xs font-medium"
          >
            <option value="">Tất cả tài xế ({uniqueDriverIds.length})</option>
            {uniqueDriverIds.map((id) => {
              const driverObj = drivers.find((d) => d.id === id);
              const driverName =
                driverObj?.staff?.fullName ||
                `${driverObj?.staff?.lastName || ""} ${driverObj?.staff?.firstName || ""}`.trim() ||
                assignments.find((a) => a.driverId === id)?.driverName ||
                `Tài xế #${id.slice(0, 8)}`;
              return (
                <option key={id} value={id}>
                  👨‍✈️ {driverName}
                </option>
              );
            })}
          </select>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
              <svg className="w-5 h-5 mr-2 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Đang tải dữ liệu...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              <svg className="w-10 h-10 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Không có phân công nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 text-left">Mã Phân công</th>
                    <th className="px-5 py-3 text-left">Chuyến đi / Tuyến</th>
                    <th className="px-5 py-3 text-left">Tài xế</th>
                    <th className="px-5 py-3 text-left">Phương tiện</th>
                    <th className="px-5 py-3 text-left">Thời điểm</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((a) => {
                    const tripObj = trips.find((t) => t.id === a.tripId);
                    const driverObj = drivers.find((d) => d.id === a.driverId);
                    const driverDisplayName =
                      a.driverName ||
                      driverObj?.staff?.fullName ||
                      `${driverObj?.staff?.lastName || ""} ${driverObj?.staff?.firstName || ""}`.trim() ||
                      "Tài xế";
                    const vehiclePlateDisplay =
                      a.vehiclePlate || driverObj?.vehicle?.plateNumber;

                    return (
                      <tr key={a.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-gray-500 font-semibold">{a.id.slice(0, 8)}…</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-gray-900">
                            {a.routeCode
                              ? `${a.routeCode} - ${a.routeName || ""}`
                              : tripObj?.routeName || (tripObj ? `${tripObj.startLocation} ➔ ${tripObj.endLocation}` : `Chuyến ${a.tripId.slice(0, 8)}…`)}
                          </div>
                          {tripObj && (
                            <div className="text-xs text-gray-500">
                              {tripObj.startLocation} ➔ {tripObj.endLocation}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-amber-700 flex items-center gap-1.5">
                            <span>👨‍✈️</span>
                            <span>{driverDisplayName}</span>
                          </div>
                          {driverObj?.staff?.phone && (
                            <div className="text-xs text-gray-500">
                              SĐT: {driverObj.staff.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {vehiclePlateDisplay ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                              🚐 {vehiclePlateDisplay}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
                              Chưa có xe
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-700">
                          {formatDateTime(a.assignmentAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`assignment-edit-${a.id}`}
                              onClick={() => openEdit(a)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-amber-300 hover:text-amber-600 transition-colors shadow-sm"
                            >
                              Sửa
                            </button>
                            <button
                              id={`assignment-delete-${a.id}`}
                              onClick={() => setDeleteTarget(a)}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            Hiển thị {filtered.length} / {assignments.length} phân công
          </p>
        )}
      </main>

      {showModal && (
        <AssignmentModal
          title={isEdit ? "Cập nhật phân công" : "Phân công tài xế mới"}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          trips={trips}
          drivers={drivers}
          assignments={assignments}
          loading={modalLoading}
          error={modalError}
          isEdit={isEdit}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          assignment={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl text-sm font-medium max-w-sm ${
          toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            : "border-red-500/30 bg-red-500/10 text-red-600"
        }`}>
          {toast.type === "success" ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
