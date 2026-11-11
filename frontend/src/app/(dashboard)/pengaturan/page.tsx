"use client";

import React, { useState } from "react";
import {
  Settings,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { resetAllMockData } from "@/lib/mock-fallback";

export default function PengaturanPage() {
  const { user, switchRole, isStrictBackend, setStrictBackend } = useAuth();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSwitchRole = (role: UserRole, label: string) => {
    switchRole(role);
    showToast(`Berhasil beralih peran aktif menjadi ${label}.`);
  };

  const handleResetSimulation = () => {
    resetAllMockData();
    showToast(
      "Seluruh data simulasi (Bed, Antrean, Rekap Tindakan, dan Tagihan Billing) telah di-reset ke kondisi awal."
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-slate-800">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
          PREFERENSI &amp; KONFIGURASI SISTEM
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Pengaturan SIMRS Rawat Inap
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Kelola peran pengguna aktif (Role-Based Access Control), mode integrasi backend API, dan pengaturan sesi simulasi.
        </p>
      </div>

      {/* Active Profile & Quick Role Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Peran Pengguna Aktif (Role-Based Access Control)
            </h2>
            <p className="text-xs text-slate-500">
              Login sebagai: <strong>{user?.nama_petugas}</strong> (
              <code>{user?.role}</code>)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() =>
              handleSwitchRole(
                "PETUGAS_BED_MANAGEMENT",
                "Petugas Bed Management"
              )
            }
            className={`p-5 rounded-xl border text-left transition cursor-pointer ${
              user?.role === "PETUGAS_BED_MANAGEMENT"
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                Petugas Bed Management
              </div>
              {user?.role === "PETUGAS_BED_MANAGEMENT" && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Aktif
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Wewenang inventaris tempat tidur: kelola ketersediaan ranjang, update status kamar (Tersedia, Terisi, Pembersihan, Pemeliharaan), dan monitor okupansi bangsal.
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleSwitchRole(
                "PETUGAS_ADMINISTRASI",
                "Petugas Administrasi Rawat Inap"
              )
            }
            className={`p-5 rounded-xl border text-left transition cursor-pointer ${
              user?.role === "PETUGAS_ADMINISTRASI"
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                Petugas Administrasi
              </div>
              {user?.role === "PETUGAS_ADMINISTRASI" && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Aktif
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Wewenang admisi &amp; administrasi: Dashboard SIMRS, Alokasi Kamar Pasien, Antrean FIFO, Rujukan Pasien Darurat (SPGDT), Rekap Layanan &amp; Tindakan RME, dan Kasir Billing.
            </div>
          </button>
        </div>
      </div>

      {/* Mode Integrasi API Backend & Strict Mode */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Mode Integrasi API Backend
            </h2>
            <p className="text-xs text-slate-500">
              Pilih apakah aplikasi berjalan dalam Mode Strict Backend API atau Mode Simulasi Fallback.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Opsi 1: Strict Backend Mode */}
          <button
            type="button"
            onClick={() => {
              setStrictBackend(true);
              showToast("Mode Strict Backend diaktifkan: Fallback mockup dinonaktifkan total.");
            }}
            className={`p-5 rounded-xl border text-left transition cursor-pointer ${
              isStrictBackend
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                Mode Server Backend (Aktif)
              </div>
              {isStrictBackend && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Live API
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Semua data kamar, antrean, rujukan, rekap RME, dan tagihan disimpan dan diambil langsung dari basis data server backend (MySQL/Prisma).
            </div>
          </button>

          {/* Opsi 2: Mock Mode */}
          <button
            type="button"
            onClick={() => {
              setStrictBackend(false);
              showToast("Mode Simulasi Mock diaktifkan: Mengizinkan data mock fallback.");
            }}
            className={`p-5 rounded-xl border text-left transition cursor-pointer ${
              !isStrictBackend
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                Mode Simulasi Mock
              </div>
              {!isStrictBackend && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                  Offline Demo
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Menggunakan data tiruan di memori browser saat server backend offline untuk demonstrasi antarmuka.
            </div>
          </button>
        </div>

        {/* Info & Reset Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Reset Data Simulasi SIMRS</span>
            </div>
            <p className="text-slate-500">
              {isStrictBackend
                ? "Dalam Mode Strict, data tersimpan di MySQL server backend. Reset data dilakukan via seeder backend."
                : "Mengembalikan seluruh perubahan data kamar, antrean, dan tagihan di browser ke kondisi awal."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetSimulation}
            disabled={isStrictBackend}
            className="px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Data Simulasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
