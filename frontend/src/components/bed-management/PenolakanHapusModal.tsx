"use client";

import React from "react";
import { BedItem } from "@/types";
import { X, Ban, ShieldAlert, User, Stethoscope } from "lucide-react";

interface PenolakanHapusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: BedItem | null;
}

export function PenolakanHapusModal({
  isOpen,
  onClose,
  bed,
}: PenolakanHapusModalProps) {
  if (!isOpen || !bed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-[480px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Modal Header (Figma 285:279) */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Tidak Dapat Menghapus Bed
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60">
                  {bed.no_bed}
                </span>
                <span className="text-[11px] text-slate-500">
                  • {bed.nama_bangsal} ({bed.kelas_perawatan})
                </span>
              </div>
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
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tempat tidur ini sedang berstatus{" "}
            <span className="font-bold text-blue-700">Terisi (Occupied)</span>{" "}
            dan aktif ditempati oleh pasien rawat inap. Sistem menolak penghapusan
            untuk mencegah anomali data medis.
          </p>

          {/* Active Occupancy Card (Figma 285:666) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Status Bed:</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Terisi (Occupied)
              </span>
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  Pasien:{" "}
                  <strong>
                    {bed.occupant?.nama_pasien || "Hendra Wijaya"}
                  </strong>{" "}
                  ({bed.occupant?.no_rm || "RM-2026-00142"})
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  DPJP:{" "}
                  <strong>
                    {bed.occupant?.dokter_dpjp || "dr. Nanda Putra, Sp.PD"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* SOP Instruction Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>SOP Rawat Inap:</strong> Silakan lakukan proses{" "}
              <em>Discharge (Pemulangan Pasien)</em> atau <em>Mutasi Kamar</em>{" "}
              terlebih dahulu sebelum menghapus inventaris tempat tidur ini.
            </p>
          </div>
        </div>

        {/* Modal Action */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#0d332f] hover:bg-[#102d2a] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            ✓ Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
