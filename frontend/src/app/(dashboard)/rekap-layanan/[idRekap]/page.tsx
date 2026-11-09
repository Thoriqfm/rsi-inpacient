"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Activity,
  Edit3,
  Trash2,
  Receipt,
  Info,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { HistoryRecapItem, HistoryStatus } from "@/types";
import {
  deleteHistoryApi,
  fetchHistoryByIdApi,
  updateHistoryApi,
} from "@/lib/api-client";

export default function DetailRekapPage() {
  const params = useParams();
  const router = useRouter();
  const idRekap = Number(params?.idRekap || 1);

  const [rekap, setRekap] = useState<HistoryRecapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modals
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectedDelete, setRejectedDelete] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (isNaN(idRekap) || idRekap <= 0) {
      setLoading(false);
      setErrorMsg("ID Rekap tidak valid atau tidak ditemukan.");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchHistoryByIdApi(idRekap);
      setRekap(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Rekap tindakan tidak ditemukan."
      );
    } finally {
      setLoading(false);
    }
  }, [idRekap]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stepper advance status
  const handleAdvanceStatus = async (nextStatus: HistoryStatus) => {
    if (!rekap) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      const updated = await updateHistoryApi(rekap.id_rekap, {
        status: nextStatus,
      });
      setRekap(updated);
      showToast(
        `Status rekap ${rekap.kode_rekap} berhasil diperbarui menjadi "${nextStatus}".`
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memperbarui status rekap."
      );
    } finally {
      setProcessing(false);
    }
  };

  // Delete rekap
  const handleDelete = async () => {
    if (!rekap) return;
    if (rekap.tagihan && rekap.tagihan.length > 0) {
      setShowDeleteModal(false);
      setRejectedDelete(true);
      return;
    }

    setProcessing(true);
    try {
      await deleteHistoryApi(rekap.id_rekap);
      router.push("/rekap-layanan");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus rekap tindakan."
      );
      setProcessing(false);
    }
  };

  // Confirm proceed to billing
  const handleConfirmBilling = () => {
    if (!rekap) return;
    setShowBillingModal(false);
    router.push(`/pembayaran/buat/${rekap.id_pasien}?id_rekap=${rekap.id_rekap}`);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto py-16 text-center text-slate-500 text-sm">
        Memuat detail rekap riwayat layanan &amp; tindakan...
      </div>
    );
  }

  if (!rekap || errorMsg) {
    return (
      <div className="max-w-[1200px] mx-auto py-16 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-600">
          {errorMsg || "Rekap riwayat layanan & tindakan tidak ditemukan."}
        </p>
        <Link
          href="/rekap-layanan"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Rekap</span>
        </Link>
      </div>
    );
  }

  const isDraft = rekap.status === "Draft";
  const isVerifikasi = rekap.status === "Proses Verifikasi";
  const isSiapBilling = rekap.status === "Siap Billing";
  const hasInvoice = rekap.tagihan && rekap.tagihan.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-16 text-[#1e1e1e]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d332f] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-teal-500/30 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#13c9b3] shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Breadcrumb & Header with Status Badge (Figma 145:5556) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-[#0fa18f] text-[10px] tracking-[1px] uppercase">
            DETAIL REKAP
          </p>
          <h1 className="text-[27px] font-medium leading-[35px] text-[#1e1e1e] tracking-[-0.675px]">
            Detail Rekap Riwayat Layanan &amp; Tindakan
          </h1>
          <p className="text-[13px] text-[#667085] leading-[21px]">
            Periksa informasi pasien, data RME, dan status administratif rekap.
          </p>
        </div>

        <div>
          {isDraft ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e7faf7] border border-[#ccefeb] text-[#0b796b] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0fa18f]" />
              <span>Draft</span>
            </div>
          ) : isSiapBilling ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6f4ef] border border-[#cbe7dd] text-[#016b46] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#018f5d]" />
              <span>Siap Billing</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3e9] border border-[#fed7aa] text-[#b45309] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <span>Proses Verifikasi</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Banner if Transferred to Billing (Figma 145:10543) */}
      {hasInvoice && (
        <div className="rounded-[12px] bg-[#e7faf7] border border-[#ccefeb] p-4 flex items-start gap-3.5 text-xs text-[#07594f]">
          <CheckCircle2 className="w-5 h-5 text-[#0fa18f] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-[13px] text-[#07594f]">
              Rekap telah diteruskan ke Billing
            </p>
            <p className="text-[11px] text-[#0b796b] leading-relaxed">
              Rekap ini sudah tersedia pada modul Billing sebagai dasar proses tagihan
              pasien ({rekap.tagihan.map((t) => t.no_tagihan).join(", ")}).
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Top Summary Cards (Horizontal bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Identitas Rekap */}
        <div className="bg-[#e7faf7] border border-[#ccefeb] rounded-[12px] p-5 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-[#0fa18f] tracking-wider uppercase block">
            IDENTITAS REKAP
          </span>
          <div className="text-[18px] font-bold text-[#07594f]">
            {rekap.kode_rekap}
          </div>
          <div className="text-[11px] text-[#0b796b]">
            Dibuat {rekap.tanggal_dibuat_formatted || "Hari ini, 11.32"}
          </div>
        </div>

        {/* Box 2: Pasien */}
        <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-5 space-y-1 shadow-[0px_4px_8px_rgba(26,39,50,0.05)]">
          <span className="text-[10px] font-semibold text-[#667085] tracking-wider uppercase block">
            PASIEN
          </span>
          <div className="text-[16px] font-bold text-[#1e1e1e] truncate">
            {rekap.nama_pasien}
          </div>
          <div className="text-[11px] text-[#667085]">{rekap.no_rm}</div>
        </div>

        {/* Box 3: Periode Perawatan */}
        <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-5 space-y-1 shadow-[0px_4px_8px_rgba(26,39,50,0.05)]">
          <span className="text-[10px] font-semibold text-[#667085] tracking-wider uppercase block">
            PERIODE PERAWATAN
          </span>
          <div className="text-[15px] font-bold text-[#1e1e1e]">
            {rekap.periode_perawatan || "18–22 Februari 2026"}
          </div>
          <div className="text-[11px] text-[#667085]">
            {rekap.nama_kamar || "Anggrek 2 • Kamar 204"}
          </div>
        </div>

        {/* Box 4: Jumlah Layanan */}
        <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-5 space-y-1 shadow-[0px_4px_8px_rgba(26,39,50,0.05)]">
          <span className="text-[10px] font-semibold text-[#667085] tracking-wider uppercase block">
            JUMLAH LAYANAN
          </span>
          <div className="text-[16px] font-bold text-[#1e1e1e]">
            {rekap.jumlah_tindakan} item
          </div>
          <div className="text-[11px] text-[#667085]">Bersumber dari RME</div>
        </div>
      </div>

      {/* Card: Informasi Pasien (Figma 145:5556) */}
      <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.05)] space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-[15px] font-semibold text-[#1e1e1e]">
            Informasi Pasien
          </h2>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Identitas dan periode rawat inap pasien
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-xs">
          <div>
            <span className="text-[11px] text-[#98a2b3] block">Nama Pasien</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {rekap.nama_pasien}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">
              Nomor Rekam Medis
            </span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {rekap.no_rm}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">Jenis Kelamin</span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {rekap.jenis_kelamin_usia.startsWith("L")
                ? "Laki-laki"
                : "Perempuan"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">
              Tanggal Lahir / Usia
            </span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              12 Mei 1994 ({rekap.jenis_kelamin_usia})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">
              Periode Perawatan
            </span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {rekap.periode_perawatan || "18–22 Februari 2026"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#98a2b3] block">
              Ruang Perawatan
            </span>
            <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
              {rekap.kelas_perawatan} • {rekap.nama_kamar || "Kamar 204"}
            </span>
          </div>
        </div>
      </div>

      {/* Card: Rincian Layanan & Tindakan (Figma 145:5556) */}
      <div className="bg-white border border-[#e9ebf0] rounded-[12px] shadow-[0px_4px_8px_rgba(26,39,50,0.05)] overflow-hidden">
        <div className="p-5 border-b border-[#e9ebf0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1e1e1e]">
              Rincian Layanan &amp; Tindakan
            </h2>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Data medis bersumber dari RME dan tidak dapat diubah di halaman ini
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium self-start sm:self-auto">
            <Info className="w-3.5 h-3.5" />
            <span>Data read-only</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8faf9] border-b border-[#e9ebf0] text-[9px] font-medium text-[#667085] uppercase tracking-[0.225px]">
                <th className="py-3 pl-5 pr-3 w-[50px]">No.</th>
                <th className="py-3 px-3">Jenis Layanan / Tindakan</th>
                <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                <th className="py-3 px-3">Tenaga Kesehatan</th>
                <th className="py-3 pl-3 pr-5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f1] text-[11px]">
              {rekap.detail_tindakan.map((d, idx) => (
                <tr key={d.id_detail_rekap} className="hover:bg-[#fbfcfc] transition">
                  <td className="py-3.5 pl-5 pr-3 text-[#475467] font-normal">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-[#1e1e1e]">
                    {d.nama_tindakan}
                  </td>
                  <td className="py-3.5 px-3 text-[#475467]">
                    {d.tanggal_tindakan_formatted || "18 Feb 2026, 10.15"}
                  </td>
                  <td className="py-3.5 px-3 text-[#475467]">
                    {d.dokter_pelaksana || rekap.dokter_dpjp}
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-[#667085]">
                    {d.catatan_khusus || "Pemeriksaan awal rawat inap"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Bottom Cards: Admin Info & Activity (Figma 145:5556) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Informasi Administratif Rekap (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#e9ebf0] rounded-[12px] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.05)] space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-[#1e1e1e]">
                Informasi Administratif Rekap
              </h2>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Informasi ini dapat diperbarui melalui Edit Rekap
              </p>
            </div>
            {!isSiapBilling && (
              <Link
                href={`/rekap-layanan/${rekap.id_rekap}/edit`}
                className="text-xs font-semibold text-[#0b796b] hover:underline"
              >
                Edit Rekap →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-[#98a2b3] block">
                Status Rekap
              </span>
              <div className="mt-1">
                {isDraft ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e7faf7] border border-[#ccefeb] text-[#0b796b] text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0fa18f]" />
                    <span>Draft</span>
                  </span>
                ) : isSiapBilling ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e6f4ef] border border-[#cbe7dd] text-[#016b46] text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#018f5d]" />
                    <span>Siap Billing</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fef3e9] border border-[#fed7aa] text-[#b45309] text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <span>Proses Verifikasi</span>
                  </span>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[11px] text-[#98a2b3] block">
                Catatan Administrasi
              </span>
              <p className="text-[12px] text-[#344054] mt-1 leading-relaxed">
                {rekap.catatan || "Tidak ada catatan administrasi."}
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs">
            <span className="text-[11px] text-[#98a2b3] block">Keterangan</span>
            <p className="text-[12px] text-[#667085] mt-1">
              {rekap.keterangan || "Tidak ada keterangan tambahan."}
            </p>
          </div>
        </div>

        {/* Right Card: Informasi Aktivitas (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#e9ebf0] rounded-[12px] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.05)] space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-semibold text-[#1e1e1e]">
              Informasi Aktivitas
            </h2>
            <p className="text-[11px] text-[#667085] mt-0.5">
              Pembaruan terakhir rekap
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#0fa18f] mt-1.5 shrink-0" />
              <div>
                <span className="text-[11px] text-[#98a2b3] block">Diperbarui</span>
                <span className="font-medium text-[#1e1e1e]">
                  {rekap.tanggal_diperbarui_formatted || "Baru saja"}
                </span>
                <span className="text-[10px] text-[#667085] block">
                  oleh {rekap.dibuat_oleh || "Rina Aprilianti"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
              <div>
                <span className="text-[11px] text-[#98a2b3] block">
                  Rekap dibuat
                </span>
                <span className="font-medium text-[#1e1e1e]">
                  {rekap.tanggal_dibuat_formatted || "Hari ini, 11.32"}
                </span>
                <span className="text-[10px] text-[#667085] block">
                  oleh {rekap.dibuat_oleh || "Rina Aprilianti"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Figma 145:5556) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/rekap-layanan"
          className="px-5 py-2.5 rounded-[9px] border border-[#d7dce4] bg-white hover:bg-slate-50 text-[#344054] font-medium text-xs transition"
        >
          Kembali ke Daftar Rekap
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {/* Hapus Rekap */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 rounded-[9px] border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-medium text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Hapus Rekap</span>
          </button>

          {/* Edit Rekap (Disabled if Siap Billing) */}
          {!isSiapBilling && (
            <Link
              href={`/rekap-layanan/${rekap.id_rekap}/edit`}
              className="px-4 py-2.5 rounded-[9px] border border-[#d7dce4] bg-white hover:bg-slate-50 text-[#344054] font-medium text-xs flex items-center gap-2 transition"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              <span>Edit Rekap</span>
            </Link>
          )}

          {/* Advance Step / Teruskan ke Billing */}
          {isDraft && (
            <button
              type="button"
              disabled={processing}
              onClick={() => handleAdvanceStatus("Proses Verifikasi")}
              className="px-5 py-2.5 rounded-[9px] bg-[#0b796b] hover:bg-[#07594f] text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <span>Ajukan ke Proses Verifikasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isVerifikasi && (
            <button
              type="button"
              disabled={processing}
              onClick={() => handleAdvanceStatus("Siap Billing")}
              className="px-5 py-2.5 rounded-[9px] bg-[#00b89f] hover:bg-[#00a38d] text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <span>Verifikasi Selesai (Siap Billing)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isSiapBilling && (
            <button
              type="button"
              onClick={() => setShowBillingModal(true)}
              className="px-5 py-2.5 rounded-[9px] bg-[#00b89f] hover:bg-[#00a38d] text-white font-medium text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Teruskan ke Billing</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Teruskan ke Billing (Figma 72:8832 popup_billing.png) */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/80 space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#e7faf7] text-[#0fa18f] flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Teruskan ke Billing?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Rekap akan diteruskan ke modul Billing dan digunakan sebagai dasar
                  proses tagihan pasien <strong>{rekap.nama_pasien}</strong>.
                  Pastikan seluruh informasi sudah benar.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBillingModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBilling}
                className="px-5 py-2 rounded-xl bg-[#00b89f] hover:bg-[#00a38d] text-white font-bold text-xs transition cursor-pointer"
              >
                Ya, Teruskan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Rekap (Figma 146:11207 popup_hapus.png) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/80 space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-lg font-bold text-slate-900">Hapus Rekap?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus rekap riwayat layanan dan tindakan
                  ini? Data layanan dan tindakan yang bersumber dari RME tidak akan ikut
                  terhapus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl border border-rose-600 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs transition cursor-pointer"
              >
                {processing ? "Menghapus..." : "Ya, Hapus Rekap"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectedDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200/80 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Tidak Dapat Menghapus Rekap
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dokumen rekap <strong>{rekap.kode_rekap}</strong> sudah diterbitkan
                  menjadi tagihan pada modul Pembayaran (Billing). Batalkan invoice
                  terlebih dahulu sebelum menghapus rekap ini.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectedDelete(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
