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

  // Success Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchBedsApi();
      setBeds(res.items);
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d332f] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-teal-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#13c9b3]" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* PAGE HEADER (Figma 164:3797) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#13c9b3]" />
            {isBedManager
              ? "Manajemen Inventaris Kamar"
              : "Manajemen Inventaris Kamar (Mode Pemantauan)"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Pemantauan & Pengelolaan Ketersediaan Bed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {isBedManager
              ? "Pantau ketersediaan ranjang bangsal secara real-time, perbarui status kebersihan dan pemeliharaan, serta tambah data inventaris kamar."
              : "Pantau ketersediaan ranjang bangsal untuk alokasi kamar pasien rawat inap baru. Pengelolaan inventaris master bed dikhususkan bagi Petugas Bed Management."}
          </p>
        </div>

        {/* Action Buttons with RBAC */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/bed-management/alokasi"
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
              isBedManager
                ? "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
                : "bg-[#13c9b3] hover:bg-[#0fb39f] active:bg-[#0c9d8c] text-[#0d332f] font-bold shadow-md shadow-teal-500/20"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alokasi Kamar Pasien</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {isBedManager && (
            <button
              type="button"
              onClick={() => setIsTambahOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#13c9b3] hover:bg-[#0fb39f] active:bg-[#0c9d8c] text-[#0d332f] text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Bed Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* RBAC Notice Banner for Petugas Administrasi */}
      {!isBedManager && (
        <div className="p-3.5 rounded-2xl bg-teal-900/5 border border-teal-800/15 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              <strong>Peran Akun: Petugas Administrasi</strong> — Akses Anda difokuskan untuk pemantauan ketersediaan dan melakukan <em>Alokasi Kamar Pasien (UC-03)</em>. Pendaftaran tempat tidur baru, pengubahan status manual (Pembersihan/Pemeliharaan), serta penghapusan master bed merupakan wewenang <em>Petugas Bed Management (UC-02)</em>.
            </span>
          </div>
          <Link
            href="/bed-management/alokasi"
            className="px-3.5 py-1.5 rounded-xl bg-[#0d332f] hover:bg-[#102d2a] text-white text-xs font-semibold shrink-0 transition"
          >
            Form Alokasi &rarr;
          </Link>
        </div>
      )}

      {/* 4 SUMMARY METRIC CARDS (Figma 164:3797) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tersedia */}
        <div
          onClick={() => setStatusTab("Tersedia")}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition shadow-xs cursor-pointer group ${
            statusTab === "Tersedia"
              ? "border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-50/20"
              : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Tersedia</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {metrics.tersedia}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center group-hover:translate-x-0.5 transition">
              Siap Huni <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Terisi */}
        <div
          onClick={() => setStatusTab("Terisi")}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition shadow-xs cursor-pointer group ${
            statusTab === "Terisi"
              ? "border-blue-400 ring-2 ring-blue-400/20 bg-blue-50/20"
              : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Terisi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {metrics.terisi}
            </span>
            <span className="text-xs font-semibold text-blue-600 flex items-center group-hover:translate-x-0.5 transition">
              Aktif Pasien <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Pembersihan */}
        <div
          onClick={() => setStatusTab("Pembersihan")}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition shadow-xs cursor-pointer group ${
            statusTab === "Pembersihan"
              ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
              : "border-slate-200/80 hover:border-amber-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Pembersihan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {metrics.pembersihan}
            </span>
            <span className="text-xs font-semibold text-amber-600 flex items-center group-hover:translate-x-0.5 transition">
              Sterilisasi <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Pemeliharaan */}
        <div
          onClick={() => setStatusTab("Pemeliharaan")}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition shadow-xs cursor-pointer group ${
            statusTab === "Pemeliharaan"
              ? "border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20"
              : "border-slate-200/80 hover:border-rose-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Pemeliharaan</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {metrics.pemeliharaan}
            </span>
            <span className="text-xs font-semibold text-rose-600 flex items-center group-hover:translate-x-0.5 transition">
              Perbaikan <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* MAIN DATA TABLE PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Toolbar & Filters (Figma 164:3797) */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID Bed atau Nama Bangsal..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]/40 focus:border-[#13c9b3]"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2.5">
              {/* Ward Dropdown */}
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]/40 cursor-pointer"
              >
                <option value="Semua Bangsal">Semua Bangsal</option>
                <option value="Anggrek 1">Anggrek 1</option>
                <option value="Cendana 2">Cendana 2</option>
                <option value="Paviliun VIP">Paviliun VIP</option>
                <option value="Melati 3">Melati 3</option>
                <option value="Bougenville 4">Bougenville 4</option>
              </select>

              {/* Class Dropdown */}
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]/40 cursor-pointer"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                <option value="VIP">VIP</option>
                <option value="Kelas 1">Kelas 1</option>
                <option value="Kelas 2">Kelas 2</option>
                <option value="Kelas 3">Kelas 3</option>
              </select>
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            <button
              type="button"
              onClick={() => setStatusTab("Semua")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusTab === "Semua"
                  ? "bg-[#0d332f] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>Semua</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusTab === "Semua"
                    ? "bg-teal-400/20 text-teal-200"
                    : "bg-white text-slate-600"
                }`}
              >
                {metrics.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab("Tersedia")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusTab === "Tersedia"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <span>Tersedia</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-emerald-800">
                {metrics.tersedia}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab("Terisi")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusTab === "Terisi"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <span>Terisi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-blue-800">
                {metrics.terisi}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab("Pembersihan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusTab === "Pembersihan"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <span>Pembersihan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-800">
                {metrics.pembersihan}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab("Pemeliharaan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusTab === "Pemeliharaan"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <span>Pemeliharaan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-rose-800">
                {metrics.pemeliharaan}
              </span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4">ID Bed</th>
                <th className="py-3 px-4">Nama Bangsal & Kamar</th>
                <th className="py-3 px-4">Kelas Perawatan</th>
                <th className="py-3 px-4">Status Operasional</th>
                <th className="py-3 px-4">Terakhir Diperbarui</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
                      <span>Memuat inventaris kamar...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBeds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data tempat tidur yang sesuai dengan kriteria pencarian/filter.
                  </td>
                </tr>
              ) : (
                paginatedBeds.map((bed, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isOccupied = bed.status === "Terisi";

                  return (
                    <tr
                      key={bed.id_bed}
                      className="hover:bg-teal-50/30 transition group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                        {rowNumber}
                      </td>

                      {/* ID Bed */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {bed.no_bed}
                        </span>
                      </td>

                      {/* Nama Bangsal & Kamar */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {bed.nama_bangsal}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {bed.nama_kamar} • {bed.tipe_bed}
                        </div>
                      </td>

                      {/* Kelas Perawatan */}
                      <td className="py-3.5 px-4">
                        {bed.kelas_perawatan === "VIP" ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            VIP
                          </span>
                        ) : (
                          <span className="font-medium text-slate-700">
                            {bed.kelas_perawatan}
                          </span>
                        )}
                      </td>

                      {/* Status Operasional Pill with colored dot */}
                      <td className="py-3.5 px-4">
                        {bed.status === "Tersedia" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Tersedia
                          </span>
                        )}
                        {bed.status === "Terisi" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Terisi
                          </span>
                        )}
                        {bed.status === "Pembersihan" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pembersihan
                          </span>
                        )}
                        {bed.status === "Pemeliharaan" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Pemeliharaan
                          </span>
                        )}
                      </td>

                      {/* Terakhir Diperbarui */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{bed.updated_relative}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {bed.updated_timestamp}
                        </div>
                      </td>

                      {/* Aksi Berbasis Role (RBAC) */}
                      <td className="py-3.5 px-4 text-center">
                        {isBedManager ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedBedForStatus(bed)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0d332f] bg-teal-50 hover:bg-[#13c9b3]/20 border border-teal-200/60 transition cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-[#13c9b3]" />
                              <span>Ubah Status</span>
                            </button>

                            {/* Trash Delete Button:
                                If Terisi -> shows muted trash icon and triggers rejection modal (Figma 285:279)
                                If not Terisi -> triggers confirmation modal (Figma 285:190)
                            */}
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(bed)}
                              title={
                                isOccupied
                                  ? "Bed sedang terisi pasien aktif (Klik untuk melihat SOP penolakan)"
                                  : "Hapus data tempat tidur dari inventaris"
                              }
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isOccupied
                                  ? "text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                  : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* Petugas Administrasi: Mode Pemantauan & Alokasi */
                          <div className="flex items-center justify-center">
                            {bed.status === "Tersedia" ? (
                              <Link
                                href="/bed-management/alokasi"
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0d332f] bg-[#13c9b3]/20 hover:bg-[#13c9b3]/40 border border-[#13c9b3]/50 transition flex items-center gap-1 shadow-2xs"
                              >
                                <Users className="w-3 h-3 text-teal-800" />
                                <span>Alokasikan</span>
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                                <Lock className="w-3 h-3 text-slate-300" />
                                <span>Hanya Pantau</span>
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

        {/* Pagination Footer (Figma 164:3797) */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan{" "}
            <strong>
              {filteredBeds.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(currentPage * pageSize, filteredBeds.length)}
            </strong>{" "}
            dari <strong>{filteredBeds.length}</strong> data bed
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#0d332f] text-white shadow-xs"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                    currentPage === totalPages
                      ? "bg-[#0d332f] text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
