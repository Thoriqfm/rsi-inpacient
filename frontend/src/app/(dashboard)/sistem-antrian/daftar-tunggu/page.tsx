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

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Sistem Antrean (Daftar Tunggu)" />;
  }

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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a2e28] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-teal-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#00b89f]" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Page Header (Canonical Clinical Style) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f] mb-1">
            SISTEM ANTREAN
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1e1e1e] tracking-tight leading-tight">
            Daftar Tunggu Pasien Rawat Inap
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
            Kelola antrean pasien kondisi stabil berbasis urutan kedatangan (FIFO) secara real-time saat kamar ranap penuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00b89f] ${loading ? "animate-spin" : ""}`} />
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
            <span>Tambah Antrean</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <AntrianTabs
        waitingCount={waitingList.length}
        referralCount={referralCount}
        monitoringCount={queues.length + referralCount}
      />

      {/* 4 KPI Stat Cards (Canonical Clinical Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Antrean Menunggu */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
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

        {/* Card 2: Prioritas #1 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-[10px] bg-[#e6f4ef] text-[#00b89f] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1e1e1e] truncate">Prioritas #1</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5 truncate">
                {firstInLine ? `${firstInLine.nama_pasien} (${firstInLine.kelas_perawatan})` : "Antrean Kosong"}
              </div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#00b89f] shrink-0 ml-2">
            {firstInLine ? firstInLine.no_antrean_formatted : "-"}
          </span>
        </div>

        {/* Card 3: Dialokasikan */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
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

        {/* Card 4: Bed Tersedia */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
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

      {/* Slim Clean FIFO Info Strip */}
      {firstInLine && (
        <div className="bg-[#f8faf9] border border-[#e9ebf0] rounded-[10px] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#4b5563]">
            <Info className="w-4 h-4 text-[#00b89f] shrink-0" />
            <span>
              Urutan alokasi kamar berikutnya:{" "}
              <strong className="text-[#1e1e1e]">
                {firstInLine.no_antrean_formatted} — {firstInLine.nama_pasien} ({firstInLine.kelas_perawatan})
              </strong>
              . Pendaftaran: {firstInLine.waktu_masuk_relative}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedQueue(firstInLine)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-[6px] bg-[#00b89f] hover:bg-[#00a28c] text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <span>Alokasikan Antrean #1</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Antrean (#01), Nama Pasien, No. RM, atau Diagnosa..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#f3f4f6] p-1 rounded-[8px]">
            {(["Semua", "Menunggu", "Dialokasikan", "Batal"] as const).map(
              (st) => {
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? "bg-white text-[#1e1e1e] font-semibold shadow-2xs"
                        : "text-[#666666] hover:text-[#1e1e1e]"
                    }`}
                  >
                    {st}
                  </button>
                );
              }
            )}
          </div>

          {/* Kelas Dropdown */}
          <div className="flex items-center gap-1.5 border border-[#e2e8f0] rounded-[8px] px-3 py-1.5 bg-white">
            <Filter className="w-3.5 h-3.5 text-[#8c8c8c]" />
            <select
              value={kelasFilter}
              onChange={(e) =>
                setKelasFilter(e.target.value as "Semua" | KelasPerawatan)
              }
              className="text-xs text-[#4b5563] bg-transparent focus:outline-none cursor-pointer"
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

      {/* FIFO Queue Table (Canonical Style) */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1e1e1e]">
              Tabel Urutan Antrean Rawat Inap (FIFO)
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Menampilkan {filteredQueues.length} dari {queues.length} data antrean terdaftar
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#016b46] bg-[#e6f4ef] border border-[#cbe7dd] px-2.5 py-0.5 rounded-full">
            Prinsip FIFO: Waktu Masuk Terawal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f2f5] text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                <th className="py-3 px-4 w-28">NO. ANTREAN</th>
                <th className="py-3 px-4">DATA PASIEN</th>
                <th className="py-3 px-4">DIAGNOSA & DPJP</th>
                <th className="py-3 px-3">KELAS DIMINTA</th>
                <th className="py-3 px-4">WAKTU MASUK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] text-xs">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8c8c8c]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Clock className="w-8 h-8 text-[#cbd5e1] mx-auto" />
                      <p className="font-semibold text-[#1e1e1e]">
                        Tidak ada data antrean yang cocok
                      </p>
                      <p className="text-xs text-[#8c8c8c]">
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
                      className={`hover:bg-slate-50/70 transition ${
                        isPriorityOne ? "bg-[#f0fdf9]" : ""
                      }`}
                    >
                      {/* FIFO Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-[6px] font-mono text-xs font-bold ${
                              isPriorityOne
                                ? "bg-[#0a2e28] text-[#00b89f]"
                                : q.status === "Dialokasikan"
                                ? "bg-[#e6f4ef] text-[#016b46]"
                                : q.status === "Batal"
                                ? "bg-[#f3f4f6] text-[#8c8c8c]"
                                : "bg-[#fef3e9] text-[#b45309]"
                            }`}
                          >
                            {q.no_antrean_formatted}
                          </span>
                          {isPriorityOne && (
                            <span className="text-[10px] font-bold text-[#00b89f] bg-[#e7faf7] px-1.5 py-0.5 rounded">
                              Top #1
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1e1e1e]">
                          {q.nama_pasien}
                        </div>
                        <div className="text-[11px] text-[#666666] font-mono mt-0.5">
                          {q.no_rm} • {q.jenis_kelamin_usia}
                        </div>
                      </td>

                      {/* Diagnosa & DPJP */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-medium text-[#1e1e1e] line-clamp-1">
                          {q.diagnosa}
                        </div>
                        <div className="text-[11px] text-[#666666] mt-0.5">
                          {q.dokter_dpjp}
                        </div>
                      </td>

                      {/* Kelas */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            q.kelas_perawatan === "VIP"
                              ? "bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]"
                              : q.kelas_perawatan === "Kelas 1"
                              ? "bg-[#e7faf7] text-[#0fa18f] border-[#b6eee7]"
                              : q.kelas_perawatan === "Kelas 2"
                              ? "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]"
                              : "bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]"
                          }`}
                        >
                          {q.kelas_perawatan}
                        </span>
                      </td>

                      {/* Waktu Masuk */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs text-[#1e1e1e]">
                          {q.waktu_masuk_formatted}
                        </div>
                        <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                          {q.waktu_masuk_relative}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {q.status === "Menunggu" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                            Menunggu
                          </span>
                        )}
                        {q.status === "Dialokasikan" && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                              Dialokasikan
                            </span>
                            {q.alokasi_bed && (
                              <div className="text-[10px] text-[#016b46] font-mono mt-0.5">
                                {q.alokasi_bed.no_bed}
                              </div>
                            )}
                          </div>
                        )}
                        {q.status === "Batal" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
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
                                className="px-3 py-1.5 rounded-[6px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium transition cursor-pointer"
                              >
                                Alokasikan
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickCancel(q)}
                                title="Batalkan Antrean"
                                className="p-1.5 rounded-[6px] border border-[#fecaca] text-[#dc2626] hover:bg-rose-50 transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedQueue(q)}
                              className="px-3 py-1.5 rounded-[6px] border border-[#e2e8f0] hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium transition cursor-pointer"
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
