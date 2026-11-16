"use client";

import React from "react";
import { BedItem } from "@/types";
import { ShieldAlert, User, Stethoscope } from "lucide-react";
import { Badge, Button, Modal } from "@/components/ui";

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
  if (!bed) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tidak Dapat Menghapus Bed"
      description={`${bed.no_bed} • ${bed.nama_bangsal} (${bed.kelas_perawatan})`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Tempat tidur ini masih berstatus <strong>Terisi</strong> dan sedang digunakan oleh pasien rawat inap aktif. Penghapusan ditolak untuk menjaga integritas rekam medis.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Status Bed</span>
            <Badge tone="rose" dot>
              Terisi (Aktif)
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800">
              <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                Pasien:{" "}
                <strong>{bed.occupant?.nama_pasien || "Pasien Rawat Inap"}</strong>{" "}
                <span className="font-mono text-slate-500">
                  ({bed.occupant?.no_rm || "-"})
                </span>
              </span>
            </div>

            {bed.occupant?.dokter_dpjp && (
              <div className="flex items-center gap-2 text-slate-700">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  DPJP: <strong>{bed.occupant.dokter_dpjp}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>SOP Rawat Inap:</strong> Selesaikan alokasi kamar pasien setelah rekap layanan siap sebelum menonaktifkan bed ini.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Mengerti
          </Button>
        </div>
      </div>
    </Modal>
  );
}
