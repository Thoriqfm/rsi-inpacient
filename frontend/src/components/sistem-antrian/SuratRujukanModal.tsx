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
    fetchReferralHistoryApi(referral.id_surat).then(setHistoryLogs);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-fadeIn my-auto">
        {/* Top Action Header */}
        <div className="bg-gradient-to-r from-[#0d332f] to-[#11423d] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#13c9b3]/20 border border-[#13c9b3]/40 flex items-center justify-center text-[#13c9b3]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  Surat Rujukan Pasien Darurat Resmi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-teal-200">
                  {referral.no_rujukan}
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Diterbitkan pada {referral.tanggal_rujukan_formatted} • Status:{" "}
                <strong>{referral.status}</strong>
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

        {/* Printable Document Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Official Letter Frame */}
          <div className="rounded-2xl border-2 border-slate-200 p-6 bg-white space-y-5">
            {/* Kop Surat */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0d332f] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0d332f] text-[#13c9b3] font-black text-2xl flex items-center justify-center">
                  +
                </div>
                <div>
                  <h4 className="text-base font-black text-[#0d332f] uppercase tracking-tight">
                    Rumah Sakit Islam (RSI) — Instalasi Rawat Inap & IGD
                  </h4>
                  <p className="text-xs text-slate-500">
                    Jl. Raya Ahmad Yani No. 2-4 • Sistem Informasi Manajemen Rumah Sakit (SIMRS)
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
                  RUJUKAN EMERGENSI (DARURAT)
                </span>
                <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                  No: {referral.no_rujukan}
                </div>
              </div>
            </div>

            {/* Destination Hospital Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-teal-50/70 border border-teal-200/80 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  Kepada Yth. Rumah Sakit Tujuan
                </div>
                <div className="text-sm font-black text-slate-900">
                  {referral.nama_rs}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {referral.alamat_rs}
                </div>
                <div className="text-xs font-semibold text-teal-800 mt-1">
                  Kontak IGD / SPGDT: {referral.kontak_rs}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  Identitas Pasien yang Dirujuk
                </div>
                <div className="text-sm font-black text-slate-900">
                  {referral.nama_pasien} ({referral.jenis_kelamin_usia})
                </div>
                <div className="text-xs font-mono text-slate-600 mt-0.5">
                  No. Rekam Medis: {referral.no_rm}
                </div>
                <div className="text-xs font-semibold text-rose-700 mt-1">
                  DPJP Pengirim: {referral.dokter_dpjp}
                </div>
              </div>
            </div>

            {/* Clinical Summary */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Diagnosa Kerja / Kondisi Darurat
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {referral.diagnosa}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/70 flex items-center gap-2 text-rose-900 font-semibold">
                <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Observasi Tanda Vital Terakhir: {referral.tanda_vital}</span>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Alasan Rujukan (Indikasi Penuh / Fasilitas Khusus)
                </span>
                <p className="text-slate-800 mt-0.5 leading-relaxed">
                  {referral.alasan_rujukan}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Tindakan & Terapi Stabilisasi Awal yang Telah Diberikan
                </span>
                <p className="text-slate-700 mt-0.5 leading-relaxed">
                  {referral.catatan_medis}
                </p>
              </div>
            </div>

            {/* Signature Footer */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-3 border-t border-slate-200 text-xs">
              <div className="text-slate-500 space-y-0.5">
                <p>Dicetak otomatis melalui Modul Rujukan SIMRS Inpatient Care</p>
                <p>
                  Waktu Terbit:{" "}
                  <strong className="text-slate-700">
                    {referral.tanggal_rujukan_formatted}
                  </strong>
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Petugas Penerbit & DPJP,</p>
                <p className="font-bold text-slate-900 mt-4">
                  {referral.dibuat_oleh} / {referral.dokter_dpjp}
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Status Transition & Audit Trail */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0d332f]" />
                <span className="text-xs font-bold text-slate-800">
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
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tandai Dikirim (Ambulans Berangkat)</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleTransitionStatus("Batal")}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
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
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Konfirmasi Diterima RS Tujuan</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleTransitionStatus("Batal")}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Batalkan</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Audit Trail List */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
              {historyLogs.map((log) => (
                <div
                  key={log.id_log}
                  className="flex items-center justify-between text-[11px] bg-white px-3 py-2 rounded-lg border border-slate-200/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="font-semibold text-slate-800">
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
              ))}
            </div>
          </div>

          {/* Bottom Modal Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-[#0d332f] hover:bg-[#144943] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-950/15 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#13c9b3]" />
              <span>Cetak Surat Rujukan (PDF / Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
