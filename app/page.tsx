"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-8 sm:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 mb-4">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Hệ thống Giám sát & Quản lý An toàn Giao thông
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {isAuthenticated && user ? (
                <>Xin chào, {user.staff?.fullName || user.username} 👋</>
              ) : (
                <>Chào mừng bạn đến với Safe Driving</>
              )}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              Theo dõi hồ sơ lái xe, phương tiện, bản ghi nồng độ cồn, tiến độ chuyến đi và biên bản vi phạm thời gian thực theo chuẩn API v2.0.0.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Đã đăng nhập vai trò: <strong className="font-bold">{user?.role}</strong>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-95 active:scale-95"
                >
                  Đăng nhập vào hệ thống
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* User Card when Authenticated */}
        {isAuthenticated && user && (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thông tin phiên làm việc
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Tài khoản</span>
                <span className="font-semibold text-slate-200">{user.username}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Quyền hạn (Role)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {user.role}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Trạng thái</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user.status || "ACTIVE"}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Thời gian hết hạn Token</span>
                <span className="font-mono text-slate-200">{user.expiresIn ? `${user.expiresIn / 1000}s` : "Theo JWT"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Feature Modules Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/60">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-base">Quản lý Tài xế & Nhân sự</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Theo dõi hồ sơ tuyển dụng, GPLX, phân công phương tiện và thông tin liên hệ của cán bộ nhân viên.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/60">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-base">Tuyến đường & Giám sát</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Hệ thống điểm dừng trạm đón trả khách, lộ trình tiêu chuẩn và GPS theo dõi hành trình xe trực tiếp.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/60">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-base">Nồng độ cồn & Vi phạm</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Ghi nhận kiểm tra nồng độ cồn trước/sau ca và lập biên bản xử lý vi phạm giao thông theo chuẩn định danh.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

