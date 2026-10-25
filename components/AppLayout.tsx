"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isAuthPage) {
        // Chưa đăng nhập mà truy cập trang quản trị -> chuyển hướng về /login
        router.replace("/login");
      } else if (isAuthenticated && isAuthPage) {
        // Đã đăng nhập rồi mà vẫn ở trang /login hoặc /register -> chuyển hướng về /fleet
        router.replace("/fleet");
      }
    }
  }, [isAuthenticated, isLoading, isAuthPage, router]);

  // Trong lúc AuthProvider đang khôi phục token từ localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="text-xs font-semibold text-gray-500">Đang khởi động phiên làm việc...</span>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập và không phải trang auth, tạm ẩn giao diện để đợi router redirect
  if (!isAuthenticated && !isAuthPage) {
    return null;
  }

  // Màn hình Login / Register độc lập (không có sidebar)
  if (isAuthPage) {
    return (
      <main className="flex-1 w-full h-full overflow-y-auto">
        {children}
      </main>
    );
  }

  // Giao diện chính sau khi đăng nhập thành công
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  );
}
