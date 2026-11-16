"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  Settings,
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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
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

      {/* Right: User Profile Pill & Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer text-left border border-slate-200/80 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
              {user?.inisial || "-"}
            </div>
            <div className="hidden md:block pr-1">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.nama_petugas || "Petugas"}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                {user?.jabatan_label || "-"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-scaleUp"
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">
                  {user?.nama_petugas}
                </p>
                <p className="text-xs text-slate-500 font-mono">{user?.username}</p>
                <span className="inline-block mt-1.5 text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                  {user?.jabatan_label}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/pengaturan"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pengaturan &amp; Profil</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium transition cursor-pointer"
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
