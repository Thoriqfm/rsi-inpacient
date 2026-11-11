"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bed,
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  ClipboardList,
  Calculator,
  Receipt,
  FileText,
  X,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Auto close drawer on route change on mobile
  useEffect(() => {
    onClose?.();
  }, [pathname, onClose]);

  const isAntrianSection = pathname.startsWith("/sistem-antrian");
  const isRekapSection = pathname.startsWith("/rekap-layanan");
  const isPembayaranSection = pathname.startsWith("/pembayaran");

  const getItemClass = (isActive: boolean) =>
    `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
      isActive
        ? "bg-emerald-600/25 text-white font-semibold border border-emerald-500/40 shadow-xs"
        : "text-emerald-100/75 hover:text-white hover:bg-white/10"
    }`;

  const getSubItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
      isActive
        ? "bg-emerald-500/20 text-emerald-300 font-semibold"
        : "text-emerald-200/70 hover:text-white hover:bg-white/5"
    }`;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-[#064e3b] text-slate-100 flex flex-col justify-between shrink-0 border-r border-[#022c22] select-none overflow-y-auto transition-transform duration-250 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-[72px] px-5 flex items-center justify-between border-b border-[#022c22] sticky top-0 bg-[#064e3b] z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              +
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wide leading-none">
                Inpatient Care
              </div>
              <div className="text-[10px] text-emerald-300/80 font-medium tracking-wide mt-1">
                RSI Hospital Platform
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-emerald-300/80 hover:text-white hover:bg-emerald-800/60 transition cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="px-3 py-4 space-y-5">
          {/* MENU UTAMA */}
          <div>
            <div className="px-3.5 text-[10px] font-bold uppercase tracking-[1.5px] text-emerald-300/50 mb-2">
              MENU UTAMA
            </div>
            <nav className="space-y-1">
              {/* Strict RBAC: Petugas Bed Management ONLY manages Bed Management */}
              {user?.role === "PETUGAS_BED_MANAGEMENT" ? (
                <>
                  {/* Bed Management (Primary Workspace) */}
                  <Link
                    href="/bed-management"
                    className={getItemClass(pathname === "/bed-management")}
                  >
                    <Bed
                      className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                        pathname === "/bed-management"
                          ? "text-emerald-400"
                          : "text-emerald-300/70"
                      }`}
                    />
                    <span>Bed Management</span>
                  </Link>
                </>
              ) : (
                /* Petugas Administrasi / Super Admin */
                <>
                  {/* Dashboard */}
                  <Link
                    href="/dashboard"
                    className={getItemClass(pathname === "/dashboard")}
                  >
                    <LayoutDashboard
                      className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                        pathname === "/dashboard"
                          ? "text-emerald-400"
                          : "text-emerald-300/70"
                      }`}
                    />
                    <span>Dashboard SIMRS</span>
                  </Link>

                  {/* Ketersediaan Bed */}
                  <Link
                    href="/bed-management"
                    className={getItemClass(pathname === "/bed-management")}
                  >
                    <Bed
                      className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                        pathname === "/bed-management"
                          ? "text-emerald-400"
                          : "text-emerald-300/70"
                      }`}
                    />
                    <span>
                      {user?.role === "PETUGAS_ADMINISTRASI"
                        ? "Ketersediaan Bed"
                        : "Bed Management"}
                    </span>
                  </Link>

                  {/* Alokasi Kamar */}
                  <Link
                    href="/bed-management/alokasi"
                    className={getItemClass(pathname === "/bed-management/alokasi")}
                  >
                    <Users
                      className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                        pathname === "/bed-management/alokasi"
                          ? "text-emerald-400"
                          : "text-emerald-300/70"
                      }`}
                    />
                    <span>Alokasi Kamar Pasien</span>
                  </Link>

                  {/* Sistem Antrean */}
                  <div className="pt-1">
                    <Link
                      href="/sistem-antrian/daftar-tunggu"
                      className={getItemClass(isAntrianSection)}
                    >
                      <ClipboardList
                        className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                          isAntrianSection
                            ? "text-emerald-400"
                            : "text-emerald-300/70"
                        }`}
                      />
                      <span>Sistem Antrean</span>
                    </Link>

                    <div className="mt-1 ml-4 pl-3 border-l border-emerald-800/60 space-y-1">
                      <Link
                        href="/sistem-antrian/daftar-tunggu"
                        className={getSubItemClass(
                          pathname === "/sistem-antrian/daftar-tunggu" ||
                            pathname === "/sistem-antrian"
                        )}
                      >
                        <span>Daftar Tunggu FIFO</span>
                      </Link>

                      <Link
                        href="/sistem-antrian/rujukan-pasien"
                        className={getSubItemClass(
                          pathname === "/sistem-antrian/rujukan-pasien"
                        )}
                      >
                        <span>Rujukan RS Jejaring</span>
                      </Link>

                      <Link
                        href="/sistem-antrian/pemantauan-status"
                        className={getSubItemClass(
                          pathname === "/sistem-antrian/pemantauan-status"
                        )}
                      >
                        <span>Pemantauan Status</span>
                      </Link>
                    </div>
                  </div>

                  {/* Rekap Layanan & Tindakan RME */}
                  <div className="pt-1">
                    <Link
                      href="/rekap-layanan"
                      className={getItemClass(isRekapSection)}
                    >
                      <FileText
                        className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                          isRekapSection
                            ? "text-emerald-400"
                            : "text-emerald-300/70"
                        }`}
                      />
                      <span>Rekap Layanan & Tindakan</span>
                    </Link>
                  </div>

                  {/* Pembayaran & Tagihan Billing */}
                  <div className="pt-1">
                    <Link
                      href="/pembayaran"
                      className={getItemClass(isPembayaranSection)}
                    >
                      <CreditCard
                        className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                          isPembayaranSection
                            ? "text-emerald-400"
                            : "text-emerald-300/70"
                        }`}
                      />
                      <span>Pembayaran & Billing</span>
                    </Link>

                    <div className="mt-1 ml-4 pl-3 border-l border-emerald-800/60 space-y-1">
                      <Link
                        href="/pembayaran"
                        className={getSubItemClass(
                          pathname === "/pembayaran" ||
                            (pathname.startsWith("/pembayaran/") &&
                              !pathname.startsWith("/pembayaran/buat"))
                        )}
                      >
                        <Receipt className="w-3.5 h-3.5 shrink-0 stroke-[1.8]" />
                        <span>Daftar Tagihan</span>
                      </Link>

                      <Link
                        href="/pembayaran/buat"
                        className={getSubItemClass(
                          pathname.startsWith("/pembayaran/buat")
                        )}
                      >
                        <Calculator className="w-3.5 h-3.5 shrink-0 stroke-[1.8]" />
                        <span>Buat Tagihan</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </nav>
          </div>

          {/* LAINNYA */}
          <div>
            <div className="px-3.5 text-[10px] font-bold uppercase tracking-[1.5px] text-emerald-300/50 mb-2">
              LAINNYA
            </div>
            <nav className="space-y-1">
              <Link
                href="/pengaturan"
                className={getItemClass(pathname === "/pengaturan")}
              >
                <Settings
                  className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                    pathname === "/pengaturan"
                      ? "text-emerald-400"
                      : "text-emerald-300/70"
                  }`}
                />
                <span>Pengaturan</span>
              </Link>
              <Link
                href="/bantuan"
                className={getItemClass(pathname === "/bantuan")}
              >
                <HelpCircle
                  className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                    pathname === "/bantuan"
                      ? "text-emerald-400"
                      : "text-emerald-300/70"
                  }`}
                />
                <span>Pusat Bantuan</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3.5 border-t border-[#022c22] bg-[#053b2d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-950 font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-emerald-500/40">
                {user?.inisial || "BS"}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#053b2d]" />
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.nama_petugas || "Budi Santoso"}
              </div>
              <div className="text-[10px] text-emerald-200/80 truncate">
                {user?.jabatan_label || "Petugas Bed Management"}
              </div>
            </div>
          </div>
          <Link
            href="/pengaturan"
            className="p-1.5 rounded-lg text-emerald-300/70 hover:text-white hover:bg-emerald-800/40 transition cursor-pointer shrink-0"
            title="Pengaturan Akun"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
