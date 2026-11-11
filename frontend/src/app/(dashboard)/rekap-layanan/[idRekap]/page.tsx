"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback } from "react";
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

function DetailRekapContent() {
  const { user } = useAuth();

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
    if (params?.idRekap === "pasien" || isNaN(idRekap) || idRekap <= 0) {
      router.replace("/rekap-layanan");
      return;
    }
    loadData();
  }, [params?.idRekap, idRekap, loadData, router]);

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

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Detail Rekap Layanan & Tindakan" />;
  }

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
    <div className="max-w-7xl mx-auto space-y-6 pb-16 text-slate-800">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Breadcrumb & Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold text-emerald-700 text-xs tracking-wider uppercase">
            DETAIL REKAP TINDAKAN
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Detail Rekap Riwayat Layanan &amp; Tindakan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Periksa informasi pasien, data RME, dan status administratif berkas rekap sebelum billing.
          </p>
        </div>

        <div>
          {isDraft ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Draft</span>
            </span>
          ) : isSiapBilling ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Siap Billing</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Proses Verifikasi</span>
            </span>
          )}
        </div>
      </div>

      {/* Success Banner if Transferred to Billing */}
      {hasInvoice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3.5 text-xs text-emerald-900 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-sm text-emerald-900">
              Rekap telah diteruskan ke Billing
            </p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Rekap ini sudah terdaftar pada modul Billing sebagai dasar penerbitan invoice tagihan
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

      {/* 4 Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Box 1: Identitas Rekap */}
        <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-xl p-4 sm:p-5 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase block">
            IDENTITAS REKAP
          </span>
          <div className="text-lg font-bold text-emerald-900 font-mono">
            {rekap.kode_rekap}
          </div>
          <div className="text-[11px] text-emerald-700">
            Dibuat {rekap.tanggal_dibuat_formatted || "Hari ini, 11.32"}
          </div>
        </div>

        {/* Box 2: Pasien */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block">
            PASIEN
          </span>
          <div className="text-base font-bold text-slate-900 truncate">
            {rekap.nama_pasien}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">{rekap.no_rm}</div>
        </div>

        {/* Box 3: Periode Perawatan */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block">
            PERIODE PERAWATAN
          </span>
          <div className="text-sm font-bold text-slate-900">
            {rekap.periode_perawatan || "18–22 Februari 2026"}
          </div>
          <div className="text-[11px] text-slate-500">
            {rekap.nama_kamar || "Kamar Rawat Inap"}
          </div>
        </div>

        {/* Box 4: Jumlah Layanan */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-1 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block">
            JUMLAH LAYANAN
          </span>
          <div className="text-base font-bold text-slate-900">
            {rekap.jumlah_tindakan} item
          </div>
          <div className="text-[11px] text-slate-500">Bersumber dari RME</div>
        </div>
      </div>

      {/* Card: Informasi Pasien */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            Informasi Pasien
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identitas dan bangsal penempatan rawat inap pasien
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Nama Pasien</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {rekap.nama_pasien}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Nomor Rekam Medis</span>
            <span className="text-sm font-mono font-medium text-slate-900 mt-0.5 block">
              {rekap.no_rm}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Jenis Kelamin / Usia</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {rekap.jenis_kelamin_usia}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Periode Perawatan</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {rekap.periode_perawatan || "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Ruang / Kamar</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {rekap.kelas_perawatan} • {rekap.nama_kamar || "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Dokter DPJP</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {rekap.dokter_dpjp}
            </span>
          </div>
        </div>
      </div>

      {/* Card: Rincian Layanan & Tindakan */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Rincian Layanan &amp; Tindakan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data medis bersumber dari RME bangsal (terkunci read-only untuk keabsahan)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Data RME Terkunci</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-5 pr-3 w-12 text-center">No.</th>
                <th className="py-3 px-3">Jenis Layanan / Tindakan</th>
                <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                <th className="py-3 px-3">Tenaga Kesehatan</th>
                <th className="py-3 pl-3 pr-5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rekap.detail_tindakan.map((d, idx) => (
                <tr key={d.id_detail_rekap} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 pl-5 pr-3 text-slate-400 text-center font-normal">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-900">
                    {d.nama_tindakan}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    {d.tanggal_tindakan_formatted || "-"}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    {d.dokter_pelaksana || rekap.dokter_dpjp}
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-slate-500">
                    {d.catatan_khusus || "Pemeriksaan rawat inap"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Bottom Cards: Admin Info & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Informasi Administratif Rekap (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                Informasi Administratif Rekap
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catatan administratif berkas rekap pasien
              </p>
            </div>
            {!isSiapBilling && (
              <Link
                href={`/rekap-layanan/${rekap.id_rekap}/edit`}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Edit Rekap →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Status Rekap</span>
              <div className="mt-1">
                {isDraft ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Draft</span>
                  </span>
                ) : isSiapBilling ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Siap Billing</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Proses Verifikasi</span>
                  </span>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[11px] text-slate-400 block">Catatan Administrasi</span>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {rekap.catatan || "Tidak ada catatan administratif tambahan."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Riwayat Aktivitas Berkas (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Riwayat Berkas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pembaruan terakhir dokumen
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block">Diperbarui</span>
                <span className="font-semibold text-slate-800">
                  {rekap.tanggal_diperbarui_formatted || "Baru saja"}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  oleh {rekap.dibuat_oleh || "Petugas Administrasi"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block">Dokumen dibuat</span>
                <span className="font-semibold text-slate-800">
                  {rekap.tanggal_dibuat_formatted || "18 Feb 2026"}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  oleh {rekap.dibuat_oleh || "Petugas Administrasi"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/rekap-layanan"
          className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
        >
          ← Kembali ke Rekap
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Hapus Rekap */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-medium text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Hapus Rekap</span>
          </button>

          {/* Edit Rekap (Disabled if Siap Billing) */}
          {!isSiapBilling && (
            <Link
              href={`/rekap-layanan/${rekap.id_rekap}/edit`}
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-2 transition"
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
              className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <span>Ajukan ke Verifikasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isVerifikasi && (
            <button
              type="button"
              disabled={processing}
              onClick={() => handleAdvanceStatus("Siap Billing")}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <span>Verifikasi Selesai (Siap Billing)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isSiapBilling && (
            <button
              type="button"
              onClick={() => setShowBillingModal(true)}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Teruskan ke Billing</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Teruskan ke Billing */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  Teruskan ke Billing?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Rekap akan diteruskan ke modul Billing dan digunakan sebagai dasar
                  proses tagihan pasien <strong>{rekap.nama_pasien}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBillingModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBilling}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                Ya, Teruskan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Rekap */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-base font-bold text-slate-900">Hapus Rekap?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus rekap riwayat layanan ini? Data medis asli pada RME tidak akan ikut terhapus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg border border-rose-600 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs transition cursor-pointer"
              >
                {processing ? "Menghapus..." : "Ya, Hapus Rekap"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectedDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  Tidak Dapat Menghapus Rekap
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dokumen rekap <strong>{rekap.kode_rekap}</strong> sudah diterbitkan
                  menjadi invoice pada modul Pembayaran. Batalkan invoice
                  terlebih dahulu sebelum menghapus rekap ini.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectedDelete(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs cursor-pointer"
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

export default function DetailRekapPage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Rekap Layanan & Tindakan" />;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 text-xs font-sans">
          Memuat detail rekap...
        </div>
      }
    >
      <DetailRekapContent />
    </Suspense>
  );
}
