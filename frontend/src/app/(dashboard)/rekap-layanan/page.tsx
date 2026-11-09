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

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Rekap Layanan & Tindakan" />;
  }

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

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12 text-[#1e1e1e]">
      {/* Toast Notification (Figma 72:6995) */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a2e28] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-teal-500/30 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#00b89f] shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-2 text-teal-200/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header (Figma 143:27 - 143:33) */}
      <div className="space-y-1">
        <p className="font-semibold text-[#0fa18f] text-[10px] tracking-[1px] uppercase">
          REKAM MEDIS ELEKTRONIK
        </p>
        <h1 className="text-[27px] font-medium leading-[35px] text-[#1e1e1e] tracking-[-0.675px]">
          Rekap Riwayat Layanan &amp; Tindakan
        </h1>
        <p className="text-[13px] text-[#667085] leading-[21px]">
          Kelola dan periksa rekap layanan serta tindakan pasien rawat inap sebagai
          dasar proses billing.
        </p>
      </div>

      {/* 3 Status Summary Cards (Figma 143:39 - 143:70) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Draft */}
        <button
          type="button"
          onClick={() => setActiveTab("Draft")}
          className={`bg-white border border-[#e9ebf0] rounded-[12px] p-[18px] min-h-[112px] flex items-center justify-between text-left transition shadow-[0px_4px_8px_rgba(26,39,50,0.05)] cursor-pointer hover:border-[#00b89f] ${
            activeTab === "Draft" ? "ring-2 ring-[#0fa18f]/20 border-[#0fa18f]" : ""
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-[44px] h-[44px] rounded-[11px] bg-[#e7faf7] flex items-center justify-center shrink-0">
              <FileText className="w-[18px] h-[18px] text-[#0fa18f]" />
            </div>
            <div>
              <div className="text-[12px] text-[#475467] font-normal">Draft</div>
              <div className="text-[10px] text-[#98a2b3] mt-0.5">
                Rekap belum selesai
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[27px] font-medium text-[#1e1e1e]">
              {counts.draft}
            </span>
            <ChevronRight className="w-[18px] h-[18px] text-[#98a2b3]" />
          </div>
        </button>

        {/* Card 2: Proses Verifikasi */}
        <button
          type="button"
          onClick={() => setActiveTab("Proses Verifikasi")}
          className={`bg-white border border-[#e9ebf0] rounded-[12px] p-[18px] min-h-[112px] flex items-center justify-between text-left transition shadow-[0px_4px_8px_rgba(26,39,50,0.05)] cursor-pointer hover:border-[#f68624] ${
            activeTab === "Proses Verifikasi"
              ? "ring-2 ring-[#f68624]/20 border-[#f68624]"
              : ""
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-[44px] h-[44px] rounded-[11px] bg-[#fef3e9] flex items-center justify-center shrink-0">
              <Clock className="w-[18px] h-[18px] text-[#f68624]" />
            </div>
            <div>
              <div className="text-[12px] text-[#475467] font-normal">
                Proses Verifikasi
              </div>
              <div className="text-[10px] text-[#98a2b3] mt-0.5">
                Menunggu pemeriksaan
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[27px] font-medium text-[#1e1e1e]">
              {counts.verifikasi}
            </span>
            <ChevronRight className="w-[18px] h-[18px] text-[#98a2b3]" />
          </div>
        </button>

        {/* Card 3: Siap Billing */}
        <button
          type="button"
          onClick={() => setActiveTab("Siap Billing")}
          className={`bg-white border border-[#e9ebf0] rounded-[12px] p-[18px] min-h-[112px] flex items-center justify-between text-left transition shadow-[0px_4px_8px_rgba(26,39,50,0.05)] cursor-pointer hover:border-[#018f5d] ${
            activeTab === "Siap Billing"
              ? "ring-2 ring-[#018f5d]/20 border-[#018f5d]"
              : ""
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-[44px] h-[44px] rounded-[11px] bg-[#e6f4ef] flex items-center justify-center shrink-0">
              <Activity className="w-[18px] h-[18px] text-[#018f5d]" />
            </div>
            <div>
              <div className="text-[12px] text-[#475467] font-normal">
                Siap Billing
              </div>
              <div className="text-[10px] text-[#98a2b3] mt-0.5">
                Dapat diteruskan
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[27px] font-medium text-[#1e1e1e]">
              {counts.siapBilling}
            </span>
            <ChevronRight className="w-[18px] h-[18px] text-[#98a2b3]" />
          </div>
        </button>
      </div>

      {/* Main Section: Search, Tabs, and Table (Figma 143:85) */}
      <div className="bg-white border border-[#e9ebf0] rounded-[12px] shadow-[0px_4px_8px_rgba(26,39,50,0.05)] overflow-hidden">
        {/* Search Bar (Figma 143:86 - 143:95) */}
        <div className="p-5 pb-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
            <div className="bg-[#fbfcfc] border border-[#d7dce4] rounded-[9px] flex items-center gap-2.5 px-3 h-[40px] flex-1">
              <Search className="w-[18px] h-[18px] text-[#a6acb5] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pasien atau No. RM..."
                className="w-full bg-transparent text-[12px] text-[#1e1e1e] placeholder-[#a6acb5] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              className="bg-white border border-[#d7dce4] hover:bg-slate-50 text-[#344054] font-medium text-[12px] px-4 h-[40px] rounded-[9px] transition cursor-pointer"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Dynamic Patient Search Result Dropdown / Banner (Figma 144:3463 & 144:3216) */}
        {searchQuery.trim().length > 0 && (
          <div className="px-5 pb-4">
            <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Hasil pencarian pasien untuk &ldquo;{searchQuery}&rdquo;
                </span>
                <span className="text-slate-500">
                  {patientSearchResults.length} pasien ditemukan
                </span>
              </div>

              {patientSearchResults.length > 0 ? (
                <div className="divide-y divide-slate-200/70 bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {patientSearchResults.slice(0, 3).map((p) => (
                    <div
                      key={p.id_pasien}
                      className="p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#b6eee7] text-[#07594f] font-semibold text-[11px] flex items-center justify-center shrink-0">
                          {getInitials(p.nama_pasien)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {p.nama_pasien}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.no_rm} • {p.periode_perawatan || "18–22 Februari 2026"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.has_recap ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800">
                            Sudah ada rekap
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">
                            Pasien belum memiliki rekap
                          </span>
                        )}
                        <Link
                          href={`/rekap-layanan/pasien/${p.id_pasien}`}
                          className="px-3 py-1.5 rounded-lg bg-[#0b796b] hover:bg-[#07594f] text-white font-medium text-[11px] transition"
                        >
                          Pilih Pasien
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Pasien tidak ditemukan
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Periksa kembali nama atau No. RM yang Anda masukkan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-semibold text-[#0b796b] hover:underline"
                  >
                    Hapus Pencarian
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab List (Figma 143:104 - 143:121) */}
        <div className="border-b border-[#e9ebf0] px-5 flex items-center gap-5.5 overflow-x-auto">
          {/* Tab: Semua */}
          <button
            type="button"
            onClick={() => setActiveTab("Semua")}
            className="flex items-center gap-1.5 h-[42px] px-0.5 relative cursor-pointer"
          >
            <span
              className={`text-[11px] font-medium ${
                activeTab === "Semua" ? "text-[#0b796b]" : "text-[#667085]"
              }`}
            >
              Semua
            </span>
            <span
              className={`h-[18px] min-w-[20px] px-1.5 rounded-[9px] text-[9px] font-medium flex items-center justify-center ${
                activeTab === "Semua"
                  ? "bg-[#e7faf7] text-[#0b796b]"
                  : "bg-[#f0f2f3] text-[#737b88]"
              }`}
            >
              {counts.total}
            </span>
            {activeTab === "Semua" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00b89f] rounded-t-[2px]" />
            )}
          </button>

          {/* Tab: Draft */}
          <button
            type="button"
            onClick={() => setActiveTab("Draft")}
            className="flex items-center gap-1.5 h-[42px] px-0.5 relative cursor-pointer"
          >
            <span
              className={`text-[11px] font-medium ${
                activeTab === "Draft" ? "text-[#0b796b]" : "text-[#667085]"
              }`}
            >
              Draft
            </span>
            <span
              className={`h-[18px] min-w-[20px] px-1.5 rounded-[9px] text-[9px] font-medium flex items-center justify-center ${
                activeTab === "Draft"
                  ? "bg-[#e7faf7] text-[#0b796b]"
                  : "bg-[#f0f2f3] text-[#737b88]"
              }`}
            >
              {counts.draft}
            </span>
            {activeTab === "Draft" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00b89f] rounded-t-[2px]" />
            )}
          </button>

          {/* Tab: Proses Verifikasi */}
          <button
            type="button"
            onClick={() => setActiveTab("Proses Verifikasi")}
            className="flex items-center gap-1.5 h-[42px] px-0.5 relative cursor-pointer"
          >
            <span
              className={`text-[11px] font-medium ${
                activeTab === "Proses Verifikasi"
                  ? "text-[#0b796b]"
                  : "text-[#667085]"
              }`}
            >
              Proses Verifikasi
            </span>
            <span
              className={`h-[18px] min-w-[20px] px-1.5 rounded-[9px] text-[9px] font-medium flex items-center justify-center ${
                activeTab === "Proses Verifikasi"
                  ? "bg-[#e7faf7] text-[#0b796b]"
                  : "bg-[#f0f2f3] text-[#737b88]"
              }`}
            >
              {counts.verifikasi}
            </span>
            {activeTab === "Proses Verifikasi" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00b89f] rounded-t-[2px]" />
            )}
          </button>

          {/* Tab: Siap Billing */}
          <button
            type="button"
            onClick={() => setActiveTab("Siap Billing")}
            className="flex items-center gap-1.5 h-[42px] px-0.5 relative cursor-pointer"
          >
            <span
              className={`text-[11px] font-medium ${
                activeTab === "Siap Billing" ? "text-[#0b796b]" : "text-[#667085]"
              }`}
            >
              Siap Billing
            </span>
            <span
              className={`h-[18px] min-w-[20px] px-1.5 rounded-[9px] text-[9px] font-medium flex items-center justify-center ${
                activeTab === "Siap Billing"
                  ? "bg-[#e7faf7] text-[#0b796b]"
                  : "bg-[#f0f2f3] text-[#737b88]"
              }`}
            >
              {counts.siapBilling}
            </span>
            {activeTab === "Siap Billing" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00b89f] rounded-t-[2px]" />
            )}
          </button>
        </div>

        {/* Table Content (Figma 143:123 - 143:240) */}
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8faf9] border-b border-[#e9ebf0] text-[9px] font-medium text-[#667085] uppercase tracking-[0.225px]">
                <th className="py-3 pl-5 pr-3 w-[50px]">No.</th>
                <th className="py-3 px-3 w-[220px]">Nama Pasien</th>
                <th className="py-3 px-3 w-[124px]">No. RM</th>
                <th className="py-3 px-3 w-[142px]">Periode Perawatan</th>
                <th className="py-3 px-3 w-[120px]">Jumlah Layanan</th>
                <th className="py-3 px-3 w-[110px]">Status Rekap</th>
                <th className="py-3 px-3 w-[140px]">Terakhir Diperbarui</th>
                <th className="py-3 pl-3 pr-5 text-right w-[180px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f1] text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Memuat data rekap layanan &amp; tindakan...
                  </td>
                </tr>
              ) : filteredHistories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
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
                      className="hover:bg-[#fbfcfc] transition"
                    >
                      {/* No */}
                      <td className="py-3.5 pl-5 pr-3 font-normal text-[#475467]">
                        {numStr}
                      </td>

                      {/* Nama Pasien + Room */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[32px] h-[32px] rounded-[9px] bg-[#e7faf7] text-[#0b796b] font-medium text-[9px] flex items-center justify-center shrink-0">
                            {getInitials(h.nama_pasien)}
                          </div>
                          <div>
                            <div className="font-normal text-[#2b313b] text-[11px]">
                              {h.nama_pasien}
                            </div>
                            <div className="text-[9px] text-[#98a2b3]">
                              {h.nama_kamar || "Cendana 1 • Kamar 108"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* No RM */}
                      <td className="py-3.5 px-3 font-medium text-[#344054]">
                        {h.no_rm}
                      </td>

                      {/* Periode */}
                      <td className="py-3.5 px-3 font-normal text-[#475467]">
                        {h.periode_perawatan || "15–19 Februari 2026"}
                      </td>

                      {/* Jumlah Layanan */}
                      <td className="py-3.5 px-3 font-normal text-[#2b313b]">
                        <span>{h.jumlah_tindakan}</span>{" "}
                        <span className="text-[#475467]">item</span>
                      </td>

                      {/* Status Rekap Badge */}
                      <td className="py-3.5 px-3">
                        {isDraft ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[12px] bg-[#e7faf7] border border-[#ccefeb] text-[#0b796b] text-[9px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0fa18f]" />
                            <span>Draft</span>
                          </div>
                        ) : isSiapBilling ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[12px] bg-[#e6f4ef] border border-[#cbe7dd] text-[#016b46] text-[9px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#018f5d]" />
                            <span>Siap Billing</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[12px] bg-[#fef3e9] border border-[#fed7aa] text-[#b45309] text-[9px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                            <span>Proses Verifikasi</span>
                          </div>
                        )}
                      </td>

                      {/* Terakhir Diperbarui */}
                      <td className="py-3.5 px-3 font-normal text-[#475467]">
                        {h.tanggal_diperbarui_formatted || "Kemarin, 16.42"}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 pl-3 pr-5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Lihat Detail */}
                          <Link
                            href={`/rekap-layanan/${h.id_rekap}`}
                            className="text-[#0b796b] hover:text-[#07594f] font-medium text-[10px] px-2 py-1 rounded-md hover:bg-teal-50 transition"
                          >
                            Lihat Detail
                          </Link>

                          {/* Edit Icon (Hidden if locked in Siap Billing) */}
                          {!isSiapBilling && (
                            <Link
                              href={`/rekap-layanan/${h.id_rekap}/edit`}
                              title="Edit Rekap"
                              className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[#667085] hover:text-[#1e1e1e] hover:bg-slate-100 transition"
                            >
                              <Edit3 className="w-[15px] h-[15px]" />
                            </Link>
                          )}

                          {/* 3 Dots Menu Button (Figma 72:2169) */}
                          <div className="relative" data-action-menu>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(isMenuOpen ? null : h.id_rekap);
                              }}
                              className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[#667085] hover:text-[#1e1e1e] hover:bg-slate-100 transition cursor-pointer"
                            >
                              <MoreHorizontal className="w-[18px] h-[18px]" />
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

        {/* Table Footer: Pagination & Count (Figma 143:244 - 143:253) */}
        <div className="border-t border-[#e9ebf0] px-5 py-3.5 flex items-center justify-between text-[10px] text-[#667085]">
          <div>
            Menampilkan <span className="text-[#344054] font-medium">{filteredHistories.length}</span> dari{" "}
            <span className="text-[#344054] font-medium">{histories.length}</span> rekap
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="w-[30px] h-[30px] rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center text-xs"
            >
              ‹
            </button>
            <button
              type="button"
              className="w-[30px] h-[30px] rounded-lg border border-teal-500 bg-teal-50 text-[#0b796b] font-medium flex items-center justify-center text-xs"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="w-[30px] h-[30px] rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center text-xs"
            >
              ›
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
