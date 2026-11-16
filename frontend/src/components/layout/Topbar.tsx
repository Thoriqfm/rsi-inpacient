"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react";

interface TopbarProps {
  onToggleMenu?: () => void;
}

export function Topbar({ onToggleMenu }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 sm:h-[72px] bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Hamburger Toggle (Mobile/Tablet < lg) */}
        <button
          type="button"
          onClick={onToggleMenu}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer shrink-0 touch-manipulation"
          title="Buka Navigasi"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Mobile Title View (< sm) */}
        <div className="sm:hidden flex items-center gap-1.5 truncate max-w-[145px]">
          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
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
              {user?.inisial || "-"}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.nama_petugas || "Petugas"}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {user?.jabatan_label || "-"}
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.nama_petugas}
                </p>
                <p className="text-[11px] text-slate-500">{user?.username}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {user?.jabatan_label}
                </span>
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
