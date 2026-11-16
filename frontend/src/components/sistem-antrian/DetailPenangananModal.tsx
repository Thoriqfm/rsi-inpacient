"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Ambulance,
  CheckCircle2,
  Send,
  XCircle,
  Bed,
  Stethoscope,
  Building2,
  User,
} from "lucide-react";
import { AlertBanner, Badge, Button, Modal } from "@/components/ui";
import {
  BedItem,
  MonitoringItem,
  ReferralHistoryItem,
  ReferralStatus,
} from "@/types";
import {
  cancelQueueApi,
  createAllocationApi,
  fetchReferralHistoryApi,
  updateReferralStatusApi,
} from "@/lib/api-client";

interface DetailPenangananModalProps {
  item: MonitoringItem | null;
  availableBeds: BedItem[];
  onClose: () => void;
  onUpdated: (msg: string) => void;
}

export function DetailPenangananModal({
  item,
  availableBeds,
  onClose,
  onUpdated,
}: DetailPenangananModalProps) {
  const [selectedBedId, setSelectedBedId] = useState<number | "">("");
  const [historyLogs, setHistoryLogs] = useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!item?.rujukan?.id_surat) {
      return;
    }
    let cancelled = false;
    fetchReferralHistoryApi(item.rujukan.id_surat)
      .then((logs) => {
        if (!cancelled) setHistoryLogs(logs);
      })
      .catch(() => {
        if (!cancelled) setHistoryLogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [item]);

  if (!item) return null;

  const displayedHistoryLogs = item.rujukan?.id_surat ? historyLogs : [];

  const isQueuePath = item.jalur_penanganan === "Daftar Tunggu";
  const isReferralPath = item.jalur_penanganan === "Rujukan RS Lain";

  const matchingBeds = availableBeds.filter(
    (b) => b.kelas_perawatan === item.kelas_perawatan && b.status === "Tersedia"
  );
  const effectiveBedId =
    selectedBedId !== ""
      ? Number(selectedBedId)
      : matchingBeds[0]?.id_bed || availableBeds[0]?.id_bed || "";

  const handleAllocateQueue = async () => {
    if (!effectiveBedId) {
      setErrorMsg("Pilih bed tersedia terlebih dahulu.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await createAllocationApi({
        id_pasien: item.id_pasien,
        id_bed: Number(effectiveBedId),
        id_antrean: item.antrean?.id_antrean,
      });
      onUpdated(
        `Pasien ${item.nama_pasien} berhasil dialokasikan ke kamar rawat inap.`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengalokasikan bed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!item.antrean?.id_antrean) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await cancelQueueApi(item.antrean.id_antrean);
      onUpdated(`Antrean pasien ${item.nama_pasien} telah dibatalkan.`);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal membatalkan antrean."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReferral = async (nextStatus: ReferralStatus) => {
    if (!item.rujukan?.id_surat) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await updateReferralStatusApi(item.rujukan.id_surat, nextStatus);
      onUpdated(
        `Status rujukan pasien ${item.nama_pasien} diperbarui menjadi "${nextStatus}".`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memperbarui status rujukan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Detail & Pembaruan Status Penanganan Pasien"
      description={`Jalur Penanganan: ${item.jalur_penanganan} • Status: ${item.status_penanganan}`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        {errorMsg && <AlertBanner tone="error" message={errorMsg} />}

        {/* Patient Clinical Info Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {item.nama_pasien}
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  {item.no_rm}
                  {item.jenis_kelamin_usia && item.jenis_kelamin_usia !== "-" && item.jenis_kelamin_usia !== "L/P"
                    ? ` • ${item.jenis_kelamin_usia}`
                    : ""}
                </div>
              </div>
            </div>

            <Badge
              tone={item.kondisi_pasien === "Darurat" ? "rose" : "emerald"}
              dot
            >
              Kondisi: {item.kondisi_pasien}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block">Diagnosa Masuk</span>
              <span className="font-bold text-slate-800">{item.diagnosa}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Dokter DPJP</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                {item.dokter_dpjp}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Waktu Pembaruan</span>
              <span className="font-medium text-slate-700">
                {item.waktu_terakhir} ({item.waktu_terakhir_relative})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Petugas Penanggung Jawab</span>
              <span className="font-medium text-slate-700">
                {item.petugas_pj}
              </span>
            </div>
          </div>
        </div>

        {/* CASE A: Daftar Tunggu Path */}
        {isQueuePath && item.antrean && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  Detail Antrean Daftar Tunggu (
                  <span className="font-mono tabular-nums">
                    #{String(item.antrean.no_antrean).padStart(2, "0")}
                  </span>
                  )
                </span>
              </div>
              <Badge tone="amber">Status Antrean: {item.antrean.status}</Badge>
            </div>

            {item.antrean.alokasi?.bed && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
                <div>
                  <strong>Kamar Dialokasikan:</strong>{" "}
                  <span className="font-mono tabular-nums">
                    {item.antrean.alokasi.bed.no_bed}
                  </span>{" "}
                  — Bangsal {item.antrean.alokasi.bed.nama_bangsal}
                </div>
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
              </div>
            )}

            {item.antrean.status === "Menunggu" && (
              <div className="space-y-3 pt-2 border-t border-amber-200/60">
                <label className="block text-xs font-bold text-slate-800">
                  Tindak Lanjut: Alokasikan ke Bed Tersedia Sekarang
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={effectiveBedId}
                    onChange={(e) => setSelectedBedId(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    {availableBeds.map((b) => (
                      <option key={b.id_bed} value={b.id_bed}>
                        {b.no_bed} — {b.nama_bangsal} ({b.kelas_perawatan})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={loading || availableBeds.length === 0}
                    loading={loading}
                    onClick={handleAllocateQueue}
                  >
                    <Bed className="w-3.5 h-3.5" />
                    <span>Alokasikan Kamar</span>
                  </Button>
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    disabled={loading}
                    onClick={handleCancelQueue}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Batalkan</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CASE B: Rujukan RS Lain Path */}
        {isReferralPath && item.rujukan && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
                <Ambulance className="w-4 h-4 text-rose-600" />
                <span>
                  Surat Rujukan Darurat (
                  <span className="font-mono tabular-nums">
                    {item.rujukan.no_rujukan}
                  </span>
                  )
                </span>
              </div>
              <Badge tone="rose">Status: {item.rujukan.status}</Badge>
            </div>

            {item.rujukan.rumah_sakit && (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  RS Tujuan: {item.rujukan.rumah_sakit.nama_rs}
                </div>
                <div className="text-slate-500">
                  {item.rujukan.rumah_sakit.alamat} • Kontak:{" "}
                  {item.rujukan.rumah_sakit.kontak}
                </div>
                {item.rujukan.alasan_rujukan && (
                  <div className="text-slate-700 pt-1 border-t border-slate-100 mt-1">
                    <strong>Alasan:</strong> {item.rujukan.alasan_rujukan}
                  </div>
                )}
              </div>
            )}

            {/* Transition Controls */}
            {(item.rujukan.status === "Dibuat" ||
              item.rujukan.status === "Dikirim") && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-200/60">
                <span className="text-xs font-bold text-slate-700">
                  Perbarui Status Pengiriman Rujukan:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {item.rujukan.status === "Dibuat" && (
                    <Button
                      variant="info"
                      size="sm"
                      disabled={loading}
                      onClick={() => handleUpdateReferral("Dikirim")}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tandai Dikirim</span>
                    </Button>
                  )}
                  {item.rujukan.status === "Dikirim" && (
                    <Button
                      size="sm"
                      disabled={loading}
                      onClick={() => handleUpdateReferral("Diterima")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Konfirmasi Diterima RS Tujuan</span>
                    </Button>
                  )}
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleUpdateReferral("Batal")}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Batalkan</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Audit History */}
            {displayedHistoryLogs.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Jejak Audit Perubahan Status
                </span>
                {displayedHistoryLogs.map((log) => (
                  <div
                    key={log.id_log}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-200/80"
                  >
                    <span>
                      {log.aksi === "CREATE"
                        ? `Surat Rujukan dibuat (${log.status_baru})`
                        : `${log.status_sebelumnya} → ${log.status_baru}`}
                    </span>
                    <span className="text-slate-500">
                      {log.nama_petugas} • {log.waktu_aksi_formatted}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
