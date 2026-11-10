"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

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
  const { user } = useAuth();

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

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Alokasi Kamar Pasien" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 text-[#1e1e1e]">
      {/* Back Link & Header */}
      <div className="space-y-2">
        <Link
          href="/bed-management"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666666] hover:text-[#00b89f] transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          <span>Kembali ke Daftar Ketersediaan Bed</span>
        </Link>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f] mb-1">
            ALOKASI RAWAT INAP
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1e1e1e] tracking-tight leading-tight">
            Alokasi Kamar & Bed Pasien
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-3xl leading-relaxed">
            Pilih tempat tidur yang berstatus Tersedia dan tetapkan (assign) kepada pasien yang membutuhkan perawatan rawat inap.
          </p>
        </div>
      </div>

      {/* Main 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 7 Columns - Available Bed Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[#1e1e1e] text-sm sm:text-base">
                  Daftar Bed Tersedia
                </h2>
                <span className="text-xs font-medium bg-[#e6f4ef] text-[#016b46] px-2.5 py-0.5 rounded-full border border-[#cbe7dd]">
                  {availableBeds.length} Tersedia
                </span>
              </div>
            </div>

            {/* Active Filter Banner */}
            <div className="p-3 rounded-[8px] bg-[#e6f4ef]/60 border border-[#cbe7dd] flex items-center justify-between text-xs text-[#016b46]">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>
                  Hanya menampilkan tempat tidur berstatus <strong>Tersedia</strong> ({availableBeds.length} Bed)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedKelas("Semua Kelas");
                  setSearchQuery("");
                }}
                className="text-xs font-medium text-[#00b89f] hover:underline cursor-pointer"
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
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
                />
              </div>
            </div>

            {/* Class Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["Semua Kelas", "VIP", "Kelas 1", "Kelas 2", "Kelas 3"].map((cls) => {
                const isSelected = selectedKelas === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedKelas(cls)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                      isSelected
                        ? "bg-[#00b89f] text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{cls}</span>
                  </button>
                );
              })}
            </div>

            {/* Available Bed Cards List */}
            <div className="space-y-3 pt-2">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-[#00b89f]/20 border-t-[#00b89f] rounded-full animate-spin mx-auto mb-2" />
                  <span>Memuat daftar bed tersedia...</span>
                </div>
              ) : filteredAvailableBeds.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-[8px] border border-dashed border-slate-200 text-xs text-slate-500">
                  Tidak ada tempat tidur yang tersedia pada kelas perawatan atau pencarian ini.
                </div>
              ) : (
                filteredAvailableBeds.map((bed) => {
                  const isSelected = bed.id_bed === selectedBedId;

                  return (
                    <div
                      key={bed.id_bed}
                      className={`p-4 rounded-[10px] border transition relative ${
                        isSelected
                          ? "border-[#00b89f] bg-[#e6f4ef]/20 shadow-xs ring-1 ring-[#00b89f]"
                          : "border-[#e9ebf0] hover:border-slate-300 bg-white"
                      }`}
                    >
                      {/* Top Row: Bed Code & Selection Status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-[#1e1e1e] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {bed.no_bed}
                          </span>
                          <span className="text-xs font-semibold text-[#1e1e1e]">
                            {bed.nama_bangsal} • {bed.nama_kamar}
                          </span>
                        </div>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                            Dipilih
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectBed(bed)}
                            className="px-3 py-1 rounded-[6px] border border-[#e2e8f0] hover:border-[#00b89f] hover:bg-slate-50 text-slate-700 hover:text-[#00b89f] text-xs font-medium transition cursor-pointer"
                          >
                            Pilih Bed
                          </button>
                        )}
                      </div>

                      {/* Row-Level Lock Countdown Banner */}
                      {isSelected && (
                        <div className="my-3 p-2.5 rounded-[8px] bg-[#fef3e9] border border-[#fed7aa] text-[#b45309] text-xs flex items-center justify-between animate-fadeIn">
                          <div className="flex items-center gap-2 font-medium">
                            <Lock className="w-3.5 h-3.5 text-[#f59e0b]" />
                            <span>
                              Dikunci Sementara untuk Alokasi Anda (Row-Level Lock)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#b45309] bg-white px-2 py-0.5 rounded border border-[#fed7aa]">
                            {formatTimer(lockSeconds)}
                          </span>
                        </div>
                      )}

                      {/* Details & Facilities */}
                      <div className="text-xs text-[#666666] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1e1e1e]">
                            Kelas Perawatan:
                          </span>
                          <span
                            className={
                              bed.kelas_perawatan === "VIP"
                                ? "font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200"
                                : "font-normal text-[#4b5563]"
                            }
                          >
                            {bed.kelas_perawatan} ({bed.tipe_bed})
                          </span>
                        </div>
                        <div>Fasilitas: {bed.fasilitas}</div>
                        <div className="text-[11px] text-[#8c8c8c]">
                          Terakhir diperbarui: {bed.updated_relative}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 Columns - Patient Assignment & Action */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] p-5 space-y-4">
            <div>
              <h2 className="font-bold text-[#1e1e1e] text-base">
                Form Penetapan Alokasi
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Pastikan data pasien dan ranjang yang dipilih telah sesuai dengan diagnosa medis.
              </p>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Patient */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#1e1e1e]">
                Pilih Pasien Rawat Inap
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#1e1e1e] focus:outline-none focus:border-[#00b89f] cursor-pointer"
              >
                {INITIAL_PASIEN_CANDIDATES.map((p) => (
                  <option key={p.id_pasien} value={p.id_pasien}>
                    {p.nama_pasien} ({p.no_rm}) - DPJP: {p.dokter_dpjp}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Card Preview */}
            {selectedPatient && (
              <div className="p-3.5 rounded-[10px] bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#1e1e1e]">
                  <User className="w-4 h-4 text-[#00b89f]" />
                  <span>{selectedPatient.nama_pasien}</span>
                  <span className="text-[11px] font-normal text-[#8c8c8c]">
                    ({selectedPatient.jenis_kelamin_usia})
                  </span>
                </div>
                <div className="text-[#666666] space-y-0.5">
                  <div>No. RM: {selectedPatient.no_rm}</div>
                  <div>Diagnosa Masuk: {selectedPatient.diagnosa_masuk}</div>
                  <div>DPJP: {selectedPatient.dokter_dpjp}</div>
                </div>
              </div>
            )}

            {/* Selected Bed Summary */}
            <div className="p-3.5 rounded-[10px] bg-[#e6f4ef]/40 border border-[#cbe7dd] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#1e1e1e]">
                  Tempat Tidur Terpilih:
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#016b46] bg-[#e6f4ef] px-2 py-0.5 rounded-full border border-[#cbe7dd]">
                  <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                  Tersedia
                </span>
              </div>
              {selectedBed ? (
                <div>
                  <div className="font-mono font-bold text-[#1e1e1e] text-sm">
                    {selectedBed.no_bed}
                  </div>
                  <div className="text-[#666666] mt-0.5">
                    {selectedBed.nama_bangsal} • {selectedBed.nama_kamar} ({selectedBed.kelas_perawatan})
                  </div>
                </div>
              ) : (
                <div className="text-rose-600 font-medium">
                  Belum ada bed yang dipilih dari katalog.
                </div>
              )}
            </div>

            {/* Concurrency Lock Info */}
            <div className="p-3 rounded-[8px] bg-teal-950/5 border border-teal-900/10 text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00b89f] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Perlindungan Kunci Sesi:</strong> Status bed otomatis dikunci saat penetapan untuk mencegah duplikasi alokasi pasien oleh petugas lain.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleAssignAllocation}
                disabled={isSubmitting || !selectedBed || lockSeconds <= 0}
                className="w-full py-2.5 px-4 bg-[#00b89f] hover:bg-[#00a28c] text-white font-medium rounded-[8px] text-xs transition duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menetapkan Alokasi...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Tetapkan Alokasi & Kunci Kamar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/bed-management")}
                disabled={isSubmitting}
                className="w-full py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL POPUP AFTER ALLOCATION */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl border border-[#e9ebf0] p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#e6f4ef] text-[#00b89f] flex items-center justify-center mx-auto border border-[#cbe7dd]">
              <CheckCircle2 className="w-6 h-6 text-[#059669]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1e1e1e]">
                Alokasi Kamar Berhasil Ditetapkan!
              </h3>
              <p className="text-xs text-[#666666]">
                Data tempat tidur dan rekam rawat inap pasien telah diperbarui di SIMRS.
              </p>
            </div>

            <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#8c8c8c]">Pasien:</span>
                <span className="font-semibold text-[#1e1e1e]">{successResult.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c8c8c]">Kamar / Bed:</span>
                <span className="font-mono font-bold text-[#1e1e1e]">{successResult.bedNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c8c8c]">Status Baru:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fdf0f0] text-[#dc2626] border border-[#fecaca]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                  Terisi
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c8c8c]">Waktu Alokasi:</span>
                <span className="font-medium text-[#4b5563]">{successResult.time}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSuccessResult(null)}
                className="flex-1 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#1e1e1e] hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
              >
                Alokasikan Pasien Lain
              </button>
              <button
                type="button"
                onClick={() => router.push("/bed-management")}
                className="flex-1 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium transition shadow-xs cursor-pointer"
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
