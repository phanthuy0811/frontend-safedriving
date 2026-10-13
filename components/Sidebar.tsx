"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRealtime } from "@/context/RealtimeContext";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { pendingHitlCount } = useRealtime();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-blue-600">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="tracking-tight text-gray-900 font-extrabold">SafeDriving</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* 1. Giám sát Đội xe & Vị trí */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Giám sát trực tuyến
          </div>
          <div className="space-y-1">
            <Link
              href="/fleet"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/fleet")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📍</span>
                <span>Đội xe & Vị trí</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </Link>
          </div>
        </div>

        {/* 2. AI Cảnh báo (ngay sau Đội xe - vị trí) */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            AI Cảnh báo & An toàn
          </div>
          <div className="space-y-1">
            <Link
              href="/hitl"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/hitl")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🛡️</span>
                <span>Thẩm định HITL</span>
              </div>
              {pendingHitlCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-100 text-red-600 border border-red-200">
                  {pendingHitlCount}
                </span>
              )}
            </Link>

            <Link
              href="/somnolence-records"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/somnolence-records")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">💤</span>
              <span>Cảnh báo Ngủ gật</span>
            </Link>

            <Link
              href="/incidents"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/incidents")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">⚠️</span>
              <span>Nhật ký Sự cố</span>
            </Link>
          </div>
        </div>

        {/* 3. Quản lý vận hành */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Quản lý vận hành
          </div>
          <div className="space-y-1">
            <Link
              href="/drivers"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/drivers")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">👨‍✈️</span>
              <span>Tài xế</span>
            </Link>

            <Link
              href="/vehicles"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/vehicles")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🚙</span>
              <span>Phương tiện</span>
            </Link>

            <Link
              href="/vehicle-types"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/vehicle-types")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🏷️</span>
              <span>Loại xe</span>
            </Link>

            <Link
              href="/routes"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/routes")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🛣️</span>
              <span>Tuyến đường</span>
            </Link>

            <Link
              href="/trips"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/trips")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🗺️</span>
              <span>Chuyến đi</span>
            </Link>

            <Link
              href="/assignments"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith("/assignments")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">📋</span>
              <span>Phân công</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* User / Auth Footer */}
      <div className="p-3.5 border-t border-gray-200 bg-gray-50/50">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm shrink-0">
                {user.username ? user.username.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user.staff?.fullName || user.username}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {user.role || "ADMIN"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Đăng xuất khỏi hệ thống"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Đăng nhập hệ thống</span>
            </Link>
            <div className="text-center">
              <span className="text-[11px] text-gray-400">Chưa có tài khoản? </span>
              <Link href="/register" className="text-[11px] font-semibold text-blue-600 hover:underline">
                Đăng ký
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
