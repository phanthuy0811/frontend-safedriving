"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignDriverToVehicle,
} from "@/services/vehicle.service";
import { getAllDrivers } from "@/services/driver.service";
import { getAllVehicleTypes } from "@/services/vehicle-type.service";
import { VehicleResponse, VehicleRequest, VehicleStatus } from "@/types/vehicle";
import { DriverResponse } from "@/types/driver";
import { VehicleTypeResponse } from "@/types/vehicle-type";
import { ApiError } from "@/services/api.client";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: "Sẵn sàng",
  IN_SERVICE: "Đang chạy",
  MAINTENANCE: "Bảo dưỡng",
  OUT_OF_SERVICE: "Ngừng hoạt động",
};

const STATUS_COLORS: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_SERVICE: "bg-blue-50 text-blue-700 border-blue-200",
  MAINTENANCE: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  OUT_OF_SERVICE: "bg-red-50 text-red-700 border-red-200",
};

const ALL_STATUSES: VehicleStatus[] = [
  "AVAILABLE",
  "IN_SERVICE",
  "MAINTENANCE",
  "OUT_OF_SERVICE",
];

const EMPTY_FORM: VehicleRequest = {
  plateNumber: "",
  vin: "",
  capacity: undefined,
  vehicleTypeId: 0,
  status: "AVAILABLE",
  odometerKm: undefined,
};

// ─── Modal Component ─────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: VehicleRequest;
  setForm: (f: VehicleRequest) => void;
  vehicleTypes: VehicleTypeResponse[];
  loading: boolean;
  error: string | null;
  isEdit: boolean;
}

