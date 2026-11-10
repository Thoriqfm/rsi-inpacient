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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-[#1e1e1e]">
      {/* Hero Welcome Banner */}
      <div className="rounded-[12px] bg-[#0a2e28] text-white p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] relative overflow-hidden border border-teal-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f]">
              PUSAT KENDALI OPERASIONAL SIMRS
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight leading-tight">
              Selamat Datang, {user?.nama_petugas || "Petugas Medis & Administrasi"}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              Monitoring ketersediaan tempat tidur rawat inap, antrean pasien FIFO, pencatatan rekap layanan tindakan RME, dan pengelolaan invoice tagihan pasien secara terintegrasi real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/bed-management"
              className="px-4 py-2 rounded-[8px] bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs flex items-center gap-2 transition"
            >
              <Bed className="w-4 h-4 text-[#00b89f]" />
              <span>Monitor Kamar</span>
            </Link>
            <Link
              href="/rekap-layanan"
              className="px-4 py-2 rounded-[8px] bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-[#00b89f]" />
              <span>Rekap Layanan</span>
            </Link>
            <Link
              href="/pembayaran"
              className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white font-medium text-xs flex items-center gap-2 shadow-xs transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing & Tagihan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards (Canonical Clinical Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Bed Tersedia */}
        <Link
          href="/bed-management"
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] hover:border-[#00b89f]/60 transition cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e6f4ef] text-[#00b89f] flex items-center justify-center shrink-0">
              <Bed className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Bed Tersedia</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">
                {loading ? "..." : `Total ${beds.length} Ranap`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
              {loading ? "..." : bedTersedia}
            </span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* KPI 2: Antrean Menunggu */}
        <Link
          href="/sistem-antrian/daftar-tunggu"
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#fef3e9] text-[#d97706] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Antrean Menunggu</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">
                {emergencyQueues.length > 0 ? `${emergencyQueues.length} Darurat` : "FIFO Terkendali"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
              {loading ? "..." : waitingQueues.length}
            </span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* KPI 3: Rekap Siap Billing */}
        <Link
          href="/rekap-layanan"
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] hover:border-[#00b89f]/60 transition cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e7faf7] text-[#0fa18f] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Siap Billing</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">
                {loading ? "..." : `${histories.length} Rekap RME`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
              {loading ? "..." : siapBillingCount}
            </span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* KPI 4: Akumulasi Tagihan (Anti-Collision Vertical Architecture) */}
        <Link
          href="/pembayaran"
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] hover:border-[#00b89f]/60 transition cursor-pointer group min-w-0"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-[10px] bg-[#e6f4ef] text-[#016b46] flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#1e1e1e] truncate">Total Tagihan</div>
              <div className="text-base sm:text-lg font-bold text-[#1e1e1e] tracking-tight mt-0.5 truncate">
                {loading ? "..." : formatRupiah(totalRevenue).replace(",00", "")}
              </div>
              <div className="text-xs text-[#0fa18f] font-medium mt-0.5 truncate">
                {billings.filter((b) => b.status !== "Batal").length} Invoice Aktif
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition shrink-0 ml-1" />
        </Link>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-5 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#0fa18f]">
              FASILITAS KAMAR & TEMPAT TIDUR
            </div>
            <h2 className="text-base font-bold text-[#1e1e1e]">
              Manajemen Bed & Alokasi Kamar
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              Pantau ketersediaan ranjang bangsal secara real-time, perbarui status tempat tidur (Tersedia, Terisi, Pembersihan, Pemeliharaan), serta lakukan alokasi kamar pasien baru.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/bed-management"
              className="px-3.5 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Ketersediaan Bed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/bed-management/alokasi"
              className="px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] font-medium text-xs transition"
            >
              Alokasi Kamar
            </Link>
          </div>
        </div>

        {/* Module 2 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-5 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#0fa18f]">
              LAYANAN ANTREAN & RUJUKAN
            </div>
            <h2 className="text-base font-bold text-[#1e1e1e]">
              Antrean Rawat Inap & Rujukan RS
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              Kelola antrean pasien stabil berdasarkan urutan pendaftaran (FIFO), pantau status rujukan fasilitas jejaring saat kapasitas penuh, dan monitoring penanganan pasien.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/sistem-antrian/daftar-tunggu"
              className="px-3.5 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Daftar Tunggu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/sistem-antrian/rujukan-pasien"
              className="px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] font-medium text-xs transition"
            >
              Rujukan RS
            </Link>
          </div>
        </div>

        {/* Module 3 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-5 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#0fa18f]">
              KEUANGAN & REKAM MEDIS
            </div>
            <h2 className="text-base font-bold text-[#1e1e1e]">
              Rekap RME & Manajemen Billing
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              Verifikasi rekap riwayat tindakan medis dokter dan perawat, validasi kelengkapan berkas, kalkulasi tarif kamar/tindakan otomatis, dan penerbitan faktur tagihan resmi.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/rekap-layanan"
              className="px-3.5 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Rekap Tindakan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/pembayaran"
              className="px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] font-medium text-xs transition"
            >
              Kelola Billing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
