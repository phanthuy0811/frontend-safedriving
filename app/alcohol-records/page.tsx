"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAllAlcoholRecords, getAlcoholRecordById } from "@/services/alcohol.service";
import { getAllDrivers } from "@/services/driver.service";
import { AlcoholRecordResponse } from "@/types/alcohol";
import { DriverResponse } from "@/types/driver";

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AlcoholRecordsContent() {
  const searchParams = useSearchParams();

  const [records, setRecords] = useState<AlcoholRecordResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDriverId, setFilterDriverId] = useState<string>("");
  const [filterViolation, setFilterViolation] = useState<"ALL" | "VIOLATION" | "SAFE">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Detail Modal
  const [detailRecord, setDetailRecord] = useState<AlcoholRecordResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // URL query sync
  useEffect(() => {
    const driverParam = searchParams.get("driverId");
    if (driverParam) {
      setFilterDriverId(driverParam);
    }
  }, [searchParams]);

  // Load Drivers
  useEffect(() => {
    getAllDrivers()
      .then((data) => setDrivers(data || []))
      .catch(() => {});
  }, []);

  // Fetch Alcohol Records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllAlcoholRecords(filterDriverId || undefined);
      setRecords(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách đo nồng độ cồn";
      setError(msg);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filterDriverId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // View Record Detail
  const handleViewDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const rec = await getAlcoholRecordById(id);
      setDetailRecord(rec);
    } catch {
      // Fallback: tìm trong list hiện tại nếu API chi tiết có vấn đề
      const fallback = records.find((r) => r.id === id);
      if (fallback) setDetailRecord(fallback);
    } finally {
      setDetailLoading(false);
    }
  };

  // Filtered List
  const filteredRecords = records.filter((r) => {
    if (filterViolation === "VIOLATION" && !r.violation) return false;
    if (filterViolation === "SAFE" && r.violation) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDriver = r.driverName?.toLowerCase().includes(q) || r.driverId.toLowerCase().includes(q);
      const matchTrip = r.tripId?.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      const matchId = String(r.id).includes(q);
      if (!matchDriver && !matchTrip && !matchNotes && !matchId) return false;
    }

    return true;
  });

  // Thống kê nhanh
  const totalCount = records.length;
  const violationCount = records.filter((r) => r.violation).length;
  const safeCount = records.filter((r) => !r.violation).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Lịch sử & Vi phạm Nồng độ Cồn
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Nhật ký kiểm tra nồng độ cồn trước ca lái và cảnh báo vi phạm tự động qua IoT / App
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-sm transition-colors"
            >
              🔄 Tải lại
            </button>
            <Link
              href="/trips?status=REASSIGN_REQUIRED"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm transition-colors"
            >
              Chuyến cần phân công lại
            </Link>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng số lần đo</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 shadow-sm">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Phát hiện Vi phạm (&gt; 0 mg/L)</p>
            <p className="text-2xl font-black text-red-600 mt-1">{violationCount}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Đạt chuẩn / Hợp lệ (0.00 mg/L)</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{safeCount}</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterViolation("ALL")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterViolation === "ALL"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              Tất cả ({records.length})
            </button>
            <button
              onClick={() => setFilterViolation("VIOLATION")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterViolation === "VIOLATION"
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              }`}
            >
              Vi phạm ({violationCount})
            </button>
            <button
              onClick={() => setFilterViolation("SAFE")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterViolation === "SAFE"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              Hợp lệ ({safeCount})
            </button>
          </div>

          {/* Search & Driver Dropdown */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterDriverId}
              onChange={(e) => setFilterDriverId(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 font-medium"
            >
              <option value="">-- Lọc theo tất cả tài xế --</option>
              {drivers.map((d) => {
                const name =
                  d.staff?.fullName ||
                  `${d.staff?.lastName || ""} ${d.staff?.firstName || ""}`.trim() ||
                  `Tài xế #${d.id.slice(0, 8)}`;
                return (
                  <option key={d.id} value={d.id}>
                    👨‍✈️ {name}
                  </option>
                );
              })}
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm mã chuyến, tên tài xế, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-xs text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              Đang tải nhật ký nồng độ cồn...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-sm">
              {error}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              Không có bản ghi nồng độ cồn nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Mã bản ghi</th>
                    <th className="px-5 py-3.5">Tài xế</th>
                    <th className="px-5 py-3.5">Chuyến đi</th>
                    <th className="px-5 py-3.5">Chỉ số cồn</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Thời gian đo</th>
                    <th className="px-5 py-3.5">Ghi chú</th>
                    <th className="px-5 py-3.5 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        r.violation ? "bg-red-50/30" : ""
                      }`}
                    >
                      {/* ID */}
                      <td className="px-5 py-4 font-mono font-bold text-gray-600 text-xs">
                        #{r.id}
                      </td>

                      {/* Driver */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">
                          {r.driverName || "Tài xế"}
                        </div>
                        <Link
                          href={`/drivers?id=${r.driverId}`}
                          className="font-mono text-[11px] text-gray-400 hover:text-blue-600 hover:underline block mt-0.5"
                          title="Xem hồ sơ tài xế"
                        >
                          {r.driverId}
                        </Link>
                      </td>

                      {/* Trip */}
                      <td className="px-5 py-4 text-xs">
                        {r.tripId ? (
                          <Link
                            href={`/trips`}
                            className="font-mono text-blue-600 hover:text-blue-800 hover:underline font-semibold block"
                            title="Xem chi tiết chuyến đi"
                          >
                            {r.tripId.slice(0, 13)}...
                          </Link>
                        ) : (
                          <span className="text-gray-400 italic">Kiểm tra độc lập</span>
                        )}
                      </td>

                      {/* Alcohol Level */}
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono text-base font-extrabold ${
                            r.violation ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {r.alcoholLevel.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">mg/L</span>
                      </td>

                      {/* Violation Badge */}
                      <td className="px-5 py-4">
                        {r.violation ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                            Vi phạm
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <span>✓</span>
                            Hợp lệ
                          </span>
                        )}
                      </td>

                      {/* Measurement Time */}
                      <td className="px-5 py-4 text-xs text-gray-600 font-medium">
                        {formatDateTime(r.measurementTime)}
                      </td>

                      {/* Notes */}
                      <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">
                        {r.notes || "—"}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleViewDetail(r.id)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Xem
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

      {/* Record Detail Modal */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDetailRecord(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-6 py-4 ${
                detailRecord.violation ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
              }`}
            >
              <div>
                <h3
                  className={`text-base font-bold ${
                    detailRecord.violation ? "text-red-900" : "text-gray-900"
                  }`}
                >
                  Chi tiết bản ghi đo nồng độ cồn #{detailRecord.id}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thời gian: {formatDateTime(detailRecord.measurementTime)}
                </p>
              </div>
              <button
                onClick={() => setDetailRecord(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Alcohol Status Highlight */}
              <div
                className={`rounded-2xl border p-4 text-center ${
                  detailRecord.violation
                    ? "border-red-300 bg-red-50 text-red-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                  {detailRecord.violation ? "CẢNH BÁO VI PHẠM NỒNG ĐỘ CỒN" : "KẾT QUẢ ĐO HỢP LỆ"}
                </div>
                <div className="mt-1 font-mono text-3xl font-black">
                  {detailRecord.alcoholLevel.toFixed(2)}{" "}
                  <span className="text-base font-normal">mg/L khí thở</span>
                </div>
                <p className="text-xs mt-1 opacity-90">
                  {detailRecord.violation
                    ? "Tài xế không đủ điều kiện điều khiển phương tiện theo quy định."
                    : "Tài xế tỉnh táo, đủ điều kiện thực hiện ca lái."}
                </p>
              </div>

              {/* Information Grid */}
              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Tài xế:</span>
                  <span className="font-semibold text-gray-900">{detailRecord.driverName || "N/A"}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Mã tài xế (UUID):</span>
                  <span className="font-mono text-gray-700">{detailRecord.driverId}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Chuyến đi liên quan:</span>
                  {detailRecord.tripId ? (
                    <span className="font-mono text-blue-600 font-semibold">{detailRecord.tripId}</span>
                  ) : (
                    <span className="text-gray-400 italic">Không gắn mã chuyến</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Thời điểm đo:</span>
                  <span className="text-gray-800">{formatDateTime(detailRecord.measurementTime)}</span>
                </div>

                <div className="py-1.5">
                  <span className="text-gray-500 block mb-1">Ghi chú kiểm tra:</span>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-normal">
                    {detailRecord.notes || "Không có ghi chú thêm."}
                  </div>
                </div>
              </div>

              {detailRecord.violation && detailRecord.tripId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center justify-between">
                  <span>Chuyến đi có thể đang cần gán tài xế mới</span>
                  <Link
                    href={`/trips?status=REASSIGN_REQUIRED`}
                    onClick={() => setDetailRecord(null)}
                    className="font-bold text-red-600 hover:underline"
                  >
                    Xem chuyến cần phân công ➔
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-200 px-6 py-3.5 bg-gray-50">
              <button
                onClick={() => setDetailRecord(null)}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlcoholRecordsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Đang tải...</div>}>
      <AlcoholRecordsContent />
    </Suspense>
  );
}
