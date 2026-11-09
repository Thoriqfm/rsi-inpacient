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
  Clock,
  Ambulance,
  Activity,
  ClipboardList,
  Calculator,
  Receipt,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAntrianSection = pathname.startsWith("/sistem-antrian");
  const isRekapSection = pathname.startsWith("/rekap-layanan");
  const isPembayaranSection = pathname.startsWith("/pembayaran");

  return (
    <aside className="w-64 min-w-[256px] bg-gradient-to-b from-[#0d332f] via-[#0d3732] to-[#082320] text-slate-200 flex flex-col justify-between shrink-0 border-r border-teal-900/30 select-none overflow-y-auto">
      {/* Brand Header */}
      <div>
        <div className="h-[72px] px-5 flex items-center gap-3 border-b border-teal-800/40 sticky top-0 bg-[#0d332f]/95 backdrop-blur-xs z-10">
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
        <div className="px-3 py-5 space-y-6">
          {/* MENU UTAMA */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-teal-300/50 mb-2">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {/* Dashboard SIMRS */}
              <Link
                href="/dashboard"
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  pathname === "/dashboard"
                    ? "bg-[#13c9b3]/15 text-[#13c9b3] shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 ${
                    pathname === "/dashboard"
                      ? "text-[#13c9b3]"
                      : "text-teal-400/70"
                  }`}
                />
                <span>Dashboard</span>
                <span className="ml-auto text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-teal-200/80 font-bold">
                  SIMRS
                </span>
                {pathname === "/dashboard" && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#13c9b3] rounded-l-full shadow-sm shadow-teal-400" />
                )}
              </Link>

              {/* Bed Management (UC-01 & UC-02) */}
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

              {/* Alokasi Kamar (UC-03) */}
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

              {/* Sistem Antrian (UC-04, UC-05, UC-06) */}
              <div className="pt-1">
                <Link
                  href="/sistem-antrian/daftar-tunggu"
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isAntrianSection
                      ? "bg-[#13c9b3]/15 text-[#13c9b3] shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <ClipboardList
                    className={`w-4 h-4 ${
                      isAntrianSection
                        ? "text-[#13c9b3]"
                        : "text-teal-400/70"
                    }`}
                  />
                  <span>Sistem Antrian</span>
                  {isAntrianSection && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#13c9b3] rounded-l-full shadow-sm shadow-teal-400" />
                  )}
                </Link>

                {/* Sub-links under Sistem Antrian */}
                <div className="mt-1 ml-4 pl-3 border-l border-teal-800/60 space-y-1">
                  <Link
                    href="/sistem-antrian/daftar-tunggu"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname.includes("/daftar-tunggu")
                        ? "bg-white/10 text-[#13c9b3]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Daftar Tunggu (FIFO)</span>
                  </Link>

                  <Link
                    href="/sistem-antrian/rujukan-pasien"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname.includes("/rujukan-pasien")
                        ? "bg-white/10 text-[#13c9b3]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Ambulance className="w-3.5 h-3.5 shrink-0" />
                    <span>Rujukan Pasien Darurat</span>
                  </Link>

                  <Link
                    href="/sistem-antrian/pemantauan-status"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname.includes("/pemantauan-status")
                        ? "bg-white/10 text-[#13c9b3]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span>Pemantauan Status</span>
                  </Link>
                </div>
              </div>

              {/* Rekap Layanan & Tindakan */}
              <div className="pt-1">
                <Link
                  href="/rekap-layanan"
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isRekapSection
                      ? "bg-[#13c9b3]/15 text-[#13c9b3] shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 ${
                      isRekapSection
                        ? "text-[#13c9b3]"
                        : "text-teal-400/70"
                    }`}
                  />
                  <span>Rekap Layanan</span>
                  {isRekapSection && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#13c9b3] rounded-l-full shadow-sm shadow-teal-400" />
                  )}
                </Link>
              </div>

              {/* Pembayaran & Billing */}
              <div className="pt-1">
                <Link
                  href="/pembayaran"
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isPembayaranSection
                      ? "bg-[#13c9b3]/15 text-[#13c9b3] shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <CreditCard
                    className={`w-4 h-4 ${
                      isPembayaranSection
                        ? "text-[#13c9b3]"
                        : "text-teal-400/70"
                    }`}
                  />
                  <span>Pembayaran (Billing)</span>
                  {isPembayaranSection && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#13c9b3] rounded-l-full shadow-sm shadow-teal-400" />
                  )}
                </Link>

                <div className="mt-1 ml-4 pl-3 border-l border-teal-800/60 space-y-1">
                  <Link
                    href="/pembayaran"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname === "/pembayaran" ||
                      (pathname.startsWith("/pembayaran/") &&
                        !pathname.startsWith("/pembayaran/buat"))
                        ? "bg-white/10 text-[#13c9b3]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 shrink-0" />
                    <span>Daftar Tagihan</span>
                  </Link>

                  <Link
                    href="/pembayaran/buat"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname.startsWith("/pembayaran/buat")
                        ? "bg-white/10 text-[#13c9b3]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5 shrink-0" />
                    <span>Buat Tagihan</span>
                  </Link>
                </div>
              </div>
            </nav>
          </div>

          {/* LAINNYA */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-teal-300/50 mb-2">
              Lainnya
            </div>
            <nav className="space-y-1">
              <Link
                href="/pengaturan"
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  pathname === "/pengaturan"
                    ? "bg-[#13c9b3]/15 text-[#13c9b3] font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Settings
                  className={`w-4 h-4 ${
                    pathname === "/pengaturan"
                      ? "text-[#13c9b3]"
                      : "text-teal-400/60"
                  }`}
                />
                <span>Pengaturan</span>
              </Link>
              <Link
                href="/bantuan"
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  pathname === "/bantuan"
                    ? "bg-[#13c9b3]/15 text-[#13c9b3] font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <HelpCircle
                  className={`w-4 h-4 ${
                    pathname === "/bantuan"
                      ? "text-[#13c9b3]"
                      : "text-teal-400/60"
                  }`}
                />
                <span>Pusat Bantuan</span>
              </Link>
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
            Sinkronisasi kamar, antrean, rekap RME & billing aktif.
          </p>
        </div>
      </div>
    </aside>
  );
}
