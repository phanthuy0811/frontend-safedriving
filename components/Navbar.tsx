"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRealtime } from "@/context/RealtimeContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { connectionStatus, pendingHitlCount } = useRealtime();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Tổng quan", icon: "dashboard" },
    {
      href: "/hitl",
      label: "Kiểm duyệt HITL",
      badge: pendingHitlCount > 0 ? pendingHitlCount : undefined,
      badgeColor: "bg-red-500",
    },
    { href: "/fleet", label: "Đội xe & Vị trí" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Safe Driving
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Giám sát & Quản lý vận tải</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`inline-flex items-center justify-center rounded-full ${item.badgeColor} px-1.5 py-0.2 text-[10px] font-bold text-white shadow-sm ${
                        item.badge > 0 ? "animate-pulse" : ""
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Live SSE Status Badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] font-medium">
            {connectionStatus === "CONNECTED" ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-mono">LIVE SSE</span>
              </>
            ) : connectionStatus === "CONNECTING" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-400 font-mono">KẾT NỐI...</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                <span className="text-slate-400 font-mono">OFFLINE</span>
              </>
            )}
          </div>

          {/* User Account Dropdown */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/90 py-1.5 pl-3 pr-4 text-sm font-medium text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800/90 focus:outline-none"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-xs font-bold text-white uppercase shadow-sm">
                  {user.username?.slice(0, 2) || "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold leading-none text-white">
                    {user.staff?.fullName || user.username}
                  </div>
                  <div className="text-[10px] leading-tight text-cyan-400 uppercase tracking-wider font-mono">
                    {user.role}
                  </div>
                </div>
                <svg
                  className={`h-4 w-4 text-slate-400 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.staff?.fullName || user.username}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.staff?.email || `${user.username}@system`}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        Trạng thái: {user.status || "ACTIVE"}
                      </div>
                    </div>

                    {/* Mobile nav links */}
                    <div className="md:hidden py-1 border-b border-slate-800">
                      {navLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                        >
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`rounded-full ${item.badgeColor} px-1.5 py-0.2 text-[10px] text-white`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
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
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Đăng xuất (Logout)
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:opacity-90 active:scale-95"
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
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
