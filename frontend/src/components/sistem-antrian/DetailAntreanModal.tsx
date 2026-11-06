"use client";

import React, { useState } from "react";
import {
  X,
  Bed,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Stethoscope,
  User,
  Calendar,
} from "lucide-react";
import { BedItem, QueueItem } from "@/types";
import { cancelQueueApi, createAllocationApi } from "@/lib/api-client";

interface DetailAntreanModalProps {
  item: QueueItem | null;
  availableBeds: BedItem[];
  onClose: () => void;
  onUpdated: () => void;
}

export function DetailAntreanModal({
  item,
  availableBeds,
  onClose,
  onUpdated,
}: DetailAntreanModalProps) {
  const [selectedBedId, setSelectedBedId] = useState<number | "">("");
  const [loadingAction, setLoadingAction] = useState<"allocate" | "cancel" | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!item) return null;

  const matchingBeds = availableBeds.filter(
    (b) => b.kelas_perawatan === item.kelas_perawatan && b.status === "Tersedia"
  );
  const otherBeds = availableBeds.filter(
    (b) => b.kelas_perawatan !== item.kelas_perawatan && b.status === "Tersedia"
  );

  const effectiveBedId =
    selectedBedId !== ""
      ? Number(selectedBedId)
      : matchingBeds[0]?.id_bed || otherBeds[0]?.id_bed || "";

  const handleAllocateNow = async () => {
    if (!effectiveBedId) {
      setErrorMsg("Pilih tempat tidur yang tersedia terlebih dahulu.");
      return;
    }
    setLoadingAction("allocate");
    setErrorMsg(null);
    try {
      await createAllocationApi({
        id_pasien: item.id_pasien,
        id_bed: Number(effectiveBedId),
        id_antrean: item.id_antrean,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal mengalokasikan tempat tidur."
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelQueue = async () => {
    setLoadingAction("cancel");
    setErrorMsg(null);
    try {
      await cancelQueueApi(item.id_antrean);
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal membatalkan antrean."
      );
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-fadeIn my-auto">
        {/* Header */}
        <div className="bg-[#0d332f] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-[#13c9b3] text-[#0d332f] font-black text-sm">
              {item.no_antrean_formatted}
            </span>
            <div>
              <h3 className="text-base font-bold">
                Detail Antrean Daftar Tunggu
              </h3>
              <p className="text-xs text-teal-200/80">
                Status Saat Ini: {item.status} • Masuk {item.waktu_masuk_formatted}
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

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Patient Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0d332f] font-bold flex items-center justify-center text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {item.nama_pasien}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {item.no_rm} • {item.jenis_kelamin_usia}
                  </div>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  item.status === "Menunggu"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : item.status === "Dialokasikan"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block">Kelas Diminta</span>
                <span className="font-bold text-slate-800">
                  {item.kelas_perawatan}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Dokter DPJP</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  {item.dokter_dpjp}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Diagnosa Masuk</span>
                <span className="font-semibold text-slate-800">
                  {item.diagnosa}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu Masuk Antrean</span>
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {item.waktu_masuk_formatted}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Petugas Pencatat</span>
                <span className="font-medium text-slate-700">
                  {item.dicatat_oleh}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Catatan Antrean</span>
                <span className="text-slate-700">{item.catatan_tunggu}</span>
              </div>
            </div>
          </div>

          {/* If already allocated */}
          {item.status === "Dialokasikan" && item.alokasi_bed && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bed className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-blue-900">
                    Telah Dialokasikan ke Kamar {item.alokasi_bed.no_bed}
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Bangsal {item.alokasi_bed.nama_bangsal} •{" "}
                    {item.alokasi_bed.waktu_alokasi || "Aktif"}
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
          )}

          {/* Direct Bed Allocation Action if Status == Menunggu */}
          {item.status === "Menunggu" && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0d332f] flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-teal-600" />
                  Alokasikan Bed Sekarang (Tersedia:{" "}
                  {matchingBeds.length} Bed {item.kelas_perawatan})
                </span>
                <span className="text-[11px] text-teal-700 font-medium">
                  Otomatis ubah status ke Dialokasikan
                </span>
              </div>

              {availableBeds.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    value={effectiveBedId}
                    onChange={(e) => setSelectedBedId(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-teal-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#13c9b3]"
                  >
                    {matchingBeds.length > 0 && (
                      <optgroup
                        label={`Rekomendasi Sesuai Hak (${item.kelas_perawatan})`}
                      >
                        {matchingBeds.map((b) => (
                          <option key={b.id_bed} value={b.id_bed}>
                            {b.no_bed} — {b.nama_bangsal} ({b.nama_kamar} •{" "}
                            {b.kelas_perawatan})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherBeds.length > 0 && (
                      <optgroup label="Kelas Perawatan Lainnya (Tersedia)">
                        {otherBeds.map((b) => (
                          <option key={b.id_bed} value={b.id_bed}>
                            {b.no_bed} — {b.nama_bangsal} ({b.nama_kamar} •{" "}
                            {b.kelas_perawatan})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={handleAllocateNow}
                    disabled={loadingAction !== null}
                    className="px-4 py-2 rounded-xl bg-[#0d332f] hover:bg-[#144943] text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#13c9b3]" />
                    <span>
                      {loadingAction === "allocate"
                        ? "Mengalokasikan..."
                        : "Alokasikan Bed"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Saat ini belum ada bed berstatus Tersedia. Pasien tetap berada di antrean prioritas.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {item.status === "Menunggu" ? (
              <button
                type="button"
                onClick={handleCancelQueue}
                disabled={loadingAction !== null}
                className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <XCircle className="w-4 h-4" />
                <span>
                  {loadingAction === "cancel"
                    ? "Membatalkan..."
                    : "Batalkan Antrean"}
                </span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
