"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Activity,
  Clock,
  Ambulance,
  CheckCircle2,
  Send,
  XCircle,
  Bed,
  Stethoscope,
  Building2,
  User,
  AlertTriangle,
} from "lucide-react";
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
    if (item?.rujukan?.id_surat) {
      fetchReferralHistoryApi(item.rujukan.id_surat).then(setHistoryLogs);
    } else {
      setHistoryLogs([]);
    }
  }, [item]);

  if (!item) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fadeIn my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d332f] to-[#11423d] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#13c9b3]/20 border border-[#13c9b3]/40 flex items-center justify-center text-[#13c9b3]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Detail & Pembaruan Status Penanganan Pasien
              </h3>
              <p className="text-xs text-teal-200/80">
                Jalur Penanganan: {item.jalur_penanganan} • Status:{" "}
                <strong>{item.status_penanganan}</strong>
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

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Patient Clinical Info Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0d332f] font-bold flex items-center justify-center">
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
                  item.kondisi_pasien === "Darurat"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                Kondisi: {item.kondisi_pasien}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block">Diagnosa Masuk</span>
                <span className="font-bold text-slate-800">{item.diagnosa}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Dokter DPJP</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  {item.dokter_dpjp}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu Pembaruan</span>
                <span className="font-medium text-slate-700">
                  {item.waktu_terakhir} ({item.waktu_terakhir_relative})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Petugas Penanggung Jawab</span>
                <span className="font-medium text-slate-700">
                  {item.petugas_pj}
                </span>
              </div>
            </div>
          </div>

          {/* CASE A: Daftar Tunggu Path */}
          {isQueuePath && item.antrean && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>
                    Detail Antrean Daftar Tunggu (#
                    {String(item.antrean.no_antrean).padStart(2, "0")})
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white border border-amber-200 text-amber-800">
                  Status Antrean: {item.antrean.status}
                </span>
              </div>

              {item.antrean.alokasi?.bed && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                  <div>
                    <strong>Kamar Dialokasikan:</strong>{" "}
                    {item.antrean.alokasi.bed.no_bed} — Bangsal{" "}
                    {item.antrean.alokasi.bed.nama_bangsal}
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
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
                      className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white"
                    >
                      {availableBeds.map((b) => (
                        <option key={b.id_bed} value={b.id_bed}>
                          {b.no_bed} — {b.nama_bangsal} ({b.kelas_perawatan})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={loading || availableBeds.length === 0}
                      onClick={handleAllocateQueue}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Bed className="w-3.5 h-3.5 text-white" />
                      <span>Alokasikan Kamar</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCancelQueue}
                      className="px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CASE B: Rujukan RS Lain Path */}
          {isReferralPath && item.rujukan && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
                  <Ambulance className="w-4 h-4 text-rose-600" />
                  <span>
                    Surat Rujukan Darurat ({item.rujukan.no_rujukan})
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white border border-rose-200 text-rose-700">
                  Status: {item.rujukan.status}
                </span>
              </div>

              {item.rujukan.rumah_sakit && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
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
                  <div className="flex items-center gap-2">
                    {item.rujukan.status === "Dibuat" && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleUpdateReferral("Dikirim")}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Tandai Dikirim</span>
                      </button>
                    )}
                    {item.rujukan.status === "Dikirim" && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleUpdateReferral("Diterima")}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Konfirmasi Diterima RS Tujuan</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleUpdateReferral("Batal")}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Audit History */}
              {historyLogs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Jejak Audit Perubahan Status
                  </span>
                  {historyLogs.map((log) => (
                    <div
                      key={log.id_log}
                      className="flex items-center justify-between text-[11px] bg-white px-3 py-1.5 rounded-lg border border-slate-200/70"
                    >
                      <span>
                        {log.aksi === "CREATE"
                          ? `Surat Rujukan dibuat (${log.status_baru})`
                          : `${log.status_sebelumnya} → ${log.status_baru}`}
                      </span>
                      <span className="text-slate-400">
                        {log.nama_petugas} • {log.waktu_aksi_formatted}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
