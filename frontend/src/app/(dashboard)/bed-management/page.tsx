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
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canManageMasterBed =
    user?.role === "PETUGAS_BED_MANAGEMENT" || isSuperAdmin;
  const canAllocateBed = user?.role === "PETUGAS_ADMINISTRASI" || isSuperAdmin;
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Backend Connection Error Banner */}
      {loadError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition shrink-0 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            MANAJEMEN INVENTARIS KAMAR
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Pemantauan & Ketersediaan Bed
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Kelola inventaris kamar rawat inap dan pantau status ketersediaan tempat tidur secara real-time.
          </p>
        </div>

        {/* Action Buttons with RBAC */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {canAllocateBed && (
            <Link
              href="/bed-management/alokasi"
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Bed className="w-4 h-4 text-slate-500" />
              <span>Alokasi Kamar</span>
            </Link>
          )}

          {canManageMasterBed && (
            <button
              type="button"
              onClick={() => setIsTambahOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Bed Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* RBAC Notice Banner */}
      {isSuperAdmin ? (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>Super Admin (Akses Penuh)</strong> — Anda memiliki wewenang mengelola master bed serta melakukan alokasi kamar pasien.
            </span>
          </div>
          <Link
            href="/bed-management/alokasi"
            className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium shrink-0 transition"
          >
            Form Alokasi &rarr;
          </Link>
        </div>
      ) : !canManageMasterBed && (
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Peran: Petugas Administrasi</strong> — Anda dapat memantau ketersediaan dan melakukan <em>Alokasi Kamar Pasien</em>. Pengelolaan master bed adalah wewenang <em>Petugas Bed Management</em>.
            </span>
          </div>
          <Link
            href="/bed-management/alokasi"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium shrink-0 transition"
          >
            Form Alokasi &rarr;
          </Link>
        </div>
      )}

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tersedia */}
        <div
          onClick={() => setStatusTab("Tersedia")}
          className={`bg-white rounded-xl border p-4 sm:p-4.5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer group ${
            statusTab === "Tersedia"
              ? "border-emerald-600 ring-2 ring-emerald-500/30"
              : "border-slate-200/90 hover:border-emerald-400"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Bed className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Tersedia</div>
              <div className="text-[11px] text-slate-500">Siap ditempati</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.tersedia}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 2: Terisi */}
        <div
          onClick={() => setStatusTab("Terisi")}
          className={`bg-white rounded-xl border p-4 sm:p-4.5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer group ${
            statusTab === "Terisi"
              ? "border-rose-500 ring-2 ring-rose-500/30"
              : "border-slate-200/90 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Terisi</div>
              <div className="text-[11px] text-slate-500">Digunakan pasien</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.terisi}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 3: Pembersihan */}
        <div
          onClick={() => setStatusTab("Pembersihan")}
          className={`bg-white rounded-xl border p-4 sm:p-4.5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer group ${
            statusTab === "Pembersihan"
              ? "border-amber-500 ring-2 ring-amber-500/30"
              : "border-slate-200/90 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Pembersihan</div>
              <div className="text-[11px] text-slate-500">Proses sterilisasi</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.pembersihan}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 4: Pemeliharaan */}
        <div
          onClick={() => setStatusTab("Pemeliharaan")}
          className={`bg-white rounded-xl border p-4 sm:p-4.5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer group ${
            statusTab === "Pemeliharaan"
              ? "border-slate-500 ring-2 ring-slate-400/30"
              : "border-slate-200/90 hover:border-slate-400"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Pemeliharaan</div>
              <div className="text-[11px] text-slate-500">Perbaikan fasilitas</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {metrics.pemeliharaan}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* MAIN DATA PANEL: DUAL-MODE TABLE & FILTER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID Bed, Bangsal, atau Kamar..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            {/* Dropdown Filters with Icons */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {/* Ward Filter */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full appearance-none pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
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
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="w-full appearance-none pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
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
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
            {(
              [
                { id: "Semua", label: "Semua", count: metrics.total },
                { id: "Tersedia", label: "Tersedia", count: metrics.tersedia },
                { id: "Terisi", label: "Terisi", count: metrics.terisi },
                { id: "Pembersihan", label: "Pembersihan", count: metrics.pembersihan },
                { id: "Pemeliharaan", label: "Pemeliharaan", count: metrics.pemeliharaan },
              ] as const
            ).map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id)}
                  className={`pb-2.5 -mb-[15px] text-xs flex items-center gap-2 font-medium transition cursor-pointer shrink-0 ${
                    isActive
                      ? "text-emerald-700 font-semibold border-b-2 border-emerald-600"
                      : "text-slate-500 hover:text-slate-900 border-b-2 border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. DESKTOP TABLE VIEW (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
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
                      className="hover:bg-slate-50/60 transition group"
                    >
                      <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-normal">
                        {String(rowNumber).padStart(2, "0")}
                      </td>

                      {/* ID Bed */}
                      <td className="py-3.5 px-4 font-bold text-xs text-slate-900">
                        {bed.no_bed}
                      </td>

                      {/* Nama Bangsal */}
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {bed.nama_bangsal} • {bed.nama_kamar}
                      </td>

                      {/* Kelas Perawatan */}
                      <td className="py-3.5 px-4">
                        {bed.kelas_perawatan === "VIP" ? (
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            VIP
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-medium">
                            {bed.kelas_perawatan}
                          </span>
                        )}
                      </td>

                      {/* Status Operasional Pill with colored dot */}
                      <td className="py-3.5 px-4 text-center">
                        {bed.status === "Tersedia" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Tersedia
                          </span>
                        )}
                        {bed.status === "Terisi" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Terisi
                          </span>
                        )}
                        {bed.status === "Pembersihan" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pembersihan
                          </span>
                        )}
                        {bed.status === "Pemeliharaan" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Pemeliharaan
                          </span>
                        )}
                      </td>

                      {/* Terakhir Diperbarui */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {bed.updated_relative}
                      </td>

                      {/* Aksi Berbasis Role */}
                      <td className="py-3.5 px-4 text-center">
                        {canManageMasterBed ? (
                          <div className="flex items-center justify-center gap-3">
                            {isSuperAdmin && bed.status === "Tersedia" && (
                              <Link
                                href="/bed-management/alokasi"
                                className="px-2 py-0.5 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200"
                              >
                                Alokasikan
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedBedForStatus(bed)}
                              className="text-emerald-700 hover:text-emerald-800 font-medium text-xs transition cursor-pointer"
                            >
                              Ubah Status
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(bed)}
                              title={
                                isOccupied
                                  ? "Bed sedang terisi (SOP penolakan hapus)"
                                  : "Hapus tempat tidur dari inventaris"
                              }
                              className="p-1 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            {bed.status === "Tersedia" ? (
                              <Link
                                href="/bed-management/alokasi"
                                className="px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200"
                              >
                                Alokasikan
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
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

        {/* 2. MOBILE CARD VIEW (visible on < md) */}
        <div className="md:hidden p-3.5 space-y-3 divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400">
              <div className="w-6 h-6 mx-auto mb-2 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs">Memuat data tempat tidur...</p>
            </div>
          ) : paginatedBeds.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Tidak ada data tempat tidur yang sesuai.
            </div>
          ) : (
            paginatedBeds.map((bed) => {
              const isOccupied = bed.status === "Terisi";
              return (
                <div
                  key={bed.id_bed}
                  className="pt-3 first:pt-0 bg-white rounded-xl border border-slate-200/90 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {bed.no_bed}
                      </span>
                      {bed.kelas_perawatan === "VIP" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          VIP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {bed.kelas_perawatan}
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div>
                      {bed.status === "Tersedia" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Tersedia
                        </span>
                      )}
                      {bed.status === "Terisi" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Terisi
                        </span>
                      )}
                      {bed.status === "Pembersihan" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pembersihan
                        </span>
                      )}
                      {bed.status === "Pemeliharaan" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Pemeliharaan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      {bed.nama_bangsal} • {bed.nama_kamar}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {bed.updated_relative}
                    </span>
                  </div>

                  {/* Mobile Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {canManageMasterBed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedBedForStatus(bed)}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition text-center cursor-pointer"
                        >
                          Ubah Status
                        </button>
                        {isSuperAdmin && bed.status === "Tersedia" && (
                          <Link
                            href="/bed-management/alokasi"
                            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium text-center transition"
                          >
                            Alokasi
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(bed)}
                          className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Bed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      bed.status === "Tersedia" && (
                        <Link
                          href="/bed-management/alokasi"
                          className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium text-center transition"
                        >
                          Alokasikan ke Pasien
                        </Link>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-slate-800">
              {paginatedBeds.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-800">
              {filteredBeds.length}
            </span>{" "}
            data bed
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer"
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
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition flex items-center justify-center cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer"
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
