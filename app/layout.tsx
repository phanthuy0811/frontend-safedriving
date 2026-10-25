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
import AppLayout from "@/components/AppLayout";

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
          <AppLayout>{children}</AppLayout>
          <RealtimeAlertToast />
        </Providers>
      </body>
    </html>
  );
}
