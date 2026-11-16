"use client";

import React, { useState } from "react";
import { BedItem } from "@/types";
import { AlertTriangle } from "lucide-react";
import { Badge, Button, Modal } from "@/components/ui";

interface KonfirmasiHapusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: BedItem | null;
  onSuccess: (deletedId: number) => void;
}

export function KonfirmasiHapusModal({
  isOpen,
  onClose,
  bed,
  onSuccess,
}: KonfirmasiHapusModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!bed) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const { deleteBedApi } = await import("@/lib/api-client");
      await deleteBedApi(bed.id_bed);
      onSuccess(bed.id_bed);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data tempat tidur."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Hapus Data Bed"
      description="Tindakan penghapusan tempat tidur dari inventaris SIMRS."
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs"
          >
            {errorMsg}
          </div>
        )}

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Apakah Anda yakin ingin menghapus data tempat tidur berikut dari inventaris rumah sakit?
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">ID / Kode Bed</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {bed.no_bed}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">Lokasi / Ruangan</span>
            <span className="font-semibold text-slate-800">
              {bed.nama_bangsal} • {bed.nama_kamar}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">Kelas Perawatan</span>
            <span className="font-semibold text-slate-800">
              {bed.kelas_perawatan} ({bed.tipe_bed})
            </span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-500">Status Operasional</span>
            <Badge tone="emerald" dot>
              {bed.status}
            </Badge>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Perhatian:</strong> Data bed yang telah dihapus tidak dapat dipulihkan kembali.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
            Ya, Hapus Bed
          </Button>
        </div>
      </div>
    </Modal>
  );
}
