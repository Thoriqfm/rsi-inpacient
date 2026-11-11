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

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pemantauan Status Penanganan" />;
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
            SISTEM ANTREAN & RUJUKAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Pemantauan Status Penanganan Pasien
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Lacak progres terintegrasi pasien rawat inap baik di jalur antrean FIFO maupun rujukan SPGDT ke rumah sakit jejaring.
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
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

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Total Dipantau</div>
              <div className="text-[11px] text-slate-500">Antrean & rujukan</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {items.length}
          </span>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Antrean Menunggu</div>
              <div className="text-[11px] text-slate-500">Kondisi stabil</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {waitingQueueCount}
          </span>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ambulance className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Rujukan Eksternal</div>
              <div className="text-[11px] text-slate-500">Jejaring SPGDT</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {referralTotalCount}
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Selesai Tertangani</div>
              <div className="text-[11px] text-slate-500">Dialokasi / diterima</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {completedCount}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Pasien, No. RM, No. Surat Rujukan, atau RS Tujuan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Jalur Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(
              ["Semua", "Daftar Tunggu", "Rujukan RS Lain"] as const
            ).map((j) => {
              const isActive = jalurFilter === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => setJalurFilter(j)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
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
            className="px-3 py-2 text-xs text-slate-700 rounded-lg border border-slate-200 bg-white focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="Semua">Semua Kondisi</option>
            <option value="Stabil">Kondisi Stabil</option>
            <option value="Darurat">Kondisi Darurat</option>
          </select>
        </div>
      </div>

      {/* Monitoring Consolidated Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tabel Konsolidasi Status Penanganan Pasien
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredItems.length} dari {items.length} pasien dalam pantauan
            </p>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Sinkron Real-time
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">PASIEN & NO. RM</th>
                <th className="py-3 px-4">KONDISI & DIAGNOSA</th>
                <th className="py-3 px-3">JALUR</th>
                <th className="py-3 px-4">DETAIL ALOKASI / RUJUKAN</th>
                <th className="py-3 px-4">STATUS TERKINI</th>
                <th className="py-3 px-4">WAKTU & PETUGAS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
                      className="hover:bg-slate-50/60 transition"
                    >
                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.nama_pasien}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.no_rm} • {item.jenis_kelamin_usia}
                        </div>
                      </td>

                      {/* Kondisi & Diagnosa */}
                      <td className="py-3.5 px-4 max-w-[210px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              item.kondisi_pasien === "Darurat"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.kondisi_pasien === "Darurat"
                                  ? "bg-rose-600 animate-pulse"
                                  : "bg-emerald-600"
                              }`}
                            />
                            {item.kondisi_pasien}
                          </span>
                        </div>
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {item.diagnosa}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.dokter_dpjp}
                        </div>
                      </td>

                      {/* Jalur */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isQueue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            Daftar Tunggu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium">
                            <Ambulance className="w-3 h-3 text-rose-600" />
                            Rujukan RS
                          </span>
                        )}
                      </td>

                      {/* Detail Antrean / Rujukan */}
                      <td className="py-3.5 px-4">
                        {isQueue && item.antrean ? (
                          <div>
                            <div className="font-mono font-medium text-slate-900">
                              Antrean #{String(item.antrean.no_antrean).padStart(2, "0")}{" "}
                              <span className="text-slate-500 font-normal">({item.kelas_perawatan})</span>
                            </div>
                            {item.antrean.alokasi?.bed ? (
                              <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                                <Bed className="w-3 h-3 text-emerald-600" />
                                {item.antrean.alokasi.bed.no_bed} ({item.antrean.alokasi.bed.nama_bangsal})
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Menunggu alokasi bed
                              </div>
                            )}
                          </div>
                        ) : item.rujukan ? (
                          <div>
                            <div className="font-mono font-semibold text-slate-900">
                              {item.rujukan.no_rujukan}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-emerald-600" />
                              {item.rujukan.rumah_sakit?.nama_rs || "RS Rujukan Tujuan"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status Terkini */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isQueue ? (
                          qStatus === "Dialokasikan" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Dialokasikan
                            </span>
                          ) : qStatus === "Batal" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Batal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Menunggu Bed
                            </span>
                          )
                        ) : rStatus === "Diterima" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Diterima RS
                          </span>
                        ) : rStatus === "Dikirim" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Dikirim
                          </span>
                        ) : rStatus === "Batal" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Batal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Diterbitkan
                          </span>
                        )}
                      </td>

                      {/* Waktu & Petugas */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-900">
                          {item.waktu_terakhir}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          PJ: {item.petugas_pj}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
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

        {/* Mobile Card View */}
        <div className="md:hidden p-3.5 space-y-3 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Tidak ada data pemantauan yang sesuai.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isQueue = item.jalur_penanganan === "Daftar Tunggu";
              return (
                <div
                  key={`${item.jalur_penanganan}-${item.id_pasien}`}
                  className="pt-3 first:pt-0 bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        item.kondisi_pasien === "Darurat"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.kondisi_pasien === "Darurat" ? "bg-rose-600" : "bg-emerald-600"
                        }`}
                      />
                      {item.kondisi_pasien}
                    </span>

                    {isQueue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        Daftar Tunggu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium">
                        <Ambulance className="w-3 h-3 text-rose-600" />
                        Rujukan RS
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {item.nama_pasien}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.no_rm} • {item.jenis_kelamin_usia}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <div><span className="font-medium text-slate-700">Diagnosa:</span> {item.diagnosa}</div>
                    <div className="text-[11px] text-slate-500">DPJP: {item.dokter_dpjp}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {item.waktu_terakhir}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
                      <span>Kelola</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
