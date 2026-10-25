"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllSomnolenceRecords,
  createSomnolenceRecord,
  deleteSomnolenceRecord,
} from "@/services/somnolence-record.service";
import { SomnolenceRecordResponse, SomnolenceRecordRequest } from "@/types/somnolence-record";
import { ApiError } from "@/services/api.client";

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function getDrowsinessColor(level?: number): string {
  if (level == null) return "text-gray-500";
  if (level >= 80) return "text-red-600";
  if (level >= 50) return "text-orange-600";
  return "text-emerald-600";
}

const EMPTY_FORM: SomnolenceRecordRequest = {
  driverId: "",
  vehicleId: "",
  drowsinessLevel: 85, // Default high for demo
  notes: "",
};

export default function SomnolencePage() {
  const [records, setRecords] = useState<SomnolenceRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<SomnolenceRecordRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try { setRecords(await getAllSomnolenceRecords()); }
    catch { alert("Lỗi khi tải danh sách cảnh báo ngủ gật"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter((r) => {
    const q = searchTerm.toLowerCase();
    return !q || r.driverId.toLowerCase().includes(q) || (r.vehicleId || "").toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    if (!form.driverId.trim()) { setModalError("ID tài xế không được để trống."); return; }
    setModalLoading(true); setModalError(null);
    try {
      await createSomnolenceRecord(form);
      setShowModal(false);
      fetchRecords();
    } catch (err) { setModalError(err instanceof ApiError ? err.message : "Đã xảy ra lỗi."); }
    finally { setModalLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa bản ghi này?")) return;
    try {
      await deleteSomnolenceRecord(id);
      fetchRecords();
    } catch (err) { alert("Xoá thất bại"); }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-900">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <span className="text-orange-600">💤</span> Cảnh báo Ngủ gật (AI)
            </h1>
            <p className="mt-1 text-sm text-gray-500">Tiếp nhận dữ liệu phân tích từ Camera/Thiết bị IoT trên xe</p>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setModalError(null); setShowModal(true); }} className="rounded-xl bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-orange-700 transition-colors">
            Giả lập Cảnh báo
          </button>
        </div>

        <div className="mb-6 relative max-w-md">
          <input
            type="text"
            placeholder="Tìm theo ID tài xế hoặc xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-5 py-3">Tài xế / Xe</th>
                <th className="px-5 py-3">Mức độ buồn ngủ</th>
                <th className="px-5 py-3">Ghi chú</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Đang tải...</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs font-medium text-gray-700">{formatDateTime(r.recordTime)}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-amber-600 text-xs truncate max-w-[150px]" title={r.driverId}>👨‍✈️ {r.driverId}</div>
                    {r.vehicleId && <div className="font-mono text-blue-600 text-[11px] truncate max-w-[150px] mt-1" title={r.vehicleId}>🚐 {r.vehicleId}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white overflow-hidden">
                        <div className={`h-full ${getDrowsinessColor(r.drowsinessLevel).replace('text', 'bg')}`} style={{ width: `${r.drowsinessLevel || 0}%` }} />
                      </div>
                      <span className={`font-bold ${getDrowsinessColor(r.drowsinessLevel)}`}>{r.drowsinessLevel}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs truncate max-w-xs">{r.notes || "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-300 text-xs font-medium px-2 py-1">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Fake Data */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-white shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Giả lập cảnh báo ngủ gật (IoT Simulator)</h2>
            {modalError && <div className="mb-4 text-sm text-red-600 bg-red-500/10 p-3 rounded-lg">{modalError}</div>}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID Tài xế *</label>
                <input type="text" value={form.driverId} onChange={e => setForm({...form, driverId: e.target.value})} className="w-full bg-white border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID Xe (Tuỳ chọn)</label>
                <input type="text" value={form.vehicleId || ""} onChange={e => setForm({...form, vehicleId: e.target.value})} className="w-full bg-white border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mức độ buồn ngủ: {form.drowsinessLevel}%</label>
                <input type="range" min="0" max="100" value={form.drowsinessLevel || 0} onChange={e => setForm({...form, drowsinessLevel: parseInt(e.target.value)})} className="w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Hủy</button>
              <button onClick={handleSubmit} disabled={modalLoading} className="px-4 py-2 text-sm bg-orange-600 text-white hover:bg-orange-700 text-gray-900 rounded-lg font-semibold">Gửi Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
