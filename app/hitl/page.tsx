"use client";

import React, { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HitlReviewModal from "@/components/hitl/HitlReviewModal";
import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/context/RealtimeContext";
import { getHitlQueue } from "@/services/hitl.service";
import { HitlCaseResponse, HitlStatus } from "@/types/hitl";
import Link from "next/link";

const ALERT_TYPE_LABELS: Record<string, string> = {
  DROWSINESS: "Ngủ gật",
  DISTRACTION: "Mất tập trung",
  YAWN: "Ngáp liên tục",
  PHONE_USE: "Dùng điện thoại",
  SEATBELT: "Không thắt dây",
  NO_FACE: "Mất dấu khuôn mặt",
};

export default function HitlPage() {
  const { isAuthenticated } = useAuth();
  const { pendingHitlCount, refreshPendingCount } = useRealtime();

  const [activeTab, setActiveTab] = useState<HitlStatus>("PENDING");
  const [cases, setCases] = useState<HitlCaseResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<HitlCaseResponse | null>(
    null
  );

  const fetchCases = useCallback(
    async (targetStatus: HitlStatus, targetPage: number = 0) => {
      setIsLoading(true);
      try {
        const response = await getHitlQueue(targetStatus, targetPage, 10);
        setCases(response.content || []);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
        setPage(response.number || 0);
      } catch (err) {
        console.error("Lỗi tải danh sách HITL:", err);
        setCases([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCases(activeTab, 0);
  }, [activeTab, fetchCases]);

  const handleReviewed = (updatedCase: HitlCaseResponse) => {
    // If we're on PENDING tab, remove it or replace it
    setCases((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
    );
    refreshPendingCount();
    fetchCases(activeTab, page);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/20">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping"></span>
                Human-in-the-Loop (HITL)
              </span>
              <span className="text-xs text-slate-400">
                Chuẩn giám định vi phạm mức HIGH/CRITICAL
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trung tâm Thẩm định Vi phạm An toàn
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Kiểm duyệt các bằng chứng vi phạm do Edge AI phát hiện, xác minh độ chính xác và loại bỏ sai số.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchCases(activeTab, page)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${activeTab === "PENDING"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
          >
            <span>Hàng đợi chờ duyệt (PENDING)</span>
            {pendingHitlCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                {pendingHitlCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("APPROVED")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${activeTab === "APPROVED"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
          >
            <span>Đã phê duyệt (APPROVED)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REJECTED")}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${activeTab === "REJECTED"
                ? "bg-slate-800 text-slate-200 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
          >
            <span>Đã bác bỏ (REJECTED)</span>
          </button>
        </div>

        {/* Not authenticated warning banner */}
        {!isAuthenticated && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Bạn cần đăng nhập với vai trò <strong>MANAGER</strong> hoặc <strong>ADMIN</strong> để gửi quyết định kiểm duyệt vi phạm.</span>
            </div>
            <Link href="/login" className="font-bold underline ml-2">Đăng nhập</Link>
          </div>
        )}

        {/* Content Table or Cards */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="h-8 w-8 animate-spin text-cyan-400 mb-3"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-xs text-slate-400">Đang đồng bộ hàng đợi vi phạm...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 mb-4">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">
              Hàng đợi trống
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === "PENDING"
                ? "Không có vi phạm an toàn nào cần kiểm duyệt. Tất cả tài xế và phương tiện đang hoạt động bình thường!"
                : "Không tìm thấy bản ghi nào trong mục này."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Thời gian</th>
                    <th className="px-4 py-3.5">Phương tiện</th>
                    <th className="px-4 py-3.5">Tài xế</th>
                    <th className="px-4 py-3.5">Hành vi vi phạm</th>
                    <th className="px-4 py-3.5">Mức độ</th>
                    <th className="px-4 py-3.5">Chỉ số AI</th>
                    <th className="px-4 py-3.5">Bằng chứng</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cases.map((c) => {
                    const alert = c.alert;
                    const alertTypeStr = alert?.alert_type || "DROWSINESS";
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-300 font-mono">
                          {alert?.timestamp
                            ? new Date(alert.timestamp).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                            : new Date(c.created_at).toLocaleTimeString("vi-VN")}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold font-mono text-cyan-400">
                          {alert?.plate_number || alert?.vehicle_id || "N/A"}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-200">
                          {alert?.driver_name || alert?.driver_id || "Chưa xác định"}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-rose-300">
                            {ALERT_TYPE_LABELS[alertTypeStr] || alertTypeStr}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${alert?.severity === "CRITICAL"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : alert?.severity === "HIGH"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                          >
                            {alert?.severity || "MEDIUM"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[11px] font-mono text-slate-400">
                          {alert?.ear_value !== undefined && (
                            <span className="mr-2">
                              EAR:{" "}
                              <strong
                                className={
                                  alert.ear_value < 0.22
                                    ? "text-red-400 font-bold"
                                    : "text-slate-200"
                                }
                              >
                                {alert.ear_value.toFixed(2)}
                              </strong>
                            </span>
                          )}
                          {alert?.perclos_value !== undefined && (
                            <span>
                              PERCLOS:{" "}
                              <strong
                                className={
                                  alert.perclos_value > 0.15
                                    ? "text-amber-400 font-bold"
                                    : "text-slate-200"
                                }
                              >
                                {(alert.perclos_value * 100).toFixed(0)}%
                              </strong>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {alert?.snapshot_url ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              MinIO S3
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Chưa có
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCase(c)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-95 active:scale-95 transition-all"
                          >
                            <span>Thẩm định</span>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <span>
                Tổng cộng: <strong className="text-white">{totalElements}</strong> ca vi phạm
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => fetchCases(activeTab, page - 1)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  Trang trước
                </button>
                <span>
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchCases(activeTab, page + 1)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  Trang sau
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Review Modal Dialog */}
      <HitlReviewModal
        hitlCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onReviewed={handleReviewed}
      />
    </div>
  );
}
