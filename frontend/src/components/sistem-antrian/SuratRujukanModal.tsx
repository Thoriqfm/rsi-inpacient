"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  CheckCircle2,
  Send,
  Building2,
  User,
  FileText,
  History,
  XCircle,
  HeartPulse,
} from "lucide-react";
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
    setErrorMsg(null);
    fetchReferralHistoryApi(referral.id_surat)
      .then((logs) => {
        if (!cancelled) setHistoryLogs(logs);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-2xl border border-[#e9ebf0] w-full max-w-3xl overflow-hidden animate-fadeIn my-auto">
        {/* Top Header */}
        <div className="bg-[#0a2e28] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#00b89f]/20 border border-[#00b89f]/40 flex items-center justify-center text-[#00b89f]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Surat Rujukan Pasien Darurat Resmi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/15 text-teal-200">
                  {referral.no_rujukan}
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Diterbitkan pada {referral.tanggal_rujukan_formatted} • Status:{" "}
                <strong className="text-white">{referral.status}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-[8px] bg-[#fdf0f0] border border-[#fecaca] text-[#dc2626] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Official Letter Frame */}
          <div className="rounded-[12px] border border-[#e9ebf0] p-6 bg-white space-y-5 shadow-2xs">
            {/* Kop Surat */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0a2e28] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[8px] bg-[#0a2e28] text-[#00b89f] font-bold text-2xl flex items-center justify-center">
                  +
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#0a2e28] uppercase tracking-tight">
                    Rumah Sakit Islam (RSI) — Instalasi Rawat Inap & IGD
                  </h4>
                  <p className="text-xs text-[#666666]">
                    Jl. Raya Ahmad Yani No. 2-4 • Sistem Informasi Manajemen Rumah Sakit (SIMRS)
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#fdf0f0] border border-[#fecaca] text-[#dc2626] font-medium text-xs">
                  • Rujukan Emergensi (Darurat)
                </span>
                <div className="text-xs font-mono font-bold text-[#1e1e1e] mt-1">
                  No: {referral.no_rujukan}
                </div>
              </div>
            </div>

            {/* Destination Hospital Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-[10px] bg-[#f0fdf9] border border-[#cbe7dd] p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#016b46] mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#00b89f]" />
                  Kepada Yth. Rumah Sakit Tujuan
                </div>
                <div className="text-sm font-bold text-[#1e1e1e]">
                  {referral.nama_rs}
                </div>
                <div className="text-xs text-[#666666] mt-0.5">
                  {referral.alamat_rs}
                </div>
                <div className="text-xs font-medium text-[#016b46] mt-1">
                  Kontak IGD / SPGDT: {referral.kontak_rs}
                </div>
              </div>

              <div className="rounded-[10px] bg-[#f8faf9] border border-[#e9ebf0] p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#666666]" />
                  Identitas Pasien yang Dirujuk
                </div>
                <div className="text-sm font-bold text-[#1e1e1e]">
                  {referral.nama_pasien} ({referral.jenis_kelamin_usia})
                </div>
                <div className="text-xs font-mono text-[#666666] mt-0.5">
                  No. Rekam Medis: {referral.no_rm}
                </div>
                <div className="text-xs font-medium text-[#dc2626] mt-1">
                  DPJP Pengirim: {referral.dokter_dpjp}
                </div>
              </div>
            </div>

            {/* Clinical Summary */}
            <div className="rounded-[10px] border border-[#e9ebf0] p-4 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[#8c8c8c] uppercase tracking-wider text-[10px] block">
                  Diagnosa Kerja / Kondisi Darurat
                </span>
                <p className="text-sm font-bold text-[#1e1e1e] mt-0.5">
                  {referral.diagnosa}
                </p>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[#fdf0f0] border border-[#fecaca] flex items-center gap-2 text-[#dc2626] font-medium">
                <HeartPulse className="w-4 h-4 text-[#dc2626] shrink-0" />
                <span>Observasi Tanda Vital Terakhir: {referral.tanda_vital}</span>
              </div>

              <div>
                <span className="font-semibold text-[#8c8c8c] uppercase tracking-wider text-[10px] block">
                  Alasan Rujukan (Indikasi Penuh / Fasilitas Khusus)
                </span>
                <p className="text-[#4b5563] mt-0.5 leading-relaxed">
                  {referral.alasan_rujukan}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[#8c8c8c] uppercase tracking-wider text-[10px] block">
                  Tindakan & Terapi Stabilisasi Awal yang Telah Diberikan
                </span>
                <p className="text-[#4b5563] mt-0.5 leading-relaxed">
                  {referral.catatan_medis}
                </p>
              </div>
            </div>

            {/* Signature Footer */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-3 border-t border-[#f0f2f5] text-xs">
              <div className="text-[#666666] space-y-0.5">
                <p>Dicetak otomatis melalui Modul Rujukan SIMRS Inpatient Care</p>
                <p>
                  Waktu Terbit:{" "}
                  <strong className="text-[#1e1e1e]">
                    {referral.tanggal_rujukan_formatted}
                  </strong>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#666666]">Petugas Penerbit & DPJP,</p>
                <p className="font-bold text-[#1e1e1e] mt-4">
                  {referral.dibuat_oleh} / {referral.dokter_dpjp}
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Status Transition & Audit Trail */}
          <div className="rounded-[10px] border border-[#e9ebf0] bg-[#f8faf9] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0a2e28]" />
                <span className="text-xs font-bold text-[#1e1e1e]">
                  Pembaruan Status Pengiriman & Riwayat Audit
                </span>
              </div>

              {/* Status transition buttons matching backend REFERRAL_TRANSITIONS */}
              <div className="flex flex-wrap items-center gap-2">
                {referral.status === "Dibuat" && (
                  <>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleTransitionStatus("Dikirim")}
                      className="px-3 py-1.5 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tandai Dikirim (Ambulans Berangkat)</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleTransitionStatus("Batal")}
                      className="px-3 py-1.5 rounded-[8px] border border-[#fecaca] bg-[#fdf0f0] hover:bg-rose-100 text-[#dc2626] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>
                  </>
                )}

                {referral.status === "Dikirim" && (
                  <>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleTransitionStatus("Diterima")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Konfirmasi Diterima RS Tujuan</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleTransitionStatus("Batal")}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Audit Trail List */}
            <div className="space-y-1.5 pt-2 border-t border-[#e9ebf0]">
              {historyLogs.length === 0 ? (
                <div className="text-[11px] text-[#666666] bg-white px-3 py-2 rounded-[6px] border border-[#e9ebf0]">
                  Belum ada catatan perubahan status pada riwayat audit.
                </div>
              ) : (
                historyLogs.map((log) => (
                  <div
                    key={log.id_log}
                    className="flex items-center justify-between text-[11px] bg-white px-3 py-2 rounded-[6px] border border-[#e9ebf0]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00b89f]" />
                      <span className="font-semibold text-[#1e1e1e]">
                        {log.aksi === "CREATE"
                          ? `Surat Rujukan diterbitkan (Status: ${log.status_baru})`
                          : `Status diubah: ${log.status_sebelumnya} → ${log.status_baru}`}
                      </span>
                    </div>
                    <div className="text-[#666666]">
                      Oleh <strong>{log.nama_petugas || "Petugas"}</strong> •{" "}
                      {log.waktu_aksi_formatted}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Modal Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#f0f2f5]">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-[#064e3b] hover:bg-[#053b2d] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Surat Rujukan (PDF / Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Selesai &amp; Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
