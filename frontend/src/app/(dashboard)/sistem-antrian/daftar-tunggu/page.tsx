"use client";

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

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d332f] text-white px-4 py-3 rounded-xl shadow-xl border border-teal-500/30 flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#13c9b3] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <AntrianTabs
        waitingCount={waitingList.length}
        referralCount={referralCount}
        monitoringCount={queues.length + referralCount}
      />

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Antrean First-In First-Out (FIFO) Pasien Rawat Inap</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Daftar Tunggu Rawat Inap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola antrean pasien kondisi stabil saat kelas perawatan penuh atau sedang dalam proses pembersihan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>

          <Link
            href="/sistem-antrian/rujukan-pasien"
            className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pasien Darurat? Buat Rujukan</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0d332f] hover:bg-[#134b45] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-950/15 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#13c9b3]" />
            <span>Tambah ke Daftar Tunggu</span>
          </button>
        </div>
      </div>

      {/* Clinical Rule & Capacity Alert Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-teal-50/50 border border-amber-200/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Aturan Prioritas Antrean FIFO & Keselamatan Pasien
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Pasien dengan kondisi <strong>Stabil</strong> otomatis diurutkan berdasarkan waktu pendaftaran (<em>First-In First-Out</em>). Saat kamar tersedia, prioritas alokasi diberikan kepada antrean paling awal:{" "}
              {firstInLine ? (
                <strong className="text-[#0d332f]">
                  {firstInLine.no_antrean_formatted} — {firstInLine.nama_pasien} ({firstInLine.kelas_perawatan})
                </strong>
              ) : (
                <span>Tidak ada antrean aktif</span>
              )}
              .
            </p>
          </div>
        </div>

        {firstInLine && (
          <button
            type="button"
            onClick={() => setSelectedQueue(firstInLine)}
            className="px-4 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition"
          >
            <span>Proses Prioritas #1</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Antrean Menunggu (FIFO)
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {waitingList.length}{" "}
              <span className="text-xs font-semibold text-amber-600">
                Pasien
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Kondisi stabil menunggu bed
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Prioritas Berikutnya
            </p>
            <p className="text-lg font-black text-[#0d332f] mt-1 truncate max-w-[170px]">
              {firstInLine
                ? `${firstInLine.no_antrean_formatted} • ${firstInLine.nama_pasien}`
                : "Antrean Kosong"}
            </p>
            <p className="text-[11px] text-teal-700 font-medium mt-1">
              {firstInLine
                ? `Hak Kelas: ${firstInLine.kelas_perawatan}`
                : "Semua pasien terlayani"}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Selesai Dialokasikan
            </p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {allocatedCount}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Pasien
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Telah masuk kamar rawat inap
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Bed Tersedia Saat Ini
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {availableBeds.length}{" "}
              <span className="text-xs font-semibold text-slate-500">Bed</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Siap dialokasikan ke antrean
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
            <Bed className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Antrean (#01), Nama Pasien, No. RM, atau Diagnosa..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(["Semua", "Menunggu", "Dialokasikan", "Batal"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === st
                      ? "bg-white text-[#0d332f] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={kelasFilter}
              onChange={(e) =>
                setKelasFilter(e.target.value as "Semua" | KelasPerawatan)
              }
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
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

      {/* FIFO Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tabel Urutan Daftar Tunggu Rawat Inap (FIFO)
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredQueues.length} dari {queues.length} data antrean
            </p>
          </div>
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
            Diurutkan: Waktu Masuk Terawal (FIFO)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">No. Urut FIFO</th>
                <th className="py-3.5 px-4">Data Pasien</th>
                <th className="py-3.5 px-4">Diagnosa & DPJP</th>
                <th className="py-3.5 px-4">Kelas Diminta</th>
                <th className="py-3.5 px-4">Waktu Masuk</th>
                <th className="py-3.5 px-4">Status Antrean</th>
                <th className="py-3.5 px-5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700">
                        Tidak ada data daftar tunggu yang cocok
                      </p>
                      <p className="text-xs text-slate-400">
                        Coba ubah filter pencarian atau tambahkan pasien stabil baru ke antrean.
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
                      className={`hover:bg-slate-50/80 transition ${
                        isPriorityOne ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* FIFO Number */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shadow-xs ${
                              isPriorityOne
                                ? "bg-[#0d332f] text-[#13c9b3] ring-2 ring-[#13c9b3]/40"
                                : q.status === "Dialokasikan"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : q.status === "Batal"
                                ? "bg-slate-100 text-slate-400"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {q.no_antrean_formatted}
                          </span>
                          <div>
                            {isPriorityOne ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                Prioritas #1
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Antrean #{q.no_antrean}
                              </span>
                            )}
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {q.estimasi_tunggu}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {q.nama_pasien}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {q.no_rm} • {q.jenis_kelamin_usia}
                        </div>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Kondisi: {q.kondisi_pasien}
                        </span>
                      </td>

                      {/* Diagnosa & DPJP */}
                      <td className="py-4 px-4 max-w-[240px]">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {q.diagnosa}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {q.dokter_dpjp} • {q.asal_instalasi}
                        </div>
                        {q.catatan_tunggu && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                            &ldquo;{q.catatan_tunggu}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* Kelas */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            q.kelas_perawatan === "VIP"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : q.kelas_perawatan === "Kelas 1"
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : q.kelas_perawatan === "Kelas 2"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {q.kelas_perawatan}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Dicatat: {q.dicatat_oleh}
                        </div>
                      </td>

                      {/* Waktu Masuk */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">
                          {q.waktu_masuk_formatted}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {q.waktu_masuk_relative}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {q.status === "Menunggu" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Menunggu Bed
                          </span>
                        )}
                        {q.status === "Dialokasikan" && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Dialokasikan
                            </span>
                            {q.alokasi_bed && (
                              <div className="text-[11px] font-semibold text-blue-800 mt-1">
                                {q.alokasi_bed.no_bed} ({q.alokasi_bed.nama_bangsal})
                              </div>
                            )}
                          </div>
                        )}
                        {q.status === "Batal" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Dibatalkan
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {q.status === "Menunggu" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedQueue(q)}
                                className="px-3 py-1.5 rounded-xl bg-[#0d332f] hover:bg-[#144943] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                              >
                                <Bed className="w-3.5 h-3.5 text-[#13c9b3]" />
                                <span>Alokasikan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickCancel(q)}
                                title="Batalkan Antrean"
                                className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedQueue(q)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Detail</span>
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
