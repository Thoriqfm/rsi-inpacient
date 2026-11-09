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
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pembayaran & Billing" />;
  }

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

  return (
    <div className="space-y-6 pb-12 font-sans text-[#1e1e1e]">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d332f] text-white px-5 py-3 rounded-[10px] shadow-xl border border-[#00b89f]/40 flex items-center gap-3 animate-fadeIn">
          <Check className="w-5 h-5 text-[#00b89f] shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-900 text-white px-5 py-3 rounded-[10px] shadow-xl border border-rose-500/40 flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          <span className="text-xs font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[#0fa18f] text-[10px] font-semibold tracking-[1px] uppercase mb-1">
            MANAJEMEN TAGIHAN RAWAT INAP
          </div>
          <h1 className="text-[#1e1e1e] text-[27px] font-medium leading-[35px] tracking-[-0.675px]">
            Pembayaran & Tagihan Pasien
          </h1>
          <p className="text-[#666] text-xs font-normal mt-0.5">
            Kelola perhitungan biaya, penerbitan invoice, dan status pembayaran pasien rawat inap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsTarifModalOpen(true)}
            className="px-3.5 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Tag className="w-3.5 h-3.5 text-[#0fa18f]" />
            <span>Master Tarif ({tariffs.length})</span>
          </button>

          <Link
            href="/pembayaran/buat"
            className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tagihan</span>
          </Link>
        </div>
      </div>

      {/* 4 Financial & Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tagihan */}
        <div
          onClick={() => {
            setActiveTab("Semua");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between cursor-pointer hover:border-[#00b89f]/50 transition shadow-[0px_4px_8px_rgba(26,39,50,0.02)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#e7faf7] flex items-center justify-center text-[#00b89f]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[#1e1e1e] text-xs font-medium">Total Tagihan</div>
              <div className="text-[#8c8c8c] text-[10px]">Seluruh invoice</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#1e1e1e] text-lg font-semibold">{counts.semua}</span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
          </div>
        </div>

        {/* Belum Dibayar */}
        <div
          onClick={() => {
            setActiveTab("Belum Dibayar");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between cursor-pointer hover:border-amber-400/50 transition shadow-[0px_4px_8px_rgba(26,39,50,0.02)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#fef3e9] flex items-center justify-center text-[#e06a14]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[#1e1e1e] text-xs font-medium">Belum Dibayar</div>
              <div className="text-[#8c8c8c] text-[10px]">Perlu ditindaklanjuti</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#1e1e1e] text-lg font-semibold">{counts.belumDibayar}</span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
          </div>
        </div>

        {/* Lunas */}
        <div
          onClick={() => {
            setActiveTab("Lunas");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between cursor-pointer hover:border-emerald-400/50 transition shadow-[0px_4px_8px_rgba(26,39,50,0.02)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#e6f4ef] flex items-center justify-center text-[#016b46]">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[#1e1e1e] text-xs font-medium">Lunas</div>
              <div className="text-[#8c8c8c] text-[10px]">Pembayaran selesai</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#1e1e1e] text-lg font-semibold">{counts.lunas}</span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
          </div>
        </div>

        {/* Dibatalkan */}
        <div
          onClick={() => {
            setActiveTab("Batal");
            setStatusDropdown("Semua status");
          }}
          className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between cursor-pointer hover:border-rose-400/50 transition shadow-[0px_4px_8px_rgba(26,39,50,0.02)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#fdf0f0] flex items-center justify-center text-[#dc2626]">
              <X className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[#1e1e1e] text-xs font-medium">Dibatalkan</div>
              <div className="text-[#8c8c8c] text-[10px]">Soft-delete tagihan</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#1e1e1e] text-lg font-semibold">{counts.batal}</span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf]" />
          </div>
        </div>
      </div>

      {/* Main Container Card: Search, Tabs & Table */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.03)] overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-[#f0f2f5] flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pasien, No. RM, atau No. Invoice..."
              className="w-full pl-9 pr-4 py-2 rounded-[8px] border border-[#e2e8f0] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Date Range Box */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-xs text-[#4b5563] shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#9ca3af]" />
              <span>{dateRange}</span>
            </div>

            {/* Status Dropdown */}
            <select
              value={statusDropdown}
              onChange={(e) => setStatusDropdown(e.target.value)}
              className="px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-xs text-[#4b5563] focus:outline-none focus:border-[#00b89f] shrink-0"
            >
              <option value="Semua status">Semua status</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
              <option value="Lunas">Lunas</option>
              <option value="Batal">Batal</option>
              <option value="Draft">Draft</option>
            </select>

            {/* Cari Button */}
            <button
              type="button"
              onClick={() => {}}
              className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium transition cursor-pointer shrink-0"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 border-b border-[#f0f2f5] flex items-center gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("Semua")}
            className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer relative ${
              activeTab === "Semua"
                ? "text-[#00b89f] font-semibold border-b-2 border-[#00b89f]"
                : "text-[#6b7280] hover:text-[#1e1e1e]"
            }`}
          >
            <span>Semua</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "Semua"
                  ? "bg-[#e7faf7] text-[#00b89f]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.semua}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("Belum Dibayar")}
            className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer relative ${
              activeTab === "Belum Dibayar"
                ? "text-[#00b89f] font-semibold border-b-2 border-[#00b89f]"
                : "text-[#6b7280] hover:text-[#1e1e1e]"
            }`}
          >
            <span>Belum Dibayar</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "Belum Dibayar"
                  ? "bg-[#e7faf7] text-[#00b89f]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.belumDibayar}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("Lunas")}
            className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer relative ${
              activeTab === "Lunas"
                ? "text-[#00b89f] font-semibold border-b-2 border-[#00b89f]"
                : "text-[#6b7280] hover:text-[#1e1e1e]"
            }`}
          >
            <span>Lunas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "Lunas"
                  ? "bg-[#e7faf7] text-[#00b89f]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.lunas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("Batal")}
            className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer relative ${
              activeTab === "Batal"
                ? "text-[#00b89f] font-semibold border-b-2 border-[#00b89f]"
                : "text-[#6b7280] hover:text-[#1e1e1e]"
            }`}
          >
            <span>Batal</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "Batal"
                  ? "bg-[#e7faf7] text-[#00b89f]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts.batal}
            </span>
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5] text-[10px] font-semibold text-[#8c8c8c] uppercase tracking-wider bg-white">
                <th className="py-3 px-4 w-12">NO.</th>
                <th className="py-3 px-4">NO. INVOICE</th>
                <th className="py-3 px-4">NAMA PASIEN</th>
                <th className="py-3 px-4">NO. RM</th>
                <th className="py-3 px-4">PERIODE PERAWATAN</th>
                <th className="py-3 px-4">TOTAL TAGIHAN</th>
                <th className="py-3 px-4">STATUS PEMBAYARAN</th>
                <th className="py-3 px-4">TANGGAL TERBIT</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f6f8]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8c8c8c]">
                    Memuat data tagihan pasien...
                  </td>
                </tr>
              ) : filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8c8c8c]">
                    Tidak ada data tagihan yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredBillings.map((item, idx) => (
                  <tr key={item.id_tagihan} className="hover:bg-[#fafbfb] transition">
                    <td className="py-3.5 px-4 text-[#8c8c8c] font-medium">
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#1e1e1e]">
                      <Link
                        href={`/pembayaran/${item.id_tagihan}`}
                        className="hover:text-[#00b89f] transition"
                      >
                        {item.no_tagihan}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#0fa18f] font-semibold text-[11px] flex items-center justify-center shrink-0">
                          {getInitials(item.nama_pasien)}
                        </div>
                        <span className="font-medium text-[#1e1e1e]">{item.nama_pasien}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#4b5563]">{item.no_rm}</td>

                    <td className="py-3.5 px-4 text-[#4b5563]">
                      {item.periode_perawatan || "10-14 Feb 2026"}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#1e1e1e]">
                      {formatRupiah(item.total_biaya_num)}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.status === "Belum Dibayar" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                          Belum Dibayar
                        </span>
                      ) : item.status === "Lunas" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                          Lunas
                        </span>
                      ) : item.status === "Batal" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fdf0f0] text-[#dc2626] border border-[#fecaca]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                          Batal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e7faf7] text-[#0b796b] border border-[#ccefeb]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0fa18f]" />
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#4b5563]">
                      {item.tanggal_terbit_formatted || item.tanggal_diperbarui_formatted || "20 Feb 2026"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2 relative">
                        <Link
                          href={`/pembayaran/${item.id_tagihan}`}
                          className="text-[#00b89f] hover:text-[#00a28c] hover:underline font-medium text-xs"
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
                            className="p-1 rounded text-[#9ca3af] hover:text-[#00b89f] hover:bg-slate-100 transition cursor-pointer"
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
                            className="p-1 rounded text-[#9ca3af] hover:text-[#1e1e1e] hover:bg-slate-100 transition cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openDropdownId === item.id_tagihan && (
                            <div className="absolute right-0 top-7 w-44 bg-white rounded-[8px] shadow-lg border border-[#e9ebf0] py-1 z-30 animate-fadeIn text-left">
                              <Link
                                href={`/pembayaran/${item.id_tagihan}`}
                                className="block px-3 py-1.5 text-xs text-[#1e1e1e] hover:bg-[#f7f8f5]"
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
                                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e1e1e] hover:bg-[#f7f8f5]"
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
                                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
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

        {/* Footer Pagination */}
        <div className="p-4 border-t border-[#f0f2f5] flex items-center justify-between text-xs text-[#8c8c8c]">
          <span>
            Menampilkan {filteredBillings.length} dari {billings.length} tagihan
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="px-2.5 py-1 rounded-[6px] border border-[#e9ebf0] bg-white text-[#bfbfbf] text-xs opacity-50"
            >
              &lt;
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-[6px] bg-[#e7faf7] text-[#00b89f] font-semibold text-xs border border-[#ccefeb]"
            >
              1
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-[6px] border border-[#e9ebf0] bg-white text-[#4b5563] text-xs hover:bg-slate-50"
            >
              2
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-[6px] border border-[#e9ebf0] bg-white text-[#4b5563] text-xs hover:bg-slate-50"
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
