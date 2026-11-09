import React, { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f7faf9]">
      {/* Fixed Left Sidebar */}
      <Suspense fallback={<div className="w-[248px] shrink-0 bg-[#0d332f]" />}>
        <Sidebar />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Topbar />
        </Suspense>
        <main className="flex-1 p-6 lg:p-8 bg-[#f5f8f8]">
          <Suspense
            fallback={
              <div className="py-16 text-center text-slate-500 text-sm">
                Memuat halaman...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
