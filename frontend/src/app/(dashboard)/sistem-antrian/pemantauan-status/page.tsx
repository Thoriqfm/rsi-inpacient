"use client";

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
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d332f] text-white px-4 py-3 rounded-xl shadow-xl border border-teal-500/30 flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#13c9b3] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <AntrianTabs
        waitingCount={waitingQueueCount}
        referralCount={referralTotalCount}
        monitoringCount={items.length}
      />

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-bold mb-2">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>
              UC-06 • Konsolidasi Pemantauan Daftar Tunggu & Rujukan Darurat
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pemantauan Status Penanganan Pasien
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lacak progres penanganan seluruh pasien baik yang berada di jalur Daftar Tunggu (FIFO) maupun Rujukan RS Lain secara terpadu.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="self-start lg:self-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Status Penanganan</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Total Pasien Dipantau
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {items.length}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Pasien
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Lintas antrean & rujukan
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Sedang Mengantre Bed
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {waitingQueueCount}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Pasien
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Jalur Daftar Tunggu (Stabil)
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Jalur Rujukan RS Lain
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {referralTotalCount}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Pasien
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Penanganan kondisi darurat
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
            <Ambulance className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Selesai Tertangani
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {completedCount}{" "}
              <span className="text-xs font-semibold text-slate-500">
                Pasien
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Masuk kamar / diterima RS tujuan
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
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
            placeholder="Cari Nama Pasien, No. RM, No. Surat Rujukan, atau RS Tujuan..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              ["Semua", "Daftar Tunggu", "Rujukan RS Lain"] as const
            ).map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setJalurFilter(j)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  jalurFilter === j
                    ? "bg-white text-[#0d332f] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {j}
              </button>
            ))}
          </div>

          <select
            value={kondisiFilter}
            onChange={(e) =>
              setKondisiFilter(
                e.target.value as "Semua" | "Stabil" | "Darurat"
              )
            }
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="Semua">Semua Kondisi</option>
            <option value="Stabil">Kondisi Stabil</option>
            <option value="Darurat">Kondisi Darurat</option>
          </select>
        </div>
      </div>

      {/* Monitoring Consolidated Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tabel Konsolidasi Status Penanganan Pasien
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredItems.length} dari {items.length} pasien yang dipantau
            </p>
          </div>
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
            Sinkronisasi Antrean & Rujukan Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Pasien & No. RM</th>
                <th className="py-3.5 px-4">Kondisi & Diagnosa</th>
                <th className="py-3.5 px-4">Jalur Penanganan</th>
                <th className="py-3.5 px-4">Detail Antrean / Rujukan</th>
                <th className="py-3.5 px-4">Status Terkini</th>
                <th className="py-3.5 px-4">Waktu & Petugas</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada data pemantauan yang sesuai filter pencarian.
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
                      className="hover:bg-slate-50/80 transition"
                    >
                      {/* Patient */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.nama_pasien}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.no_rm} • {item.jenis_kelamin_usia}
                        </div>
                      </td>

                      {/* Kondisi & Diagnosa */}
                      <td className="py-4 px-4 max-w-[230px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1 ${
                            item.kondisi_pasien === "Darurat"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.kondisi_pasien === "Darurat"
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          {item.kondisi_pasien}
                        </span>
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {item.diagnosa}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.dokter_dpjp}
                        </div>
                      </td>

                      {/* Jalur */}
                      <td className="py-4 px-4">
                        {isQueue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            Daftar Tunggu (FIFO)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                            <Ambulance className="w-3.5 h-3.5 text-rose-600" />
                            Rujukan RS Lain
                          </span>
                        )}
                      </td>

                      {/* Detail Antrean / Rujukan */}
                      <td className="py-4 px-4">
                        {isQueue && item.antrean ? (
                          <div>
                            <div className="font-bold text-slate-900">
                              Antrean #
                              {String(item.antrean.no_antrean).padStart(2, "0")}{" "}
                              ({item.kelas_perawatan})
                            </div>
                            {item.antrean.alokasi?.bed ? (
                              <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1 mt-0.5">
                                <Bed className="w-3 h-3" />
                                {item.antrean.alokasi.bed.no_bed} (
                                {item.antrean.alokasi.bed.nama_bangsal})
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Menunggu alokasi kamar tersedia
                              </div>
                            )}
                          </div>
                        ) : item.rujukan ? (
                          <div>
                            <div className="font-mono font-bold text-[#0d332f]">
                              {item.rujukan.no_rujukan}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-teal-600" />
                              {item.rujukan.rumah_sakit?.nama_rs ||
                                "RS Rujukan Tujuan"}
                            </div>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      {/* Status Terkini */}
                      <td className="py-4 px-4">
                        {isQueue ? (
                          qStatus === "Dialokasikan" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Rawat Inap (Dialokasikan)
                            </span>
                          ) : qStatus === "Batal" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" />
                              Antrean Dibatalkan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Menunggu Antrean
                            </span>
                          )
                        ) : rStatus === "Diterima" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Diterima RS Tujuan
                          </span>
                        ) : rStatus === "Dikirim" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Send className="w-3.5 h-3.5" />
                            Rujukan Dikirim
                          </span>
                        ) : rStatus === "Batal" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Rujukan Batal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Surat Rujukan Dibuat
                          </span>
                        )}
                      </td>

                      {/* Waktu & Petugas */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.waktu_terakhir}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          PJ: {item.petugas_pj}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#0d332f] hover:bg-[#144943] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#13c9b3]" />
                          <span>Kelola Status</span>
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
