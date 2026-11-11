"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Check,
  Clock,
  X,
  RefreshCw,
  MoreHorizontal,
  Plus,
  Calendar,
  AlertTriangle,
  Receipt,
  Tag,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  BillingItem,
  BillingStatus,
  HistoryRecapItem,
  TarifItem,
} from "@/types";
import {
  cancelBillingApi,
  fetchBillingsApi,
  fetchHistoriesApi,
  fetchTariffsApi,
  updateBillingStatusApi,
} from "@/lib/api-client";

export default function PembayaranDashboardPage() {
  const { user } = useAuth();

  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [readyRecaps, setReadyRecaps] = useState<HistoryRecapItem[]>([]);
  const [tariffs, setTariffs] = useState<TarifItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Semua" | "Belum Dibayar" | "Lunas" | "Batal">("Semua");
  const [statusDropdown, setStatusDropdown] = useState<string>("Semua status");
  const [dateRange, setDateRange] = useState("01-28 Feb 2026");

  // Modals state
  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<BillingItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [statusModalTarget, setStatusModalTarget] = useState<BillingItem | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<BillingStatus>("Belum Dibayar");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, hRes, tList] = await Promise.all([
        fetchBillingsApi(),
        fetchHistoriesApi({ status: "Siap Billing" }),
        fetchTariffsApi(),
      ]);
      setBillings(bRes.items);
      const uninvoiced = hRes.items.filter(
        (r) => !r.tagihan.some((t) => t.status !== "Batal")
      );
      setReadyRecaps(uninvoiced);
      setTariffs(tList);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal memuat data tagihan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts for tabs & cards
  const counts = useMemo(() => {
    const belumDibayar = billings.filter((b) => b.status === "Belum Dibayar").length;
    const lunas = billings.filter((b) => b.status === "Lunas").length;
    const batal = billings.filter((b) => b.status === "Batal").length;
    return {
      semua: billings.length,
      belumDibayar,
      lunas,
      batal,
    };
  }, [billings]);

  // Filtering
  const filteredBillings = useMemo(() => {
    return billings.filter((b) => {
      // Filter tab
      if (activeTab === "Belum Dibayar" && b.status !== "Belum Dibayar") return false;
      if (activeTab === "Lunas" && b.status !== "Lunas") return false;
      if (activeTab === "Batal" && b.status !== "Batal") return false;

      // Filter dropdown status
      if (statusDropdown !== "Semua status" && b.status !== statusDropdown) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = b.no_tagihan.toLowerCase().includes(q);
        const matchNama = b.nama_pasien.toLowerCase().includes(q);
        const matchRm = b.no_rm.toLowerCase().includes(q);
        if (!matchInv && !matchNama && !matchRm) return false;
      }
      return true;
    });
  }, [billings, activeTab, statusDropdown, searchQuery]);

  // Status Change handler
  const handleSaveStatusChange = async () => {
    if (!statusModalTarget) return;
    try {
      await updateBillingStatusApi(statusModalTarget.id_tagihan, selectedNewStatus);
      showToast(
        `Status tagihan ${statusModalTarget.no_tagihan} berhasil diperbarui menjadi "${selectedNewStatus}".`
      );
      setStatusModalTarget(null);
      loadData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal memperbarui status tagihan.");
    }
  };

  // Cancel Invoice handler
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    if (!cancelReason.trim()) {
      showError("Alasan pembatalan tagihan wajib diisi.");
      return;
    }

    try {
      await cancelBillingApi(cancelTarget.id_tagihan, cancelReason);
      showToast(`Tagihan ${cancelTarget.no_tagihan} berhasil dibatalkan.`);
      setCancelTarget(null);
      setCancelReason("");
      loadData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal membatalkan tagihan.");
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pembayaran & Billing" />;
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-3 animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-rose-500/40 flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-emerald-700 text-xs font-semibold tracking-wider uppercase mb-1">
            MANAJEMEN TAGIHAN RAWAT INAP
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Pembayaran &amp; Tagihan Pasien
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Kelola perhitungan biaya pelayanan, penerbitan invoice kasir, dan status pelunasan pasien rawat inap.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTarifModalOpen(true)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Master Tarif ({tariffs.length})</span>
          </button>

          <Link
            href="/pembayaran/buat"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tagihan</span>
          </Link>
        </div>
      </div>

      {/* 4 Financial & Status KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Tagihan */}
        <div
          onClick={() => {
            setActiveTab("Semua");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-slate-800 text-xs font-semibold">Total Tagihan</div>
              <div className="text-slate-500 text-[11px]">Seluruh invoice</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 text-2xl font-bold">{counts.semua}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Belum Dibayar */}
        <div
          onClick={() => {
            setActiveTab("Belum Dibayar");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:border-amber-400 transition shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-slate-800 text-xs font-semibold">Belum Dibayar</div>
              <div className="text-slate-500 text-[11px]">Perlu ditindaklanjuti</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 text-2xl font-bold">{counts.belumDibayar}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Lunas */}
        <div
          onClick={() => {
            setActiveTab("Lunas");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Check className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-slate-800 text-xs font-semibold">Lunas</div>
              <div className="text-slate-500 text-[11px]">Pembayaran selesai</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 text-2xl font-bold">{counts.lunas}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Dibatalkan */}
        <div
          onClick={() => {
            setActiveTab("Batal");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between cursor-pointer hover:border-rose-400 transition shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <X className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-slate-800 text-xs font-semibold">Dibatalkan</div>
              <div className="text-slate-500 text-[11px]">Invoice dibatalkan</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 text-2xl font-bold">{counts.batal}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Container Card: Search, Tabs & Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pasien, No. RM, atau No. Invoice..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 bg-slate-50/60 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Date Range Box */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 shrink-0 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
            </div>

            {/* Status Dropdown */}
            <select
              value={statusDropdown}
              onChange={(e) => setStatusDropdown(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-emerald-500 shrink-0 shadow-2xs"
            >
              <option value="Semua status">Semua status</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
              <option value="Lunas">Lunas</option>
              <option value="Batal">Batal</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-4 sm:gap-6 text-xs font-medium overflow-x-auto no-scrollbar">
          {(
            [
              { id: "Semua", label: "Semua", count: counts.semua },
              { id: "Belum Dibayar", label: "Belum Dibayar", count: counts.belumDibayar },
              { id: "Lunas", label: "Lunas", count: counts.lunas },
              { id: "Batal", label: "Batal", count: counts.batal },
            ] as const
          ).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer relative shrink-0 ${
                  isActive
                    ? "text-emerald-700 font-semibold border-b-2 border-emerald-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop Table Content */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4 w-12 text-center">NO.</th>
                <th className="py-3 px-4">NO. INVOICE</th>
                <th className="py-3 px-4">NAMA PASIEN</th>
                <th className="py-3 px-4">NO. RM</th>
                <th className="py-3 px-4">PERIODE</th>
                <th className="py-3 px-4">TOTAL TAGIHAN</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TANGGAL TERBIT</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data tagihan pasien...</span>
                  </td>
                </tr>
              ) : filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada data tagihan yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredBillings.map((item, idx) => (
                  <tr key={item.id_tagihan} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-normal text-center">
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/pembayaran/${item.id_tagihan}`}
                        className="hover:text-emerald-700 transition"
                      >
                        {item.no_tagihan}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(item.nama_pasien)}
                        </div>
                        <span className="font-semibold text-slate-900">{item.nama_pasien}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">{item.no_rm}</td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.periode_perawatan || "-"}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(item.total_biaya_num)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === "Belum Dibayar" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Belum Dibayar
                        </span>
                      ) : item.status === "Lunas" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Lunas
                        </span>
                      ) : item.status === "Batal" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Batal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {item.tanggal_terbit_formatted || item.tanggal_diperbarui_formatted || "-"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2 relative">
                        <Link
                          href={`/pembayaran/${item.id_tagihan}`}
                          className="text-emerald-700 hover:text-emerald-800 font-medium text-xs px-2 py-1 rounded-md hover:bg-emerald-50 transition border border-emerald-200"
                        >
                          Lihat Detail
                        </Link>

                        {/* Quick Update Icon */}
                        {item.status !== "Batal" && (
                          <button
                            type="button"
                            title="Ubah Status Pembayaran"
                            onClick={() => {
                              setStatusModalTarget(item);
                              setSelectedNewStatus(
                                item.status === "Belum Dibayar" ? "Lunas" : "Belum Dibayar"
                              );
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* More Actions Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === item.id_tagihan ? null : item.id_tagihan
                              )
                            }
                            className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openDropdownId === item.id_tagihan && (
                            <div className="absolute right-0 top-7 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 animate-fadeIn text-left text-xs">
                              <Link
                                href={`/pembayaran/${item.id_tagihan}`}
                                className="block px-3.5 py-1.5 text-slate-700 hover:bg-slate-50"
                                onClick={() => setOpenDropdownId(null)}
                              >
                                Buka Tagihan
                              </Link>

                              {item.status !== "Batal" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setStatusModalTarget(item);
                                    setSelectedNewStatus(
                                      item.status === "Belum Dibayar" ? "Lunas" : "Belum Dibayar"
                                    );
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  Ubah Status
                                </button>
                              )}

                              {(item.status === "Draft" || item.status === "Belum Dibayar") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setCancelTarget(item);
                                    setCancelReason("");
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  Batalkan Tagihan
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-3.5 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
              <span>Memuat data tagihan...</span>
            </div>
          ) : filteredBillings.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Tidak ada tagihan yang sesuai filter.
            </div>
          ) : (
            filteredBillings.map((item) => (
              <div
                key={item.id_tagihan}
                className="pt-3 first:pt-0 bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {item.no_tagihan}
                  </span>
                  {item.status === "Belum Dibayar" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Belum Dibayar
                    </span>
                  ) : item.status === "Lunas" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Lunas
                    </span>
                  ) : item.status === "Batal" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                      Batal
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Draft
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {item.nama_pasien}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {item.no_rm} • {item.periode_perawatan || "-"}
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(item.total_biaya_num)}
                  </span>
                  <span className="text-[11px] text-slate-400">{item.tanggal_terbit_formatted}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/pembayaran/${item.id_tagihan}`}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium text-center transition"
                  >
                    Buka Tagihan
                  </Link>
                  {item.status !== "Batal" && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusModalTarget(item);
                        setSelectedNewStatus(
                          item.status === "Belum Dibayar" ? "Lunas" : "Belum Dibayar"
                        );
                      }}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                    >
                      Ubah Status
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredBillings.length}</strong> dari{" "}
            <strong className="text-slate-800">{billings.length}</strong> tagihan
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center text-xs"
            >
              &lt;
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-medium flex items-center justify-center text-xs shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center text-xs hover:bg-slate-50"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center text-xs hover:bg-slate-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Ubah Status Pembayaran (matches 228:16744) */}
      {statusModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-md w-full shadow-2xl border border-[#e9ebf0] p-6 space-y-5 animate-fadeIn">
            {/* Top Icon */}
            <div className="w-10 h-10 rounded-full bg-[#e6f8f5] text-[#00b89f] flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>

            {/* Titles */}
            <div>
              <h3 className="text-base font-semibold text-[#1e1e1e]">Ubah Status Pembayaran</h3>
              <p className="text-xs text-[#8c8c8c] mt-0.5">
                Perbarui status pembayaran invoice pasien.
              </p>
            </div>

            {/* Info Summary Box */}
            <div className="bg-[#f9fafb] rounded-[10px] p-4 border border-[#f0f2f5] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">No. Invoice</span>
                <span className="font-semibold text-[#1e1e1e]">{statusModalTarget.no_tagihan}</span>
              </div>
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">Nama Pasien</span>
                <span className="font-semibold text-[#1e1e1e]">{statusModalTarget.nama_pasien}</span>
              </div>
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">Total Tagihan</span>
                <span className="font-bold text-[#00b89f]">
                  {formatRupiah(statusModalTarget.total_biaya_num)}
                </span>
              </div>
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">Status Saat Ini</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {statusModalTarget.status}
                </span>
              </div>
            </div>

            {/* Radio Selectors */}
            <div className="space-y-2.5">
              <span className="text-xs font-medium text-[#1e1e1e] block">
                Pilih status pembayaran
              </span>

              {/* Option Belum Dibayar */}
              <label
                onClick={() => setSelectedNewStatus("Belum Dibayar")}
                className={`flex items-center justify-between p-3.5 rounded-[10px] border cursor-pointer transition ${
                  selectedNewStatus === "Belum Dibayar"
                    ? "border-[#00b89f] bg-[#f2fbf9]"
                    : "border-[#e5e7eb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedNewStatus === "Belum Dibayar"
                        ? "border-[#00b89f] bg-[#00b89f]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {selectedNewStatus === "Belum Dibayar" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1e1e1e]">Belum Dibayar</div>
                    <div className="text-[10px] text-[#8c8c8c]">Pembayaran belum diterima</div>
                  </div>
                </div>
                {selectedNewStatus === "Belum Dibayar" && (
                  <Check className="w-4 h-4 text-[#00b89f]" />
                )}
              </label>

              {/* Option Lunas */}
              <label
                onClick={() => setSelectedNewStatus("Lunas")}
                className={`flex items-center justify-between p-3.5 rounded-[10px] border cursor-pointer transition ${
                  selectedNewStatus === "Lunas"
                    ? "border-[#00b89f] bg-[#f2fbf9]"
                    : "border-[#e5e7eb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedNewStatus === "Lunas"
                        ? "border-[#00b89f] bg-[#00b89f]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {selectedNewStatus === "Lunas" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1e1e1e]">Lunas</div>
                    <div className="text-[10px] text-[#8c8c8c]">Pembayaran telah diselesaikan</div>
                  </div>
                </div>
                {selectedNewStatus === "Lunas" && (
                  <Check className="w-4 h-4 text-[#00b89f]" />
                )}
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalTarget(null)}
                className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatusChange}
                className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Batalkan Tagihan (matches 228:17611) */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-white rounded-[16px] max-w-md w-full shadow-2xl border border-[#fee2e2] p-6 space-y-4 animate-fadeIn"
          >
            {/* Top Red Icon */}
            <div className="w-10 h-10 rounded-full bg-[#fdf0f0] text-[#dc2626] flex items-center justify-center">
              <X className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#1e1e1e]">Batalkan Tagihan?</h3>
              <p className="text-xs text-[#8c8c8c] mt-0.5">
                Tindakan ini akan mengubah status tagihan menjadi Batal dan tidak dapat dipulihkan.
              </p>
            </div>

            {/* Target Info */}
            <div className="bg-[#fef2f2]/60 rounded-[10px] p-3 border border-[#fecaca] text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#1e1e1e] block">{cancelTarget.no_tagihan}</span>
                <span className="text-[11px] text-[#4b5563]">{cancelTarget.nama_pasien}</span>
              </div>
              <span className="font-bold text-[#dc2626]">
                {formatRupiah(cancelTarget.total_biaya_num)}
              </span>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-medium text-[#1e1e1e] mb-1.5">
                Alasan pembatalan *
              </label>
              <textarea
                rows={3}
                required
                maxLength={200}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tuliskan alasan pembatalan tagihan..."
                className="w-full p-2.5 rounded-[8px] border border-[#e5e7eb] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-rose-500"
              />
              <div className="text-[10px] text-[#8c8c8c] text-right mt-1">
                {cancelReason.length}/200 karakter
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-medium cursor-pointer"
              >
                Ya, Batalkan Tagihan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Master Tarif */}
      {isTarifModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-2xl w-full shadow-2xl border border-[#e9ebf0] overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#e7faf7] text-[#00b89f] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#1e1e1e]">Master Tarif Pelayanan</h3>
                  <p className="text-[11px] text-[#8c8c8c]">
                    Acuan harga satuan otomatis untuk kalkulasi tagihan pasien rawat inap
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTarifModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#8c8c8c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[380px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#f0f2f5] text-[10px] font-semibold text-[#8c8c8c] uppercase">
                    <th className="py-2 px-3">Kode</th>
                    <th className="py-2 px-3">Nama Layanan</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3 text-right">Tarif Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f6f8]">
                  {tariffs.map((t) => (
                    <tr key={t.id_tarif} className="hover:bg-[#fafafa]">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#0fa18f]">
                        {t.kode_tindakan}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#1e1e1e]">
                        {t.nama_tindakan}
                      </td>
                      <td className="py-2.5 px-3 text-[#4b5563]">{t.kategori}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#1e1e1e]">
                        {formatRupiah(t.harga_num)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
