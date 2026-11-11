"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  Activity,
  Search,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck2,
  Eye,
  Plus,
} from "lucide-react";
import {
  HistoryPatientSummary,
  HistoryRecapItem,
  HistoryStatus,
} from "@/types";
import {
  deleteHistoryApi,
  fetchHistoriesApi,
  searchHistoryPatientsApi,
} from "@/lib/api-client";

export default function RekapLayananPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [histories, setHistories] = useState<HistoryRecapItem[]>([]);
  const [patients, setPatients] = useState<HistoryPatientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Semua" | HistoryStatus>("Semua");

  // Dropdown action menu state per row: id_rekap | null
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Modal Delete state
  const [deleteTarget, setDeleteTarget] = useState<HistoryRecapItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rejection modal if recap has invoice
  const [rejectedDelete, setRejectedDelete] = useState<HistoryRecapItem | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, pList] = await Promise.all([
        fetchHistoriesApi(),
        searchHistoryPatientsApi(""),
      ]);
      setHistories(hRes.items);
      setPatients(pList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Counts for 3 top summary cards & tabs
  const counts = useMemo(() => {
    const draft = histories.filter((h) => h.status === "Draft").length;
    const verifikasi = histories.filter(
      (h) => h.status === "Proses Verifikasi"
    ).length;
    const siapBilling = histories.filter(
      (h) => h.status === "Siap Billing"
    ).length;
    return {
      total: histories.length,
      draft,
      verifikasi,
      siapBilling,
    };
  }, [histories]);

  // Patient search results (shows patients who don't have active recap or match query)
  const patientSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return patients.filter(
      (p) =>
        p.nama_pasien.toLowerCase().includes(q) ||
        p.no_rm.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  // Filtered recap items by tab and search
  const filteredHistories = useMemo(() => {
    return histories.filter((h) => {
      if (activeTab !== "Semua" && h.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = h.nama_pasien.toLowerCase().includes(q);
        const matchRm = h.no_rm.toLowerCase().includes(q);
        const matchKode = h.kode_rekap.toLowerCase().includes(q);
        return matchName || matchRm || matchKode;
      }
      return true;
    });
  }, [histories, activeTab, searchQuery]);

  const handleDeleteRecap = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.tagihan && deleteTarget.tagihan.length > 0) {
      setRejectedDelete(deleteTarget);
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteHistoryApi(deleteTarget.id_rekap);
      setDeleteTarget(null);
      showToast("Rekap riwayat layanan dan tindakan berhasil dihapus.");
      await loadData();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus rekap tindakan."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Rekap Layanan & Tindakan" />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-slate-800">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-2 text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-1">
        <p className="font-semibold text-emerald-700 text-xs tracking-wider uppercase">
          REKAM MEDIS ELEKTRONIK
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Rekap Riwayat Layanan &amp; Tindakan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Kelola dan periksa rekap layanan serta tindakan pasien rawat inap sebagai dasar proses billing.
        </p>
      </div>

      {/* 3 Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Draft */}
        <button
          type="button"
          onClick={() => setActiveTab("Draft")}
          className={`bg-white border rounded-xl p-4 sm:p-5 flex items-center justify-between text-left transition shadow-xs cursor-pointer hover:border-emerald-500 ${
            activeTab === "Draft"
              ? "border-emerald-600 ring-2 ring-emerald-500/20"
              : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-emerald-600 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Draft</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Rekap belum selesai
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {counts.draft}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        {/* Card 2: Proses Verifikasi */}
        <button
          type="button"
          onClick={() => setActiveTab("Proses Verifikasi")}
          className={`bg-white border rounded-xl p-4 sm:p-5 flex items-center justify-between text-left transition shadow-xs cursor-pointer hover:border-amber-500 ${
            activeTab === "Proses Verifikasi"
              ? "border-amber-500 ring-2 ring-amber-500/20"
              : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Proses Verifikasi
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Menunggu pemeriksaan
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {counts.verifikasi}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        {/* Card 3: Siap Billing */}
        <button
          type="button"
          onClick={() => setActiveTab("Siap Billing")}
          className={`bg-white border rounded-xl p-4 sm:p-5 flex items-center justify-between text-left transition shadow-xs cursor-pointer hover:border-emerald-600 ${
            activeTab === "Siap Billing"
              ? "border-emerald-600 ring-2 ring-emerald-500/20"
              : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-emerald-700 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Siap Billing
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Dapat diteruskan kasir
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {counts.siapBilling}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>
      </div>

      {/* Main Section: Search, Tabs, Table & Mobile Cards */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 sm:p-5 pb-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
            <div className="bg-slate-50/60 border border-slate-200 rounded-lg flex items-center gap-2.5 px-3 h-10 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pasien atau No. RM..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs px-4 h-10 rounded-lg transition cursor-pointer shadow-2xs"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Dynamic Patient Search Result Dropdown */}
        {searchQuery.trim().length > 0 && (
          <div className="px-4 sm:px-5 pb-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Hasil pencarian pasien untuk &ldquo;{searchQuery}&rdquo;
                </span>
                <span className="text-slate-500">
                  {patientSearchResults.length} pasien ditemukan
                </span>
              </div>

              {patientSearchResults.length > 0 ? (
                <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {patientSearchResults.slice(0, 3).map((p) => (
                    <div
                      key={p.id_pasien}
                      className="p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-semibold text-xs flex items-center justify-center shrink-0">
                          {getInitials(p.nama_pasien)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {p.nama_pasien}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            {p.no_rm} • {p.periode_perawatan || "18–22 Februari 2026"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.has_recap ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Sudah ada rekap
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Belum ada rekap
                          </span>
                        )}
                        <Link
                          href={`/rekap-layanan/pasien/${p.id_pasien}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-2xs"
                        >
                          Pilih Pasien
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Pasien tidak ditemukan
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Periksa kembali nama atau No. RM yang Anda masukkan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Hapus Pencarian
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab List */}
        <div className="border-b border-slate-100 px-4 sm:px-5 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "Semua", label: "Semua", count: counts.total },
              { id: "Draft", label: "Draft", count: counts.draft },
              { id: "Proses Verifikasi", label: "Proses Verifikasi", count: counts.verifikasi },
              { id: "Siap Billing", label: "Siap Billing", count: counts.siapBilling },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 h-11 px-0.5 relative cursor-pointer shrink-0"
              >
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </span>
                <span
                  className={`h-4.5 min-w-5 px-1.5 rounded-full text-[10px] font-medium flex items-center justify-center ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Table Content */}
        <div className="hidden md:block overflow-x-auto min-h-[220px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-5 pr-3 w-12">No.</th>
                <th className="py-3 px-3">Nama Pasien</th>
                <th className="py-3 px-3">No. RM</th>
                <th className="py-3 px-3">Periode</th>
                <th className="py-3 px-3">Layanan</th>
                <th className="py-3 px-3">Status Rekap</th>
                <th className="py-3 px-3">Diperbarui</th>
                <th className="py-3 pl-3 pr-5 text-right w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data rekap tindakan...</span>
                  </td>
                </tr>
              ) : filteredHistories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada dokumen rekap untuk status atau filter pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredHistories.map((h, idx) => {
                  const numStr = String(idx + 1).padStart(2, "0");
                  const isMenuOpen = openMenuId === h.id_rekap;
                  const isDraft = h.status === "Draft";
                  const isSiapBilling = h.status === "Siap Billing";

                  return (
                    <tr
                      key={h.id_rekap}
                      className="hover:bg-slate-50/60 transition"
                    >
                      {/* No */}
                      <td className="py-3.5 pl-5 pr-3 font-normal text-slate-400">
                        {numStr}
                      </td>

                      {/* Nama Pasien + Room */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(h.nama_pasien)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {h.nama_pasien}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {h.nama_kamar || "Kamar Rawat Inap"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* No RM */}
                      <td className="py-3.5 px-3 font-mono font-medium text-slate-800">
                        {h.no_rm}
                      </td>

                      {/* Periode */}
                      <td className="py-3.5 px-3 text-slate-600 text-xs">
                        {h.periode_perawatan || "-"}
                      </td>

                      {/* Jumlah Layanan */}
                      <td className="py-3.5 px-3 text-slate-800 font-medium">
                        {h.jumlah_tindakan} <span className="text-slate-400 font-normal">item</span>
                      </td>

                      {/* Status Rekap Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isDraft ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Draft</span>
                          </span>
                        ) : isSiapBilling ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Siap Billing</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Proses Verifikasi</span>
                          </span>
                        )}
                      </td>

                      {/* Terakhir Diperbarui */}
                      <td className="py-3.5 px-3 text-slate-500 text-xs">
                        {h.tanggal_diperbarui_formatted || "-"}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 pl-3 pr-5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Lihat Detail */}
                          <Link
                            href={`/rekap-layanan/${h.id_rekap}`}
                            className="text-emerald-700 hover:text-emerald-800 font-medium text-xs px-2.5 py-1 rounded-md hover:bg-emerald-50 transition border border-emerald-200"
                          >
                            Lihat Detail
                          </Link>

                          {/* Edit Icon (Hidden if locked in Siap Billing) */}
                          {!isSiapBilling && (
                            <Link
                              href={`/rekap-layanan/${h.id_rekap}/edit`}
                              title="Edit Rekap"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                          )}

                          {/* 3 Dots Menu Button */}
                          <div className="relative" data-action-menu>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(isMenuOpen ? null : h.id_rekap);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 text-left text-xs animate-fadeIn">
                                <Link
                                  href={`/rekap-layanan/${h.id_rekap}`}
                                  className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Lihat rekap</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setDeleteTarget(h);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus Rekap</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Content */}
        <div className="md:hidden p-3.5 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
              <span>Memuat data rekap...</span>
            </div>
          ) : filteredHistories.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Tidak ada rekap yang sesuai kriteria.
            </div>
          ) : (
            filteredHistories.map((h) => {
              const isDraft = h.status === "Draft";
              const isSiapBilling = h.status === "Siap Billing";
              return (
                <div
                  key={h.id_rekap}
                  className="pt-3 first:pt-0 bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {h.kode_rekap}
                    </span>
                    {isDraft ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Draft
                      </span>
                    ) : isSiapBilling ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Siap Billing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Proses Verifikasi
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {h.nama_pasien}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {h.no_rm} • {h.nama_kamar || "Kamar Ranap"}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>{h.jumlah_tindakan} tindakan layanan</span>
                    <span className="text-[11px] text-slate-400">{h.tanggal_diperbarui_formatted}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/rekap-layanan/${h.id_rekap}`}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium text-center transition"
                    >
                      Lihat Detail
                    </Link>
                    {!isSiapBilling && (
                      <Link
                        href={`/rekap-layanan/${h.id_rekap}/edit`}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium text-center transition"
                      >
                        Edit
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(h)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus Rekap"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer: Pagination & Count */}
        <div className="border-t border-slate-100 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <span className="text-slate-800 font-semibold">{filteredHistories.length}</span> dari{" "}
            <span className="text-slate-800 font-semibold">{histories.length}</span> rekap
          </div>
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
              disabled
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center text-xs"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (Figma 146:11207 popup_hapus.png) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/80 space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-lg font-bold text-slate-900">Hapus Rekap?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus rekap riwayat layanan dan tindakan
                  pasien <strong>{deleteTarget.nama_pasien}</strong> ({deleteTarget.kode_rekap})? Data layanan dan tindakan yang bersumber dari RME
                  tidak akan ikut terhapus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteRecap}
                className="px-4 py-2 rounded-xl border border-rose-600 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs transition cursor-pointer"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Rekap"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal: When recap has an active invoice */}
      {rejectedDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/80 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Tidak Dapat Menghapus Rekap
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dokumen rekap <strong>{rejectedDelete.kode_rekap}</strong> sudah
                  diterbitkan menjadi tagihan pada modul Pembayaran (Billing).
                  Hapus atau batalkan invoice tagihan terlebih dahulu sebelum menghapus
                  rekap ini.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectedDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
