import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Providers } from "./providers";
import RealtimeAlertToast from "@/components/common/RealtimeAlertToast";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Safe Driving Management System",
  description: "Hệ thống Quản lý và Giám sát Tài xế Lái xe An toàn",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="h-full flex overflow-hidden bg-gray-50 text-gray-900 selection:bg-blue-500 selection:text-white"
      >
        <Providers>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
          <RealtimeAlertToast />
        </Providers>
      </body>
    </html>
  );
}
