"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setIsMobileNavOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-9 h-9 border-3 border-emerald-600/25 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs font-medium">Memverifikasi sesi petugas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Mobile Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200 cursor-pointer"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (Desktop Static & Mobile Drawer) */}
      <Suspense fallback={<div className="w-64 min-w-[256px] bg-[#064e3b] shrink-0" />}>
        <Sidebar isOpen={isMobileNavOpen} onClose={handleClose} />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Suspense fallback={<div className="h-[72px] bg-white border-b border-slate-200" />}>
          <Topbar onToggleMenu={handleToggle} />
        </Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50/60 overflow-x-hidden">
          <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Memuat konten...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
