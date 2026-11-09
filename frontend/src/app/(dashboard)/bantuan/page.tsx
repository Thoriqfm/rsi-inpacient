"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";

interface GuideItem {
  code: string;
  title: string;
  actor: "Petugas Bed Management" | "Petugas Administrasi" | "Semua Petugas";
  desc: string;
  href: string;
}

const USE_CASE_GUIDES: GuideItem[] = [
  {
    code: "SOP 01",
    title: "Autentikasi & Kontrol Akses Peran",
    actor: "Semua Petugas",
    desc: "Validasi sesi login terenkripsi JWT dan pemisahan hak akses berbasis RBAC ketat antara Petugas Bed Management dan Petugas Administrasi.",
    href: "/pengaturan",
  },
  {
    code: "SOP 02",
    title: "Inventarisasi & Status Tempat Tidur",
    actor: "Petugas Bed Management",
    desc: "Memonitor ketersediaan ranjang bangsal, mendaftarkan tempat tidur baru, serta mengelola status operasional (Tersedia, Pembersihan, Pemeliharaan).",
    href: "/bed-management",
  },
  {
    code: "SOP 03",
    title: "Alokasi Kamar & Ranjang Pasien",
    actor: "Petugas Administrasi",
    desc: "Menerima pendaftaran rawat inap, menetapkan bed berstatus Tersedia dengan penguncian real-time, serta memilih dokter DPJP.",
    href: "/bed-management/alokasi",
  },
  {
    code: "SOP 04",
    title: "Pengelolaan Daftar Tunggu (Antrean FIFO)",
    actor: "Petugas Administrasi",
    desc: "Mendaftarkan pasien ke sistem antrean otomatis berbasis urutan kedatangan FIFO saat seluruh kapasitas ranap terisi penuh.",
    href: "/sistem-antrian/daftar-tunggu",
  },
  {
    code: "SOP 05",
    title: "Rujukan Pasien Darurat (Jejaring SPGDT)",
    actor: "Petugas Administrasi",
    desc: "Mengidentifikasi kapasitas RS rujukan jejaring dan menerbitkan Surat Rujukan Resmi SPGDT bagi pasien gawat darurat triase merah.",
    href: "/sistem-antrian/rujukan-pasien",
  },
  {
    code: "SOP 06",
    title: "Pemantauan Status & Tracking Ranap",
    actor: "Petugas Administrasi",
    desc: "Melacak riwayat penempatan pasien, status alokasi, rujukan eksternal, mutasi bangsal, hingga pemulangan pasien (discharge).",
    href: "/sistem-antrian/pemantauan-status",
  },
  {
    code: "SOP 07",
    title: "Penyusunan Rekap Layanan Tindakan RME",
    actor: "Petugas Administrasi",
    desc: "Mengambil snapshot riwayat tindakan medis dari RME bangsal, memverifikasi kelengkapan layanan, dan mengunci berkas menjadi Siap Billing.",
    href: "/rekap-layanan",
  },
  {
    code: "SOP 08",
    title: "Kalkulasi Biaya & Tarif Pelayanan",
    actor: "Petugas Administrasi",
    desc: "Mencocokkan setiap tindakan pada rekap Siap Billing dengan master tarif resmi yang berlaku untuk menghitung total biaya perawatan.",
    href: "/pembayaran",
  },
  {
    code: "SOP 09",
    title: "Penerbitan & Pelunasan Tagihan Billing",
    actor: "Petugas Administrasi",
    desc: "Memeriksa draf rincian tagihan, melakukan hitung ulang bila diperlukan, menerbitkan invoice resmi, hingga proses pelunasan (Lunas).",
    href: "/pembayaran",
  },
];

const getActorBadge = (actor: string) => {
  if (actor === "Petugas Bed Management") {
    return "bg-[#e7faf7] text-[#0fa18f] border border-[#b6eee7]";
  }
  if (actor === "Petugas Administrasi") {
    return "bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]";
  }
  return "bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]";
};

export default function BantuanPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f] mb-1">
          DOKUMENTASI OPERASIONAL & PANDUAN SOP
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#1e1e1e] tracking-tight leading-tight">
          Panduan Alur Kerja SIMRS Rawat Inap
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
          Standar Operasional Prosedur (SOP) operasional terpadu pada modul Inpatient Care SIMRS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {USE_CASE_GUIDES.map((uc) => (
          <div
            key={uc.code}
            className="bg-white rounded-[12px] border border-[#e9ebf0] p-5 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex flex-col justify-between space-y-4 hover:border-[#00b89f] transition"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#0a2e28] text-[#00b89f]">
                  {uc.code}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getActorBadge(
                    uc.actor
                  )}`}
                >
                  {uc.actor}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 leading-snug">
                {uc.title}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {uc.desc}
              </p>
            </div>

            <Link
              href={uc.href}
              className="inline-flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-teal-700 hover:text-teal-900 transition"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#00b89f]" />
                Buka Modul
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-[#0a2e28] text-white rounded-[16px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-teal-500/20 shadow-lg">
        <div className="space-y-1.5">
          <div className="font-bold text-sm flex items-center gap-2 text-[#00b89f]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Alur Terintegrasi Akhir-ke-Akhir (End-to-End Workflow)</span>
          </div>
          <p className="text-xs text-teal-100/80 leading-relaxed max-w-3xl">
            1. Pendaftaran & Alokasi Kamar (Administrasi) &rarr; 2. Manajemen Okupansi Bed (Bed Management) &rarr; 3. Perawatan & Pemantauan Pasien &rarr; 4. Rekap Tindakan Medis RME &rarr; 5. Perhitungan Biaya & Pelunasan Invoice Resmi.
          </p>
        </div>
      </div>
    </div>
  );
}
