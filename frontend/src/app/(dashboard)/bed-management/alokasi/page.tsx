"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BedItem, KelasPerawatan, PasienCandidate } from "@/types";
import { fetchAvailableBedsApi, createAllocationApi } from "@/lib/api-client";
import { INITIAL_PASIEN_CANDIDATES } from "@/lib/mock-fallback";
import {
  ArrowLeft,
  Bed,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  ShieldCheck,
  User,
  Stethoscope,
  FileText,
  AlertCircle,
  RefreshCw,
  Check,
  Sparkles,
} from "lucide-react";

export default function AlokasiBedPage() {
  const router = useRouter();

  const [beds, setBeds] = useState<BedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState<string>("Kelas 1"); // Default Kelas 1 as in Figma 193:9909

  // Selected Bed for allocation (Default BED-ANG-101 as in Figma 193:9909)
  const [selectedBedId, setSelectedBedId] = useState<number | null>(1);

  // Selected Patient (Default Hendra Wijaya RM-2026-00142 as in Figma 193:9909)
  const [selectedPatientId, setSelectedPatientId] = useState<number>(101);

  // Countdown timer for Row-Level Lock (5 minutes = 300 seconds)
  const [lockSeconds, setLockSeconds] = useState(288); // 04:48s initially as shown in Figma

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    bedNo: string;
    patientName: string;
    time: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load beds
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetchAvailableBedsApi();
        setBeds(res.items);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Row-level lock countdown interval
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockSeconds]);

  // Format seconds into MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} s`;
  };

  // Only Available beds can be allocated (Rule UC-03)
  const availableBeds = useMemo(() => {
    return beds.filter((b) => b.status === "Tersedia");
  }, [beds]);

  // Filter available beds by search and class
  const filteredAvailableBeds = useMemo(() => {
    return availableBeds.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNo = b.no_bed.toLowerCase().includes(q);
        const matchesWard = b.nama_bangsal.toLowerCase().includes(q);
        if (!matchesNo && !matchesWard) return false;
      }
      if (selectedKelas !== "Semua Kelas" && b.kelas_perawatan !== selectedKelas) {
        return false;
      }
      return true;
    });
  }, [availableBeds, searchQuery, selectedKelas]);

  // Auto-select first available bed if current selection is not valid
  useEffect(() => {
    if (availableBeds.length > 0) {
      const currentExists = availableBeds.some((b) => b.id_bed === selectedBedId);
      if (!currentExists) {
        setSelectedBedId(availableBeds[0].id_bed);
        setLockSeconds(300);
      }
    }
  }, [availableBeds, selectedBedId]);

  const selectedBed = useMemo(() => {
    return beds.find((b) => b.id_bed === selectedBedId) || null;
  }, [beds, selectedBedId]);

  const selectedPatient = useMemo(() => {
    return (
      INITIAL_PASIEN_CANDIDATES.find((p) => p.id_pasien === selectedPatientId) ||
      INITIAL_PASIEN_CANDIDATES[0]
    );
  }, [selectedPatientId]);

  const handleSelectBed = (bed: BedItem) => {
    setSelectedBedId(bed.id_bed);
    setLockSeconds(300); // Reset 5-min temporary concurrency lock
    setErrorMsg(null);
  };

  const handleAssignAllocation = async () => {
    if (!selectedBed) {
      setErrorMsg("Silakan pilih tempat tidur yang tersedia.");
      return;
    }
    if (lockSeconds <= 0) {
      setErrorMsg("Kunci sesi sementara telah kedaluwarsa. Silakan perbarui pilihan tempat tidur.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await createAllocationApi({
        id_pasien: selectedPatient.id_pasien,
        id_bed: selectedBed.id_bed,
      });

      setSuccessResult({
        bedNo: result.bed.no_bed,
        patientName: result.pasien.nama_pasien,
        time: result.waktu_alokasi,
      });

      // Update local state beds
      setBeds((prev) =>
        prev.map((b) => (b.id_bed === result.bed.id_bed ? result.bed : b))
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal menetapkan alokasi kamar pasien.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Link & Header (Figma 193:9909) */}
      <div className="space-y-2">
        <Link
          href="/bed-management"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          <span>Kembali ke Daftar Ketersediaan Bed</span>
        </Link>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#13c9b3]" />
            Alokasi Rawat Inap
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Alokasi Kamar & Bed Pasien
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Pilih tempat tidur yang berstatus Tersedia dan tetapkan (assign) kepada pasien yang membutuhkan perawatan rawat inap.
          </p>
        </div>
      </div>

      {/* Main 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 7 Columns - Available Bed Catalog (Figma 193:9909) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-base">
                  Daftar Bed Tersedia
                </h2>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {availableBeds.length} Bed Tersedia
                </span>
              </div>
            </div>

            {/* Active Filter Banner (Figma 193:9909) */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Filter Aktif: Hanya menampilkan bed berstatus <strong>Tersedia</strong> ({availableBeds.length} Bed)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedKelas("Semua Kelas");
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode bed atau nama bangsal..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]/40"
                />
              </div>
            </div>

            {/* Class Filter Pills (Figma 193:9909) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["Semua Kelas", "VIP", "Kelas 1", "Kelas 2", "Kelas 3"].map((cls) => {
                const isSelected = selectedKelas === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedKelas(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      isSelected
                        ? "bg-[#0d332f] text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#13c9b3]" />}
                    <span>{cls}</span>
                  </button>
                );
              })}
            </div>

            {/* Available Bed Cards List */}
            <div className="space-y-3 pt-2">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
                  <span>Memuat daftar bed tersedia...</span>
                </div>
              ) : filteredAvailableBeds.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  Tidak ada tempat tidur yang tersedia pada kelas perawatan atau pencarian ini.
                </div>
              ) : (
                filteredAvailableBeds.map((bed) => {
                  const isSelected = bed.id_bed === selectedBedId;

                  return (
                    <div
                      key={bed.id_bed}
                      className={`p-4 sm:p-5 rounded-2xl border transition relative ${
                        isSelected
                          ? "border-[#13c9b3] bg-teal-50/20 shadow-md ring-2 ring-[#13c9b3]/25"
                          : "border-slate-200/90 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {/* Top Row: Bed Code & Selection Status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {bed.no_bed}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {bed.nama_bangsal} • {bed.nama_kamar}
                          </span>
                        </div>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#13c9b3]/20 text-teal-900 border border-[#13c9b3]/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                            Dipilih Saat Ini
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectBed(bed)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-[#13c9b3] hover:bg-teal-50/50 text-slate-700 hover:text-teal-900 text-xs font-bold transition cursor-pointer"
                          >
                            Pilih Bed
                          </button>
                        )}
                      </div>

                      {/* Row-Level Lock Countdown Banner (Figma 193:9909) */}
                      {isSelected && (
                        <div className="my-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between animate-fadeIn">
                          <div className="flex items-center gap-2 font-medium">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Dikunci Sementara untuk Alokasi Anda (Row-Level Lock)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                            {formatTimer(lockSeconds)}
                          </span>
                        </div>
                      )}

                      {/* Details & Facilities */}
                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            Kelas Perawatan:
                          </span>
                          <span
                            className={
                              bed.kelas_perawatan === "VIP"
                                ? "font-bold text-purple-700"
                                : "font-medium text-slate-700"
                            }
                          >
                            {bed.kelas_perawatan} ({bed.tipe_bed})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>Fasilitas:</span>
                          <span className="text-slate-600">{bed.fasilitas}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 Columns - Patient Assignment Form (Figma 193:9909) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Formulir Penetapan (Assign) Pasien
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih pasien antrean rawat inap dan konfirmasi penempatan kamar.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Patient Selector Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Pilih Pasien dari Antrean <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#13c9b3]/40 cursor-pointer"
              >
                {INITIAL_PASIEN_CANDIDATES.map((p) => (
                  <option key={p.id_pasien} value={p.id_pasien}>
                    {p.no_rm} — {p.nama_pasien} ({p.kelas_rekomendasi})
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Clinical Summary Card (Figma 193:9909) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 font-bold text-slate-800">
                <User className="w-4 h-4 text-teal-600" />
                <span>Ringkasan Klinis Pasien</span>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Pasien:</span>
                  <span className="font-bold text-slate-800">
                    {selectedPatient.nama_pasien} ({selectedPatient.jenis_kelamin_usia})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Rekam Medis:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedPatient.no_rm}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dokter DPJP:</span>
                  <span className="font-medium text-slate-800">
                    {selectedPatient.dokter_dpjp}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hak Kelas Jaminan:</span>
                  <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    {selectedPatient.hak_kelas_jaminan}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <div className="text-slate-400 mb-0.5">Diagnosa Masuk:</div>
                  <div className="font-medium text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                    {selectedPatient.diagnosa_masuk}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Bed Verification Card (Figma 193:9909) */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-teal-900">
                  Tempat Tidur Terpilih:
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Tervalidasi
                </span>
              </div>
              {selectedBed ? (
                <div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {selectedBed.no_bed}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {selectedBed.nama_bangsal} • {selectedBed.nama_kamar} ({selectedBed.kelas_perawatan})
                  </div>
                </div>
              ) : (
                <div className="text-rose-600 font-medium">
                  Belum ada bed yang dipilih dari katalog.
                </div>
              )}
            </div>

            {/* Status Transition Simulation (Figma 193:9909) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <span className="font-semibold text-slate-600">
                Simulasi Perubahan Status Operasional:
              </span>
              <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  • Tersedia
                </span>
                <span className="text-slate-400">➜</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  • Terisi (Occupied)
                </span>
              </div>
            </div>

            {/* Concurrency Lock Info */}
            <div className="p-3 rounded-xl bg-teal-950/5 border border-teal-900/10 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Perlindungan Kunci Sesi:</strong> Status bed otomatis dikunci saat penetapan untuk mencegah duplikasi alokasi pasien oleh petugas lain.
              </p>
            </div>

            {/* Action Buttons (Figma 193:9909) */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleAssignAllocation}
                disabled={isSubmitting || !selectedBed || lockSeconds <= 0}
                className="w-full py-3 px-4 bg-[#13c9b3] hover:bg-[#0fb39f] active:bg-[#0c9d8c] text-[#0d332f] font-bold rounded-xl text-sm transition duration-150 shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0d332f]/30 border-t-[#0d332f] rounded-full animate-spin" />
                    <span>Menetapkan Alokasi...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Tetapkan Alokasi & Kunci Kamar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/bed-management")}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL POPUP AFTER ALLOCATION */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">
                Alokasi Kamar Berhasil Ditetapkan!
              </h3>
              <p className="text-xs text-slate-500">
                Data tempat tidur dan rekam rawat inap pasien telah diperbarui di SIMRS.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Pasien:</span>
                <span className="font-bold text-slate-800">{successResult.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kamar / Bed:</span>
                <span className="font-mono font-bold text-slate-800">{successResult.bedNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Baru:</span>
                <span className="font-bold text-blue-700">Terisi (Occupied)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Alokasi:</span>
                <span className="font-medium text-slate-600">{successResult.time}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSuccessResult(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Alokasikan Pasien Lain
              </button>
              <button
                type="button"
                onClick={() => router.push("/bed-management")}
                className="flex-1 py-2.5 rounded-xl bg-[#0d332f] hover:bg-[#102d2a] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Lihat Daftar Bed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
