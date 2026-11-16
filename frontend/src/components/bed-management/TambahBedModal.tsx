"use client";

import React, { useState } from "react";
import { BedItem, KelasPerawatan } from "@/types";
import { BANGSAL_OPTIONS } from "@/lib/constants";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge, Button, Modal } from "@/components/ui";

interface TambahBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBed: BedItem) => void;
  allExistingBeds: BedItem[];
}

function suggestBedNumber(
  bangsalLabel: string,
  beds: BedItem[]
): { noBed: string; kelas: KelasPerawatan } {
  const selectedWard =
    BANGSAL_OPTIONS.find((b) => b.label === bangsalLabel) || BANGSAL_OPTIONS[0];
  const existingInWard = beds.filter((b) =>
    b.no_bed.toUpperCase().includes(`-${selectedWard.prefix}-`)
  );
  const nextNum = 101 + existingInWard.length;
  return {
    noBed: `BED-${selectedWard.prefix}-${nextNum}`,
    kelas: selectedWard.defaultKelas,
  };
}

export function TambahBedModal({
  isOpen,
  onClose,
  onSuccess,
  allExistingBeds,
}: TambahBedModalProps) {
  const [bangsal, setBangsal] = useState(BANGSAL_OPTIONS[0].label);
  const [noBed, setNoBed] = useState(() =>
    suggestBedNumber(BANGSAL_OPTIONS[0].label, allExistingBeds).noBed
  );
  const [kelas, setKelas] = useState<KelasPerawatan>(
    BANGSAL_OPTIONS[0].defaultKelas
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBangsalChange = (nextBangsal: string) => {
    setBangsal(nextBangsal);
    const suggestion = suggestBedNumber(nextBangsal, allExistingBeds);
    setNoBed(suggestion.noBed);
    setKelas(suggestion.kelas);
    setErrorMsg(null);
  };

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
      setErrorMsg("Format penomoran harus sesuai standar, mis. BED-ANG-105");
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
      const namaKamar = isVip
        ? `Suite ${roomNum.slice(-2)}`
        : `Kamar ${roomNum}`;
      const fasilitasStr = isVip
        ? "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas"
        : "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central";

      const { createBedApi } = await import("@/lib/api-client");
      const created = await createBedApi({
        no_bed: normalized,
        nama_bangsal: bangsal.replace("Bangsal ", "").replace(" Utama", ""),
        nama_kamar: namaKamar,
        kelas_perawatan: kelas,
        tipe_bed: isVip
          ? "1 Bed/Rm"
          : kelas === "Kelas 1"
          ? "2 Bed/Rm"
          : kelas === "Kelas 2"
          ? "4 Bed/Rm"
          : "6 Bed/Rm",
        fasilitas: fasilitasStr,
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data tempat tidur."
      );
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Data Bed Baru"
      description="Daftarkan tempat tidur baru ke dalam inventaris bangsal rumah sakit."
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="no-bed-input"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            ID / Nomor Bed <span className="text-rose-600">*</span>
          </label>
          <input
            id="no-bed-input"
            type="text"
            value={noBed}
            onChange={(e) => setNoBed(e.target.value.toUpperCase())}
            placeholder="BED-XXX-000"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600 focus:bg-white"
            required
          />
          <div className="mt-2">
            {normalized.length > 3 && !isDuplicate && isValidFormat ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ID Bed unik dan siap didaftarkan
              </span>
            ) : isDuplicate ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                ID Bed sudah terdaftar, gunakan nomor lain
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Format standar: BED-[KODE BANGSAL]-[NO KAMAR/BED]
              </span>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="bangsal-select"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Nama Bangsal / Ruangan <span className="text-rose-600">*</span>
          </label>
          <select
            id="bangsal-select"
            value={bangsal}
            onChange={(e) => handleBangsalChange(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600 cursor-pointer"
          >
            {BANGSAL_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2">
            Kelas Perawatan <span className="text-rose-600">*</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {kelasOptions.map((opt) => {
              const isSelected = kelas === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setKelas(opt.label)}
                  className={`p-3 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-semibold"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                    {opt.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-emerald-950">
              Status Awal Tempat Tidur
            </span>
            <Badge tone="emerald" dot>
              Tersedia (Otomatis)
            </Badge>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Tempat tidur baru otomatis berstatus Tersedia dan siap dialokasikan.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isDuplicate || !isValidFormat}
          >
            Simpan Data Bed
          </Button>
        </div>
      </form>
    </Modal>
  );
}
