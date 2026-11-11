"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bed,
  ArrowUpRight,
  Users,
  ShieldCheck,
  RefreshCw,
  Eye,
  ArrowRight,
  Info,
} from "lucide-react";
import { BedItem, KelasPerawatan, QueueItem, QueueStatus } from "@/types";
import {
  cancelQueueApi,
  fetchAvailableBedsApi,
  fetchQueuesApi,
  fetchReferralsApi,
} from "@/lib/api-client";
import { AntrianTabs } from "@/components/sistem-antrian/AntrianTabs";
import { TambahAntreanModal } from "@/components/sistem-antrian/TambahAntreanModal";
import { DetailAntreanModal } from "@/components/sistem-antrian/DetailAntreanModal";

export default function DaftarTungguPage() {
  const { user } = useAuth();

  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [availableBeds, setAvailableBeds] = useState<BedItem[]>([]);
  const [referralCount, setReferralCount] = useState<number>(2);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Semua" | QueueStatus>(
    "Semua"
  );
  const [kelasFilter, setKelasFilter] = useState<"Semua" | KelasPerawatan>(
    "Semua"
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<QueueItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, bRes, rRes] = await Promise.all([
        fetchQueuesApi(),
        fetchAvailableBedsApi(),
        fetchReferralsApi(),
      ]);
      // Sort strictly by FIFO (no_antrean asc)
      const sorted = [...qRes.items].sort((a, b) => a.no_antrean - b.no_antrean);
      setQueues(sorted);
      setAvailableBeds(bRes.items);
      setReferralCount(rRes.items.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const waitingList = useMemo(
    () =>
      queues
        .filter((q) => q.status === "Menunggu")
        .sort((a, b) => a.no_antrean - b.no_antrean),
    [queues]
  );

  const firstInLine = waitingList[0] || null;
  const allocatedCount = useMemo(
    () => queues.filter((q) => q.status === "Dialokasikan").length,
    [queues]
  );

  const filteredQueues = useMemo(() => {
    return queues.filter((q) => {
      if (statusFilter !== "Semua" && q.status !== statusFilter) return false;
      if (kelasFilter !== "Semua" && q.kelas_perawatan !== kelasFilter)
        return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = q.nama_pasien.toLowerCase().includes(query);
        const matchRm = q.no_rm.toLowerCase().includes(query);
        const matchNo = q.no_antrean_formatted.toLowerCase().includes(query);
        const matchDiag = q.diagnosa.toLowerCase().includes(query);
        if (!matchName && !matchRm && !matchNo && !matchDiag) return false;
      }
      return true;
    });
  }, [queues, statusFilter, kelasFilter, searchQuery]);

  const handleQuickCancel = async (item: QueueItem) => {
    if (
      !confirm(
        `Batalkan antrean ${item.no_antrean_formatted} atas nama ${item.nama_pasien}?`
      )
    ) {
      return;
    }
    try {
      await cancelQueueApi(item.id_antrean);
      showToast(
        `Antrean ${item.no_antrean_formatted} (${item.nama_pasien}) berhasil dibatalkan.`
      );
      loadData();
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Gagal membatalkan antrean."
      );
    }
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Sistem Antrean (Daftar Tunggu)" />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            SISTEM ANTREAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Daftar Tunggu Rawat Inap (FIFO)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Kelola antrean pasien kondisi stabil berbasis urutan kedatangan (First-In, First-Out) saat kapasitas kamar penuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>

          <Link
            href="/sistem-antrian/rujukan-pasien"
            className="px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-rose-700 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Pasien Darurat? Buat Rujukan</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Tambah Antrean</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <AntrianTabs
        waitingCount={waitingList.length}
        referralCount={referralCount}
        monitoringCount={queues.length + referralCount}
      />

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Antrean Menunggu */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Menunggu (FIFO)</div>
              <div className="text-[11px] text-slate-500">Kondisi stabil</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {waitingList.length}
          </span>
        </div>

        {/* Card 2: Prioritas #1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">Prioritas #1</div>
              <div className="text-[11px] text-slate-500 truncate">
                {firstInLine ? `${firstInLine.nama_pasien} (${firstInLine.kelas_perawatan})` : "Antrean Kosong"}
              </div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-emerald-700 shrink-0 ml-2">
            {firstInLine ? firstInLine.no_antrean_formatted : "-"}
          </span>
        </div>

        {/* Card 3: Dialokasikan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Dialokasikan</div>
              <div className="text-[11px] text-slate-500">Masuk kamar ranap</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {allocatedCount}
          </span>
        </div>

        {/* Card 4: Bed Tersedia */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Bed className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Bed Tersedia</div>
              <div className="text-[11px] text-slate-500">Siap alokasi</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {availableBeds.length}
          </span>
        </div>
      </div>

      {/* Slim Clean FIFO Info Strip */}
      {firstInLine && (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Urutan alokasi kamar berikutnya:{" "}
              <strong className="text-slate-900">
                {firstInLine.no_antrean_formatted} — {firstInLine.nama_pasien} ({firstInLine.kelas_perawatan})
              </strong>
              . Pendaftaran: {firstInLine.waktu_masuk_relative}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedQueue(firstInLine)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <span>Alokasikan Antrean #1</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Antrean (#01), Nama Pasien, No. RM, atau Diagnosa..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(["Semua", "Menunggu", "Dialokasikan", "Batal"] as const).map(
              (st) => {
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 font-semibold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st}
                  </button>
                );
              }
            )}
          </div>

          {/* Kelas Dropdown */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-white shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={kelasFilter}
              onChange={(e) =>
                setKelasFilter(e.target.value as "Semua" | KelasPerawatan)
              }
              className="text-xs text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              <option value="VIP">Kelas VIP</option>
              <option value="Kelas 1">Kelas 1</option>
              <option value="Kelas 2">Kelas 2</option>
              <option value="Kelas 3">Kelas 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* FIFO Queue Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tabel Urutan Antrean Rawat Inap (FIFO)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredQueues.length} dari {queues.length} data antrean terdaftar
            </p>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Prinsip FIFO: Waktu Masuk Terawal
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-28">NO. ANTREAN</th>
                <th className="py-3 px-4">DATA PASIEN</th>
                <th className="py-3 px-4">DIAGNOSA & DPJP</th>
                <th className="py-3 px-3">KELAS DIMINTA</th>
                <th className="py-3 px-4">WAKTU MASUK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-800">
                        Tidak ada data antrean yang cocok
                      </p>
                      <p className="text-xs text-slate-500">
                        Coba sesuaikan kata kunci pencarian atau filter status antrean.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQueues.map((q) => {
                  const isPriorityOne =
                    firstInLine && firstInLine.id_antrean === q.id_antrean;

                  return (
                    <tr
                      key={q.id_antrean}
                      className={`hover:bg-slate-50/60 transition ${
                        isPriorityOne ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      {/* FIFO Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold ${
                              isPriorityOne
                                ? "bg-emerald-900 text-emerald-300"
                                : q.status === "Dialokasikan"
                                ? "bg-emerald-50 text-emerald-700"
                                : q.status === "Batal"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {q.no_antrean_formatted}
                          </span>
                          {isPriorityOne && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Top #1
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {q.nama_pasien}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {q.no_rm} • {q.jenis_kelamin_usia}
                        </div>
                      </td>

                      {/* Diagnosa & DPJP */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {q.diagnosa}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {q.dokter_dpjp}
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            q.kelas_perawatan === "VIP"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : q.kelas_perawatan === "Kelas 1"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : q.kelas_perawatan === "Kelas 2"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {q.kelas_perawatan}
                        </span>
                      </td>

                      {/* Waktu Masuk */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-800">
                          {q.waktu_masuk_formatted}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {q.waktu_masuk_relative}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {q.status === "Menunggu" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Menunggu
                          </span>
                        )}
                        {q.status === "Dialokasikan" && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Dialokasikan
                            </span>
                            {q.alokasi_bed && (
                              <div className="text-[10px] text-emerald-800 font-mono mt-0.5 font-semibold">
                                {q.alokasi_bed.no_bed}
                              </div>
                            )}
                          </div>
                        )}
                        {q.status === "Batal" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Batal
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {q.status === "Menunggu" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedQueue(q)}
                                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition cursor-pointer"
                              >
                                Alokasikan
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickCancel(q)}
                                title="Batalkan Antrean"
                                className="p-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedQueue(q)}
                              className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                            >
                              Detail
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-3.5 space-y-3 divide-y divide-slate-100">
          {filteredQueues.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Tidak ada data antrean yang sesuai.
            </div>
          ) : (
            filteredQueues.map((q) => {
              const isPriorityOne = firstInLine && firstInLine.id_antrean === q.id_antrean;
              return (
                <div
                  key={q.id_antrean}
                  className={`pt-3 first:pt-0 bg-white rounded-xl border p-4 space-y-2.5 shadow-2xs ${
                    isPriorityOne ? "border-emerald-300 ring-1 ring-emerald-500/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                        {q.no_antrean_formatted}
                      </span>
                      {isPriorityOne && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Top #1
                        </span>
                      )}
                    </div>
                    {q.status === "Menunggu" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Menunggu
                      </span>
                    )}
                    {q.status === "Dialokasikan" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Dialokasikan
                      </span>
                    )}
                    {q.status === "Batal" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Batal
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {q.nama_pasien}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {q.no_rm} • {q.jenis_kelamin_usia} • {q.kelas_perawatan}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <div><span className="font-medium text-slate-700">Diagnosa:</span> {q.diagnosa}</div>
                    <div className="text-[11px] text-slate-500">DPJP: {q.dokter_dpjp}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {q.status === "Menunggu" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedQueue(q)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium text-center transition cursor-pointer"
                        >
                          Alokasikan Bed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickCancel(q)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Batalkan Antrean"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedQueue(q)}
                        className="w-full py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium text-center transition cursor-pointer"
                      >
                        Lihat Detail
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <TambahAntreanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingQueues={queues}
        onSuccess={(created) => {
          showToast(
            `Pasien ${created.nama_pasien} berhasil ditambahkan ke Daftar Tunggu (${created.no_antrean_formatted}).`
          );
          loadData();
        }}
      />

      <DetailAntreanModal
        item={selectedQueue}
        availableBeds={availableBeds}
        onClose={() => setSelectedQueue(null)}
        onUpdated={() => {
          showToast("Status antrean berhasil diperbarui.");
          loadData();
        }}
      />
    </div>
  );
}
