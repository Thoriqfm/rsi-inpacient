"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bed,
  Users,
  Activity,
  FileText,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  Siren,
  Sparkles,
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
      const [bList, qList, hRes, billRes] = await Promise.all([
        fetchBedsApi(),
        fetchQueuesApi(),
        fetchHistoriesApi(),
        fetchBillingsApi(),
      ]);
      setBeds(bList.items);
      setQueues(qList.items);
      setHistories(hRes.items);
      setBillings(billRes.items);
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d332f] via-[#102d2a] to-[#0a2623] text-white p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-teal-400/30 text-[#13c9b3] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIMRS Rawat Inap Terpadu • Kelompok 5</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {user?.nama_petugas || "Petugas Medis & Administrasi"}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              Pusat kendali operasional Rawat Inap Rumah Sakit Islam mencakup{" "}
              <strong>Manajemen Tempat Tidur & Alokasi Kamar</strong>,{" "}
              <strong>Antrean Pasien & Rujukan Darurat</strong>,{" "}
              <strong>Rekapitulasi Layanan & Tindakan</strong>, serta{" "}
              <strong>Perhitungan Biaya & Pengelolaan Tagihan</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/bed-management"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <Bed className="w-4 h-4 text-[#13c9b3]" />
              <span>Monitor Kamar</span>
            </Link>
            <Link
              href="/rekap-layanan"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-[#13c9b3]" />
              <span>Rekap Layanan</span>
            </Link>
            <Link
              href="/pembayaran"
              className="px-5 py-2.5 rounded-xl bg-[#13c9b3] hover:bg-[#10b39f] text-[#082320] font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition"
            >
              <CreditCard className="w-4 h-4 stroke-[2.5]" />
              <span>Pembayaran & Tagihan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ketersediaan Bed
            </span>
            <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading ? "..." : `${bedTersedia} Tersedia`}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>Total: {beds.length} Bed</span>
            <span className="font-bold text-teal-700">
              Terisi: {bedTerisi} • Pembersihan: {bedPembersihan}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Antrean & Pasien Darurat
            </span>
            <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading ? "..." : `${waitingQueues.length} Menunggu`}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {emergencyQueues.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                <Siren className="w-3.5 h-3.5" />
                {emergencyQueues.length} Prioritas IGD/Darurat
              </span>
            ) : (
              <span>Urutan FIFO Normal Terkendali</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rekap Layanan Pasien
            </span>
            <span className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading ? "..." : `${histories.length} Dokumen`}
          </div>
          <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{siapBillingCount} Berstatus &quot;Siap Billing&quot;</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Tagihan Aktif
            </span>
            <span className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {loading ? "..." : formatRupiah(totalRevenue)}
          </div>
          <div className="text-xs text-slate-500">
            Dari {billings.filter((b) => b.status !== "Batal").length} invoice
            aktif
          </div>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-bold text-[11px]">
              FASILITAS KAMAR & TEMPAT TIDUR
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              Manajemen Tempat Tidur & Alokasi Kamar
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pantau ketersediaan kamar secara real-time, perbarui status tempat
              tidur (`Tersedia`, `Terisi`, `Pembersihan`), serta alokasikan
              kamar dan dokter DPJP untuk pasien rawat inap.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Link
              href="/bed-management"
              className="px-4 py-2 rounded-xl bg-[#0d332f] text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Ketersediaan Bed</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#13c9b3]" />
            </Link>
            <Link
              href="/bed-management/alokasi"
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
            >
              Alokasi Kamar
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-[11px]">
              LAYANAN ANTREAN & RUJUKAN
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              Antrean Rawat Inap (FIFO) & Rujukan Darurat
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kelola daftar tunggu pasien dengan algoritma First-In First-Out
              ketika kapasitas bed penuh, atau lakukan bypass otomatis untuk
              pasien rujukan IGD/Darurat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Link
              href="/sistem-antrian/daftar-tunggu"
              className="px-4 py-2 rounded-xl bg-[#0d332f] text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Daftar Antrean FIFO</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#13c9b3]" />
            </Link>
            <Link
              href="/sistem-antrian/rujukan-pasien"
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-xs"
            >
              + Rujukan Darurat
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px]">
              REKAPITULASI & BILLING
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              Rekap Tindakan Medis & Billing Tagihan
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Susun rekapitulasi tindakan pelayanan dari RME (`Draft` → `Proses
              Verifikasi` → `Siap Billing`), hitung rincian biaya berdasarkan
              master tarif, dan terbitkan invoice resmi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Link
              href="/rekap-layanan"
              className="px-4 py-2 rounded-xl bg-[#0d332f] text-white font-bold text-xs flex items-center gap-1.5"
            >
              <span>Rekap Layanan</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#13c9b3]" />
            </Link>
            <Link
              href="/pembayaran"
              className="px-3.5 py-2 rounded-xl bg-[#13c9b3] text-[#082320] font-extrabold text-xs"
            >
              Pembayaran & Tagihan
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Rekap & Billing Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Rekap Tindakan Terbaru</span>
              </h3>
              <p className="text-xs text-slate-500">
                Status kesiapan rekapitulasi tindakan menuju pembuatan tagihan
              </p>
            </div>
            <Link
              href="/rekap-layanan"
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          <div className="divide-y divide-slate-200/70 text-xs">
            {histories.slice(0, 4).map((h) => (
              <div
                key={h.id_rekap}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {h.nama_pasien}{" "}
                    <span className="font-mono text-[11px] text-teal-700">
                      ({h.kode_rekap})
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {h.jumlah_tindakan} Tindakan • {h.dokter_dpjp}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      h.status === "Siap Billing"
                        ? "bg-emerald-100 text-emerald-800"
                        : h.status === "Proses Verifikasi"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {h.status}
                  </span>
                  <Link
                    href={`/rekap-layanan/${h.id_rekap}`}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Invoice & Tagihan Terbaru</span>
              </h3>
              <p className="text-xs text-slate-500">
                Daftar tagihan rawat inap dan status pelunasannya
              </p>
            </div>
            <Link
              href="/pembayaran"
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          <div className="divide-y divide-slate-200/70 text-xs">
            {billings.slice(0, 4).map((b) => (
              <div
                key={b.id_tagihan}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {b.nama_pasien}{" "}
                    <span className="font-mono text-[11px] text-teal-700">
                      ({b.no_tagihan})
                    </span>
                  </div>
                  <div className="font-extrabold text-slate-800">
                    {formatRupiah(b.total_biaya_num)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      b.status === "Lunas"
                        ? "bg-emerald-100 text-emerald-800"
                        : b.status === "Belum Dibayar"
                        ? "bg-amber-100 text-amber-800"
                        : b.status === "Draft"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {b.status}
                  </span>
                  <Link
                    href={`/pembayaran/${b.id_tagihan}`}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Buka
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
