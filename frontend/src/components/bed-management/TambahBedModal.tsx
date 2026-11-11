"use client";

import React, { useState, useEffect } from "react";
import { BedItem, KelasPerawatan } from "@/types";
import { BANGSAL_OPTIONS } from "@/lib/mock-fallback";
import { X, CheckCircle2, AlertTriangle, Bed } from "lucide-react";

interface TambahBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBed: BedItem) => void;
  allExistingBeds: BedItem[];
}

export function TambahBedModal({
  isOpen,
  onClose,
  onSuccess,
  allExistingBeds,
}: TambahBedModalProps) {
  const [noBed, setNoBed] = useState("");
  const [bangsal, setBangsal] = useState(BANGSAL_OPTIONS[0].label);
  const [kelas, setKelas] = useState<KelasPerawatan>("Kelas 1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate suggestion when bangsal changes
  useEffect(() => {
    if (isOpen) {
      const selectedWard =
        BANGSAL_OPTIONS.find((b) => b.label === bangsal) || BANGSAL_OPTIONS[0];
      setKelas(selectedWard.defaultKelas);

      // Find highest bed number in this ward
      const existingInWard = allExistingBeds.filter((b) =>
        b.no_bed.toUpperCase().includes(`-${selectedWard.prefix}-`)
      );
      const nextNum = 101 + existingInWard.length;
      setNoBed(`BED-${selectedWard.prefix}-${nextNum}`);
      setErrorMsg(null);
    }
  }, [isOpen, bangsal, allExistingBeds]);

  if (!isOpen) return null;

  const normalized = noBed.trim().toUpperCase();
  const isDuplicate = allExistingBeds.some(
    (b) => b.no_bed.toUpperCase() === normalized
  );
  const isValidFormat = /^BED-[A-Z0-9]+-\d+$/i.test(normalized);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!normalized) {
      setErrorMsg("Nomor bed tidak boleh kosong.");
      return;
    }
    if (!isValidFormat) {
      setErrorMsg("Format penomoran harus sesuai standar, e.g. BED-ANG-105");
      return;
    }
    if (isDuplicate) {
      setErrorMsg(`Nomor bed "${normalized}" sudah terdaftar di sistem.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const isVip = kelas === "VIP";
      const roomNumMatch = normalized.match(/(\d+)$/);
      const roomNum = roomNumMatch ? roomNumMatch[1] : "101";
      const namaKamar = isVip ? `Suite ${roomNum.slice(-2)}` : `Kamar ${roomNum}`;
      const fasilitasStr = isVip
        ? "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas"
        : "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central";

      const { createBedApi } = await import("@/lib/api-client");
      const created = await createBedApi({
        no_bed: normalized,
        nama_bangsal: bangsal.replace("Bangsal ", "").replace(" Utama", ""),
        nama_kamar: namaKamar,
        kelas_perawatan: kelas,
        tipe_bed: isVip ? "1 Bed/Rm" : kelas === "Kelas 1" ? "2 Bed/Rm" : kelas === "Kelas 2" ? "4 Bed/Rm" : "6 Bed/Rm",
        fasilitas: fasilitasStr,
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal menyimpan data tempat tidur.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const kelasOptions: { label: KelasPerawatan; subtitle: string }[] = [
    { label: "VIP", subtitle: "1 Bed/Rm" },
    { label: "Kelas 1", subtitle: "2 Bed/Rm" },
    { label: "Kelas 2", subtitle: "4 Bed/Rm" },
    { label: "Kelas 3", subtitle: "6 Bed/Rm" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-[560px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header (Figma 217:13467) */}
        <div className="px-7 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#13c9b3]">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Tambah Data Bed Baru
              </h3>
              <p className="text-xs text-slate-500">
                Daftarkan tempat tidur baru ke dalam inventaris bangsal rumah sakit.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Input 1: ID / Nomor Bed */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              ID / Nomor Bed <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={noBed}
              onChange={(e) => setNoBed(e.target.value.toUpperCase())}
              placeholder="BED-XXX-000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              required
            />
            {/* Real-time Uniqueness & Format Badge */}
            <div className="mt-2 flex items-center gap-2">
              {normalized.length > 3 && !isDuplicate && isValidFormat ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ID Bed unik dan siap didaftarkan</span>
                </div>
              ) : isDuplicate ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>ID Bed sudah terdaftar, silakan gunakan nomor lain</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Format standar penomoran: BED-[KODE BANGSAL]-[NO KAMAR/BED]
                </span>
              )}
            </div>
          </div>

          {/* Input 2: Nama Bangsal / Ruangan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Nama Bangsal / Ruangan <span className="text-rose-500">*</span>
            </label>
            <select
              value={bangsal}
              onChange={(e) => setBangsal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
            >
              {BANGSAL_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Input 3: Kelas Perawatan (4 Cards) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Kelas Perawatan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {kelasOptions.map((opt) => {
                const isSelected = kelas === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setKelas(opt.label)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 font-bold"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[11px] text-slate-400 font-normal mt-0.5">
                      {opt.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locked Initial Status Box */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-teal-900">
                Status Awal Tempat Tidur:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                TERSEDIA (Otomatis)
              </span>
            </div>
            <p className="text-[11px] text-teal-800/80 leading-relaxed">
              Tempat tidur baru otomatis berstatus Tersedia dan siap dialokasikan kepada pasien rawat inap.
            </p>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDuplicate || !isValidFormat}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0d332f]/30 border-t-[#0d332f] rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Data Bed</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
