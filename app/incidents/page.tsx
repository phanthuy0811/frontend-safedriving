"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
} from "@/services/incident.service";
import { getAllTrips } from "@/services/trip.service";
import { IncidentResponse, IncidentRequest, IncidentType, IncidentSeverity } from "@/types/incident";
import { TripResponse } from "@/types/trip";
import { ApiError } from "@/services/api.client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<IncidentType, string> = {
  ACCIDENT: "Tai nạn",
  BREAKDOWN: "Hỏng hóc kỹ thuật",
  DELAY: "Kẹt xe / Trễ giờ",
  WEATHER: "Sự cố thời tiết",
  PASSENGER: "Sự cố hành khách",
};

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  LOW: "Nhẹ",
  MEDIUM: "Vừa",
  HIGH: "Nghiêm trọng",
  CRITICAL: "Khẩn cấp",
};

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  HIGH: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  CRITICAL: "bg-red-50 text-red-700 border-red-200 animate-pulse",
};

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function toLocalDateTime(dtLocal: string): string {
  return dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
}

function getLocalIsoDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function tripLabel(t: TripResponse): string {
  const route = t.routeName || (t.startLocation && t.endLocation ? `${t.startLocation} → ${t.endLocation}` : `Chuyến #${t.id.slice(0, 8)}`);
  const time = t.plannedStartTime ? ` (${formatDateTime(t.plannedStartTime)})` : "";
  return `${route}${time}`;
}

const EMPTY_FORM: IncidentRequest = {
  tripId: "",
  timeIncident: `${getLocalIsoDateTime(new Date())}:00`,
  type: "BREAKDOWN",
  severity: "MEDIUM",
  description: "",
};

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: IncidentRequest;
  setForm: (f: IncidentRequest) => void;
  trips: TripResponse[];
  loading: boolean;
  error: string | null;
  isEdit: boolean;
  editingIncident?: IncidentResponse;
}

