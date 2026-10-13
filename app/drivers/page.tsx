"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from "@/services/driver.service";
import { getAllVehicles } from "@/services/vehicle.service";
import { getAllStaff } from "@/services/staff.service";
import { DriverResponse, DriverRequest } from "@/types/driver";
import { VehicleResponse } from "@/types/vehicle";
import { StaffResponse } from "@/types/auth";
import { ApiError } from "@/services/api.client";

const todayStr = new Date().toISOString().slice(0, 10);

const EMPTY_FORM: DriverRequest = {
  hireDate: todayStr,
  urlImage: "",
  isActive: true,
  staffId: "",
  vehicleId: "",
};

// ─── Modal Thêm / Sửa Tài Xế ────────────────────────────────────────────────

interface DriverModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: DriverRequest;
  setForm: (f: DriverRequest) => void;
  staffList: StaffResponse[];
  vehicles: VehicleResponse[];
  existingDriverStaffIds: Set<string>;
  loading: boolean;
  error: string | null;
  isEdit: boolean;
}

function DriverModal({
  title,
  onClose,
  onSubmit,
  form,
  setForm,
  staffList,
  vehicles,
  existingDriverStaffIds,
  loading,
  error,
  isEdit,
}: DriverModalProps) {
  // Khi tạo mới: chỉ hiển thị các Staff chưa có hồ sơ tài xế
  const availableStaff = isEdit
    ? staffList
    : staffList.filter((s) => !s.id || !existingDriverStaffIds.has(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">Quản lý hồ sơ nhân sự, phương tiện và ngày tuyển dụng</p>
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

          {/* Chọn Nhân sự (Staff) */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              👤 Nhân sự liên kết <span className="text-red-500">*</span>
            </label>
            <select
              value={form.staffId || ""}
              onChange={(e) => setForm({ ...form, staffId: e.target.value })}
              disabled={isEdit}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500 transition-all font-medium"
            >
              <option value="">-- Chọn nhân viên để tạo hồ sơ tài xế --</option>
              {availableStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName || `${s.firstName || ""} ${s.lastName || ""}`} {s.phone ? `(${s.phone})` : ""} - {s.email || "No email"}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-[11px] text-gray-400 mt-1 italic">
                Hồ sơ nhân sự không thể thay đổi sau khi đã liên kết tài xế.
              </p>
            )}
            {!isEdit && availableStaff.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                ⚠️ Tất cả nhân viên hiện tại đều đã được tạo hồ sơ tài xế.
              </p>
            )}
          </div>

          {/* Chọn Phương tiện giao cho tài xế */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              🚗 Phương tiện phụ trách (Giao xe)
            </label>
            <select
              value={form.vehicleId || ""}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">-- Chưa giao xe (giao sau) --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.vehicleTypeName || "Xe"} - {v.status === "AVAILABLE" ? "Sẵn sàng" : "Đang chạy"})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Xe được giao ở đây sẽ được tự động nhận diện khi tài xế nhận chuyến đi.
            </p>
          </div>

          {/* Ngày tuyển dụng & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                📅 Ngày tuyển dụng <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Trạng thái làm việc
              </label>
              <select
                value={form.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "ACTIVE" })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="ACTIVE">Đang làm việc</option>
                <option value="INACTIVE">Tạm nghỉ / Khóa hồ sơ</option>
              </select>
            </div>
          </div>

          {/* URL Ảnh chân dung */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              🖼️ Đường dẫn ảnh đại diện (URL)
            </label>
            <input
              type="text"
              placeholder="VD: https://example.com/avatar-driver.jpg"
              value={form.urlImage || ""}
              onChange={(e) => setForm({ ...form, urlImage: e.target.value })}
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
            {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo hồ sơ tài xế"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Xác Nhận Xóa ───────────────────────────────────────────────────

interface DeleteModalProps {
  driver: DriverResponse;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ConfirmDeleteModal({ driver, onClose, onConfirm, loading }: DeleteModalProps) {
  const driverName = driver.staff?.fullName || "Tài xế";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Xóa hồ sơ tài xế?</h3>
            <p className="text-xs text-gray-500">Tài xế sẽ không thể tiếp tục nhận chuyến đi</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Bạn có chắc chắn muốn xóa hồ sơ của tài xế <strong className="text-gray-900">{driverName}</strong>?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang xóa..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trang Quản Lý Tài Xế ───────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ASSIGNED" | "UNASSIGNED">("ALL");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DriverRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DriverResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [driversData, staffData, vehiclesData] = await Promise.all([
        getAllDrivers(),
        getAllStaff().catch(() => []),
        getAllVehicles().catch(() => []),
      ]);
      setDrivers(driversData);
      setStaffList(staffData);
      setVehicles(vehiclesData);
    } catch (err) {
      const e = err as ApiError;
      setError(e.message || "Không thể tải danh sách tài xế");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set các staffId đã có driver
  const existingDriverStaffIds = new Set(
    drivers.map((d) => d.staff?.id).filter(Boolean) as string[]
  );

  // Submit create or edit
  const handleSubmit = async () => {
    if (!form.staffId?.trim()) {
      setModalError("Vui lòng chọn nhân sự để tạo hồ sơ tài xế");
      return;
    }
    if (!form.hireDate) {
      setModalError("Vui lòng chọn ngày tuyển dụng");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      if (isEdit && editId) {
        await updateDriver(editId, form);
      } else {
        await createDriver(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      const e = err as ApiError;
      setModalError(e.message || "Lỗi lưu thông tin tài xế");
    } finally {
      setModalLoading(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setIsEdit(false);
    setEditId(null);
    setForm({
      ...EMPTY_FORM,
      hireDate: todayStr,
    });
    setModalError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (d: DriverResponse) => {
    setIsEdit(true);
    setEditId(d.id);
    setForm({
      hireDate: d.hireDate || todayStr,
      urlImage: d.urlImage || "",
      isActive: d.isActive ?? true,
      staffId: d.staff?.id || "",
      vehicleId: d.vehicle?.id || "",
    });
    setModalError(null);
    setModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDriver(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      const e = err as ApiError;
      alert("Không thể xóa tài xế: " + (e.message || "Đã xảy ra lỗi"));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter Drivers
  const filteredDrivers = drivers.filter((d) => {
    const name = d.staff?.fullName || `${d.staff?.firstName || ""} ${d.staff?.lastName || ""}`;
    const phone = d.staff?.phone || "";
    const email = d.staff?.email || "";
    const plate = d.vehicle?.plateNumber || "";
    const username = d.staff?.account?.username || "";

    const matchSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username.toLowerCase().includes(searchTerm.toLowerCase());

    let matchFilter = true;
    if (filterType === "ACTIVE") {
      matchFilter = d.isActive !== false;
    } else if (filterType === "INACTIVE") {
      matchFilter = d.isActive === false;
    } else if (filterType === "ASSIGNED") {
      matchFilter = !!d.vehicle;
    } else if (filterType === "UNASSIGNED") {
      matchFilter = !d.vehicle;
    }

    return matchSearch && matchFilter;
  });

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter((d) => d.isActive !== false).length;
  const assignedVehicleDrivers = drivers.filter((d) => !!d.vehicle).length;
  const unassignedVehicleDrivers = totalDrivers - assignedVehicleDrivers;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>👨‍✈️</span>
            <span>Hồ Sơ Đội Ngũ Tài Xế</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý danh sách tài xế, phương tiện phụ trách, liên hệ và trạng thái hoạt động
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm Hồ Sơ Tài Xế Mới
        </button>
      </div>

      {/* Stats Cards (Bấm để lọc nhanh) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterType("ALL")}
          className={`rounded-2xl border p-5 text-left transition-all hover:scale-[1.02] cursor-pointer ${
            filterType === "ALL"
              ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-md"
              : "border-gray-200 bg-white shadow-sm hover:border-gray-300"
          }`}
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng số tài xế</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{totalDrivers}</div>
          <p className="mt-1 text-xs text-gray-400">Hồ sơ đã đăng ký</p>
        </button>

        <button
          onClick={() => setFilterType(filterType === "ACTIVE" ? "ALL" : "ACTIVE")}
          className={`rounded-2xl border p-5 text-left transition-all hover:scale-[1.02] cursor-pointer ${
            filterType === "ACTIVE"
              ? "border-emerald-500 bg-emerald-100/60 ring-2 ring-emerald-500/20 shadow-md"
              : "border-emerald-200 bg-emerald-50/50 shadow-sm hover:border-emerald-300"
          }`}
        >
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Đang hoạt động</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700">{activeDrivers}</div>
          <p className="mt-1 text-xs text-emerald-600/80">Sẵn sàng nhận chuyến</p>
        </button>

        <button
          onClick={() => setFilterType(filterType === "ASSIGNED" ? "ALL" : "ASSIGNED")}
          className={`rounded-2xl border p-5 text-left transition-all hover:scale-[1.02] cursor-pointer ${
            filterType === "ASSIGNED"
              ? "border-blue-500 bg-blue-100/60 ring-2 ring-blue-500/20 shadow-md"
              : "border-blue-200 bg-blue-50/50 shadow-sm hover:border-blue-300"
          }`}
        >
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">Đã giao xe</div>
          <div className="mt-2 text-3xl font-extrabold text-blue-700">{assignedVehicleDrivers}</div>
          <p className="mt-1 text-xs text-blue-600/80">Có phương tiện phụ trách</p>
        </button>

        <button
          onClick={() => setFilterType(filterType === "UNASSIGNED" ? "ALL" : "UNASSIGNED")}
          className={`rounded-2xl border p-5 text-left transition-all hover:scale-[1.02] cursor-pointer ${
            filterType === "UNASSIGNED"
              ? "border-amber-500 bg-amber-100/60 ring-2 ring-amber-500/20 shadow-md"
              : "border-amber-200 bg-amber-50/50 shadow-sm hover:border-amber-300"
          }`}
        >
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Chưa giao xe</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-700">{unassignedVehicleDrivers}</div>
          <p className="mt-1 text-xs text-amber-600/80">Cần gán phương tiện</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, biển số xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status & Vehicle Filter buttons */}
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả ({totalDrivers})
          </button>
          <button
            onClick={() => setFilterType(filterType === "ACTIVE" ? "ALL" : "ACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Đang hoạt động ({activeDrivers})
          </button>
          <button
            onClick={() => setFilterType(filterType === "INACTIVE" ? "ALL" : "INACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === "INACTIVE"
                ? "bg-gray-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tạm nghỉ ({totalDrivers - activeDrivers})
          </button>

          {/* Vehicle filter */}
          <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />
          <button
            onClick={() => setFilterType(filterType === "ASSIGNED" ? "ALL" : "ASSIGNED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === "ASSIGNED"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🚗 Đã có xe ({assignedVehicleDrivers})
          </button>
          <button
            onClick={() => setFilterType(filterType === "UNASSIGNED" ? "ALL" : "UNASSIGNED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === "UNASSIGNED"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ⚠️ Chưa có xe ({unassignedVehicleDrivers})
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Đang tải danh sách tài xế...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Không tìm thấy tài xế nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tài xế</th>
                  <th className="px-5 py-3.5">Liên hệ</th>
                  <th className="px-5 py-3.5">Xe phụ trách</th>
                  <th className="px-5 py-3.5">Ngày tuyển dụng</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrivers.map((d) => {
                  const staff = d.staff;
                  const name = staff?.fullName || `${staff?.firstName || ""} ${staff?.lastName || ""}`.trim() || "Chưa cập nhật";
                  const initial = name.charAt(0).toUpperCase() || "T";

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Driver info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {d.urlImage ? (
                            <img
                              src={d.urlImage}
                              alt={name}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                              {initial}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{name}</div>
                            {staff?.account?.username && (
                              <div className="text-xs text-gray-400 font-mono">
                                @{staff.account.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="text-xs text-gray-900 font-medium">
                          📞 {staff?.phone || "—"}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          ✉️ {staff?.email || "—"}
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-4">
                        {d.vehicle ? (
                          <div>
                            <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md">
                              🚗 {d.vehicle.plateNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
                            Chưa giao xe
                          </span>
                        )}
                      </td>

                      {/* Hire Date */}
                      <td className="px-5 py-4 text-xs text-gray-600 font-medium">
                        {d.hireDate || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {d.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Đang làm việc
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                            Tạm nghỉ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(d)}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setDeleteTarget(d)}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Xóa
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

      {/* Driver Modal */}
      {modalOpen && (
        <DriverModal
          title={isEdit ? "Cập Nhật Hồ Sơ Tài Xế" : "Thêm Hồ Sơ Tài Xế Mới"}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          staffList={staffList}
          vehicles={vehicles}
          existingDriverStaffIds={existingDriverStaffIds}
          loading={modalLoading}
          error={modalError}
          isEdit={isEdit}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          driver={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
