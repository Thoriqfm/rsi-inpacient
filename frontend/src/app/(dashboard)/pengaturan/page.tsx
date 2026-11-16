"use client";

import React from "react";
import {
  UserCheck,
  Server,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PengaturanPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-slate-800">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
          INFORMASI AKUN &amp; SISTEM
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Pengaturan SIMRS Rawat Inap
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Detail profil petugas aktif, hak akses Role-Based Access Control (RBAC), dan status koneksi server backend SIMRS.
        </p>
      </div>

      {/* Active Profile & RBAC Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Profil Petugas Aktif
            </h2>
            <p className="text-xs text-slate-500">
              Sesi terautentikasi oleh server backend melalui token JWT.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Nama Petugas</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {user?.nama_petugas || "-"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Username</div>
            <div className="text-sm font-mono font-semibold text-slate-900 mt-1">
              {user?.username || "-"}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <div className="text-[11px] text-emerald-700 font-medium">Peran / Hak Akses</div>
            <div className="text-sm font-bold text-emerald-900 mt-1">
              {user?.jabatan_label || "-"}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Hak akses ditegakkan langsung oleh server backend berdasarkan peran akun yang terdaftar. Untuk berpindah akun petugas, silakan keluar terlebih dahulu lalu masuk dengan akun yang sesuai.
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>

      {/* Backend Integration Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Integrasi API Backend
            </h2>
            <p className="text-xs text-slate-500">
              Seluruh transaksi tempat tidur, antrean, rujukan, RME, dan tagihan tersinkronisasi langsung dengan server backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
