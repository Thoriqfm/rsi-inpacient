"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bed,
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
  Activity,
  Layers,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isBedActive =
    pathname === "/bed-management" || pathname.startsWith("/bed-management/");

  return (
    <aside className="w-64 min-w-[256px] bg-gradient-to-b from-[#0d332f] via-[#0d3732] to-[#082320] text-slate-200 flex flex-col justify-between shrink-0 border-r border-teal-900/30 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-[72px] px-5 flex items-center gap-3 border-b border-teal-800/40">
          <div className="w-9 h-9 rounded-lg bg-[#13c9b3] text-[#0d332f] font-black flex items-center justify-center text-xl shadow-md shadow-teal-500/20">
            +
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1.5">
              Inpatient Care
            </div>
            <div className="text-[11px] text-teal-300/70 font-medium tracking-wide mt-1">
              Sistem Rawat Inap
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-3 py-6 space-y-6">
          {/* MENU UTAMA */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-teal-300/50 mb-2">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {/* If Administrasi, show Dashboard */}
              {user?.role === "PETUGAS_ADMINISTRASI" && (
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition cursor-not-allowed opacity-60"
                  title="Modul Administrasi - Halaman Utama"
                >
                  <LayoutDashboard className="w-4 h-4 text-teal-400/60" />
                  <span>Dashboard</span>
                  <span className="ml-auto text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400">
                    SIMRS
                  </span>
                </div>
              )}

              {/* Bed Management (Active Module) */}
              <Link
                href="/bed-management"
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  pathname === "/bed-management"
                    ? "bg-[#13c9b3]/15 text-[#13c9b3] shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Bed
                  className={`w-4 h-4 ${
                    pathname === "/bed-management"
                      ? "text-[#13c9b3]"
                      : "text-teal-400/70"
                  }`}
                />
                <span>
                  {user?.role === "PETUGAS_ADMINISTRASI"
                    ? "Ketersediaan Bed"
                    : "Bed Management"}
                </span>
                {pathname === "/bed-management" && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#13c9b3] rounded-l-full shadow-sm shadow-teal-400" />
                )}
              </Link>

              {/* Direct Alokasi Menu for Petugas Administrasi */}
              {user?.role === "PETUGAS_ADMINISTRASI" && (
                <Link
                  href="/bed-management/alokasi"
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    pathname === "/bed-management/alokasi"
                      ? "bg-[#13c9b3]/15 text-[#13c9b3] shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Users
                    className={`w-4 h-4 ${
                      pathname === "/bed-management/alokasi"
                        ? "text-[#13c9b3]"
                        : "text-teal-400/70"
                    }`}
                  />
                  <span>Alokasi Kamar</span>
                  {pathname === "/bed-management/alokasi" && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#13c9b3] rounded-l-full shadow-sm shadow-teal-400" />
                  )}
                </Link>
              )}

              {/* If Administrasi, show related modules */}
              {user?.role === "PETUGAS_ADMINISTRASI" && (
                <>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition cursor-not-allowed opacity-60"
                    title="Modul Antrian Pasien Rawat Inap"
                  >
                    <Users className="w-4 h-4 text-teal-400/60" />
                    <span>Sistem Antrian</span>
                  </div>

                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition cursor-not-allowed opacity-60"
                    title="Rekap Layanan & Tindakan"
                  >
                    <FileText className="w-4 h-4 text-teal-400/60" />
                    <span>Rekap Layanan</span>
                  </div>

                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition cursor-not-allowed opacity-60"
                    title="Pembayaran & Billing"
                  >
                    <CreditCard className="w-4 h-4 text-teal-400/60" />
                    <span>Pembayaran (Billing)</span>
                  </div>
                </>
              )}
            </nav>
          </div>

          {/* LAINNYA */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-teal-300/50 mb-2">
              Lainnya
            </div>
            <nav className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition cursor-pointer">
                <Settings className="w-4 h-4 text-teal-400/60" />
                <span>Pengaturan</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition cursor-pointer">
                <HelpCircle className="w-4 h-4 text-teal-400/60" />
                <span>Pusat Bantuan</span>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-teal-800/40">
        <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-700/20 text-xs">
          <div className="flex items-center gap-2 text-teal-300 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Konektivitas SIMRS</span>
          </div>
          <p className="text-[11px] text-teal-200/60 leading-tight">
            Sinkronisasi kamar rawat inap real-time aktif.
          </p>
        </div>
      </div>
    </aside>
  );
}
