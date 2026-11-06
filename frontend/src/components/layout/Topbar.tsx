"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  ChevronDown,
  LogOut,
  RefreshCw,
  ChevronRight,
  Database,
} from "lucide-react";
import { resetMockBeds } from "@/lib/mock-fallback";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchRole, dataSource } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAlokasi = pathname.includes("/alokasi");
  const isAntrian = pathname.startsWith("/sistem-antrian");
  const antrianSubLabel = pathname.includes("/rujukan-pasien")
    ? "Rujukan Pasien Darurat"
    : pathname.includes("/pemantauan-status")
    ? "Pemantauan Status Penanganan"
    : "Daftar Tunggu Rawat Inap (FIFO)";

  const handleResetData = () => {
    if (
      confirm(
        "Reset ulang seluruh data simulasi (68 Bed, Daftar Tunggu, dan Surat Rujukan) ke kondisi awal?"
      )
    ) {
      resetMockBeds();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-[72px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {isAntrian ? (
          <>
            <Link
              href="/sistem-antrian/daftar-tunggu"
              className="font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Sistem Antrian
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md text-xs border border-teal-200/50">
              {antrianSubLabel}
            </span>
          </>
        ) : (
          <>
            <Link
              href="/bed-management"
              className={`font-semibold transition ${
                !isAlokasi
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Bed Management
            </Link>

            {isAlokasi && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="font-semibold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md text-xs border border-teal-200/50">
                  Alokasi Kamar Pasien
                </span>
              </>
            )}
          </>
        )}
      </nav>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Data Source Badge */}
        <div
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            dataSource === "backend"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-teal-50 text-teal-800 border-teal-200"
          }`}
          title="Status Sumber Data"
        >
          <Database className="w-3.5 h-3.5" />
          <span>
            {dataSource === "backend"
              ? "Backend API Terhubung"
              : "Mode Simulasi Lokal"}
          </span>
        </div>

        {/* Reset Data Button for Demo Convenience */}
        <button
          type="button"
          onClick={handleResetData}
          title="Reset Data Simulasi ke Nilai Awal"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden lg:inline">Reset Data</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition relative"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f68624] ring-2 ring-white" />
          </button>
        </div>

        <div className="h-7 w-px bg-slate-200 mx-1" />

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0d332f] to-[#13c9b3] text-white font-bold text-sm flex items-center justify-center shadow-sm">
              {user?.inisial || "BS"}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.nama_petugas || "Budi Santoso"}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                {user?.jabatan_label || "Petugas Bed Management"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">
                  {user?.nama_petugas}
                </p>
                <p className="text-[11px] text-slate-500">{user?.username}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200/60">
                  {user?.jabatan_label}
                </span>
              </div>

              {/* Quick Role Switcher for Demo */}
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ganti Peran Pengguna (Uji Desain):
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchRole("PETUGAS_BED_MANAGEMENT");
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between ${
                      user?.role === "PETUGAS_BED_MANAGEMENT"
                        ? "bg-teal-50 text-teal-800 font-semibold"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span>Budi Santoso (Bed Mgmt)</span>
                    {user?.role === "PETUGAS_BED_MANAGEMENT" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchRole("PETUGAS_ADMINISTRASI");
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between ${
                      user?.role === "PETUGAS_ADMINISTRASI"
                        ? "bg-teal-50 text-teal-800 font-semibold"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span>Rini Aprilianti (Admin)</span>
                    {user?.role === "PETUGAS_ADMINISTRASI" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
