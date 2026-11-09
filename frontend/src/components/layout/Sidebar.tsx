"use client";

import React from "react";
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
  MoreHorizontal,
  FileText,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAntrianSection = pathname.startsWith("/sistem-antrian");
  const isRekapSection = pathname.startsWith("/rekap-layanan");
  const isPembayaranSection = pathname.startsWith("/pembayaran");

  const getItemClass = (isActive: boolean) =>
    `relative flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-medium transition cursor-pointer ${
      isActive
        ? "bg-[#0d3b36] border border-[#00b89f]/40 text-white shadow-xs"
        : "text-slate-300 hover:text-white hover:bg-white/5"
    }`;

  const getSubItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition cursor-pointer ${
      isActive
        ? "bg-[#00b89f]/20 text-[#00b89f] font-semibold"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <aside className="w-64 min-w-[256px] bg-[#0a2e28] text-slate-200 flex flex-col justify-between shrink-0 border-r border-teal-950/40 select-none overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="h-[72px] px-5 flex items-center gap-3 border-b border-teal-900/40 sticky top-0 bg-[#0a2e28] z-10">
          <div className="w-9 h-9 rounded-[10px] bg-[#00b89f] text-white font-bold flex items-center justify-center text-lg shadow-sm">
            +
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide leading-none">
              Inpatient Care
            </div>
            <div className="text-[10px] text-teal-300/70 font-medium tracking-wide mt-1">
              Sistem Informasi Rawat Inap
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-3 py-4 space-y-5">
          {/* MENU UTAMA */}
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-[1.5px] text-teal-300/40 mb-2">
              MENU UTAMA
            </div>
            <nav className="space-y-1">
              {/* Strict RBAC: Petugas Bed Management ONLY sees Bed Management & Allocation */}
              {user?.role === "PETUGAS_BED_MANAGEMENT" ? (
                <>
                  {/* Bed Management (Primary Workspace) */}
                  <Link
                    href="/bed-management"
                    className={getItemClass(pathname === "/bed-management")}
                  >
                    <Bed
                      className={`w-4 h-4 ${
                        pathname === "/bed-management" ? "text-[#00b89f]" : "text-teal-400/70"
                      }`}
                    />
                    <span>Bed Management</span>
                  </Link>

                  {/* Alokasi Kamar Pasien */}
                  <Link
                    href="/bed-management/alokasi"
                    className={getItemClass(pathname === "/bed-management/alokasi")}
                  >
                    <Users
                      className={`w-4 h-4 ${
                        pathname === "/bed-management/alokasi"
                          ? "text-[#00b89f]"
                          : "text-teal-400/70"
                      }`}
                    />
                    <span>Alokasi Kamar Pasien</span>
                  </Link>
                </>
              ) : (
                /* Petugas Administrasi: Full Administrative Operations */
                <>
                  {/* Dashboard */}
                  <Link
                    href="/dashboard"
                    className={getItemClass(pathname === "/dashboard")}
                  >
                    <LayoutDashboard
                      className={`w-4 h-4 ${
                        pathname === "/dashboard" ? "text-[#00b89f]" : "text-teal-400/70"
                      }`}
                    />
                    <span>Dashboard SIMRS</span>
                  </Link>

                  {/* Ketersediaan Bed (Read-only view for Administrasi) */}
                  <Link
                    href="/bed-management"
                    className={getItemClass(pathname === "/bed-management")}
                  >
                    <Bed
                      className={`w-4 h-4 ${
                        pathname === "/bed-management" ? "text-[#00b89f]" : "text-teal-400/70"
                      }`}
                    />
                    <span>Ketersediaan Bed</span>
                  </Link>

                  {/* Alokasi Kamar */}
                  <Link
                    href="/bed-management/alokasi"
                    className={getItemClass(pathname === "/bed-management/alokasi")}
                  >
                    <Users
                      className={`w-4 h-4 ${
                        pathname === "/bed-management/alokasi"
                          ? "text-[#00b89f]"
                          : "text-teal-400/70"
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
                        className={`w-4 h-4 ${
                          isAntrianSection ? "text-[#00b89f]" : "text-teal-400/70"
                        }`}
                      />
                      <span>Sistem Antrean</span>
                    </Link>

                    <div className="mt-1 ml-4 pl-3 border-l border-teal-800/40 space-y-1">
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

                  {/* Rekap Layanan & Tindakan RME (Figma node 143:287) */}
                  <div className="pt-1">
                    <Link
                      href="/rekap-layanan"
                      className={getItemClass(isRekapSection)}
                    >
                      <FileText
                        className={`w-4 h-4 ${
                          isRekapSection ? "text-[#00b89f]" : "text-teal-400/70"
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
                        className={`w-4 h-4 ${
                          isPembayaranSection ? "text-[#00b89f]" : "text-teal-400/70"
                        }`}
                      />
                      <span>Pembayaran & Billing</span>
                    </Link>

                    <div className="mt-1 ml-4 pl-3 border-l border-teal-800/40 space-y-1">
                      <Link
                        href="/pembayaran"
                        className={getSubItemClass(
                          pathname === "/pembayaran" ||
                            (pathname.startsWith("/pembayaran/") &&
                              !pathname.startsWith("/pembayaran/buat"))
                        )}
                      >
                        <Receipt className="w-3.5 h-3.5 shrink-0" />
                        <span>Daftar Tagihan</span>
                      </Link>

                      <Link
                        href="/pembayaran/buat"
                        className={getSubItemClass(
                          pathname.startsWith("/pembayaran/buat")
                        )}
                      >
                        <Calculator className="w-3.5 h-3.5 shrink-0" />
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
            <div className="px-3 text-[10px] font-bold uppercase tracking-[1.5px] text-teal-300/40 mb-2">
              LAINNYA
            </div>
            <nav className="space-y-1">
              <Link
                href="/pengaturan"
                className={getItemClass(pathname === "/pengaturan")}
              >
                <Settings
                  className={`w-4 h-4 ${
                    pathname === "/pengaturan" ? "text-[#00b89f]" : "text-teal-400/60"
                  }`}
                />
                <span>Pengaturan</span>
              </Link>
              <Link
                href="/bantuan"
                className={getItemClass(pathname === "/bantuan")}
              >
                <HelpCircle
                  className={`w-4 h-4 ${
                    pathname === "/bantuan" ? "text-[#00b89f]" : "text-teal-400/60"
                  }`}
                />
                <span>Pusat Bantuan</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* User Profile Footer (Matched to Screenshot) */}
      <div className="p-3.5 border-t border-teal-900/40 bg-[#092722]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#a3e4db] text-[#0a2e28] font-bold text-xs flex items-center justify-center shrink-0">
              {user?.inisial || "BS"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">
                {user?.nama_petugas || "Budi Santoso"}
              </div>
              <div className="text-[10px] text-teal-200/70 truncate">
                {user?.jabatan_label || "Petugas Bed Management"}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="p-1 text-teal-300/60 hover:text-white transition cursor-pointer"
            title="Opsi Akun"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
