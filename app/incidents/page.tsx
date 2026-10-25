"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
} from "@/services/incident.service";
import { IncidentResponse, IncidentRequest, IncidentType, IncidentSeverity } from "@/types/incident";
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

const EMPTY_FORM: IncidentRequest = {
  tripId: "",
  timeIncident: toLocalDateTime(new Date().toISOString().slice(0, 16)),
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
  loading: boolean;
  error: string | null;
  isEdit: boolean;
}

function IncidentModal({ title, onClose, onSubmit, form, setForm, loading, error, isEdit }: ModalProps) {
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

          {/* Trip ID */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500">ID Chuyến đi <span className="text-red-600">*</span></label>
            <input
              type="text"
              placeholder="UUID của chuyến đi gặp sự cố"
              value={form.tripId}
              onChange={(e) => setForm({ ...form, tripId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-colors font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Time */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-500">Thời gian sự cố <span className="text-red-600">*</span></label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.timeIncident)}
                onChange={(e) => setForm({ ...form, timeIncident: toLocalDateTime(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-colors "
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
                  className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${
                    form.severity === s ? SEVERITY_COLORS[s] : "border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                  }`}
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
            className="rounded-lg bg-red-600 text-white px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-red-700 disabled:opacity-50 transition-colors"
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | "ALL">("ALL");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IncidentRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try { setIncidents(await getAllIncidents()); }
    catch { showToast("Lỗi khi tải danh sách sự cố", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const filtered = incidents.filter((i) => {
    const matchSev = filterSeverity === "ALL" || i.severity === filterSeverity;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || i.tripId.toLowerCase().includes(q) || (i.description?.toLowerCase() || "").includes(q);
    return matchSev && matchSearch;
  });

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, timeIncident: toLocalDateTime(new Date().toISOString().slice(0, 16)) });
    setIsEdit(false); setEditingId(null); setModalError(null); setShowModal(true);
  };

  const openEdit = (i: IncidentResponse) => {
    setForm({ tripId: i.tripId, timeIncident: i.timeIncident, type: i.type, severity: i.severity, description: i.description });
    setIsEdit(true); setEditingId(i.id); setModalError(null); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.tripId.trim()) { setModalError("ID chuyến đi không được để trống."); return; }
    if (!form.timeIncident) { setModalError("Chưa chọn thời gian sự cố."); return; }

    setModalLoading(true); setModalError(null);
    try {
      if (isEdit && editingId) { await updateIncident(editingId, form); showToast("Đã cập nhật sự cố!", "success"); }
      else { await createIncident(form); showToast("Đã báo cáo sự cố thành công!", "success"); }
      setShowModal(false); fetchIncidents();
    } catch (err) { setModalError(err instanceof ApiError ? err.message : "Đã xảy ra lỗi."); }
    finally { setModalLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá báo cáo này? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteIncident(id);
      showToast("Đã xoá báo cáo", "success");
      fetchIncidents();
    } catch (err) { showToast(err instanceof ApiError ? err.message : "Xoá thất bại", "error"); }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-900">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <span className="text-red-600">⚠️</span> Quản lý Sự cố
            </h1>
            <p className="mt-1 text-sm text-gray-500">Ghi nhận hỏng hóc, tai nạn, sự cố thời tiết trên tuyến</p>
          </div>
          <button onClick={openCreate} className="rounded-xl bg-red-600 text-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-sm hover:bg-red-700 transition-colors">
            + Báo cáo sự cố
          </button>
        </div>

        {/* ── Stats & Filters ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo ID chuyến đi hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <button
              onClick={() => setFilterSeverity("ALL")}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${filterSeverity === "ALL" ? "border-slate-500 bg-white text-gray-900" : "border-gray-200 bg-white border-gray-200 text-gray-500 hover:bg-white"}`}
            >
              Tất cả
            </button>
            {(Object.keys(SEVERITY_LABELS) as IncidentSeverity[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition-all ${filterSeverity === s ? SEVERITY_COLORS[s] : "border-gray-200 bg-white border-gray-200 text-gray-400 hover:bg-white"}`}
              >
                {SEVERITY_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* ── List / Grid ── */}
        {loading ? (
          <div className="py-20 text-center text-gray-500 text-sm">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">Không có sự cố nào phù hợp.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((i) => (
              <div key={i.id} className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm border-gray-200 p-5 hover:border-red-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_COLORS[i.severity]}`}>
                    {SEVERITY_LABELS[i.severity]}
                  </span>
                  <span className="text-xs text-gray-400">{formatDateTime(i.timeIncident)}</span>
                </div>
                
                <h3 className="text-base font-bold text-gray-900 mb-1">{TYPE_LABELS[i.type]}</h3>
                <p className="font-mono text-xs text-blue-600 mb-3 truncate" title={i.tripId}>Chuyến: {i.tripId}</p>
                
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                  {i.description || <span className="italic opacity-50">Không có mô tả chi tiết</span>}
                </p>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                  <button onClick={() => openEdit(i)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">Sửa</button>
                  <button onClick={() => handleDelete(i.id)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-700/10 transition-colors">Xoá</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <IncidentModal title={isEdit ? "Cập nhật sự cố" : "Báo cáo sự cố"} onClose={() => setShowModal(false)} onSubmit={handleSubmit} form={form} setForm={setForm} loading={modalLoading} error={modalError} isEdit={isEdit} />
      )}
      
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl ${toast.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-red-500/30 bg-red-500/10 text-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
