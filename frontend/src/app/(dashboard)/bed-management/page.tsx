"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BedItem, BedStatus, KelasPerawatan } from "@/types";
import { fetchBedsApi } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { TambahBedModal } from "@/components/bed-management/TambahBedModal";
import { UbahStatusModal } from "@/components/bed-management/UbahStatusModal";
import { KonfirmasiHapusModal } from "@/components/bed-management/KonfirmasiHapusModal";
import { PenolakanHapusModal } from "@/components/bed-management/PenolakanHapusModal";
import {
  Bed,
  Plus,
  Users,
  Search,
  Building2,
  Star,
  ChevronDown,
  ChevronRight,
  Clock,
  Trash2,
  Edit3,
  CheckCircle2,
  Activity,
  AlertCircle,
  Wrench,
  Sparkles,
  ArrowRight,
  Filter,
  ShieldAlert,
  Lock,
} from "lucide-react";

export default function BedManagementPage() {
  const { user } = useAuth();
  const isBedManager = user?.role === "PETUGAS_BED_MANAGEMENT";

  const [beds, setBeds] = useState<BedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState("Semua Bangsal");
  const [selectedKelas, setSelectedKelas] = useState("Semua Kelas");
  const [statusTab, setStatusTab] = useState<"Semua" | BedStatus>("Semua");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // As displayed in Figma frame 164:3797 (5 rows per page)

  // Modal States
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [selectedBedForStatus, setSelectedBedForStatus] =
    useState<BedItem | null>(null);
  const [selectedBedForDelete, setSelectedBedForDelete] =
    useState<BedItem | null>(null);
  const [selectedBedForReject, setSelectedBedForReject] =
    useState<BedItem | null>(null);

  // Success Notification & Error State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetchBedsApi();
      setBeds(res.items);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data tempat tidur.";
      setLoadError(msg);
      console.error("[BedManagement] Error loading beds:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Metric counts calculated from live data
  const metrics = useMemo(() => {
    const tersedia = beds.filter((b) => b.status === "Tersedia").length;
    const terisi = beds.filter((b) => b.status === "Terisi").length;
    const pembersihan = beds.filter((b) => b.status === "Pembersihan").length;
    const pemeliharaan = beds.filter((b) => b.status === "Pemeliharaan").length;
    return {
      total: beds.length,
      tersedia,
      terisi,
      pembersihan,
      pemeliharaan,
    };
  }, [beds]);

  // Filtered beds
  const filteredBeds = useMemo(() => {
    return beds.filter((bed) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNo = bed.no_bed.toLowerCase().includes(q);
        const matchesBangsal = bed.nama_bangsal.toLowerCase().includes(q);
        const matchesKamar = bed.nama_kamar.toLowerCase().includes(q);
        if (!matchesNo && !matchesBangsal && !matchesKamar) return false;
      }
      // Bangsal
      if (
        selectedWard !== "Semua Bangsal" &&
        !bed.nama_bangsal.toLowerCase().includes(selectedWard.toLowerCase().replace("bangsal ", ""))
      ) {
        return false;
      }
      // Kelas
      if (selectedKelas !== "Semua Kelas" && bed.kelas_perawatan !== selectedKelas) {
        return false;
      }
      // Status Tab
      if (statusTab !== "Semua" && bed.status !== statusTab) {
        return false;
      }
      return true;
    });
  }, [beds, searchQuery, selectedWard, selectedKelas, statusTab]);

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(filteredBeds.length / pageSize));
  const paginatedBeds = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBeds.slice(start, start + pageSize);
  }, [filteredBeds, currentPage, pageSize]);

  // Adjust page if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedWard, selectedKelas, statusTab]);

  // Delete Action Dispatcher (Rules UC-02 EF-01)
  const handleDeleteClick = (bed: BedItem) => {
    if (bed.status === "Terisi") {
      // Trigger rejection modal per Figma frame 285:279
      setSelectedBedForReject(bed);
    } else {
      // Trigger normal confirmation modal per Figma frame 285:190
      setSelectedBedForDelete(bed);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a2e28] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-teal-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#00b89f]" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Backend Connection Error Banner */}
      {loadError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-[6px] font-medium transition shrink-0 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* PAGE HEADER (Matched to Official Clinical Screenshot) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f] mb-1">
            MANAJEMEN INVENTARIS KAMAR
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1e1e1e] tracking-tight leading-tight">
            Pemantauan & Pengelolaan<br className="hidden sm:inline" /> Ketersediaan Bed
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1.5 max-w-2xl leading-relaxed">
            Kelola data inventaris kamar dan pantau status operasional tempat tidur rawat inap secara real-time.
          </p>
        </div>

        {/* Action Buttons with RBAC */}
        <div className="flex items-center gap-3 shrink-0 pt-1">
          {!isBedManager && (
            <Link
              href="/bed-management/alokasi"
              className="px-4 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] text-xs sm:text-sm font-medium flex items-center gap-2 shadow-2xs transition"
            >
              <Bed className="w-4 h-4 text-[#4b5563]" />
              <span>Alokasi Kamar Pasien</span>
            </Link>
          )}

          {isBedManager && (
            <button
              type="button"
              onClick={() => setIsTambahOpen(true)}
              className="px-4 py-2.5 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs sm:text-sm font-medium shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Bed Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* RBAC Notice Banner for Petugas Administrasi */}
      {!isBedManager && (
        <div className="p-3.5 rounded-[12px] bg-teal-900/5 border border-teal-800/15 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#0fa18f] shrink-0" />
            <span>
              <strong>Peran Akun: Petugas Administrasi</strong> — Akses Anda difokuskan untuk pemantauan ketersediaan dan melakukan <em>Alokasi Kamar Pasien</em>. Pendaftaran tempat tidur baru, pengubahan status manual (Pembersihan/Pemeliharaan), serta pengelolaan master bed merupakan wewenang <em>Petugas Bed Management</em>.
            </span>
          </div>
          <Link
            href="/bed-management/alokasi"
            className="px-3.5 py-1.5 rounded-[8px] bg-[#0a2e28] hover:bg-[#0d3b36] text-white text-xs font-medium shrink-0 transition"
          >
            Form Alokasi &rarr;
          </Link>
        </div>
      )}

      {/* 4 SUMMARY METRIC CARDS (Exact Match to Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tersedia */}
        <div
          onClick={() => setStatusTab("Tersedia")}
          className={`bg-white rounded-[12px] border p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] transition cursor-pointer group ${
            statusTab === "Tersedia"
              ? "border-[#00b89f] ring-1 ring-[#00b89f]"
              : "border-[#e9ebf0] hover:border-[#00b89f]/60"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#e6f4ef] text-[#00b89f] flex items-center justify-center shrink-0">
              <Bed className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Tersedia</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Siap ditempati pasien</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
              {metrics.tersedia}
            </span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 2: Terisi */}
        <div
          onClick={() => setStatusTab("Terisi")}
          className={`bg-white rounded-[12px] border p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] transition cursor-pointer group ${
            statusTab === "Terisi"
              ? "border-rose-400 ring-1 ring-rose-400"
              : "border-[#e9ebf0] hover:border-rose-300"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#fdf0f0] text-[#dc2626] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Terisi</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Digunakan pasien</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
              {metrics.terisi}
            </span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 3: Pembersihan */}
        <div
          onClick={() => setStatusTab("Pembersihan")}
          className={`bg-white rounded-[12px] border p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] transition cursor-pointer group ${
            statusTab === "Pembersihan"
              ? "border-amber-400 ring-1 ring-amber-400"
              : "border-[#e9ebf0] hover:border-amber-300"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#fef3e9] text-[#d97706] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Pembersihan</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Dalam proses sterilisasi</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
              {metrics.pembersihan}
            </span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 4: Pemeliharaan */}
        <div
          onClick={() => setStatusTab("Pemeliharaan")}
          className={`bg-white rounded-[12px] border p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] transition cursor-pointer group ${
            statusTab === "Pemeliharaan"
              ? "border-slate-400 ring-1 ring-slate-400"
              : "border-[#e9ebf0] hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[10px] bg-[#f3f4f6] text-[#6b7280] flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">Pemeliharaan</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Perbaikan fasilitas</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
              {metrics.pemeliharaan}
            </span>
            <ChevronRight className="w-4 h-4 text-[#bfbfbf] group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* MAIN DATA TABLE & FILTER PANEL */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] overflow-hidden">
        {/* Toolbar & Filter Bar */}
        <div className="p-5 border-b border-[#f0f2f5] space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box with Cari Button */}
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari ID Bed atau Nama Bangsal..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
                />
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs font-medium text-[#1e1e1e] hover:bg-slate-50 transition cursor-pointer shrink-0"
              >
                Cari
              </button>
            </div>

            {/* Dropdown Filters with Icons */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Ward Filter */}
              <div className="relative">
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#4b5563] focus:outline-none focus:border-[#00b89f] cursor-pointer"
                >
                  <option value="Semua Bangsal">Semua Bangsal</option>
                  <option value="Anggrek 1">Anggrek 1</option>
                  <option value="Cendana 2">Cendana 2</option>
                  <option value="Mawar 3">Mawar 3</option>
                  <option value="Melati 1">Melati 1</option>
                  <option value="Bougenville 4">Bougenville 4</option>
                </select>
                <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Class Filter */}
              <div className="relative">
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#4b5563] focus:outline-none focus:border-[#00b89f] cursor-pointer"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  <option value="VIP">VIP</option>
                  <option value="Kelas 1">Kelas 1</option>
                  <option value="Kelas 2">Kelas 2</option>
                  <option value="Kelas 3">Kelas 3</option>
                </select>
                <Star className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="flex items-center gap-6 overflow-x-auto pt-2 border-t border-[#f0f2f5]">
            {[
              { id: "Semua", label: "Semua", count: metrics.total },
              { id: "Tersedia", label: "Tersedia", count: metrics.tersedia },
              { id: "Terisi", label: "Terisi", count: metrics.terisi },
              { id: "Pembersihan", label: "Pembersihan", count: metrics.pembersihan },
              { id: "Pemeliharaan", label: "Pemeliharaan", count: metrics.pemeliharaan },
            ].map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id as any)}
                  className={`pb-3 -mb-[17px] text-xs flex items-center gap-2 font-medium transition cursor-pointer shrink-0 ${
                    isActive
                      ? "text-[#00b89f] font-semibold border-b-2 border-[#00b89f]"
                      : "text-[#666666] hover:text-[#1e1e1e] border-b-2 border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      isActive
                        ? "bg-[#e7faf7] text-[#00b89f] font-semibold"
                        : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fcfdfd] border-b border-[#f0f2f5] text-[10px] font-semibold text-[#8c8c8c] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">NO.</th>
                <th className="py-3.5 px-4">ID BED</th>
                <th className="py-3.5 px-4">NAMA BANGSAL</th>
                <th className="py-3.5 px-4">KELAS PERAWATAN</th>
                <th className="py-3.5 px-4 text-center">STATUS OPERASIONAL</th>
                <th className="py-3.5 px-4">TERAKHIR DIPERBARUI</th>
                <th className="py-3.5 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f6f8] text-[#1e1e1e]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#00b89f]/20 border-t-[#00b89f] rounded-full animate-spin" />
                      <span>Memuat data inventaris bed...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBeds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data tempat tidur yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedBeds.map((bed, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isOccupied = bed.status === "Terisi";

                  return (
                    <tr
                      key={bed.id_bed}
                      className="hover:bg-[#fafbfb] transition group"
                    >
                      <td className="py-3.5 px-4 text-center text-xs text-[#8c8c8c] font-normal">
                        {String(rowNumber).padStart(2, "0")}
                      </td>

                      {/* ID Bed */}
                      <td className="py-3.5 px-4 font-bold text-xs text-[#1e1e1e]">
                        {bed.no_bed}
                      </td>

                      {/* Nama Bangsal */}
                      <td className="py-3.5 px-4 text-xs text-[#1e1e1e]">
                        {bed.nama_bangsal} • {bed.nama_kamar}
                      </td>

                      {/* Kelas Perawatan */}
                      <td className="py-3.5 px-4">
                        {bed.kelas_perawatan === "VIP" ? (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]">
                            VIP
                          </span>
                        ) : (
                          <span className="text-xs text-[#4b5563]">
                            {bed.kelas_perawatan}
                          </span>
                        )}
                      </td>

                      {/* Status Operasional Pill with colored dot */}
                      <td className="py-3.5 px-4 text-center">
                        {bed.status === "Tersedia" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                            Tersedia
                          </span>
                        )}
                        {bed.status === "Terisi" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#fdf0f0] text-[#dc2626] border border-[#fecaca]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                            Terisi
                          </span>
                        )}
                        {bed.status === "Pembersihan" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                            Pembersihan
                          </span>
                        )}
                        {bed.status === "Pemeliharaan" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                            Pemeliharaan
                          </span>
                        )}
                      </td>

                      {/* Terakhir Diperbarui */}
                      <td className="py-3.5 px-4 text-xs text-[#666666]">
                        {bed.updated_relative}
                      </td>

                      {/* Aksi Berbasis Role */}
                      <td className="py-3.5 px-4 text-center">
                        {isBedManager ? (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedBedForStatus(bed)}
                              className="text-[#00b89f] hover:text-[#00a28c] hover:underline font-medium text-xs transition cursor-pointer"
                            >
                              Ubah Status
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(bed)}
                              title={
                                isOccupied
                                  ? "Bed sedang terisi pasien aktif (Klik untuk melihat SOP penolakan)"
                                  : "Hapus data tempat tidur dari inventaris"
                              }
                              className="p-1 text-rose-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            {bed.status === "Tersedia" ? (
                              <Link
                                href="/bed-management/alokasi"
                                className="px-2.5 py-1 rounded-[6px] text-xs font-medium text-[#00b89f] bg-[#e7faf7] hover:bg-[#d8f5ef] transition"
                              >
                                Alokasikan
                              </Link>
                            ) : (
                              <span className="text-xs text-[#8c8c8c] italic">
                                Hanya Pantau
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#f0f2f5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8c8c8c]">
          <div>
            Menampilkan{" "}
            <span className="font-medium text-[#1e1e1e]">
              {paginatedBeds.length}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-[#1e1e1e]">
              {filteredBeds.length}
            </span>{" "}
            data bed
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-[6px] border border-[#e2e8f0] bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
            >
              &lt;
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-[6px] text-xs font-medium transition flex items-center justify-center ${
                    isActive
                      ? "bg-[#00b89f] text-white shadow-2xs"
                      : "border border-[#e2e8f0] bg-white text-[#4b5563] hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-[6px] border border-[#e2e8f0] bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>


      {/* MODAL 1: TAMBAH BED BARU (Figma 217:13467) */}
      <TambahBedModal
        isOpen={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
        allExistingBeds={beds}
        onSuccess={(newBed) => {
          setBeds((prev) => [newBed, ...prev]);
          showToast(`Tempat tidur ${newBed.no_bed} berhasil didaftarkan ke SIMRS.`);
        }}
      />

      {/* MODAL 2: UBAH STATUS KETERSEDIAAN BED (Figma 285:189) */}
      <UbahStatusModal
        isOpen={!!selectedBedForStatus}
        onClose={() => setSelectedBedForStatus(null)}
        bed={selectedBedForStatus}
        onSuccess={(updated) => {
          setBeds((prev) =>
            prev.map((b) => (b.id_bed === updated.id_bed ? updated : b))
          );
          showToast(`Status ${updated.no_bed} berhasil diubah menjadi ${updated.status}.`);
        }}
      />

      {/* MODAL 3: KONFIRMASI HAPUS DATA BED (Figma 285:190) */}
      <KonfirmasiHapusModal
        isOpen={!!selectedBedForDelete}
        onClose={() => setSelectedBedForDelete(null)}
        bed={selectedBedForDelete}
        onSuccess={(deletedId) => {
          setBeds((prev) => prev.filter((b) => b.id_bed !== deletedId));
          showToast(`Data tempat tidur berhasil dihapus dari inventaris.`);
        }}
      />

      {/* MODAL 4: PENOLAKAN HAPUS BED TERISI (Figma 285:279) */}
      <PenolakanHapusModal
        isOpen={!!selectedBedForReject}
        onClose={() => setSelectedBedForReject(null)}
        bed={selectedBedForReject}
      />
    </div>
  );
}
