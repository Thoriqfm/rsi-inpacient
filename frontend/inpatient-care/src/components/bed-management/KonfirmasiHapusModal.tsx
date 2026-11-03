"use client";

import React, { useState } from "react";
import { BedItem } from "@/types";
import { X, Trash2, AlertTriangle } from "lucide-react";

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

  if (!isOpen || !bed) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const { deleteBedApi } = await import("@/lib/api-client");
      await deleteBedApi(bed.id_bed);
      onSuccess(bed.id_bed);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Gagal menghapus data tempat tidur.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-[480px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Konfirmasi Hapus Data Bed
              </h3>
              <p className="text-xs text-slate-500">
                Tindakan penghapusan tempat tidur dari inventaris.
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

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus data tempat tidur berikut dari inventaris SIMRS?
          </p>

          {/* Bed Detail Summary Card (Figma 285:190) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">ID / Kode Bed:</span>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {bed.no_bed}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Lokasi / Ruangan:</span>
              <span className="font-semibold text-slate-800">
                {bed.nama_bangsal} • {bed.nama_kamar}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Kelas Perawatan:</span>
              <span className="font-semibold text-slate-800">
                {bed.kelas_perawatan} ({bed.tipe_bed})
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Status Operasional:</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {bed.status}
              </span>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong>Perhatian:</strong> Data yang dihapus tidak dapat dipulihkan kembali setelah dikonfirmasi.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Ya, Hapus Bed</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
