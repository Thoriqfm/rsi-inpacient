"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bed,
  Users,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  FileText,
  TrendingUp,
  ChevronRight,
  Building2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  fetchBedsApi,
  fetchQueuesApi,
  fetchHistoriesApi,
  fetchBillingsApi,
} from "@/lib/api-client";
import { BedItem, QueueItem, HistoryRecapItem, BillingItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

export default function MainSimrsDashboardPage() {
  const { user } = useAuth();

  const [beds, setBeds] = useState<BedItem[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [histories, setHistories] = useState<HistoryRecapItem[]>([]);
  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchBedsApi(),
        fetchQueuesApi(),
        fetchHistoriesApi(),
        fetchBillingsApi(),
      ]);

      if (results[0].status === "fulfilled") setBeds(results[0].value.items);
      if (results[1].status === "fulfilled") setQueues(results[1].value.items);
      if (results[2].status === "fulfilled") setHistories(results[2].value.items);
      if (results[3].status === "fulfilled") setBillings(results[3].value.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const bedTersedia = beds.filter((b) => b.status === "Tersedia").length;
  const bedTerisi = beds.filter((b) => b.status === "Terisi").length;
  const bedPembersihan = beds.filter((b) => b.status === "Pembersihan").length;

  const waitingQueues = queues.filter((q) => q.status === "Menunggu");
  const emergencyQueues = waitingQueues.filter(
    (q) => q.kondisi_pasien === "Darurat"
  );
  const siapBillingCount = histories.filter(
    (h) => h.status === "Siap Billing"
  ).length;
  const totalRevenue = billings
    .filter((b) => b.status !== "Batal")
    .reduce((acc, b) => acc + b.total_biaya_num, 0);

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Dashboard SIMRS" />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-slate-800">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl bg-[#064e3b] text-white p-6 sm:p-8 shadow-sm relative overflow-hidden border border-[#022c22]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              PUSAT KENDALI OPERASIONAL SIMRS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Selamat Datang, {user?.nama_petugas || "Petugas Medis & Administrasi"}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Monitoring ketersediaan tempat tidur rawat inap, antrean pasien FIFO, rekap RME bangsal, dan kasir billing secara terintegrasi real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/bed-management"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs flex items-center gap-2 transition"
            >
              <Bed className="w-4 h-4 text-emerald-300" />
              <span>Monitor Kamar</span>
            </Link>
            <Link
              href="/rekap-layanan"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>Rekap Layanan</span>
            </Link>
            <Link
              href="/pembayaran"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing &amp; Kasir</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Bed Tersedia */}
        <Link
          href="/bed-management"
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-emerald-500 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Bed className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Bed Tersedia</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {loading ? "..." : `Total ${beds.length} Ranap`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {loading ? "..." : bedTersedia}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* KPI 2: Antrean Menunggu */}
        <Link
          href="/sistem-antrian/daftar-tunggu"
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-amber-400 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Antrean Menunggu</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {emergencyQueues.length > 0 ? `${emergencyQueues.length} Darurat` : "FIFO Terkendali"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {loading ? "..." : waitingQueues.length}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* KPI 3: Rekap Siap Billing */}
        <Link
          href="/rekap-layanan"
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-emerald-500 hover:shadow-sm transition cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Siap Billing</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {loading ? "..." : `${histories.length} Rekap RME`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {loading ? "..." : siapBillingCount}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* KPI 4: Akumulasi Tagihan */}
        <Link
          href="/pembayaran"
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-xs hover:border-emerald-500 hover:shadow-sm transition cursor-pointer group min-w-0"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-800 truncate">Total Tagihan</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight mt-0.5 truncate tabular-nums">
                {loading ? "..." : formatRupiah(totalRevenue).replace(",00", "")}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
                {billings.filter((b) => b.status !== "Batal").length} Invoice Aktif
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0 ml-1" />
        </Link>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              FASILITAS KAMAR &amp; TEMPAT TIDUR
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Manajemen Bed &amp; Alokasi Kamar
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pantau ketersediaan ranjang bangsal secara real-time, perbarui status tempat tidur, serta lakukan alokasi kamar pasien baru.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/bed-management"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span>Ketersediaan Bed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/bed-management/alokasi"
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Alokasi Kamar
            </Link>
          </div>
        </div>

        {/* Module 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              LAYANAN ANTREAN &amp; RUJUKAN
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Antrean Rawat Inap &amp; Rujukan RS
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kelola antrean pasien stabil berdasarkan urutan pendaftaran (FIFO), dan pantau status rujukan fasilitas jejaring saat kapasitas penuh.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/sistem-antrian/daftar-tunggu"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span>Daftar Tunggu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/sistem-antrian/rujukan-pasien"
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Rujukan RS
            </Link>
          </div>
        </div>

        {/* Module 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              KEUANGAN &amp; REKAM MEDIS
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Rekap RME &amp; Manajemen Billing
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verifikasi rekap riwayat tindakan medis dokter dan perawat, validasi kelengkapan berkas, kalkulasi tarif kamar/tindakan otomatis, dan penerbitan faktur tagihan resmi.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/rekap-layanan"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span>Rekap Tindakan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/pembayaran"
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Kelola Billing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
