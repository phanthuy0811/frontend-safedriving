"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "@/services/trip.service";
import { TripResponse, TripRequest, TripStatus } from "@/types/trip";
import { ApiError } from "@/services/api.client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: "Đã lên kế hoạch",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

const STATUS_COLORS: Record<TripStatus, string> = {
  PLANNED: "bg-slate-500/15 text-gray-700 border-slate-500/30",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-cyan-500/15 text-blue-600 border-cyan-500/30",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const ALL_STATUSES: TripStatus[] = [
  "PLANNED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

// Convert "2024-01-15T08:00:00" → "15/01/2024 08:00"
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

// For <input type="datetime-local"> value
function toDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 16); // "2024-01-15T08:00"
}

// For sending to BE: "2024-01-15T08:00" → "2024-01-15T08:00:00"
function toLocalDateTime(dtLocal: string): string {
  return dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
}

const now = new Date();
const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

const EMPTY_FORM: TripRequest = {
  routeId: "",
  plannedStartTime: toLocalDateTime(now.toISOString().slice(0, 16)),
  plannedEndTime: toLocalDateTime(inOneHour.toISOString().slice(0, 16)),
  status: "PLANNED",
};

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: TripRequest;
  setForm: (f: TripRequest) => void;
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
  loading,
  error,
  isEdit,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent/80 backdrop-blur-sm" onClick={onClose} />
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

          {/* Route ID */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              ID Tuyến đường <span className="text-red-600">*</span>
            </label>
            <input
              id="trip-route-id"
              type="text"
              placeholder="VD: ROUTE-001"
              value={form.routeId}
              onChange={(e) => setForm({ ...form, routeId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Planned Start Time */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              Thời gian xuất phát (dự kiến) <span className="text-red-600">*</span>
            </label>
            <input
              id="trip-planned-start"
              type="datetime-local"
              value={toDateTimeLocal(form.plannedStartTime)}
              onChange={(e) =>
                setForm({
                  ...form,
                  plannedStartTime: toLocalDateTime(e.target.value),
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors "
            />
          </div>

          {/* Planned End Time */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">
              Thời gian đến (dự kiến) <span className="text-red-600">*</span>
            </label>
            <input
              id="trip-planned-end"
              type="datetime-local"
              value={toDateTimeLocal(form.plannedEndTime)}
              onChange={(e) =>
                setForm({
                  ...form,
                  plannedEndTime: toLocalDateTime(e.target.value),
                })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors "
            />
          </div>

          {/* Status (chỉ hiện khi edit) */}
          {isEdit && (
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">
                Trạng thái
              </label>
              <select
                id="trip-status"
                value={form.status ?? "PLANNED"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TripStatus })
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
          )}
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
            id="trip-modal-submit"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-lg bg-blue-600 text-white px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Lên kế hoạch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  trip,
  onClose,
  onConfirm,
  loading,
}: {
  trip: TripResponse;
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
            <h3 className="text-sm font-bold text-gray-900">Huỷ chuyến đi?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Dữ liệu sẽ bị ẩn (soft delete)</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6">
          Xoá chuyến{" "}
          <span className="font-mono font-bold text-gray-900">{trip.routeId}</span>{" "}
          lúc <span className="text-blue-600">{formatDateTime(trip.plannedStartTime)}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Huỷ
          </button>
          <button
            id="trip-delete-confirm"
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TripStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TripRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TripResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      setTrips(await getAllTrips());
    } catch {
      showToast("Không thể tải danh sách chuyến đi.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // ── Stats ──
  const stats = ALL_STATUSES.map((s) => ({
    status: s,
    count: trips.filter((t) => t.status === s).length,
  }));

  // ── Filter ──
  const filtered = trips.filter((t) => {
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      t.routeId.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const openCreate = () => {
    const n = new Date();
    const h = new Date(n.getTime() + 60 * 60 * 1000);
    setForm({
      routeId: "",
      plannedStartTime: toLocalDateTime(n.toISOString().slice(0, 16)),
      plannedEndTime: toLocalDateTime(h.toISOString().slice(0, 16)),
      status: "PLANNED",
    });
    setIsEdit(false);
    setEditingId(null);
    setModalError(null);
    setShowModal(true);
  };

  const openEdit = (t: TripResponse) => {
    setForm({
      routeId: t.routeId,
      plannedStartTime: t.plannedStartTime,
      plannedEndTime: t.plannedEndTime,
      status: t.status,
    });
    setIsEdit(true);
    setEditingId(t.id);
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.routeId.trim()) { setModalError("ID tuyến đường không được để trống."); return; }
    if (!form.plannedStartTime) { setModalError("Vui lòng chọn thời gian xuất phát."); return; }
    if (!form.plannedEndTime) { setModalError("Vui lòng chọn thời gian đến."); return; }
    if (new Date(form.plannedEndTime) <= new Date(form.plannedStartTime)) {
      setModalError("Thời gian đến phải sau thời gian xuất phát.");
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      if (isEdit && editingId) {
        await updateTrip(editingId, form);
        showToast("Cập nhật chuyến đi thành công!", "success");
      } else {
        await createTrip(form);
        showToast("Lên kế hoạch chuyến đi thành công!", "success");
      }
      setShowModal(false);
      fetchTrips();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteTrip(deleteTarget.id);
      showToast("Đã xoá chuyến đi thành công!", "success");
      setDeleteTarget(null);
      fetchTrips();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Xoá thất bại.", "error");
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
              Quản lý Chuyến đi
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Lập kế hoạch và theo dõi trạng thái các chuyến đi của đội xe
            </p>
          </div>
          <button
            id="trip-add-btn"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-sm hover:bg-blue-700 transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Lên kế hoạch chuyến
          </button>
        </div>

        {/* ── Status Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {stats.map(({ status, count }) => (
            <button
              key={status}
              id={`trip-filter-${status.toLowerCase()}`}
              onClick={() => setFilterStatus(filterStatus === status ? "ALL" : status)}
              className={`rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] ${
                filterStatus === status
                  ? "border-blue-200 bg-blue-50 ring-1 ring-blue-500/20"
                  : "border-gray-200 bg-white shadow-sm border-gray-200"
              }`}
            >
              <div className="text-2xl font-extrabold font-mono text-gray-900">{count}</div>
              <div className="mt-1">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="trip-search"
              type="text"
              placeholder="Tìm theo tuyến đường hoặc ID chuyến..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
          <select
            id="trip-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TripStatus | "ALL")}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm border-gray-200 overflow-hidden">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Không có chuyến đi nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 text-left">Tuyến đường</th>
                    <th className="px-5 py-3 text-left">Giờ xuất phát (DK)</th>
                    <th className="px-5 py-3 text-left">Giờ đến (DK)</th>
                    <th className="px-5 py-3 text-left">Thực tế bắt đầu</th>
                    <th className="px-5 py-3 text-left">Thực tế kết thúc</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((t) => (
                    <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-semibold text-blue-600">{t.routeId}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{t.id.slice(0, 8)}…</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 text-xs">{formatDateTime(t.plannedStartTime)}</td>
                      <td className="px-5 py-3.5 text-gray-700 text-xs">{formatDateTime(t.plannedEndTime)}</td>
                      <td className="px-5 py-3.5 text-xs">
                        {t.startTime ? (
                          <span className="text-emerald-600">{formatDateTime(t.startTime)}</span>
                        ) : (
                          <span className="text-gray-400">Chưa bắt đầu</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {t.endTime ? (
                          <span className="text-emerald-600">{formatDateTime(t.endTime)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_COLORS[t.status]}`}>
                          {STATUS_LABELS[t.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            id={`trip-edit-${t.id}`}
                            onClick={() => openEdit(t)}
                            disabled={t.status === "COMPLETED" || t.status === "CANCELLED"}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-200 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            id={`trip-delete-${t.id}`}
                            onClick={() => setDeleteTarget(t)}
                            disabled={t.status === "IN_PROGRESS"}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-red-500/50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

        {!loading && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            Hiển thị {filtered.length} / {trips.length} chuyến đi
          </p>
        )}
      </main>

      {showModal && (
        <TripModal
          title={isEdit ? "Chỉnh sửa chuyến đi" : "Lên kế hoạch chuyến đi mới"}
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
          trip={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl text-sm font-medium ${
          toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            : "border-red-500/30 bg-red-500/10 text-red-600"
        }`}>
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
