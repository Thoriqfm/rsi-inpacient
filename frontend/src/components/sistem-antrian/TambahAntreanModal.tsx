"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { KelasPerawatan, PasienCandidate, QueueItem } from "@/types";
import { INITIAL_PASIEN_CANDIDATES } from "@/lib/mock-fallback";
import { createQueueApi } from "@/lib/api-client";

interface TambahAntreanModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingQueues: QueueItem[];
  onSuccess: (created: QueueItem) => void;
}

export function TambahAntreanModal({
  isOpen,
  onClose,
  existingQueues,
  onSuccess,
}: TambahAntreanModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPasien, setSelectedPasien] = useState<PasienCandidate | null>(
    INITIAL_PASIEN_CANDIDATES[3] // Dewi Lestari (Stabil, belum antre)
  );
  const [kelasTarget, setKelasTarget] = useState<KelasPerawatan>(
    INITIAL_PASIEN_CANDIDATES[3].kelas_rekomendasi
  );
  const [catatan, setCatatan] = useState(
    "Menunggu ketersediaan kamar rawat inap sesuai hak kelas pasien (urutan FIFO)."
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeWaitingIds = useMemo(
    () =>
      new Set(
        existingQueues
          .filter((q) => q.status === "Menunggu")
          .map((q) => q.id_pasien)
      ),
    [existingQueues]
  );

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return INITIAL_PASIEN_CANDIDATES;
    return INITIAL_PASIEN_CANDIDATES.filter(
      (p) =>
        p.nama_pasien.toLowerCase().includes(q) ||
        p.no_rm.toLowerCase().includes(q) ||
        p.diagnosa_masuk.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const isDarurat = selectedPasien?.kondisi_pasien === "Darurat";
  const isAlreadyWaiting = selectedPasien
    ? activeWaitingIds.has(selectedPasien.id_pasien)
    : false;

  const nextFifoNumber =
    existingQueues.length > 0
      ? Math.max(...existingQueues.map((q) => q.no_antrean)) + 1
      : 1;

  const handleSelectPatient = (p: PasienCandidate) => {
    setSelectedPasien(p);
    setKelasTarget(p.kelas_rekomendasi);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasien) {
      setErrorMsg("Silakan pilih pasien terlebih dahulu.");
      return;
    }
    if (isDarurat) {
      setErrorMsg(
        "Pasien dengan kondisi Darurat tidak dapat dimasukkan ke daftar tunggu. Gunakan menu Rujukan Pasien Darurat."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await createQueueApi({
        id_pasien: selectedPasien.id_pasien,
        kelas_perawatan: kelasTarget,
        catatan_tunggu: catatan.trim(),
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan pasien ke daftar tunggu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fadeIn my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d332f] to-[#11423d] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#13c9b3]/20 border border-[#13c9b3]/40 flex items-center justify-center text-[#13c9b3]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Tambah Pasien ke Daftar Tunggu (FIFO)
              </h3>
              <p className="text-xs text-teal-200/80">
                Pencatatan otomatis nomor urut antrean berdasarkan waktu masuk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* FIFO Info Banner */}
          <div className="flex items-center justify-between bg-teal-50/80 border border-teal-200/80 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5 text-xs text-teal-900">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Sistem menerapkan antrean <strong>First-In First-Out (FIFO)</strong> khusus untuk <strong>Pasien Kondisi Stabil</strong>.
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#0d332f] text-[#13c9b3] font-bold text-xs shrink-0">
              Estimasi No: #{String(nextFifoNumber).padStart(2, "0")}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search & Select Patient */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Cari & Pilih Data Pasien (SIMRS / RME)
            </label>
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik No. RM, Nama Pasien, atau Diagnosa..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13c9b3] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredCandidates.map((p) => {
                const isSelected = selectedPasien?.id_pasien === p.id_pasien;
                const inQueue = activeWaitingIds.has(p.id_pasien);
                const emergency = p.kondisi_pasien === "Darurat";

                return (
                  <button
                    key={p.id_pasien}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {p.nama_pasien}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.no_rm} • {p.jenis_kelamin_usia}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emergency
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {p.kondisi_pasien || "Stabil"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">
                        Hak: {p.kelas_rekomendasi}
                      </span>
                      {inQueue && (
                        <span className="text-amber-600 font-semibold">
                          Sudah Mengantre
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Patient Summary Card */}
          {selectedPasien && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0d332f]" />
                  <span className="text-xs font-bold text-slate-800">
                    Ringkasan Klinis Pasien Terpilih
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isDarurat
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  Kondisi: {selectedPasien.kondisi_pasien || "Stabil"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Nama & No. RM</span>
                  <span className="font-bold text-slate-800">
                    {selectedPasien.nama_pasien} ({selectedPasien.no_rm})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dokter DPJP</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    {selectedPasien.dokter_dpjp}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Diagnosa Masuk</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPasien.diagnosa_masuk}
                  </span>
                </div>
              </div>

              {/* Warning if Darurat */}
              {isDarurat && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        Pasien Kondisi Darurat Tidak Boleh Masuk Daftar Tunggu!
                      </p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Sesuai prosedur keselamatan pasien, jika bed penuh maka pasien darurat wajib segera dirujuk ke RS jejaring.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(
                        `/sistem-antrian/rujukan-pasien?id_pasien=${selectedPasien.id_pasien}`
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>Buat Rujukan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Kelas & Catatan Input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kelas Kamar Diminta
              </label>
              <select
                value={kelasTarget}
                onChange={(e) =>
                  setKelasTarget(e.target.value as KelasPerawatan)
                }
              className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                <option value="VIP">VIP</option>
                <option value="Kelas 1">Kelas 1</option>
                <option value="Kelas 2">Kelas 2</option>
                <option value="Kelas 3">Kelas 3</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan / Keterangan Antrean
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Menunggu bed Anggrek 1 selesai sterilisasi..."
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || isDarurat || isAlreadyWaiting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>
                {submitting
                  ? "Menyimpan Antrean..."
                  : `Simpan ke Antrean (#${String(nextFifoNumber).padStart(
                      2,
                      "0"
                    )})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
