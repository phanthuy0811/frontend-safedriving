"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllVehicleTypes,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
} from "@/services/vehicle-type.service";
import { VehicleTypeResponse, VehicleTypeRequest } from "@/types/vehicle-type";
import { ApiError } from "@/services/api.client";

const EMPTY_FORM: VehicleTypeRequest = {
  code: "",
  name: "",
  capacity: 1,
};

// ─── Modal ──────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: VehicleTypeRequest;
  setForm: (f: VehicleTypeRequest) => void;
  loading: boolean;
  error: string | null;
  isEdit: boolean;
}

function VehicleTypeModal({
  title,
  onClose,
  onSubmit,
  form,
  setForm,
  loading,
  error,
  isEdit,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-transparent/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-300 bg-white shadow-2xl">
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

          {/* Code */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              Mã loại xe <span className="text-red-600">*</span>
            </label>
            <input
              id="vehicle-type-code"
              type="text"
              placeholder="VD: BUS_16, COACH_45"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              Tên loại xe <span className="text-red-600">*</span>
            </label>
            <input
              id="vehicle-type-name"
              type="text"
              placeholder="VD: Xe buýt 16 chỗ"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              Sức chứa (số chỗ ngồi) <span className="text-red-600">*</span>
            </label>
            <input
              id="vehicle-type-capacity"
              type="number"
              min={1}
              placeholder="VD: 45"
              value={form.capacity || ""}
              onChange={(e) =>
                setForm({ ...form, capacity: parseInt(e.target.value) || 1 })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
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
            id="vehicle-type-modal-submit"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-lg bg-blue-600 text-white px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ──────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  vehicleType,
  onClose,
  onConfirm,
  loading,
}: {
  vehicleType: VehicleTypeResponse;
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
            <h3 className="text-sm font-bold text-gray-900">Xoá loại xe?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Hành động không thể hoàn tác</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6">
          Bạn có chắc muốn xoá loại xe{" "}
          <span className="font-bold text-gray-900">{vehicleType.name}</span>{" "}
          <span className="font-mono text-gray-500">({vehicleType.code})</span>?
          <br />
          <span className="text-xs text-amber-600 mt-1 block">
            ⚠️ Chỉ xoá được nếu không có xe nào đang dùng loại này.
          </span>
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Huỷ
          </button>
          <button
            id="vehicle-type-delete-confirm"
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function VehicleTypesPage() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VehicleTypeRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<VehicleTypeResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ──
  const fetchVehicleTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllVehicleTypes();
      setVehicleTypes(data);
    } catch {
      showToast("Không thể tải danh sách loại xe.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  // ── Filter ──
  const filtered = vehicleTypes.filter((vt) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      vt.code.toLowerCase().includes(q) ||
      vt.name.toLowerCase().includes(q) ||
      vt.capacity.toString().includes(q)
    );
  });

  // ── Capacity groups for stats ──
  const totalTypes = vehicleTypes.length;
  const totalCapacity = vehicleTypes.reduce((sum, vt) => sum + vt.capacity, 0);
  const avgCapacity = totalTypes > 0 ? Math.round(totalCapacity / totalTypes) : 0;
  const maxCapacity = totalTypes > 0 ? Math.max(...vehicleTypes.map((vt) => vt.capacity)) : 0;

  // ── Open create ──
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setIsEdit(false);
    setEditingId(null);
    setModalError(null);
    setShowModal(true);
  };

  // ── Open edit ──
  const openEdit = (vt: VehicleTypeResponse) => {
    setForm({ code: vt.code, name: vt.name, capacity: vt.capacity });
    setIsEdit(true);
    setEditingId(vt.id);
    setModalError(null);
    setShowModal(true);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.code.trim()) { setModalError("Mã loại xe không được để trống."); return; }
    if (!form.name.trim()) { setModalError("Tên loại xe không được để trống."); return; }
    if (!form.capacity || form.capacity < 1) { setModalError("Sức chứa phải từ 1 chỗ trở lên."); return; }

    setModalLoading(true);
    setModalError(null);
    try {
      if (isEdit && editingId !== null) {
        await updateVehicleType(editingId, form);
        showToast("Cập nhật loại xe thành công!", "success");
      } else {
        await createVehicleType(form);
        showToast("Thêm loại xe thành công!", "success");
      }
      setShowModal(false);
      fetchVehicleTypes();
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
      await deleteVehicleType(deleteTarget.id);
      showToast("Đã xoá loại xe thành công!", "success");
      setDeleteTarget(null);
      fetchVehicleTypes();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Xoá loại xe thất bại.",
        "error"
      );
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
              Quản lý Loại Phương tiện
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Phân loại xe theo sức chứa và mã loại để phân công chuyến đi phù hợp
            </p>
          </div>
          <button
            id="vehicle-type-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm loại xe
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-500 mb-1">Tổng loại xe</div>
            <div className="text-3xl font-extrabold font-mono text-blue-600">{totalTypes}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-500 mb-1">Sức chứa TB</div>
            <div className="text-3xl font-extrabold font-mono text-blue-600">
              {avgCapacity} <span className="text-base font-semibold text-gray-400">chỗ</span>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-500 mb-1">Lớn nhất</div>
            <div className="text-3xl font-extrabold font-mono text-emerald-600">
              {maxCapacity} <span className="text-base font-semibold text-gray-400">chỗ</span>
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="vehicle-type-search"
              type="text"
              placeholder="Tìm theo mã, tên hoặc sức chứa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        {/* ── Grid Cards ── */}
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
            Không tìm thấy loại xe nào
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((vt) => (
              <div
                key={vt.id}
                id={`vehicle-type-card-${vt.id}`}
                className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm border-gray-200 p-5 hover:border-blue-300 hover:bg-gray-50 transition-all"
              >
                {/* ID badge */}
                <span className="absolute top-3 right-3 text-[10px] font-mono text-gray-400">
                  #{vt.id}
                </span>

                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-200">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h1m8 0H9m4 0h2m4 0h1v-3.65a1 1 0 00-.22-.624l-3.48-4.35A1 1 0 0014.52 7H13" />
                  </svg>
                </div>

                {/* Code */}
                <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-700 border border-gray-300 mb-2">
                  {vt.code}
                </span>

                {/* Name */}
                <h3 className="text-sm font-bold text-gray-900 leading-snug mb-3">{vt.name}</h3>

                {/* Capacity */}
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <span className="font-bold text-emerald-600">{vt.capacity}</span>{" "}
                    <span className="text-gray-400">chỗ ngồi</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`vehicle-type-edit-${vt.id}`}
                    onClick={() => openEdit(vt)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white py-1.5 text-xs font-medium text-gray-700 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    id={`vehicle-type-delete-${vt.id}`}
                    onClick={() => setDeleteTarget(vt)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white py-1.5 text-xs font-medium text-gray-700 hover:border-red-500/50 hover:text-red-600 transition-colors"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && (
          <p className="mt-4 text-xs text-gray-400 text-right">
            Hiển thị {filtered.length} / {vehicleTypes.length} loại xe
          </p>
        )}
      </main>

      {/* ── Modals ── */}
      {showModal && (
        <VehicleTypeModal
          title={isEdit ? "Chỉnh sửa loại xe" : "Thêm loại xe mới"}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          loading={modalLoading}
          error={modalError}
          isEdit={isEdit}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          vehicleType={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl text-sm font-medium ${
            toast.type === "success"
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
