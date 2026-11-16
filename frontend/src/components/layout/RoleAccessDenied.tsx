"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Bed } from "lucide-react";
import { Card } from "@/components/ui";

interface RoleAccessDeniedProps {
  moduleName: string;
}

export function RoleAccessDenied({ moduleName }: RoleAccessDeniedProps) {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 animate-fadeIn">
      <Card className="p-8 text-center space-y-5">
        <div
          aria-hidden="true"
          className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto"
        >
          <ShieldAlert className="w-7 h-7 stroke-[1.8]" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">
            Akses Dibatasi (403 Forbidden)
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Akses Modul {moduleName} Dibatasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Berdasarkan aturan <strong>Role-Based Access Control (RBAC)</strong> rumah sakit, modul <strong>{moduleName}</strong> dikhususkan bagi <strong>Petugas Administrasi</strong> atau <strong>Super Admin</strong>. Akun Anda berperan sebagai <strong>Petugas Bed Management</strong>.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/bed-management"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-2xs transition"
          >
            <Bed className="w-4 h-4" />
            <span>Buka Bed Management</span>
          </Link>

          <Link
            href="/pengaturan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition"
          >
            <span>Lihat Profil &amp; Akses</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
