"use client";

import React, { useState } from "react";
import { HitlCaseResponse, HitlStatus } from "@/types/hitl";
import { reviewHitlCase } from "@/services/hitl.service";

interface HitlReviewModalProps {
  hitlCase: HitlCaseResponse | null;
  onClose: () => void;
  onReviewed: (updatedCase: HitlCaseResponse) => void;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  DROWSINESS: "Ngủ gật khi lái xe",
  DISTRACTION: "Mất tập trung / Nhìn lệch hướng",
  YAWN: "Ngáp liên tục / Dấu hiệu mệt mỏi",
  PHONE_USE: "Sử dụng điện thoại",
  SEATBELT: "Không thắt dây an toàn",
  NO_FACE: "Không nhận diện khuôn mặt tài xế",
};

export default function HitlReviewModal({
  hitlCase,
  onClose,
  onReviewed,
}: HitlReviewModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hitlCase) return null;

  const alert = hitlCase.alert;
  const isPending = hitlCase.status === "PENDING";

  const handleDecision = async (decision: HitlStatus) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await reviewHitlCase(hitlCase.id, {
        decision,
        notes: notes.trim() || undefined,
      });
      onReviewed(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không thể cập nhật quyết định. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                hitlCase.status === "PENDING"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : hitlCase.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {hitlCase.status === "PENDING" && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping mr-1.5" />
              )}
              {hitlCase.status}
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Thẩm định vi phạm an toàn #{hitlCase.id.slice(0, 8)}
              </h3>
              <p className="text-xs text-gray-500">
                Ghi nhận lúc:{" "}
                {alert?.timestamp
                  ? new Date(alert.timestamp).toLocaleString("vi-VN")
                  : new Date(hitlCase.created_at).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 block mb-1">Phương tiện (Biển số)</span>
              <span className="font-bold font-mono text-blue-600 text-sm">
                {alert?.plate_number || alert?.vehicle_id || "N/A"}
              </span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 block mb-1">Tài xế phụ trách</span>
              <span className="font-semibold text-gray-900 text-sm">
                {alert?.driver_name || alert?.driver_id || "Chưa xác định"}
              </span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 block mb-1">Hành vi AI phát hiện</span>
              <span className="font-semibold text-rose-600 text-sm">
                {alert?.alert_type
                  ? ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type
                  : "N/A"}
              </span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5">
              <span className="text-gray-500 block mb-1">Mức độ nghiêm trọng</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                  alert?.severity === "CRITICAL" || alert?.severity === "HIGH"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {alert?.severity || "MEDIUM"}
              </span>
            </div>
          </div>

          {/* Evidence Image and AI Biometrics HUD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Snapshot Image */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Ảnh chụp bằng chứng (MinIO S3)
                  </h4>
                  {alert?.speed_kmh !== undefined && (
                    <span className="font-mono text-xs text-blue-600 font-semibold">
                      Vận tốc: {alert.speed_kmh.toFixed(1)} km/h
                    </span>
                  )}
                </div>

                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                  {alert?.snapshot_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                            ? alert.snapshot_url.replace('//localhost:9000', `//${window.location.hostname}:9000`).replace('//127.0.0.1:9000', `//${window.location.hostname}:9000`)
                            : alert.snapshot_url
                        }
                        alt="Ảnh vi phạm"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          const errDiv = document.getElementById("snapshot-error-msg");
                          if (errDiv) errDiv.style.display = "flex";
                        }}
                      />
                      <div id="snapshot-error-msg" style={{ display: "none" }} className="flex-col items-center justify-center p-6 text-amber-700 text-center">
                        <p className="text-xs font-medium">Không thể hiển thị ảnh từ MinIO S3</p>
                        <a href={alert.snapshot_url} target="_blank" rel="noreferrer" className="text-[11px] underline text-blue-600 mt-1 block">
                          Mở ảnh trực tiếp
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 text-gray-400">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-300 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-xs">Chưa có ảnh snapshot từ thiết bị</p>
                    </div>
                  )}
                </div>
              </div>

              {alert?.latitude && alert?.longitude && (
                <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5 font-mono">
                  <svg
                    className="w-3.5 h-3.5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Tọa độ GPS: {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
                </div>
              )}
            </div>

            {/* AI Biometrics HUD */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Chỉ số Trắc sinh học Edge AI
              </h4>

              <div className="space-y-3.5 text-xs">
                {/* EAR */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">
                      Tỷ lệ mở mắt (EAR - Eye Aspect Ratio)
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        (alert?.ear_value ?? 1) < 0.22
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {alert?.ear_value !== undefined
                        ? alert.ear_value.toFixed(3)
                        : "N/A"}{" "}
                      {(alert?.ear_value ?? 1) < 0.22 && "(Nhắm mắt)"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full ${
                        (alert?.ear_value ?? 1) < 0.22
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          ((alert?.ear_value || 0) / 0.4) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Ngưỡng báo động: &lt; 0.22 (Bình thường: 0.28 - 0.35)
                  </span>
                </div>

                {/* MAR */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">
                      Tỷ lệ mở miệng (MAR - Mouth Aspect Ratio)
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        (alert?.mar_value ?? 0) > 0.6
                          ? "text-amber-600"
                          : "text-gray-700"
                      }`}
                    >
                      {alert?.mar_value !== undefined
                        ? alert.mar_value.toFixed(3)
                        : "N/A"}{" "}
                      {(alert?.mar_value ?? 0) > 0.6 && "(Ngáp)"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full ${
                        (alert?.mar_value ?? 0) > 0.6
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          ((alert?.mar_value || 0) / 0.8) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Ngưỡng ngáp: &gt; 0.60
                  </span>
                </div>

                {/* PERCLOS */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">
                      Tỷ lệ nhắm mắt tích lũy 60s (PERCLOS)
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        (alert?.perclos_value ?? 0) > 0.15
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {alert?.perclos_value !== undefined
                        ? `${(alert.perclos_value * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full ${
                        (alert?.perclos_value ?? 0) > 0.15
                          ? "bg-red-500"
                          : "bg-blue-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          (alert?.perclos_value || 0) * 100 * 3,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Head Pose */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-2.5">
                    <span className="text-[11px] text-gray-400 block">
                      Độ cúi/ngửa (Pitch)
                    </span>
                    <span className="font-mono font-bold text-gray-800">
                      {alert?.pitch_value !== undefined
                        ? `${alert.pitch_value.toFixed(1)}°`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-2.5">
                    <span className="text-[11px] text-gray-400 block">
                      Độ quay đầu (Yaw)
                    </span>
                    <span className="font-mono font-bold text-gray-800">
                      {alert?.yaw_value !== undefined
                        ? `${alert.yaw_value.toFixed(1)}°`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Review Details if Already Reviewed */}
          {!isPending && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 text-xs">
              <h4 className="font-semibold text-gray-900 mb-2">
                Thông tin kết quả thẩm định
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-500 block">Người duyệt:</span>
                  <span className="font-semibold text-gray-800">
                    {hitlCase.reviewer_username || hitlCase.reviewer_id || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Thời gian duyệt:</span>
                  <span className="text-gray-800 font-mono">
                    {hitlCase.reviewed_at
                      ? new Date(hitlCase.reviewed_at).toLocaleString("vi-VN")
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Ghi chú:</span>
                  <span className="text-gray-800 italic">
                    {hitlCase.review_notes || "(Không có ghi chú)"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Review Decision Input if PENDING */}
          {isPending && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
              <label
                htmlFor="review-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
              >
                Ghi chú của Giám sát viên (Tùy chọn)
              </label>
              <textarea
                id="review-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập lý do phê duyệt hoặc lý do bác bỏ (ví dụ: xác nhận tài xế ngủ gật, hoặc ảnh bị lóa sáng do ánh nắng)..."
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Đóng
          </button>

          {isPending && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision("REJECTED")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-all disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? "Đang xử lý..." : "❌ Bác bỏ (Sai số AI)"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDecision("APPROVED")}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : "✅ Phê duyệt vi phạm"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
