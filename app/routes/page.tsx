"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
} from "@/services/route.service";
import { RouteResponse, RouteRequest } from "@/types/route";
import { ApiError } from "@/services/api.client";

const EMPTY_FORM: RouteRequest = {
  code: "",
  routeName: "",
  distanceKm: 0,
  standardDurationMin: 60,
  isActive: true,
  note: "",
};

// ─── Modal Thêm / Sửa Tuyến Đường ──────────────────────────────────────────

interface RouteModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: RouteRequest;
  setForm: (f: RouteRequest) => void;
  loading: boolean;
  error: string | null;
  isEdit: boolean;
}

function RouteModal({
  title,
  onClose,
  onSubmit,
  form,
  setForm,
  loading,
  error,
  isEdit,
}: RouteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">Thiết lập cự ly và thời gian tiêu chuẩn cho tuyến</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Code */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Mã tuyến đường <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: HN-HP, SG-DL"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono uppercase"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Trạng thái hoạt động
              </label>
              <select
                value={form.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "ACTIVE" })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm dừng khai thác</option>
              </select>
            </div>
          </div>

          {/* Route Name */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              Tên tuyến đường (Hành trình) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Hà Nội - Hải Phòng, Đà Lạt - Sài Gòn"
              value={form.routeName}
              onChange={(e) => setForm({ ...form, routeName: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1">Gợi ý: Dùng định dạng "Điểm đi - Điểm đến" để hệ thống tự động bóc tách khi tạo chuyến đi.</p>
          </div>

          {/* Distance and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Cự ly khoảng cách (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="VD: 120"
                value={form.distanceKm || ""}
                onChange={(e) => setForm({ ...form, distanceKm: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-700">
                Thời gian tiêu chuẩn (phút) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="VD: 120"
                value={form.standardDurationMin || ""}
                onChange={(e) => setForm({ ...form, standardDurationMin: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {form.standardDurationMin > 0 && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Khoảng {(form.standardDurationMin / 60).toFixed(1)} giờ
                </p>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-700">
              Ghi chú
            </label>
            <input
              type="text"
              placeholder="VD: Tuyến cao tốc Hà Nội - Hải Phòng 5B"
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
            {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo tuyến đường"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Xác Nhận Xóa ───────────────────────────────────────────────────

interface DeleteModalProps {
  route: RouteResponse;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function ConfirmDeleteModal({ route, onClose, onConfirm, loading }: DeleteModalProps) {
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
            <h3 className="text-base font-bold text-gray-900">Xác nhận xóa tuyến đường?</h3>
            <p className="text-xs text-gray-500">Thao tác này không thể hoàn tác</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Bạn có chắc chắn muốn xóa tuyến đường <strong className="text-gray-900">[{route.code}] {route.routeName}</strong>?
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

// ─── Trang Quản Lý Tuyến Đường ──────────────────────────────────────────────

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RouteRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<RouteResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load Routes
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllRoutes();
      setRoutes(data);
    } catch (err) {
      const e = err as ApiError;
      setError(e.message || "Không thể tải danh sách tuyến đường");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit create or edit
  const handleSubmit = async () => {
    if (!form.code.trim()) {
      setModalError("Vui lòng nhập mã tuyến đường");
      return;
    }
    if (!form.routeName.trim()) {
      setModalError("Vui lòng nhập tên tuyến đường");
      return;
    }
    if (!form.distanceKm || form.distanceKm <= 0) {
      setModalError("Cự ly khoảng cách phải lớn hơn 0");
      return;
    }
    if (!form.standardDurationMin || form.standardDurationMin <= 0) {
      setModalError("Thời gian tiêu chuẩn phải lớn hơn 0");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      if (isEdit && editId) {
        await updateRoute(editId, form);
      } else {
        await createRoute(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      const e = err as ApiError;
      setModalError(e.message || "Lỗi lưu tuyến đường");
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
  const openEditModal = (r: RouteResponse) => {
    setIsEdit(true);
    setEditId(r.id);
    setForm({
      code: r.code,
      routeName: r.routeName,
      distanceKm: r.distanceKm,
      standardDurationMin: r.standardDurationMin,
      isActive: r.isActive ?? true,
      note: r.note || "",
    });
    setModalError(null);
    setModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteRoute(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      const e = err as ApiError;
      alert("Không thể xóa tuyến đường: " + (e.message || "Đã xảy ra lỗi"));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered Routes
  const filteredRoutes = routes.filter((r) => {
    const matchSearch =
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.note && r.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && r.isActive !== false) ||
      (statusFilter === "INACTIVE" && r.isActive === false);

    return matchSearch && matchStatus;
  });

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.isActive !== false).length;
  const avgDistance =
    totalRoutes > 0
      ? (routes.reduce((acc, r) => acc + (r.distanceKm || 0), 0) / totalRoutes).toFixed(1)
      : "0";

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Quản lý Tuyến Đường</span>
          </h1>

        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm Tuyến Đường Mới
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
            placeholder="Tìm theo mã hoặc tên tuyến..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === "ALL"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Tất cả ({totalRoutes})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === "ACTIVE"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Đang chạy ({activeRoutes})
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === "INACTIVE"
              ? "bg-gray-700 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Tạm dừng ({totalRoutes - activeRoutes})
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Đang tải danh sách tuyến đường...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Không tìm thấy tuyến đường nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Mã tuyến</th>
                  <th className="px-5 py-3.5">Tên tuyến đường (Hành trình)</th>
                  <th className="px-5 py-3.5">Cự ly</th>
                  <th className="px-5 py-3.5">Thời gian tiêu chuẩn</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Ghi chú</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRoutes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Code */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-md border border-gray-200">
                        {r.code}
                      </span>
                    </td>

                    {/* Route Name */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>🛣️</span>
                        <span>{r.routeName}</span>
                      </div>
                    </td>

                    {/* Distance */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900">{r.distanceKm}</span>
                      <span className="text-xs text-gray-500 ml-1">km</span>
                    </td>

                    {/* Duration */}
                    <td className="px-5 py-4">
                      <div className="text-gray-900 font-medium">{r.standardDurationMin} phút</div>
                      <div className="text-[11px] text-gray-400">
                        ~ {(r.standardDurationMin / 60).toFixed(1)} giờ
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {r.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                          Tạm dừng
                        </span>
                      )}
                    </td>

                    {/* Note */}
                    <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">
                      {r.note || "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(r)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Xóa
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

      {/* Route Modal */}
      {modalOpen && (
        <RouteModal
          title={isEdit ? "Cập Nhật Tuyến Đường" : "Thêm Tuyến Đường Mới"}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          loading={modalLoading}
          error={modalError}
          isEdit={isEdit}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          route={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
