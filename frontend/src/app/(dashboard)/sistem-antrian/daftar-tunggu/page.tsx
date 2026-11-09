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

      {/* Page Header (Canonical Style) */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f] mb-1">
            ANTREAN FIRST-IN FIRST-OUT (FIFO)
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1e1e1e] tracking-tight leading-tight">
            Daftar Tunggu Pasien Rawat Inap
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
            Kelola antrean pasien kondisi stabil saat kelas perawatan penuh atau sedang dalam proses sterilisasi/pembersihan tempat tidur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>

          <Link
            href="/sistem-antrian/rujukan-pasien"
            className="px-3.5 py-2 rounded-[8px] border border-[#fecaca] bg-[#fdf0f0] hover:bg-rose-100/60 text-[#dc2626] text-xs font-medium flex items-center gap-1.5 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>Pasien Darurat? Buat Rujukan</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah ke Antrean</span>
          </button>
        </div>
      </div>

      {/* Clinical Rule & Capacity Alert Banner (Canonical Style) */}
      <div className="rounded-[8px] bg-[#fef3e9] border border-[#fed7aa] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-white border border-[#fed7aa] flex items-center justify-center text-[#d97706] shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#b45309]">
              Aturan Prioritas Antrean FIFO & Keselamatan Pasien
            </h3>
            <p className="text-xs text-[#b45309]/90 mt-0.5 leading-relaxed">
              Pasien dengan kondisi <strong>Stabil</strong> otomatis diurutkan berdasarkan waktu pendaftaran (<em>First-In First-Out</em>). Saat kamar tersedia, prioritas alokasi diberikan kepada antrean paling awal:{" "}
              {firstInLine ? (
                <strong className="text-[#0a2e28] underline">
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
            className="px-4 py-2 rounded-[8px] bg-white border border-[#fed7aa] hover:bg-amber-50 text-[#b45309] text-xs font-medium flex items-center gap-1.5 shrink-0 shadow-2xs transition cursor-pointer"
          >
            <span>Proses Prioritas #1</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 KPI Summary Cards (Canonical Clinical Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#fef3e9] text-[#d97706] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Menunggu (FIFO)</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Kondisi stabil</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {waitingList.length}
          </span>
        </div>

        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e6f4ef] text-[#00b89f] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Prioritas #1</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5 truncate max-w-[130px]">
                {firstInLine ? firstInLine.nama_pasien : "Antrean Kosong"}
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-[#4b5563]">
            {firstInLine ? firstInLine.kelas_perawatan : "-"}
          </span>
        </div>

        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e7faf7] text-[#0fa18f] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Dialokasikan</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Masuk kamar ranap</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {allocatedCount}
          </span>
        </div>

        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e6f4ef] text-[#016b46] flex items-center justify-center shrink-0">
              <Bed className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Bed Tersedia</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Siap alokasi</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {availableBeds.length}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Antrean (#01), Nama Pasien, No. RM, atau Diagnosa..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-[8px] border border-[#e2e8f0] focus:outline-none focus:border-[#00b89f]"
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
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] overflow-hidden">
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
