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
    return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  }
  if (actor === "Petugas Administrasi") {
    return "bg-teal-50 text-teal-800 border border-teal-200";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

export default function BantuanPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-slate-800">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
          DOKUMENTASI OPERASIONAL &amp; PANDUAN SOP
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Panduan Alur Kerja SIMRS Rawat Inap
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Standar Operasional Prosedur (SOP) integrasi alur pasien dari registrasi, perawatan bangsal, hingga kepulangan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {USE_CASE_GUIDES.map((uc) => (
          <div
            key={uc.code}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 hover:shadow-sm transition"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#064e3b] text-emerald-300">
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
              className="inline-flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Buka Modul
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-[#064e3b] text-white rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#022c22] shadow-sm">
        <div className="space-y-1.5">
          <div className="font-bold text-sm flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Alur Terintegrasi Akhir-ke-Akhir (End-to-End Workflow)</span>
          </div>
          <p className="text-xs text-emerald-100/80 leading-relaxed max-w-3xl">
            1. Pendaftaran &amp; Alokasi Kamar &rarr; 2. Manajemen Okupansi Bed &rarr; 3. Perawatan &amp; Pemantauan Pasien &rarr; 4. Rekap Tindakan Medis RME &rarr; 5. Perhitungan Biaya &amp; Pelunasan Invoice Kasir.
          </p>
        </div>
      </div>
    </div>
  );
}
