"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Info,
  Plus,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";
import {
  HistoryRecapItem,
  PasienCandidate,
  RmeRecordItem,
} from "@/types";
import { fetchPatientRmeApi } from "@/lib/api-client";

export default function InformasiDataPasienPage() {
  const { user } = useAuth();

  const params = useParams();
  const idPasien = Number(params?.idPasien || 1);

  const [pasien, setPasien] = useState<PasienCandidate | null>(null);
  const [rmeItems, setRmeItems] = useState<RmeRecordItem[]>([]);
  const [existingRekap, setExistingRekap] = useState<HistoryRecapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPatientRmeApi(idPasien);
      setPasien(res.pasien);
      setRmeItems(res.items);
      setExistingRekap(res.rekap_existing);
    } finally {
      setLoading(false);
    }
  }, [idPasien]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Data Pasien & Riwayat RME" />;
  }

  if (loading || !pasien) {
    return (
      <div className="max-w-[1200px] mx-auto py-16 text-center text-slate-500 text-sm">
        Memuat data pasien dan riwayat layanan dari RME...
      </div>
    );
  }

  const activeRekap = existingRekap.find((r) => r.status !== "Draft") || existingRekap[0];

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12 text-[#1e1e1e]">
      {/* Breadcrumb & Header (Figma 144:4504 - 144:4510) */}
      <div className="space-y-1">
        <p className="font-semibold text-[#0fa18f] text-[10px] tracking-[1px] uppercase">
          INFORMASI PASIEN
        </p>
        <h1 className="text-[27px] font-medium leading-[35px] text-[#1e1e1e] tracking-[-0.675px]">
          Data Pasien
        </h1>
        <p className="text-[13px] text-[#667085] leading-[21px]">
          Periksa identitas pasien dan riwayat layanan dari RME sebelum membuat
          rekap.
        </p>
      </div>

      {/* Card 1: Data Pasien Rawat Inap (Figma 144:4512) */}
      <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.05)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-[14px] bg-[#e7faf7] text-[#07594f] font-semibold text-[16px] flex items-center justify-center shrink-0">
              {getInitials(pasien.nama_pasien)}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#667085] tracking-wider uppercase">
                DATA PASIEN RAWAT INAP
              </p>
              <h2 className="text-[20px] font-bold text-[#1e1e1e] mt-0.5">
                {pasien.nama_pasien}
              </h2>
              <p className="text-[12px] text-[#667085]">{pasien.no_rm}</p>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e7faf7] border border-[#ccefeb] text-[#0b796b] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0fa18f]" />
              <span>Memenuhi syarat rekap</span>
            </span>
          </div>
        </div>

        {/* 6-item Grid Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8 text-xs">
          <div>
            <span className="text-[11px] text-[#98a2b3] block">Nama Pasien</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {pasien.nama_pasien}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">Nomor Rekam Medis</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {pasien.no_rm}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">Jenis Kelamin</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {pasien.jenis_kelamin_usia.startsWith("L")
                ? "Laki-laki"
                : "Perempuan"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">Tanggal Lahir / Usia</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              12 Mei 1994 ({pasien.jenis_kelamin_usia})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">Periode Perawatan</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              18–22 Februari 2026
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">Ruang Perawatan</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {pasien.kelas_rekomendasi} • Kamar 204
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Blue Info Banner (Figma 144:4542) */}
      <div className="rounded-[12px] bg-[#eff8ff] border border-[#b2ddff] p-4 flex items-start gap-3 text-xs text-[#175cd3]">
        <Info className="w-5 h-5 text-[#2e90fa] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[12px]">Data medis hanya dapat dilihat</p>
          <p className="text-[11px] text-[#175cd3]/90 leading-relaxed">
            Data layanan dan tindakan bersumber dari RME dan hanya dapat dilihat
            melalui fitur ini. Perubahan data medis harus dilakukan melalui sistem
            RME yang berwenang.
          </p>
        </div>
      </div>

      {/* Card 3: Table Riwayat Layanan & Tindakan dari RME (Figma 144:4550) */}
      <div className="bg-white border border-[#e9ebf0] rounded-[12px] shadow-[0px_4px_8px_rgba(26,39,50,0.05)] overflow-hidden">
        <div className="p-5 border-b border-[#e9ebf0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1e1e1e]">
              Riwayat Layanan &amp; Tindakan dari RME
            </h2>
            <p className="text-[11px] text-[#667085] mt-0.5">
              {rmeItems.length} item tercatat selama periode perawatan
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium self-start sm:self-auto">
            <Info className="w-3.5 h-3.5" />
            <span>Data read-only</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8faf9] border-b border-[#e9ebf0] text-[9px] font-medium text-[#667085] uppercase tracking-[0.225px]">
                <th className="py-3 pl-5 pr-3 w-[50px]">No.</th>
                <th className="py-3 px-3">Jenis Layanan / Tindakan</th>
                <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                <th className="py-3 px-3">Tenaga Kesehatan</th>
                <th className="py-3 pl-3 pr-5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f1] text-[11px]">
              {rmeItems.map((r, idx) => (
                <tr key={r.id_riwayat} className="hover:bg-[#fbfcfc] transition">
                  <td className="py-3.5 pl-5 pr-3 text-[#475467] font-normal">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-[#1e1e1e]">
                    {r.nama_tindakan}
                  </td>
                  <td className="py-3.5 px-3 text-[#475467]">
                    {r.tanggal_tindakan_formatted || "18 Feb 2026, 10.15"}
                  </td>
                  <td className="py-3.5 px-3 text-[#475467]">
                    {r.dokter_pelaksana}
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-[#667085]">
                    {r.catatan_medis || "Pemeriksaan awal rawat inap"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Bar (Figma 144:4660) */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/rekap-layanan"
          className="px-5 py-2.5 rounded-[9px] border border-[#d7dce4] bg-white hover:bg-slate-50 text-[#344054] font-medium text-xs transition"
        >
          Kembali
        </Link>

        {activeRekap ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Rekap sudah dibuat: {activeRekap.kode_rekap} ({activeRekap.status})
            </span>
            <Link
              href={`/rekap-layanan/${activeRekap.id_rekap}`}
              className="px-5 py-2.5 rounded-[9px] bg-[#0b796b] hover:bg-[#07594f] text-white font-medium text-xs flex items-center gap-2 shadow-xs transition"
            >
              <span>Buka Dokumen Rekap</span>
            </Link>
          </div>
        ) : (
          <Link
            href={`/rekap-layanan/pasien/${pasien.id_pasien}/buat`}
            className="px-5 py-2.5 rounded-[9px] bg-[#00b89f] hover:bg-[#00a38d] text-white font-medium text-xs flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buat Rekap</span>
          </Link>
        )}
      </div>
    </div>
  );
}
