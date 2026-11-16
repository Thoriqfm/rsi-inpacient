"use client";

import React, { useState } from "react";
import { BedItem, BedStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button, Modal } from "@/components/ui";

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

  if (!bed) return null;

  const isOccupied = bed.status === "Terisi";

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
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status tempat tidur."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: {
    status: BedStatus;
    title: string;
    desc: string;
    dotColor: string;
  }[] = [
    {
      status: "Tersedia",
      title: "Tersedia (Siap Pakai)",
      desc: "Siap digunakan dan dialokasikan untuk pasien rawat inap baru.",
      dotColor: "bg-emerald-600",
    },
    {
      status: "Pembersihan",
      title: "Pembersihan (Sterilisasi)",
      desc: "Sedang disterilisasi atau dibersihkan oleh petugas sanitasi.",
      dotColor: "bg-amber-500",
    },
    {
      status: "Pemeliharaan",
      title: "Pemeliharaan (Perbaikan)",
      desc: "Dalam perbaikan teknis atau fasilitas rusak, sementara nonaktif.",
      dotColor: "bg-slate-500",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ubah Status ${bed.no_bed}`}
      description={`${bed.nama_bangsal} • ${bed.kelas_perawatan}`}
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Status Saat Ini:</span>
            <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
              {bed.status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{bed.updated_relative}</span>
          </div>
        </div>

        {isOccupied && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Tempat Tidur Terisi Pasien Aktif</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Sedang ditempati oleh{" "}
                <strong>{bed.occupant?.nama_pasien || "Pasien Rawat Inap"}</strong>{" "}
                ({bed.occupant?.no_rm || "-"}). Gunakan tombol{" "}
                <strong>Selesaikan Alokasi</strong> setelah rekap Siap Billing selesai.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-700">
            Pilih Status Operasional Baru:
          </span>
          <div className="space-y-2">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.status;
              return (
                <label
                  key={opt.status}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition cursor-pointer select-none ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="bedStatus"
                    value={opt.status}
                    checked={isSelected}
                    onChange={() => setSelectedStatus(opt.status)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {opt.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`w-2 h-2 rounded-full ${opt.dotColor}`}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
          <span>
            Petugas: <strong className="text-slate-900">{user?.nama_petugas || "-"}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
            <RefreshCw className="w-3 h-3" />
            Sinkron real-time
          </span>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isOccupied}
          >
            {isOccupied ? "Terkunci (Pasien Aktif)" : "Simpan Pembaruan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
