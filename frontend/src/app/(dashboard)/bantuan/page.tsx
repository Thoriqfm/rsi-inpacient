"use client";

import React from "react";
import Link from "next/link";
import { HelpCircle, CheckCircle2, ArrowRight, BookOpen } from "lucide-react";

const USE_CASE_GUIDES = [
  {
    code: "PANDUAN 01",
    title: "Autentikasi & Kontrol Akses Petugas",
    actor: "Semua Petugas",
    desc: "Validasi sesi pengguna dan pengarah halaman berdasarkan peran (Perawat, Petugas Administrasi, Dokter).",
    href: "/pengaturan",
  },
  {
    code: "PANDUAN 02",
    title: "Melihat & Memperbarui Status Tempat Tidur",
    actor: "Perawat / Petugas Administrasi",
    desc: "Memantau okupansi bed per bangsal/kelas dan mengubah status antara Tersedia, Terisi, dan Dibersihkan.",
    href: "/bed-management",
  },
  {
    code: "PANDUAN 03",
    title: "Mengalokasikan Kamar & Tempat Tidur Pasien",
    actor: "Petugas Administrasi",
    desc: "Menetapkan tempat tidur yang Tersedia serta memilih dokter DPJP untuk pasien rawat inap baru.",
    href: "/bed-management/alokasi",
  },
  {
    code: "PANDUAN 04",
    title: "Mengelola Daftar Tunggu (Antrean FIFO)",
    actor: "Petugas Administrasi",
    desc: "Mendaftarkan pasien ke daftar tunggu otomatis berdasarkan waktu pendaftaran saat seluruh bed penuh.",
    href: "/sistem-antrian/daftar-tunggu",
  },
  {
    code: "PANDUAN 05",
    title: "Menangani Pasien Rujukan Darurat (IGD/ICU)",
    actor: "Petugas Administrasi / Medis",
    desc: "Memberikan prioritas tertinggi (bypass antrean reguler) bagi pasien gawat darurat.",
    href: "/sistem-antrian/rujukan-pasien",
  },
  {
    code: "PANDUAN 06",
    title: "Memantau Status Pasien & Histori Alokasi",
    actor: "Perawat / Petugas Administrasi",
    desc: "Melihat status penempatan pasien, mutasi kamar, dan pemulangan pasien (discharge).",
    href: "/sistem-antrian/pemantauan-status",
  },
  {
    code: "PANDUAN 07",
    title: "Menyusun Rekap Tindakan Pelayanan Pasien",
    actor: "Petugas Administrasi",
    desc: "Mengambil tindakan medis dari RME, memverifikasi kelengkapan layanan, dan mengunci rekap menjadi Siap Billing.",
    href: "/rekap-layanan",
  },
  {
    code: "PANDUAN 08",
    title: "Menghitung Biaya Pelayanan Rawat Inap",
    actor: "Petugas Administrasi",
    desc: "Mencocokkan setiap tindakan pada rekap Siap Billing dengan master tarif yang berlaku untuk menghitung subtotal & total biaya.",
    href: "/pembayaran/buat",
  },
  {
    code: "PANDUAN 09",
    title: "Memeriksa, Menyesuaikan, & Menerbitkan Tagihan",
    actor: "Petugas Administrasi",
    desc: "Memeriksa rincian draf invoice, melakukan hitung ulang (recalculate) bila diperlukan, menerbitkan invoice (Belum Dibayar), hingga pelunasan (Lunas).",
    href: "/pembayaran",
  },
];

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
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-[#0a2e28] text-[#00b89f]">
                  {uc.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {uc.actor}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900">
                {uc.title}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {uc.desc}
              </p>
            </div>

            <Link
              href={uc.href}
              className="inline-flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Buka Modul
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-[#0d332f] text-white rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-extrabold text-sm flex items-center gap-2 text-[#00b89f]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Alur Terintegrasi Akhir-ke-Akhir (End-to-End Workflow)</span>
          </div>
          <p className="text-xs text-teal-100/80">
            Pendaftaran & Alokasi Kamar → Perawatan & Pemantauan Pasien →
            Rekap Layanan & Tindakan Medis → Perhitungan Biaya & Penerbitan Invoice Resmi.
          </p>
        </div>
      </div>
    </div>
  );
}
