"use client";

import React from "react";
import { useRealtime } from "@/context/RealtimeContext";
import Link from "next/link";

const ALERT_TYPE_LABELS: Record<string, string> = {
  DROWSINESS: "Ngủ gật khi lái xe",
  DISTRACTION: "Mất tập trung / Nhìn lệch hướng",
  YAWN: "Ngáp liên tục / Dấu hiệu mệt mỏi",
  PHONE_USE: "Sử dụng điện thoại",
  SEATBELT: "Không thắt dây an toàn",
  NO_FACE: "Không nhận diện khuôn mặt tài xế",
};

export default function RealtimeAlertToast() {
  const { latestNotification, dismissNotification } = useRealtime();

  if (!latestNotification) return null;

  const isCritical =
    latestNotification.severity === "CRITICAL" ||
    latestNotification.severity === "HIGH";

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-in">
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all ${
          isCritical
            ? "border-red-500/50 bg-slate-900/95 shadow-red-500/20"
            : "border-amber-500/50 bg-slate-900/95 shadow-amber-500/20"
        }`}
      >
        {/* Glow accent */}
        <div
          className={`absolute top-0 right-0 -mr-8 -mt-8 h-28 w-28 rounded-full blur-2xl ${
            isCritical ? "bg-red-500/20" : "bg-amber-500/20"
          }`}
        />

        <div className="relative z-10 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
              isCritical
                ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40 animate-pulse"
                : "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40"
            }`}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isCritical
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                Cảnh báo {latestNotification.severity}
              </span>
              <button
                type="button"
                onClick={dismissNotification}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Đóng thông báo"
              >
                <svg
                  className="h-4 w-4"
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

            <h4 className="mt-1 text-sm font-semibold text-white truncate">
              {ALERT_TYPE_LABELS[latestNotification.alert_type] ||
                latestNotification.alert_type}
            </h4>

            <div className="mt-1 text-xs text-slate-300 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>
                Xe:{" "}
                <strong className="text-cyan-300">
                  {latestNotification.plate_number ||
                    latestNotification.vehicle_id}
                </strong>
              </span>
              {latestNotification.driver_name && (
                <span>
                  Tài xế:{" "}
                  <span className="text-slate-200">
                    {latestNotification.driver_name}
                  </span>
                </span>
              )}
            </div>

            {latestNotification.telemetry?.speed_kmh !== undefined && (
              <p className="mt-1 text-[11px] text-slate-400">
                Tốc độ: {latestNotification.telemetry.speed_kmh.toFixed(1)} km/h
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/hitl"
                onClick={dismissNotification}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-transform active:scale-95 hover:opacity-95"
              >
                <span>Mở hàng đợi HITL</span>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
              <button
                type="button"
                onClick={dismissNotification}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
