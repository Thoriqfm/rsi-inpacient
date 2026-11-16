"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  CheckCircle2,
  Send,
  Building2,
  User,
  History,
  XCircle,
  HeartPulse,
} from "lucide-react";
import { AlertBanner, Badge, Button, Modal } from "@/components/ui";
import {
  ReferralHistoryItem,
  ReferralItem,
  ReferralStatus,
} from "@/types";
import {
  fetchReferralHistoryApi,
  updateReferralStatusApi,
} from "@/lib/api-client";

interface SuratRujukanModalProps {
  referral: ReferralItem | null;
  onClose: () => void;
  onStatusUpdated: (updated: ReferralItem) => void;
}

export function SuratRujukanModal({
  referral,
  onClose,
  onStatusUpdated,
}: SuratRujukanModalProps) {
  const [historyLogs, setHistoryLogs] = useState<ReferralHistoryItem[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!referral) return;
    let cancelled = false;
    fetchReferralHistoryApi(referral.id_surat)
      .then((logs) => {
        if (!cancelled) {
          setErrorMsg(null);
          setHistoryLogs(logs);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHistoryLogs([]);
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "Gagal memuat riwayat audit surat rujukan."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [referral]);

  if (!referral) return null;

  const handleTransitionStatus = async (nextStatus: ReferralStatus) => {
    setUpdatingStatus(true);
    setErrorMsg(null);
    try {
      const updated = await updateReferralStatusApi(
        referral.id_surat,
        nextStatus
      );
      const logs = await fetchReferralHistoryApi(referral.id_surat);
      setHistoryLogs(logs);
      onStatusUpdated(updated);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status surat rujukan."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <Modal
      isOpen={!!referral}
      onClose={onClose}
      title={`Surat Rujukan Pasien Darurat (${referral.no_rujukan})`}
      description={`Diterbitkan pada ${referral.tanggal_rujukan_formatted} • Status: ${referral.status}`}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-5">
        {errorMsg && <AlertBanner tone="error" message={errorMsg} />}

        {/* Official Letter Frame */}
        <div className="rounded-xl border border-slate-200 p-5 sm:p-6 bg-white space-y-5">
          {/* Kop Surat */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-emerald-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-900 text-emerald-300 font-bold text-2xl flex items-center justify-center shrink-0">
                +
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
                  Rumah Sakit Islam (RSI) — Instalasi Rawat Inap &amp; IGD
                </h4>
                <p className="text-xs text-slate-500">
                  Jl. Raya Ahmad Yani No. 2-4 • Sistem Informasi Manajemen Rumah Sakit (SIMRS)
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <Badge tone="rose" dot>
                Rujukan Emergensi (Darurat)
              </Badge>
              <div className="text-xs font-mono tabular-nums font-bold text-slate-900 mt-1">
                No: {referral.no_rujukan}
              </div>
            </div>
          </div>

          {/* Destination Hospital Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Kepada Yth. Rumah Sakit Tujuan
              </div>
              <div className="text-sm font-bold text-slate-900">
                {referral.nama_rs}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {referral.alamat_rs}
              </div>
              <div className="text-xs font-medium text-emerald-800 mt-1">
                Kontak IGD / SPGDT: {referral.kontak_rs}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Identitas Pasien yang Dirujuk
              </div>
              <div className="text-sm font-bold text-slate-900">
                {referral.nama_pasien}
                {referral.jenis_kelamin_usia && referral.jenis_kelamin_usia !== "-" && referral.jenis_kelamin_usia !== "L/P"
                  ? ` (${referral.jenis_kelamin_usia})`
                  : ""}
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-600 mt-0.5">
                No. Rekam Medis: {referral.no_rm}
              </div>
              <div className="text-xs font-medium text-rose-700 mt-1">
                DPJP Pengirim: {referral.dokter_dpjp}
              </div>
            </div>
          </div>

          {/* Clinical Summary */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs block">
                Diagnosa Kerja / Kondisi Darurat
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {referral.diagnosa}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 font-medium">
              <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Observasi Tanda Vital Terakhir: {referral.tanda_vital}</span>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs block">
                Alasan Rujukan (Indikasi Penuh / Fasilitas Khusus)
              </span>
              <p className="text-slate-700 mt-0.5 leading-relaxed">
                {referral.alasan_rujukan}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs block">
                Tindakan &amp; Terapi Stabilisasi Awal yang Telah Diberikan
              </span>
              <p className="text-slate-700 mt-0.5 leading-relaxed">
                {referral.catatan_medis}
              </p>
            </div>
          </div>

          {/* Signature Footer */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="text-slate-600 space-y-0.5">
              <p>Dicetak otomatis melalui Modul Rujukan SIMRS Inpatient Care</p>
              <p>
                Waktu Terbit:{" "}
                <strong className="text-slate-900">
                  {referral.tanggal_rujukan_formatted}
                </strong>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-600">Petugas Penerbit &amp; DPJP,</p>
              <p className="font-bold text-slate-900 mt-4">
                {referral.dibuat_oleh} / {referral.dokter_dpjp}
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Status Transition & Audit Trail */}
        <div className="no-print rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">
                Pembaruan Status Pengiriman &amp; Riwayat Audit
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {referral.status === "Dibuat" && (
                <>
                  <Button
                    variant="info"
                    size="sm"
                    disabled={updatingStatus}
                    loading={updatingStatus}
                    onClick={() => handleTransitionStatus("Dikirim")}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Tandai Dikirim (Ambulans Berangkat)</span>
                  </Button>
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleTransitionStatus("Batal")}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Batalkan</span>
                  </Button>
                </>
              )}

              {referral.status === "Dikirim" && (
                <>
                  <Button
                    size="sm"
                    disabled={updatingStatus}
                    loading={updatingStatus}
                    onClick={() => handleTransitionStatus("Diterima")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi Diterima RS Tujuan</span>
                  </Button>
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleTransitionStatus("Batal")}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Batalkan</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            {historyLogs.length === 0 ? (
              <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
                Belum ada catatan perubahan status pada riwayat audit.
              </div>
            ) : (
              historyLogs.map((log) => (
                <div
                  key={log.id_log}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="font-semibold text-slate-900">
                      {log.aksi === "CREATE"
                        ? `Surat Rujukan diterbitkan (Status: ${log.status_baru})`
                        : `Status diubah: ${log.status_sebelumnya} → ${log.status_baru}`}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Oleh <strong>{log.nama_petugas || "Petugas"}</strong> •{" "}
                    {log.waktu_aksi_formatted}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Modal Buttons */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Surat Rujukan (PDF / Print)</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Selesai &amp; Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