function VehicleModal({
  title,
  onClose,
  onSubmit,
  form,
  setForm,
  vehicleTypes,
  loading,
  error,
  isEdit,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-transparent/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Biển số */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              Biển số xe <span className="text-red-600">*</span>
            </label>
            <input
              id="vehicle-plate"
              type="text"
              placeholder="VD: 51A-123.45"
              value={form.plateNumber}
              onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* VIN */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              Số khung (VIN)
            </label>
            <input
              id="vehicle-vin"
              type="text"
              placeholder="VD: 1HGBH41JXMN109186"
              value={form.vin ?? ""}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* vehicleTypeId & capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">
                Loại xe <span className="text-red-600">*</span>
              </label>
              <select
                id="vehicle-type-id"
                value={form.vehicleTypeId || ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  const selectedType = vehicleTypes.find((t) => t.id === val);
                  setForm({
                    ...form,
                    vehicleTypeId: val,
                    capacity: selectedType?.capacity !== undefined ? selectedType.capacity : form.capacity,
                  });
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="">
                  {vehicleTypes.length === 0
                    ? "-- Không có loại xe nào --"
                    : "-- Chọn loại xe --"}
                </option>
                {vehicleTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.name} {vt.code ? `(${vt.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">
                Sức chứa (chỗ)
              </label>
              <input
                id="vehicle-capacity"
                type="number"
                min={1}
                placeholder="VD: 45"
                value={form.capacity ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacity: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Status & Odometer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">
                Trạng thái
              </label>
              <select
                id="vehicle-status"
                value={form.status ?? "AVAILABLE"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as VehicleStatus })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">
                ODO (km)
              </label>
              <input
                id="vehicle-odometer"
                type="number"
                min={0}
                step={0.1}
                placeholder="VD: 125000"
                value={form.odometerKm ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    odometerKm: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Huỷ
          </button>
          <button
            id="vehicle-modal-submit"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-lg bg-blue-600 text-white px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm xe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ────────────────────────────────────────────────────

function ConfirmDeleteModal({
  vehicle,
  onClose,
  onConfirm,
  loading,
}: {
  vehicle: VehicleResponse;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
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
            <h3 className="text-sm font-bold text-gray-900">Xoá xe?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Hành động này không thể hoàn tác</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6">
          Bạn có chắc chắn muốn xoá xe biển số{" "}
          <span className="font-bold text-gray-900">{vehicle.plateNumber}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Huỷ
          </button>
          <button
            id="vehicle-delete-confirm"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang xoá..." : "Xoá"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Gán Tài Xế ─────────────────────────────────────────────────────────

interface AssignDriverModalProps {
  vehicle: VehicleResponse;
  drivers: DriverResponse[];
  onClose: () => void;
  onSubmit: (driverId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

function AssignDriverModal({
  vehicle,
  drivers,
  onClose,
  onSubmit,
  loading,
  error,
}: AssignDriverModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    vehicle.assignedDriverId || ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setValidationError("Vui lòng chọn tài xế từ danh sách dropdown.");
      return;
    }
    setValidationError(null);
    onSubmit(selectedDriverId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Phân công tài xế cho xe
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chọn tài xế phụ trách điều khiển xe{" "}
              <span className="font-semibold text-blue-600">{vehicle.plateNumber}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {(error || validationError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error || validationError}
            </div>
          )}

          {/* Chi tiết xe */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs">
            <div>
              <span className="text-gray-500 block">Biển số xe:</span>
              <span className="font-mono font-bold text-gray-900 text-sm">
                {vehicle.plateNumber}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Loại xe:</span>
              <span className="font-medium text-gray-800">
                {vehicle.vehicleTypeName || "Chưa xác định"}
              </span>
            </div>
            <div className="col-span-2 pt-1.5 border-t border-gray-200/60 flex items-center justify-between">
              <span className="text-gray-500">Tài xế hiện tại:</span>
              <span>
                {vehicle.assignedDriverName ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    👨‍✈️ {vehicle.assignedDriverName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    Chưa gán tài xế
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Dropmenu chọn tài xế */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              👨‍✈️ Chọn tài xế từ danh sách (Dropdown Menu) <span className="text-red-500">*</span>
            </label>
            <select
              id="select-assign-driver"
              value={selectedDriverId}
              onChange={(e) => {
                setSelectedDriverId(e.target.value);
                setValidationError(null);
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            >
              <option value="">
                {drivers.length === 0
                  ? "-- Không có tài xế nào trong hệ thống --"
                  : "-- Nhấn để chọn tài xế --"}
              </option>
              {drivers.map((d) => {
                const fullName =
                  d.staff?.fullName ||
                  `${d.staff?.lastName || ""} ${d.staff?.firstName || ""}`.trim() ||
                  `Tài xế #${d.id.slice(0, 8)}`;
                const phone = d.staff?.phone ? ` (SĐT: ${d.staff.phone})` : "";
                const currentVeh = d.vehicle
                  ? ` — [Đang lái: ${d.vehicle.plateNumber}]`
                  : " — [Chưa nhận xe]";
                return (
                  <option key={d.id} value={d.id}>
                    {fullName}{phone}{currentVeh}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="rounded-xl bg-blue-50/80 border border-blue-200/80 p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>💡 Hướng dẫn phân công:</span>
            </p>
            <p className="text-blue-700 leading-relaxed">
              Chọn tài xế từ danh sách dropdown ở trên. Khi xác nhận, tài xế sẽ được phân công trực tiếp vào phương tiện này để phục vụ các chuyến đi. Nếu tài xế đang nhận xe khác, hệ thống sẽ tự động cập nhật chuyển xe.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Huỷ
            </button>
            <button
              id="assign-driver-submit-btn"
              type="submit"
              disabled={loading || drivers.length === 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Đang xử lý..." : "Xác nhận gán tài xế"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | "ALL">("ALL");
  const [filterAssignment, setFilterAssignment] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Assign driver modal state
  const [assignTarget, setAssignTarget] = useState<VehicleResponse | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ──
  const fetchVehiclesAndDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiclesData, driversData, typesData] = await Promise.all([
        getAllVehicles(),
        getAllDrivers().catch(() => []),
        getAllVehicleTypes().catch(() => []),
      ]);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setVehicleTypes(typesData);
    } catch {
      showToast("Không thể tải danh sách phương tiện.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehiclesAndDrivers();
  }, [fetchVehiclesAndDrivers]);

  // ── Filtered list ──
  const filtered = vehicles.filter((v) => {
    const matchStatus = filterStatus === "ALL" || v.status === filterStatus;
    const matchAssignment =
      filterAssignment === "ALL" ||
      (filterAssignment === "ASSIGNED" ? !!v.assignedDriverName : !v.assignedDriverName);
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      v.plateNumber.toLowerCase().includes(q) ||
      (v.vin ?? "").toLowerCase().includes(q) ||
      v.vehicleTypeName.toLowerCase().includes(q) ||
      (v.assignedDriverName ?? "").toLowerCase().includes(q);
    return matchStatus && matchAssignment && matchSearch;
  });

  // ── Open create modal ──
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setEditingId(null);
    setModalError(null);
    setShowModal(true);
  };

  // ── Open edit modal ──
  const openEdit = (v: VehicleResponse) => {
    setForm({
      plateNumber: v.plateNumber,
      vin: v.vin ?? "",
      capacity: v.capacity,
      vehicleTypeId: v.vehicleTypeId,
      status: v.status,
      odometerKm: v.odometerKm,
    });
    setIsEdit(true);
    setEditingId(v.id);
    setModalError(null);
    setShowModal(true);
  };

  // ── Open assign modal ──
  const openAssignModal = (v: VehicleResponse) => {
    setAssignTarget(v);
    setAssignError(null);
  };

  // ── Submit assign driver ──
  const handleAssignSubmit = async (driverId: string) => {
    if (!assignTarget) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      await assignDriverToVehicle(assignTarget.id, driverId);
      showToast(
        `Đã phân công tài xế thành công cho xe ${assignTarget.plateNumber}!`,
        "success"
      );
      setAssignTarget(null);
      await fetchVehiclesAndDrivers();
    } catch (err) {
      setAssignError(
        err instanceof ApiError ? err.message : "Phân công tài xế thất bại."
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // ── Submit create/update ──
  const handleSubmit = async () => {
    if (!form.plateNumber.trim()) {
      setModalError("Biển số xe không được để trống.");
      return;
    }
    if (!form.vehicleTypeId || form.vehicleTypeId < 1) {
      setModalError("Vui lòng chọn loại xe.");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      if (isEdit && editingId) {
        await updateVehicle(editingId, form);
        showToast("Cập nhật xe thành công!", "success");
      } else {
        await createVehicle(form);
        showToast("Thêm xe mới thành công!", "success");
      }
      setShowModal(false);
      fetchVehiclesAndDrivers();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteVehicle(deleteTarget.id);
      showToast("Đã xoá xe thành công!", "success");
      setDeleteTarget(null);
      fetchVehiclesAndDrivers();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Xoá xe thất bại.",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Stats ──
  const stats = ALL_STATUSES.map((s) => ({
    status: s,
    count: vehicles.filter((v) => v.status === s).length,
  }));

  const assignedCount = vehicles.filter((v) => !!v.assignedDriverName).length;
  const unassignedCount = vehicles.filter((v) => !v.assignedDriverName).length;

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-900">

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Quản lý xe
            </h1>
          </div>
          <button
            id="vehicle-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm xe mới
          </button>
        </div>

        {/* ── Search & Filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="vehicle-search"
              type="text"
              placeholder="Tìm theo biển số, VIN, loại xe, tài xế..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
          <select
            id="vehicle-assignment-filter"
            value={filterAssignment}
            onChange={(e) =>
              setFilterAssignment(
                e.target.value as "ALL" | "ASSIGNED" | "UNASSIGNED"
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none transition-colors font-medium"
          >
            <option value="ALL">Tất cả phương tiện</option>
            <option value="ASSIGNED">Đã gán tài xế ({assignedCount})</option>
            <option value="UNASSIGNED">Chưa gán tài xế ({unassignedCount})</option>
          </select>
          <select
            id="vehicle-status-filter"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as VehicleStatus | "ALL")
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
              <svg className="w-5 h-5 mr-2 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Đang tải dữ liệu...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              <svg className="w-10 h-10 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h1m8 0H9m4 0h2m4 0h1v-3.65a1 1 0 00-.22-.624l-3.48-4.35A1 1 0 0014.52 7H13" />
              </svg>
              Không tìm thấy xe nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 text-left">Biển số</th>
                    <th className="px-5 py-3 text-left">Loại xe</th>
                    <th className="px-5 py-3 text-left">VIN</th>
                    <th className="px-5 py-3 text-left">Sức chứa</th>
                    <th className="px-5 py-3 text-left">Tài xế phụ trách</th>
                    <th className="px-5 py-3 text-left">ODO (km)</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((v) => (
                    <tr
                      key={v.id}
                      className="group hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-semibold text-gray-900">
                        {v.plateNumber}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {v.vehicleTypeName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-gray-500 text-xs">
                        {v.vin || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {v.capacity != null ? (
                          <span>{v.capacity} chỗ</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {v.assignedDriverName ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              <span>👨‍✈️</span>
                              <span>{v.assignedDriverName}</span>
                            </span>
                            <button
                              id={`vehicle-change-driver-${v.id}`}
                              onClick={() => openAssignModal(v)}
                              title="Đổi tài xế khác"
                              className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              Đổi
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-block rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                              Chưa gán
                            </span>
                            <button
                              id={`vehicle-assign-btn-${v.id}`}
                              onClick={() => openAssignModal(v)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-all shadow-2xs hover:shadow-xs active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Gán tài xế
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-gray-700">
                        {v.odometerKm != null ? (
                          v.odometerKm.toLocaleString("vi-VN")
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_COLORS[v.status]}`}
                        >
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`vehicle-edit-${v.id}`}
                            onClick={() => openEdit(v)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-200 hover:text-blue-600 transition-colors shadow-sm"
                          >
                            Sửa
                          </button>
                          <button
                            id={`vehicle-delete-${v.id}`}
                            onClick={() => setDeleteTarget(v)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Result count ── */}
        {!loading && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            Hiển thị {filtered.length} / {vehicles.length} xe
          </p>
        )}
      </main>

      {/* ── Modals ── */}
      {showModal && (
        <VehicleModal
          title={isEdit ? "Chỉnh sửa thông tin xe" : "Thêm xe mới"}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          vehicleTypes={vehicleTypes}
          loading={modalLoading}
          error={modalError}
          isEdit={isEdit}
        />
      )}

      {assignTarget && (
        <AssignDriverModal
          vehicle={assignTarget}
          drivers={drivers}
          onClose={() => setAssignTarget(null)}
          onSubmit={handleAssignSubmit}
          loading={assignLoading}
          error={assignError}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          vehicle={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl text-sm font-medium transition-all animate-in slide-in-from-bottom-2 ${toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            : "border-red-500/30 bg-red-500/10 text-red-600"
            }`}
        >
          {toast.type === "success" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
