"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Bed, ArrowLeft } from "lucide-react";

interface RoleAccessDeniedProps {
  moduleName: string;
}

export function RoleAccessDenied({ moduleName }: RoleAccessDeniedProps) {
  return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-5 animate-fadeIn">
      <div className="w-16 h-16 rounded-[14px] bg-[#fdf0f0] border border-[#fecaca] text-[#dc2626] flex items-center justify-center mx-auto shadow-sm">
        <ShieldAlert className="w-8 h-8 stroke-[1.8]" />
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#dc2626]">
          AKSES DIBATASI (403 FORBIDDEN)
        </div>
        <h1 className="text-2xl font-bold text-[#1e1e1e] tracking-tight">
          Akses Modul {moduleName} Dibatasi
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] max-w-lg mx-auto leading-relaxed">
          Berdasarkan aturan <strong>Role-Based Access Control (RBAC)</strong> rumah sakit, modul <strong>{moduleName}</strong> hanya diperuntukkan bagi <strong>Petugas Administrasi</strong>. Akun Anda memiliki peran <strong>Petugas Bed Management</strong> dengan wewenang khusus inventaris dan status operasional tempat tidur rawat inap.
        </p>
      </div>

      <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/bed-management"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
        >
          <Bed className="w-4 h-4" />
          <span>Buka Bed Management</span>
        </Link>

        <Link
          href="/pengaturan"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
        >
          <span>Ganti Peran di Pengaturan</span>
        </Link>
      </div>
    </div>
  );
}
