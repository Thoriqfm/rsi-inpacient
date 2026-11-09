"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity,
  Search,
  Clock,
  Ambulance,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bed,
  Building2,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { BedItem, MonitoringItem } from "@/types";
import {
  fetchAvailableBedsApi,
  fetchMonitoringApi,
} from "@/lib/api-client";
import { AntrianTabs } from "@/components/sistem-antrian/AntrianTabs";
import { DetailPenangananModal } from "@/components/sistem-antrian/DetailPenangananModal";

export default function PemantauanStatusPage() {
  const { user } = useAuth();

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pemantauan Status Penanganan" />;
  }

  const [items, setItems] = useState<MonitoringItem[]>([]);
  const [availableBeds, setAvailableBeds] = useState<BedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [jalurFilter, setJalurFilter] = useState<
    "Semua" | "Daftar Tunggu" | "Rujukan RS Lain"
  >("Semua");
  const [kondisiFilter, setKondisiFilter] = useState<
    "Semua" | "Stabil" | "Darurat"
  >("Semua");

  const [selectedItem, setSelectedItem] = useState<MonitoringItem | null>(
    null
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, bRes] = await Promise.all([
        fetchMonitoringApi(),
        fetchAvailableBedsApi(),
      ]);
      setItems(mRes.items);
      setAvailableBeds(bRes.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const waitingQueueCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.jalur_penanganan === "Daftar Tunggu" &&
          i.antrean?.status === "Menunggu"
      ).length,
    [items]
  );

  const referralTotalCount = useMemo(
    () => items.filter((i) => i.jalur_penanganan === "Rujukan RS Lain").length,
    [items]
  );

  const completedCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.antrean?.status === "Dialokasikan" ||
          i.rujukan?.status === "Diterima"
      ).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (jalurFilter !== "Semua" && item.jalur_penanganan !== jalurFilter)
        return false;
      if (kondisiFilter !== "Semua" && item.kondisi_pasien !== kondisiFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.nama_pasien.toLowerCase().includes(q);
        const matchRm = item.no_rm.toLowerCase().includes(q);
        const matchDiag = item.diagnosa.toLowerCase().includes(q);
        const matchRef =
          item.rujukan?.no_rujukan?.toLowerCase().includes(q) || false;
        const matchRs =
          item.rujukan?.rumah_sakit?.nama_rs?.toLowerCase().includes(q) ||
          false;
        if (!matchName && !matchRm && !matchDiag && !matchRef && !matchRs)
          return false;
      }
      return true;
    });
  }, [items, jalurFilter, kondisiFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a2e28] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-teal-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#00b89f]" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Page Header (Canonical Style) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f] mb-1">
            SISTEM ANTREAN
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1e1e1e] tracking-tight leading-tight">
            Pemantauan Status Penanganan Pasien
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1.5 max-w-3xl leading-relaxed">
            Lacak progres terintegrasi pasien rawat inap baik di jalur antrean FIFO maupun rujukan SPGDT ke rumah sakit jejaring.
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00b89f] ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Status</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <AntrianTabs
        waitingCount={waitingQueueCount}
        referralCount={referralTotalCount}
        monitoringCount={items.length}
      />

      {/* 4 KPI Summary Cards (Canonical Clinical Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e6f4ef] text-[#00b89f] flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Total Dipantau</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Antrean & rujukan</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {items.length}
          </span>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#fef3e9] text-[#d97706] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Antrean Menunggu</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Kondisi stabil</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {waitingQueueCount}
          </span>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#fdf0f0] text-[#dc2626] flex items-center justify-center shrink-0">
              <Ambulance className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Rujukan Eksternal</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Jejaring SPGDT</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {referralTotalCount}
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e7faf7] text-[#0fa18f] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Selesai Tertangani</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Dialokasi / diterima</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {completedCount}
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
            placeholder="Cari Nama Pasien, No. RM, No. Surat Rujukan, atau RS Tujuan..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Jalur Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#f3f4f6] p-1 rounded-[8px]">
            {(
              ["Semua", "Daftar Tunggu", "Rujukan RS Lain"] as const
            ).map((j) => {
              const isActive = jalurFilter === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => setJalurFilter(j)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-white text-[#1e1e1e] font-semibold shadow-2xs"
                      : "text-[#666666] hover:text-[#1e1e1e]"
                  }`}
                >
                  {j}
                </button>
              );
            })}
          </div>

          {/* Kondisi Filter Dropdown */}
          <select
            value={kondisiFilter}
            onChange={(e) =>
              setKondisiFilter(
                e.target.value as "Semua" | "Stabil" | "Darurat"
              )
            }
            className="px-3 py-2 text-xs text-[#4b5563] rounded-[8px] border border-[#e2e8f0] bg-white focus:outline-none cursor-pointer"
          >
            <option value="Semua">Semua Kondisi</option>
            <option value="Stabil">Kondisi Stabil</option>
            <option value="Darurat">Kondisi Darurat</option>
          </select>
        </div>
      </div>

      {/* Monitoring Consolidated Table */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1e1e1e]">
              Tabel Konsolidasi Status Penanganan Pasien
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Menampilkan {filteredItems.length} dari {items.length} pasien dalam pantauan
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#016b46] bg-[#e6f4ef] border border-[#cbe7dd] px-2.5 py-0.5 rounded-full">
            Sinkron Real-time
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f2f5] text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                <th className="py-3 px-4">PASIEN & NO. RM</th>
                <th className="py-3 px-4">KONDISI & DIAGNOSA</th>
                <th className="py-3 px-3">JALUR</th>
                <th className="py-3 px-4">DETAIL ALOKASI / RUJUKAN</th>
                <th className="py-3 px-4">STATUS TERKINI</th>
                <th className="py-3 px-4">WAKTU & PETUGAS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8c8c8c]">
                    Tidak ada data pemantauan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isQueue = item.jalur_penanganan === "Daftar Tunggu";
                  const qStatus = item.antrean?.status;
                  const rStatus = item.rujukan?.status;

                  return (
                    <tr
                      key={`${item.jalur_penanganan}-${item.id_pasien}-${
                        item.antrean?.id_antrean || item.rujukan?.id_surat || 0
                      }`}
                      className="hover:bg-slate-50/70 transition"
                    >
                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1e1e1e]">
                          {item.nama_pasien}
                        </div>
                        <div className="text-[11px] text-[#666666] font-mono mt-0.5">
                          {item.no_rm} • {item.jenis_kelamin_usia}
                        </div>
                      </td>

                      {/* Kondisi & Diagnosa */}
                      <td className="py-3.5 px-4 max-w-[210px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              item.kondisi_pasien === "Darurat"
                                ? "bg-[#fdf0f0] text-[#dc2626] border-[#fecaca]"
                                : "bg-[#e6f4ef] text-[#016b46] border-[#cbe7dd]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.kondisi_pasien === "Darurat"
                                  ? "bg-[#dc2626]"
                                  : "bg-[#059669]"
                              }`}
                            />
                            {item.kondisi_pasien}
                          </span>
                        </div>
                        <div className="font-medium text-[#1e1e1e] line-clamp-1">
                          {item.diagnosa}
                        </div>
                        <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                          {item.dokter_dpjp}
                        </div>
                      </td>

                      {/* Jalur */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isQueue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7faf7] text-[#0fa18f] border border-[#b6eee7] text-[11px] font-medium">
                            <Clock className="w-3 h-3 text-[#0fa18f]" />
                            Daftar Tunggu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fdf0f0] text-[#dc2626] border border-[#fecaca] text-[11px] font-medium">
                            <Ambulance className="w-3 h-3 text-[#dc2626]" />
                            Rujukan RS
                          </span>
                        )}
                      </td>

                      {/* Detail Antrean / Rujukan */}
                      <td className="py-3.5 px-4">
                        {isQueue && item.antrean ? (
                          <div>
                            <div className="font-mono font-medium text-[#1e1e1e]">
                              Antrean #{String(item.antrean.no_antrean).padStart(2, "0")}{" "}
                              <span className="text-[#666666] font-normal">({item.kelas_perawatan})</span>
                            </div>
                            {item.antrean.alokasi?.bed ? (
                              <div className="text-[11px] font-medium text-[#016b46] flex items-center gap-1 mt-0.5">
                                <Bed className="w-3 h-3 text-[#00b89f]" />
                                {item.antrean.alokasi.bed.no_bed} ({item.antrean.alokasi.bed.nama_bangsal})
                              </div>
                            ) : (
                              <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                                Menunggu bed kosong
                              </div>
                            )}
                          </div>
                        ) : item.rujukan ? (
                          <div>
                            <div className="font-mono font-semibold text-[#1e1e1e]">
                              {item.rujukan.no_rujukan}
                            </div>
                            <div className="text-[11px] text-[#666666] flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-[#00b89f]" />
                              {item.rujukan.rumah_sakit?.nama_rs || "RS Rujukan Tujuan"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#8c8c8c]">-</span>
                        )}
                      </td>

                      {/* Status Terkini */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isQueue ? (
                          qStatus === "Dialokasikan" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                              Dialokasikan
                            </span>
                          ) : qStatus === "Batal" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
                              Batal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                              Menunggu Bed
                            </span>
                          )
                        ) : rStatus === "Diterima" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                            Diterima RS
                          </span>
                        ) : rStatus === "Dikirim" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                            Dikirim
                          </span>
                        ) : rStatus === "Batal" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
                            Batal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                            Diterbitkan
                          </span>
                        )}
                      </td>

                      {/* Waktu & Petugas */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs text-[#1e1e1e]">
                          {item.waktu_terakhir}
                        </div>
                        <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                          PJ: {item.petugas_pj}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1.5 rounded-[6px] border border-[#e2e8f0] hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#00b89f]" />
                          <span>Kelola</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail & Update Status */}
      <DetailPenangananModal
        item={selectedItem}
        availableBeds={availableBeds}
        onClose={() => setSelectedItem(null)}
        onUpdated={(msg) => {
          showToast(msg);
          loadData();
        }}
      />
    </div>
  );
}
