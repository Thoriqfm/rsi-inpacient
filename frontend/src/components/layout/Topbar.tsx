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
import { resetAllMockData } from "@/lib/mock-fallback";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchRole, dataSource, isStrictBackend, setStrictBackend } =
    useAuth();
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
    ? "Pemantauan Status Penanganan"
    : "Daftar Tunggu Rawat Inap (FIFO)";

  const rekapSubLabel = pathname.includes("/pasien/")
    ? pathname.endsWith("/buat")
      ? "Buat Snapshot Rekap Baru"
      : "Data Pasien & Riwayat RME"
    : pathname.endsWith("/edit")
    ? "Edit & Verifikasi Status Rekap"
    : pathname !== "/rekap-layanan"
    ? "Detail Rekap Tindakan"
    : "Rekap Riwayat Layanan & Tindakan";

  const pembayaranSubLabel = pathname.includes("/pemeriksaan")
    ? "Pemeriksaan & Penyesuaian Tagihan"
    : pathname.includes("/penerbitan")
    ? "Penerbitan Invoice Resmi"
    : pathname.startsWith("/pembayaran/buat/")
    ? "Rincian Biaya Pelayanan"
    : pathname === "/pembayaran/buat"
    ? "Pilih Pasien Rawat Inap"
    : pathname !== "/pembayaran"
    ? "Detail & Pelunasan Tagihan"
    : "Manajemen Tagihan & Pembayaran";

  const handleResetData = () => {
    if (isStrictBackend) {
      alert(
        "Mode Strict Backend aktif: data disimpan langsung di basis data MySQL backend.\n\nUntuk mereset data ke kondisi awal, silakan jalankan script seeder/migrasi pada server backend."
      );
      return;
    }
    if (
      confirm(
        "Reset ulang seluruh data simulasi (68 Bed, Daftar Tunggu, Rujukan, Rekap Tindakan RME, dan Tagihan Billing) ke kondisi awal?"
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

  const handleToggleMock = () => {
    const nextStrict = !isStrictBackend;
    setStrictBackend(nextStrict);
    window.location.reload();
  };

  return (
    <header className="h-[72px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm flex-wrap">
        {isDashboard ? (
          <>
            <span className="font-semibold text-slate-500">SIMRS Rawat Inap</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md text-xs border border-teal-200/50">
              Dashboard Operasional Terpadu
            </span>
          </>
        ) : isAntrian ? (
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
        ) : isRekap ? (
          <>
            <Link
              href="/rekap-layanan"
              className="font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Rekap Layanan
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md text-xs border border-teal-200/50">
              {rekapSubLabel}
            </span>
          </>
        ) : isPembayaran ? (
          <>
            <Link
              href="/pembayaran"
              className="font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Pembayaran & Billing
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md text-xs border border-teal-200/50">
              {pembayaranSubLabel}
            </span>
          </>
        ) : isPengaturan ? (
          <>
            <span className="font-semibold text-slate-500">Sistem</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md text-xs border border-teal-200/50">
              Pengaturan Sistem & Profil
            </span>
          </>
        ) : isBantuan ? (
          <>
            <span className="font-semibold text-slate-500">Sistem</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md text-xs border border-teal-200/50">
              Pusat Bantuan & Panduan SOP
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
        {/* Mockup Mode On/Off Toggle Button */}
        <button
          type="button"
          onClick={handleToggleMock}
          title={
            !isStrictBackend
              ? "Mockup aktif (Data Simulasi). Klik untuk mematikan mockup dan hanya menggunakan Real Backend API"
              : "Mockup nonaktif (Pure Backend API). Klik jika ingin mengaktifkan fallback simulasi mockup"
          }
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition shadow-2xs cursor-pointer ${
            !isStrictBackend
              ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Mockup:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                !isStrictBackend
                  ? "bg-amber-200 text-amber-900"
                  : "bg-emerald-200 text-emerald-900"
              }`}
            >
              {!isStrictBackend ? "ON (Simulasi)" : "OFF (Backend)"}
            </span>
          </div>

          {/* Toggle Switch Graphic */}
          <div
            className={`w-7 h-4 flex items-center rounded-full p-0.5 transition duration-200 ${
              !isStrictBackend ? "bg-amber-500" : "bg-emerald-600"
            }`}
          >
            <div
              className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition duration-200 ${
                !isStrictBackend ? "translate-x-3" : "translate-x-0"
              }`}
            />
          </div>
        </button>

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
            className="w-9 h-9 rounded-[8px] border border-[#e2e8f0] bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition relative shadow-2xs cursor-pointer"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-4 h-4 text-[#4b5563]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00b89f] ring-2 ring-white" />
          </button>
        </div>

        <div className="h-7 w-px bg-slate-200 mx-1" />

        {/* User Profile Pill & Dropdown (Matched to Official UI) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 px-2 rounded-[8px] hover:bg-slate-50 transition cursor-pointer text-left border border-transparent hover:border-[#e2e8f0]"
          >
            <div className="w-8 h-8 rounded-full bg-[#a3e4db] text-[#0a2e28] font-bold text-xs flex items-center justify-center shrink-0">
              {user?.inisial || "BS"}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-[#1e1e1e] leading-tight">
                {user?.nama_petugas || "Budi Santoso"}
              </div>
              <div className="text-[10px] text-[#8c8c8c] leading-tight">
                {user?.jabatan_label || "Petugas Bed Management"}
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#bfbfbf] ml-0.5" />
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
