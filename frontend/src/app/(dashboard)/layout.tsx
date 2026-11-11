"use client";

import React, { useState, useCallback, Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setIsMobileNavOpen((prev) => !prev);
  }, []);

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
        <Sidebar
          isOpen={isMobileNavOpen}
          onClose={handleClose}
        />
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