function IncidentModal({ title, onClose, onSubmit, form, setForm, trips, loading, error, isEdit, editingIncident }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-300 bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">{error}</div>}

          {/* Chọn chuyến đi (dropdown khi tạo mới, read-only khi sửa) */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">Chuyến đi <span className="text-red-600">*</span></label>
            {isEdit ? (
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 font-medium">
                {(() => {
                  const tripFromList = trips.find((t) => t.id === form.tripId);
                  if (tripFromList) return tripLabel(tripFromList);
                  if (editingIncident?.tripStartLocation && editingIncident?.tripEndLocation)
                    return `${editingIncident.tripStartLocation} → ${editingIncident.tripEndLocation}`;
                  return `Chuyến #${form.tripId.slice(0, 8)}…`;
                })()}
              </div>
            ) : (
              <select
                value={form.tripId}
                onChange={(e) => setForm({ ...form, tripId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-colors"
              >
                <option value="">-- Chọn chuyến đi --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{tripLabel(t)}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Time */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">Thời gian sự cố <span className="text-red-600">*</span></label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.timeIncident)}
                onChange={(e) => setForm({ ...form, timeIncident: toLocalDateTime(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-colors"
              />
            </div>
            {/* Type */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">Loại sự cố <span className="text-red-600">*</span></label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as IncidentType })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none transition-colors"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">Mức độ nghiêm trọng <span className="text-red-600">*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(SEVERITY_LABELS) as IncidentSeverity[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, severity: s })}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${form.severity === s ? SEVERITY_COLORS[s] : "border-gray-300 bg-white text-gray-500 hover:bg-gray-100"}`}
                >
                  {SEVERITY_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">Mô tả chi tiết</label>
            <textarea
              rows={3}
              placeholder="Ghi chú thêm về tình trạng hiện tại..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Huỷ</button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="rounded-lg bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Báo cáo sự cố"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | "ALL">("ALL");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIncident, setEditingIncident] = useState<IncidentResponse | undefined>(undefined);
  const [form, setForm] = useState<IncidentRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [incidentsData, tripsData] = await Promise.all([getAllIncidents(), getAllTrips().catch(() => [])]);
      setIncidents(incidentsData);
      setTrips(tripsData);
    } catch { showToast("Lỗi khi tải danh sách sự cố", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = incidents.filter((i) => {
    const matchSev = filterSeverity === "ALL" || i.severity === filterSeverity;
    const q = searchTerm.toLowerCase();
    const tripInfo = trips.find((t) => t.id === i.tripId);
    const searchable = [
      i.tripStartLocation, i.tripEndLocation,
      tripInfo?.routeName, tripInfo?.startLocation, tripInfo?.endLocation,
      i.description,
    ].filter(Boolean).join(" ").toLowerCase();
    const matchSearch = !q || searchable.includes(q);
    return matchSev && matchSearch;
  });

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, timeIncident: `${getLocalIsoDateTime(new Date())}:00` });
    setIsEdit(false); setEditingId(null); setModalError(null); setShowModal(true);
  };

  const openEdit = (i: IncidentResponse) => {
    setForm({ tripId: i.tripId, timeIncident: i.timeIncident, type: i.type, severity: i.severity, description: i.description });
    setIsEdit(true); setEditingId(i.id); setEditingIncident(i); setModalError(null); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.tripId.trim()) { setModalError("Vui lòng chọn chuyến đi."); return; }
    if (!form.timeIncident) { setModalError("Chưa chọn thời gian sự cố."); return; }

    setModalLoading(true); setModalError(null);
    try {
      if (isEdit && editingId) { await updateIncident(editingId, form); showToast("Đã cập nhật sự cố!", "success"); }
      else { await createIncident(form); showToast("Đã báo cáo sự cố thành công!", "success"); }
      setShowModal(false); fetchData();
    } catch (err) { setModalError(err instanceof ApiError ? err.message : "Đã xảy ra lỗi."); }
    finally { setModalLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá báo cáo này? Hành động này không thể hoàn tác.")) return;
    try { await deleteIncident(id); showToast("Đã xoá báo cáo", "success"); fetchData(); }
    catch (err) { showToast(err instanceof ApiError ? err.message : "Xoá thất bại", "error"); }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-900">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Quản lý Sự cố</h1>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-red-700 transition-colors active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Báo cáo sự cố
          </button>
        </div>

        {/* ── Severity Pills ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([["ALL", "Tất cả"], ...Object.entries(SEVERITY_LABELS)] as [string, string][]).map(([key, label]) => {
            const count = key === "ALL" ? incidents.length : incidents.filter((i) => i.severity === key).length;
            const isActive = filterSeverity === key;
            return (
              <button
                key={key}
                onClick={() => setFilterSeverity(key as IncidentSeverity | "ALL")}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
                  isActive
                    ? key === "ALL"
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : SEVERITY_COLORS[key as IncidentSeverity] + " shadow-sm font-bold"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                {label}
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${isActive ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search ── */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên chuyến đi, lộ trình hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
              <svg className="w-5 h-5 mr-2 animate-spin text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Đang tải dữ liệu...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Không có sự cố nào phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 text-left">Chuyến đi</th>
                    <th className="px-5 py-3 text-left">Loại sự cố</th>
                    <th className="px-5 py-3 text-left">Mức độ</th>
                    <th className="px-5 py-3 text-left">Thời gian</th>
                    <th className="px-5 py-3 text-left">Mô tả</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((i) => {
                    const tripInfo = trips.find((t) => t.id === i.tripId);
                    const tripDisplay =
                      tripInfo?.routeName ||
                      (i.tripStartLocation && i.tripEndLocation
                        ? `${i.tripStartLocation} → ${i.tripEndLocation}`
                        : tripInfo
                        ? `${tripInfo.startLocation} → ${tripInfo.endLocation}`
                        : `Chuyến #${i.tripId.slice(0, 8)}…`);

                    return (
                      <tr key={i.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-blue-700">{tripDisplay}</div>
                          {i.tripPlannedStartTime && (
                            <div className="text-xs text-gray-400 mt-0.5">🕐 {formatDateTime(i.tripPlannedStartTime)}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-900">
                          {TYPE_LABELS[i.type]}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${SEVERITY_COLORS[i.severity]}`}>
                            {SEVERITY_LABELS[i.severity]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                          {formatDateTime(i.timeIncident)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs">
                          <span className="line-clamp-2">{i.description || <span className="italic opacity-50">Không có mô tả</span>}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(i)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-amber-300 hover:text-amber-600 transition-colors shadow-sm"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(i.id)}
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
            Hiển thị {filtered.length} / {incidents.length} sự cố
          </p>
        )}
      </main>

      {showModal && (
        <IncidentModal
          title={isEdit ? "Cập nhật sự cố" : "Báo cáo sự cố"}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          trips={trips}
          loading={modalLoading}
          error={modalError}
          isEdit={isEdit}
          editingIncident={editingIncident}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl ${toast.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-red-500/30 bg-red-500/10 text-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
