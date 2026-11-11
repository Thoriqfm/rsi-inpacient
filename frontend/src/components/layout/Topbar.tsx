"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  LogOut,
  RefreshCw,
  ChevronRight,
  Database,
  Menu,
} from "lucide-react";
import { resetAllMockData } from "@/lib/mock-fallback";

interface TopbarProps {
  onToggleMenu?: () => void;
}

export function Topbar({ onToggleMenu }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    logout,
    login,
    switchRole,
    isStrictBackend,
    setStrictBackend,
  } = useAuth();
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

  const isDashboard = pathname === "/dashboard";
  const isAlokasi = pathname.includes("/alokasi");
  const isAntrian = pathname.startsWith("/sistem-antrian");
  const isRekap = pathname.startsWith("/rekap-layanan");
  const isPembayaran = pathname.startsWith("/pembayaran");
  const isPengaturan = pathname.startsWith("/pengaturan");
  const isBantuan = pathname.startsWith("/bantuan");

  const antrianSubLabel = pathname.includes("/rujukan-pasien")
    ? "Rujukan Pasien Darurat"
    : pathname.includes("/pemantauan-status")
    ? "Pemantauan Status"
    : "Daftar Tunggu FIFO";

  const rekapSubLabel = pathname.includes("/pasien/")
    ? pathname.endsWith("/buat")
      ? "Buat Rekap Baru"
      : "Riwayat RME"
    : pathname.endsWith("/edit")
    ? "Edit Verifikasi Rekap"
    : pathname !== "/rekap-layanan"
    ? "Detail Rekap Tindakan"
    : "Rekap Layanan & Tindakan";

  const pembayaranSubLabel = pathname.includes("/pemeriksaan")
    ? "Pemeriksaan Tagihan"
    : pathname.includes("/penerbitan")
    ? "Penerbitan Invoice"
    : pathname.startsWith("/pembayaran/buat/")
    ? "Rincian Biaya"
    : pathname === "/pembayaran/buat"
    ? "Pilih Pasien Billing"
    : pathname !== "/pembayaran"
    ? "Pelunasan Tagihan"
    : "Daftar Tagihan & Kasir";

  // Active page title for compact mobile header
  const activeTitle = isDashboard
    ? "Dashboard"
    : isAntrian
    ? antrianSubLabel
    : isRekap
    ? rekapSubLabel
    : isPembayaran
    ? pembayaranSubLabel
    : isPengaturan
    ? "Pengaturan"
    : isBantuan
    ? "Pusat Bantuan"
    : isAlokasi
    ? "Alokasi Kamar"
    : "Bed Management";

  const handleResetData = () => {
    if (isStrictBackend) {
      alert(
        "Mode Strict Backend aktif: data disimpan langsung di basis data MySQL backend.\n\nUntuk mereset data ke kondisi awal, silakan jalankan script seeder/migrasi pada server backend."
      );
      return;
    }
    if (
      confirm(
        "Reset ulang seluruh data simulasi (Bed, Daftar Tunggu, Rujukan, Rekap Tindakan RME, dan Tagihan Billing) ke kondisi awal?"
      )
    ) {
      resetAllMockData();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleToggleMock = async () => {
    const nextStrict = !isStrictBackend;
    if (nextStrict) {
      try {
        const username = user?.username || "budi.santoso";
        await login(username, "password123");
      } catch (e) {
        console.warn("Auto-login backend on toggle failed:", e);
      }
    }
    setStrictBackend(nextStrict);
    window.location.reload();
  };

  return (
    <header className="h-[72px] bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Hamburger Toggle (Mobile/Tablet < lg) */}
        <button
          type="button"
          onClick={onToggleMenu}
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Buka Navigasi"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Mobile Title View (< sm) */}
        <div className="sm:hidden flex items-center gap-1.5 truncate">
          <span className="font-bold text-slate-900 text-sm truncate">
            {activeTitle}
          </span>
        </div>

        {/* Desktop Breadcrumbs (>= sm) */}
        <nav className="hidden sm:flex items-center gap-2 text-xs md:text-sm flex-wrap text-slate-500">
          {isDashboard ? (
            <>
              <span className="font-medium text-slate-500">SIMRS Rawat Inap</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-xs border border-emerald-200/60">
                Dashboard Operasional
              </span>
            </>
          ) : isAntrian ? (
            <>
              <Link
                href="/sistem-antrian/daftar-tunggu"
                className="font-medium hover:text-slate-900 transition"
              >
                Sistem Antrian
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-xs border border-emerald-200/60">
                {antrianSubLabel}
              </span>
            </>
          ) : isRekap ? (
            <>
              <Link
                href="/rekap-layanan"
                className="font-medium hover:text-slate-900 transition"
              >
                Rekap Layanan
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-xs border border-emerald-200/60">
                {rekapSubLabel}
              </span>
            </>
          ) : isPembayaran ? (
            <>
              <Link
                href="/pembayaran"
                className="font-medium hover:text-slate-900 transition"
              >
                Pembayaran & Billing
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-xs border border-emerald-200/60">
                {pembayaranSubLabel}
              </span>
            </>
          ) : isPengaturan ? (
            <>
              <span className="font-medium">Sistem</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-xs border border-emerald-200/60">
                Pengaturan Sistem
              </span>
            </>
          ) : isBantuan ? (
            <>
              <span className="font-medium">Sistem</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-xs border border-emerald-200/60">
                Pusat Bantuan SOP
              </span>
            </>
          ) : (
            <>
              <Link
                href="/bed-management"
                className={`font-medium transition ${
                  !isAlokasi ? "text-slate-900 font-semibold" : "hover:text-slate-900"
                }`}
              >
                Bed Management
              </Link>

              {isAlokasi && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-xs border border-emerald-200/60">
                    Alokasi Kamar Pasien
                  </span>
                </>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mockup Mode On/Off Pill Button */}
        <button
          type="button"
          onClick={handleToggleMock}
          title={
            !isStrictBackend
              ? "Mode Simulasi Aktif. Klik untuk beralih ke Server Backend"
              : "Mode Server Backend Aktif. Klik untuk beralih ke Simulasi"
          }
          className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            !isStrictBackend
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-slate-300"
              : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-300/80"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span className="hidden md:inline font-normal text-slate-500">Mode:</span>
            <span className="font-semibold">
              {!isStrictBackend ? "Simulasi" : "Backend"}
            </span>
          </div>

          {/* LED Indicator Dot */}
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                !isStrictBackend ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                !isStrictBackend ? "bg-amber-500" : "bg-emerald-600"
              }`}
            />
          </span>
        </button>

        {/* Reset Data Button for Demo Convenience */}
        <button
          type="button"
          onClick={handleResetData}
          title="Reset Data Simulasi ke Kondisi Awal"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden xl:inline">Reset Data</span>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition relative shadow-2xs cursor-pointer"
          title="Pemberitahuan Sistem"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 sm:px-2 rounded-lg hover:bg-slate-100 transition cursor-pointer text-left border border-transparent hover:border-slate-200"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-300">
              {user?.inisial || "BS"}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.nama_petugas || "Budi Santoso"}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {user?.jabatan_label || "Petugas Bed Management"}
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.nama_petugas}
                </p>
                <p className="text-[11px] text-slate-500">{user?.username}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {user?.jabatan_label}
                </span>
              </div>

              {/* Role Switcher */}
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ganti Peran (Uji Desain):
                </p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchRole("SUPER_ADMIN");
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between cursor-pointer ${
                      user?.role === "SUPER_ADMIN"
                        ? "bg-purple-50 text-purple-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>Super Admin</span>
                    {user?.role === "SUPER_ADMIN" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchRole("PETUGAS_BED_MANAGEMENT");
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between cursor-pointer ${
                      user?.role === "PETUGAS_BED_MANAGEMENT"
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>Budi Santoso (Bed Mgmt)</span>
                    {user?.role === "PETUGAS_BED_MANAGEMENT" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchRole("PETUGAS_ADMINISTRASI");
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between cursor-pointer ${
                      user?.role === "PETUGAS_ADMINISTRASI"
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>Rini Aprilianti (Admin)</span>
                    {user?.role === "PETUGAS_ADMINISTRASI" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition cursor-pointer"
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
