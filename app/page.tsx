"use client";

import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/context/RealtimeContext";
import Link from "next/link";

const ALERT_TYPE_LABELS: Record<string, string> = {
  DROWSINESS: "Ngủ gật khi lái xe",
  DISTRACTION: "Mất tập trung",
  YAWN: "Ngáp liên tục / Mệt mỏi",
  PHONE_USE: "Sử dụng điện thoại",
  SEATBELT: "Không thắt dây an toàn",
  NO_FACE: "Mất dấu khuôn mặt",
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const {
    connectionStatus,
    pendingHitlCount,
    vehiclesGps,
    recentAlerts,
  } = useRealtime();

  const liveVehicleCount = Object.keys(vehiclesGps).length;

  return (
    <div className="flex flex-col h-full bg-transparent text-gray-900">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome & Command Center Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-8 sm:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-50 blur-[80px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 mb-4">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              Trung tâm Chỉ huy Điều hành & Giám sát An toàn Giao thông
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              {isAuthenticated && user ? (
                <>Xin chào, {user.staff?.fullName || user.username} 👋</>
              ) : (
                <>Chào mừng bạn đến với Safe Driving PRO</>
              )}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-500 leading-relaxed">
              Hệ thống giám sát phương tiện, phân tích trắc sinh học Edge AI chống ngủ gật, truyền phát tọa độ GPS thời gian thực qua EMQX MQTT &amp; SSE Broadcaster.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/hitl"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:opacity-95 active:scale-95"
              >
                <span>Hàng đợi Kiểm duyệt HITL</span>
                {pendingHitlCount > 0 && (
                  <span className="rounded-full bg-white text-red-600 font-bold px-2 py-0.5 text-xs animate-pulse">
                    {pendingHitlCount}
                  </span>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                href="/fleet"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-md hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
              >
                <span>Quản lý Đội xe &amp; GPS</span>
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry & HITL Pulse Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: HITL Queue */}
          <Link
            href="/hitl"
            className="group rounded-3xl border border-gray-200 bg-white shadow-sm border-gray-200 p-6 backdrop-blur-md transition-all hover:border-red-300 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">
                Vi phạm chờ duyệt (HITL)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-red-600">
              {pendingHitlCount}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Cần thẩm định yếu tố con người
            </p>
          </Link>

          {/* Card 2: Live GPS Telemetry */}
          <Link
            href="/fleet"
            className="group rounded-3xl border border-gray-200 bg-white shadow-sm border-gray-200 p-6 backdrop-blur-md transition-all hover:border-blue-300 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">
                Phương tiện trực tuyến
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-blue-600">
              {liveVehicleCount}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Đang phát sóng GPS định kỳ 5s
            </p>
          </Link>

          {/* Card 3: SSE Connection */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm border-gray-200 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">
                Luồng Real-time (SSE)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 flex items-center gap-2">
              {connectionStatus === "CONNECTED" ? (
                <>
                  <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  CONNECTED
                </>
              ) : connectionStatus === "CONNECTING" ? (
                <>
                  <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
                  CONNECTING
                </>
              ) : (
                <>
                  <span className="h-3 w-3 rounded-full bg-slate-500"></span>
                  OFFLINE
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Ping giữ kết nối mỗi 15 giây
            </p>
          </div>

          {/* Card 4: MinIO S3 Media */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm border-gray-200 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">
                Lưu trữ Bằng chứng
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-600">
              MinIO S3
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Presigned URL Upload trực tiếp
            </p>
          </div>
        </div>

        {/* Live Safety Alert Feed */}
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white shadow-sm border-gray-200 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-ping"></span>
              Dòng Sự kiện Cảnh báo Thời gian thực (SSE Live Alerts)
            </h2>
            <Link
              href="/hitl"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Xem toàn bộ hàng đợi &rarr;
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-transparent/40 p-8 text-center text-gray-500 text-xs">
              <p>Chưa có sự kiện cảnh báo an toàn mới nào phát sinh từ Edge AI qua SSE.</p>
              <p className="mt-1 text-gray-500">
                Khi tài xế ngủ gật hoặc mất tập trung, thiết bị Android AppDetect sẽ gửi gói tin lên MQTT và chuyển tiếp xuống màn hình này tức thì.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentAlerts.slice(0, 5).map((alt, idx) => (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 font-bold text-[10px]">
                      {alt.severity}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {ALERT_TYPE_LABELS[alt.alert_type] || alt.alert_type}
                      </span>
                      <span className="text-gray-500 ml-2">
                        Xe: <strong className="text-blue-600">{alt.plate_number || alt.vehicle_id}</strong>
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/hitl"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-slate-700 hover:text-gray-900"
                  >
                    Kiểm duyệt
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Modules Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/fleet"
            className="group rounded-2xl border border-gray-200 bg-white border-gray-200 p-6 transition-all hover:border-gray-300 hover:bg-white shadow-sm border-gray-200"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base">Quản lý Đội xe &amp; Gán tài xế</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Theo dõi trạng thái AVAILABLE, IN_USE, gán tài xế cho phương tiện trước ca lái.
            </p>
          </Link>

          <Link
            href="/hitl"
            className="group rounded-2xl border border-gray-200 bg-white border-gray-200 p-6 transition-all hover:border-gray-300 hover:bg-white shadow-sm border-gray-200"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-500/20 flex items-center justify-center text-red-600 mb-4 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base">Thẩm định Vi phạm (HITL)</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Kiểm tra ảnh chụp MinIO S3, đối chiếu chỉ số EAR, MAR, Pitch, Yaw và ra quyết định phê duyệt.
            </p>
          </Link>

          <div className="rounded-2xl border border-gray-200 bg-white border-gray-200 p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-500/20 flex items-center justify-center text-indigo-600 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-base">Hạ tầng IoT &amp; Offline Outbox</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Truyền thông tin cậy qua EMQX MQTT Broker (QoS 0/1) kết hợp cơ chế Zero Data Loss SQLite trên Mobile.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
