"use client";

import React, { useState } from "react";
import { BedItem, BedStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Wrench,
  Sparkles,
  BedDouble,
  UserCheck,
} from "lucide-react";

interface UbahStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: BedItem | null;
  onSuccess: (updated: BedItem) => void;
}

export function UbahStatusModal({
  isOpen,
  onClose,
  bed,
  onSuccess,
}: UbahStatusModalProps) {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<BedStatus>(
    bed?.status === "Terisi" ? "Pembersihan" : bed?.status || "Tersedia"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOccupied = bed?.status === "Terisi";

  // Sync state whenever bed changes
  React.useEffect(() => {
    if (bed) {
      setSelectedStatus(bed.status === "Terisi" ? "Pembersihan" : bed.status);
      setErrorMsg(null);
    }
  }, [bed]);

  if (!isOpen || !bed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsSubmitting(true);
    try {
      const { updateBedStatusApi } = await import("@/lib/api-client");
      const updated = await updateBedStatusApi({
        id_bed: bed.id_bed,
        status: selectedStatus,
        petugas: user?.nama_petugas,
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal memperbarui status tempat tidur.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: {
    status: BedStatus;
    title: string;
    desc: string;
    badgeBg: string;
    badgeText: string;
    dotColor: string;
  }[] = [
    {
      status: "Tersedia",
      title: "Tersedia (Ready)",
      desc: "Siap digunakan dan dialokasikan untuk pasien rawat inap baru.",
      badgeBg: "bg-emerald-50 border-emerald-200",
      badgeText: "text-emerald-800",
      dotColor: "bg-emerald-500",
    },
    {
      status: "Pembersihan",
      title: "Pembersihan (Cleaning)",
      desc: "Sedang disterilisasi atau dibersihkan oleh petugas sanitasi.",
      badgeBg: "bg-amber-50 border-amber-200",
      badgeText: "text-amber-800",
      dotColor: "bg-amber-500",
    },
    {
      status: "Pemeliharaan",
      title: "Pemeliharaan (Maintenance)",
      desc: "Dalam perbaikan teknis atau fasilitas rusak, tidak beroperasi.",
      badgeBg: "bg-rose-50 border-rose-200",
      badgeText: "text-rose-800",
      dotColor: "bg-rose-500",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-[560px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header (Figma 285:189) */}
        <div className="px-7 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                {bed.no_bed}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                • {bed.nama_bangsal} ({bed.kelas_perawatan})
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Ubah Status Ketersediaan Bed
            </h3>
            <p className="text-xs text-slate-500">
              Perbarui status operasional tempat tidur secara langsung ke SIMRS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Status Saat Ini:
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                {bed.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{bed.updated_relative}</span>
            </div>
          </div>

          {isOccupied && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900">Tempat Tidur Sedang Terisi Pasien Aktif</p>
                <p className="mt-0.5 text-amber-700 leading-relaxed">
                  Tempat tidur ini sedang ditempati oleh <strong>{bed.occupant?.nama_pasien || "Pasien Rawat Inap"}</strong> ({bed.occupant?.no_rm || "RM"}). Mengubah status ke Pembersihan, Tersedia, atau Pemeliharaan akan otomatis menyelesaikan masa alokasi aktif kamar ini.
                </p>
              </div>
            </div>
          )}

          {/* 4 Status Option Radio Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Pilih Status Operasional Baru:
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.status;
                return (
                  <label
                    key={opt.status}
                    onClick={() => setSelectedStatus(opt.status)}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 transition cursor-pointer select-none ${
                      isSelected
                        ? "border-[#13c9b3] bg-teal-50/50 ring-2 ring-[#13c9b3]/25"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bedStatus"
                      value={opt.status}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(opt.status)}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {opt.title}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${opt.dotColor}`}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Auditor Footer Note */}
          <div className="p-3 rounded-xl bg-teal-50/40 border border-teal-200/40 text-[11px] text-teal-900/80 flex items-center justify-between">
            <span>
              Petugas Pemutakhiran:{" "}
              <strong>{user?.nama_petugas || "Budi Santoso"}</strong>
            </span>
            <span className="flex items-center gap-1 text-teal-700 font-medium">
              <RefreshCw className="w-3 h-3" />
              Otomatis sinkron ke SIMRS
            </span>
          </div>

          {/* Footer Actions */}
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
              disabled={isSubmitting || isOccupied}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0d332f]/30 border-t-[#0d332f] rounded-full animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : isOccupied ? (
                <span>Terkunci (Pasien Aktif)</span>
              ) : (
                <span>Simpan Pembaruan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
