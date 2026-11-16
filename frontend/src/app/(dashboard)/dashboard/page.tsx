"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bed,
  Users,
  CreditCard,
  ArrowRight,
  FileText,
  TrendingUp,
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
import { Card, PageHeader, StatCard } from "@/components/ui";

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
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadOverview();
    });
    return () => {
      active = false;
    };
  }, [loadOverview]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const totalBeds = beds.length;
  const bedTersedia = beds.filter((b) => b.status === "Tersedia").length;
  const bedTerisi = beds.filter((b) => b.status === "Terisi").length;
  const bedPembersihan = beds.filter((b) => b.status === "Pembersihan").length;
  const bedPemeliharaan = beds.filter((b) => b.status === "Pemeliharaan").length;

  const pct = (n: number) => (totalBeds > 0 ? Math.round((n / totalBeds) * 100) : 0);

  const waitingQueues = queues.filter((q) => q.status === "Menunggu");
  const emergencyQueues = waitingQueues.filter(
    (q) => q.kondisi_pasien === "Darurat"
  );
  const siapBillingCount = histories.filter(
    (h) => h.status === "Siap Billing"
  ).length;
  const activeBillings = billings.filter((b) => b.status !== "Batal");
  const totalRevenue = activeBillings.reduce((acc, b) => acc + b.total_biaya_num, 0);

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Dashboard SIMRS" />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-slate-800">
      <PageHeader
        eyebrow="Pusat Kendali Operasional SIMRS"
        title={`Ringkasan Operasional, ${user?.nama_petugas || "Petugas"}`}
        description="Pemantauan real-time kapasitas tempat tidur rawat inap, antrean FIFO, rekap tindakan RME, dan status penagihan kasir."
        actions={
          <>
            <Link
              href="/bed-management"
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs inline-flex items-center gap-1.5 transition"
            >
              <Bed className="w-3.5 h-3.5 text-slate-500" />
              <span>Monitor Kamar</span>
            </Link>
            <Link
              href="/rekap-layanan"
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs inline-flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Rekap Layanan</span>
            </Link>
            <Link
              href="/pembayaran"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Billing &amp; Kasir</span>
            </Link>
          </>
        }
      />

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          href="/bed-management"
          label="Bed Tersedia"
          subtitle={loading ? "Memuat..." : `Dari ${totalBeds} total kapasitas`}
          value={loading ? "—" : bedTersedia}
          icon={<Bed className="w-5 h-5 stroke-[1.8]" />}
          tone="emerald"
        />
        <StatCard
          href="/sistem-antrian/daftar-tunggu"
          label="Antrean Menunggu"
          subtitle={
            emergencyQueues.length > 0
              ? `${emergencyQueues.length} Darurat`
              : "FIFO terkendali"
          }
          value={loading ? "—" : waitingQueues.length}
          icon={<Users className="w-5 h-5 stroke-[1.8]" />}
          tone="amber"
        />
        <StatCard
          href="/rekap-layanan"
          label="Siap Billing"
          subtitle={loading ? "Memuat..." : `${histories.length} total rekap RME`}
          value={loading ? "—" : siapBillingCount}
          icon={<FileText className="w-5 h-5 stroke-[1.8]" />}
          tone="emerald"
        />
        <StatCard
          href="/pembayaran"
          label="Total Tagihan Aktif"
          subtitle={`${activeBillings.length} invoice tercatat`}
          value={loading ? "—" : formatRupiah(totalRevenue)}
          icon={<TrendingUp className="w-5 h-5 stroke-[1.8]" />}
          tone="slate"
        />
      </div>

      {/* Live Bed Occupancy Telemetry Bar */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Distribusi Okupansi Tempat Tidur
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkat keterisian bangsal aktif saat ini:{" "}
              <strong className="font-mono text-slate-800 tabular-nums">
                {loading ? "—" : `${pct(bedTerisi)}%`}
              </strong>{" "}
              ({bedTerisi} dari {totalBeds} bed terisi pasien)
            </p>
          </div>
          <Link
            href="/bed-management/alokasi"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Buka Alokasi Kamar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
          {totalBeds > 0 && (
            <>
              <div
                style={{ width: `${(bedTerisi / totalBeds) * 100}%` }}
                className="bg-rose-500 h-full transition-all duration-300"
                title={`Terisi: ${bedTerisi}`}
              />
              <div
                style={{ width: `${(bedTersedia / totalBeds) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Tersedia: ${bedTersedia}`}
              />
              <div
                style={{ width: `${(bedPembersihan / totalBeds) * 100}%` }}
                className="bg-amber-400 h-full transition-all duration-300"
                title={`Pembersihan: ${bedPembersihan}`}
              />
              <div
                style={{ width: `${(bedPemeliharaan / totalBeds) * 100}%` }}
                className="bg-slate-400 h-full transition-all duration-300"
                title={`Pemeliharaan: ${bedPemeliharaan}`}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Terisi
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {bedTerisi}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Tersedia
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {bedTersedia}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Pembersihan
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {bedPembersihan}
            </span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              Pemeliharaan
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {bedPemeliharaan}
            </span>
          </div>
        </div>
      </Card>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Fasilitas Kamar
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Manajemen Bed &amp; Alokasi Kamar
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pantau ketersediaan tempat tidur bangsal secara real-time, selesaikan masa inap pasien, serta lakukan alokasi kamar baru.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Link
              href="/bed-management"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs inline-flex items-center gap-1.5 transition"
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
        </Card>

        <Card className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Antrean &amp; Rujukan
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Antrean Rawat Inap &amp; Rujukan RS
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kelola antrean pasien kondisi stabil berdasarkan urutan FIFO dan terbitkan surat rujukan SPGDT ke rumah sakit jejaring.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Link
              href="/sistem-antrian/daftar-tunggu"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs inline-flex items-center gap-1.5 transition"
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
        </Card>

        <Card className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              RME &amp; Keuangan
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Rekap Layanan &amp; Manajemen Billing
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verifikasi rekap tindakan medis RME, hitung otomatis tarif kamar dan tindakan, hingga penerbitan serta pelunasan invoice kasir.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Link
              href="/rekap-layanan"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs inline-flex items-center gap-1.5 transition"
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
        </Card>
      </div>
    </div>
  );
}
