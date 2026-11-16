"use client";

import React, { useState, useMemo } from "react";
import {
  Bed,
  Clock,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Calendar,
  Building2,
  Info,
} from "lucide-react";
import { AlertBanner, Badge, Button, Modal } from "@/components/ui";
import { BedItem, QueueItem } from "@/types";
import { cancelQueueApi, createAllocationApi } from "@/lib/api-client";

interface DetailAntreanModalProps {
  item: QueueItem | null;
  availableBeds: BedItem[];
  isPriorityOne?: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function DetailAntreanModal({
  item,
  availableBeds,
  isPriorityOne = false,
  onClose,
  onUpdated,
}: DetailAntreanModalProps) {
  const [selectedBedId, setSelectedBedId] = useState<number | "">("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"allocate" | "cancel" | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const matchingBeds = useMemo(
    () =>
      item
        ? availableBeds.filter(
            (b) =>
              b.kelas_perawatan === item.kelas_perawatan && b.status === "Tersedia"
          )
        : [],
    [availableBeds, item]
  );

  const otherBeds = useMemo(
    () =>
      item
        ? availableBeds.filter(
            (b) =>
              b.kelas_perawatan !== item.kelas_perawatan && b.status === "Tersedia"
          )
        : [],
    [availableBeds, item]
  );

  const effectiveBedId =
    selectedBedId !== ""
      ? Number(selectedBedId)
      : matchingBeds[0]?.id_bed || otherBeds[0]?.id_bed || "";

  const chosenBed = useMemo(
    () => availableBeds.find((b) => b.id_bed === Number(effectiveBedId)) || null,
    [availableBeds, effectiveBedId]
  );

  if (!item) return null;

  const hasGenderAge =
    Boolean(item.jenis_kelamin_usia) &&
    item.jenis_kelamin_usia !== "-" &&
    item.jenis_kelamin_usia !== "L/P";

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

  const kelasBadgeTone =
    item.kelas_perawatan === "VIP"
      ? "amber"
      : item.kelas_perawatan === "Kelas 1"
      ? "emerald"
      : item.kelas_perawatan === "Kelas 2"
      ? "sky"
      : "slate";

  return (
    <Modal
      isOpen={!!item}
      onClose={() => !loadingAction && onClose()}
      title={`Alokasi & Detail Antrean ${item.no_antrean_formatted}`}
      description={`Masuk antrean ${item.waktu_masuk_formatted} • Status: ${item.status}`}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        {errorMsg && <AlertBanner tone="error" message={errorMsg} />}

        {/* Priority Banner for non-#1 waiting item */}
        {item.status === "Menunggu" && !isPriorityOne && (
          <AlertBanner
            tone="warning"
            message="Terdapat antrean nomor lebih awal yang masih menunggu. Pastikan alasan klinis sesuai sebelum mendahului urutan FIFO #1."
          />
        )}

        {/* Patient Info Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center justify-center text-xs shrink-0">
                {getInitials(item.nama_pasien)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {item.nama_pasien}
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                  {item.no_rm}
                  {hasGenderAge ? ` • ${item.jenis_kelamin_usia}` : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {item.status === "Menunggu" && isPriorityOne && (
                <Badge tone="emerald">Prioritas #1 FIFO</Badge>
              )}
              <Badge
                tone={
                  item.status === "Menunggu"
                    ? "amber"
                    : item.status === "Dialokasikan"
                    ? "sky"
                    : "rose"
                }
                dot
              >
                {item.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Kelas Diminta</span>
              <Badge tone={kelasBadgeTone}>{item.kelas_perawatan}</Badge>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Dokter DPJP</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {item.dokter_dpjp}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block mb-0.5">Diagnosa Masuk</span>
              <span className="font-semibold text-slate-800">
                {item.diagnosa}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Waktu Masuk Antrean</span>
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {item.waktu_masuk_formatted}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Petugas Pencatat</span>
              <span className="font-medium text-slate-700">
                {item.dicatat_oleh}
              </span>
            </div>
            {item.catatan_tunggu && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 block mb-0.5">Catatan Antrean</span>
                <span className="text-slate-700 leading-relaxed">{item.catatan_tunggu}</span>
              </div>
            )}
          </div>
        </div>

        {/* If already allocated */}
        {item.status === "Dialokasikan" && item.alokasi_bed && (
          <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                <Bed className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-sky-900">
                  Telah Dialokasikan ke Kamar{" "}
                  <span className="font-mono tabular-nums">
                    {item.alokasi_bed.no_bed}
                  </span>
                </div>
                <div className="text-xs text-sky-700 mt-0.5">
                  Bangsal {item.alokasi_bed.nama_bangsal} •{" "}
                  {item.alokasi_bed.waktu_alokasi || "Aktif"}
                </div>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
          </div>
        )}

        {/* Direct Bed Allocation Action if Status == Menunggu */}
        {item.status === "Menunggu" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="queue-bed-select"
                className="text-xs font-bold text-slate-900 flex items-center gap-1.5"
              >
                <Bed className="w-4 h-4 text-emerald-600" />
                <span>Pilih Tempat Tidur Tersedia</span>
              </label>
              <Badge tone={matchingBeds.length > 0 ? "emerald" : "amber"}>
                {matchingBeds.length > 0
                  ? `${matchingBeds.length} Bed ${item.kelas_perawatan} Tersedia`
                  : `${otherBeds.length} Bed Kelas Lain Tersedia`}
              </Badge>
            </div>

            {availableBeds.length > 0 ? (
              <>
                <select
                  id="queue-bed-select"
                  value={effectiveBedId}
                  onChange={(e) => setSelectedBedId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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

                {chosenBed && (
                  <div className="rounded-lg bg-white border border-emerald-200/80 px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong className="font-mono tabular-nums text-slate-900">
                          {chosenBed.no_bed}
                        </strong>{" "}
                        • {chosenBed.nama_bangsal} ({chosenBed.nama_kamar})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {chosenBed.kelas_perawatan} • {chosenBed.tipe_bed}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Saat ini belum ada bed berstatus Tersedia. Pasien tetap berada di antrean prioritas.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          {item.status === "Menunggu" ? (
            confirmCancel ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-rose-700">
                  Batalkan antrean ini?
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  loading={loadingAction === "cancel"}
                  disabled={loadingAction !== null}
                  onClick={handleCancelQueue}
                >
                  Ya, Batalkan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingAction !== null}
                  onClick={() => setConfirmCancel(false)}
                >
                  Tidak
                </Button>
              </div>
            ) : (
              <Button
                variant="dangerOutline"
                size="sm"
                disabled={loadingAction !== null}
                onClick={() => setConfirmCancel(true)}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Batalkan Antrean</span>
              </Button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingAction !== null}
              onClick={onClose}
            >
              Tutup
            </Button>

            {item.status === "Menunggu" && (
              <Button
                variant="primary"
                size="sm"
                loading={loadingAction === "allocate"}
                disabled={loadingAction !== null || availableBeds.length === 0}
                onClick={handleAllocateNow}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {loadingAction === "allocate"
                    ? "Mengalokasikan..."
                    : "Alokasikan Bed"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
