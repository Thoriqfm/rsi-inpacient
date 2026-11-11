"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Printer,
  RefreshCw,
  X,
  Check,
  Clock,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { BillingItem, BillingStatus } from "@/types";
import {
  cancelBillingApi,
  fetchBillingByIdApi,
  updateBillingStatusApi,
} from "@/lib/api-client";

function DetailTagihanContent() {
  const { user } = useAuth();

  const params = useParams();
  const idTagihan = Number(params?.idTagihan || 1);

  const [billing, setBilling] = useState<BillingItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Ubah Status Pembayaran
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<BillingStatus>("Lunas");

  // Modal Batalkan Tagihan
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBillingByIdApi(idTagihan);
      setBilling(data);
      if (data.status === "Belum Dibayar") {
        setSelectedNewStatus("Lunas");
      } else {
        setSelectedNewStatus("Belum Dibayar");
      }
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Data tagihan tidak ditemukan."
      );
    } finally {
      setLoading(false);
    }
  }, [idTagihan]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler Simpan Perubahan Status
  const handleSaveStatus = async () => {
    if (!billing) return;
    try {
      const updated = await updateBillingStatusApi(
        billing.id_tagihan,
        selectedNewStatus
      );
      setBilling(updated);
      setIsStatusModalOpen(false);
      showToast(
        `Status tagihan ${updated.no_tagihan} berhasil diperbarui menjadi "${selectedNewStatus}".`
      );
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Gagal mengubah status tagihan."
      );
    }
  };

  // Handler Batalkan Tagihan
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billing) return;
    if (!cancelReason.trim()) {
      showError("Alasan pembatalan tagihan wajib diisi.");
      return;
    }

    try {
      const updated = await cancelBillingApi(billing.id_tagihan, cancelReason);
      setBilling(updated);
      setIsCancelModalOpen(false);
      showToast(`Tagihan ${updated.no_tagihan} telah dibatalkan.`);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Gagal membatalkan tagihan."
      );
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Detail Tagihan Pasien" />;
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-[#8c8c8c] text-xs font-sans">
        Memuat detail tagihan pasien...
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 font-sans text-xs">
        <div className="p-5 rounded-[12px] bg-[#fdf0f0] border border-[#fecaca] text-[#dc2626]">
          <span className="font-semibold text-sm">Tagihan Tidak Ditemukan</span>
        </div>
        <Link
          href="/pembayaran"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#e5e7eb] bg-white text-[#4b5563] font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Tagihan</span>
        </Link>
      </div>
    );
  }

  const isBatal = billing.status === "Batal";
  const isLunas = billing.status === "Lunas";

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-3 animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-rose-500/40 flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-emerald-700 text-xs font-semibold tracking-wider uppercase mb-1">
            RINCIAN INVOICE TAGIHAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Detail Tagihan &amp; Pembayaran
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Lihat rincian biaya medis, status pelunasan kasir, dan jejak audit aktivitas invoice.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Cetak Invoice</span>
        </button>
      </div>

      {/* Alert Banner jika Tagihan Dibatalkan */}
      {isBatal && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <X className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-800">
              Tagihan telah dibatalkan
            </div>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Invoice ini disimpan sebagai riwayat audit dan dinonaktifkan dari penagihan kasir.
            </p>
          </div>
        </div>
      )}

      {/* CARD 1: Top Invoice & Patient Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-emerald-700 text-[10px] font-semibold uppercase tracking-wider block">
              NO. INVOICE RESMI
            </span>
            <h2 className="text-slate-900 text-xl font-bold font-mono mt-0.5">
              {billing.no_tagihan}
            </h2>
            <span className="text-xs text-slate-500">
              Diterbitkan {billing.tanggal_terbit_formatted || "18 Feb 2026"} oleh {billing.dibuat_oleh || "Petugas Administrasi"}
            </span>
          </div>

          <div>
            {billing.status === "Belum Dibayar" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Belum Dibayar
              </span>
            ) : billing.status === "Lunas" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Lunas
              </span>
            ) : billing.status === "Batal" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                Batal
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Draft
              </span>
            )}
          </div>
        </div>

        {/* 4 Details Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Nama Pasien</span>
            <span className="font-semibold text-slate-900">{billing.nama_pasien}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">No. Rekam Medis</span>
            <span className="font-mono font-medium text-slate-800">{billing.no_rm}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Periode Perawatan</span>
            <span className="font-medium text-slate-800">
              {billing.periode_perawatan || "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Total Tagihan</span>
            <span className="font-mono font-bold text-emerald-700 text-base tabular-nums">
              {formatRupiah(billing.total_biaya_num)}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Columns Layout: Left Rincian, Right Histori */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Tabel Rincian Biaya (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">Rincian Biaya Pelayanan</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {billing.detail_tagihan_list.length} jenis layanan tercatat pada invoice resmi.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
              Tersimpan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                  <th className="py-3 px-4 w-12 text-center">NO.</th>
                  <th className="py-3 px-4">TANGGAL</th>
                  <th className="py-3 px-4">NAMA TINDAKAN</th>
                  <th className="py-3 px-4">KATEGORI</th>
                  <th className="py-3 px-4">JUMLAH</th>
                  <th className="py-3 px-4">TARIF SATUAN</th>
                  <th className="py-3 px-5 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billing.detail_tagihan_list.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-400 text-center font-normal">
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.tanggal_tindakan || "-"}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.nama_tindakan}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {item.jumlah} {item.satuan}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {formatRupiah(item.harga_satuan_num)}
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(item.subtotal_num)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Total Bottom */}
          <div className="p-5 border-t border-slate-100 flex items-baseline justify-end gap-4 text-xs">
            <span className="text-slate-500 font-medium">Total Tagihan:</span>
            <span className="text-xl font-mono font-bold text-emerald-700 tabular-nums">
              {formatRupiah(billing.total_biaya_num)}
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Histori Aktivitas Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">Histori Aktivitas</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Jejak audit berkas tagihan pasien
            </p>
          </div>

          {/* Timeline Nodes */}
          <div className="space-y-5 text-xs relative pl-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Node 1: Latest Status */}
            {isLunas && (
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center absolute -left-5 top-0.5 shadow-2xs">
                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Lunas
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {billing.tanggal_diperbarui_formatted || billing.tanggal_dibuat_formatted}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                    Pembayaran diterima oleh kasir
                  </div>
                </div>
              </div>
            )}

            {isBatal && (
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center absolute -left-5 top-0.5 shadow-2xs">
                  <X className="w-2.5 h-2.5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-700">
                      Tagihan Dibatalkan
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {billing.tanggal_dibatalkan_formatted ||
                        billing.tanggal_diperbarui_formatted ||
                        billing.tanggal_dibuat_formatted}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Alasan: {billing.alasan_pembatalan || "Pembatalan tagihan"}
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center absolute -left-5 top-0.5 shadow-2xs">
                <Clock className="w-2.5 h-2.5" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Invoice Diterbitkan
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {billing.tanggal_terbit_formatted || "18 Feb 2026"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Oleh {billing.dibuat_oleh || "Petugas Administrasi"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href="/pembayaran"
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Tagihan</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Batalkan Tagihan Button */}
          {!isBatal && !isLunas ? (
            <button
              type="button"
              onClick={() => {
                setCancelReason("");
                setIsCancelModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
            >
              Batalkan Tagihan
            </button>
          ) : null}

          {/* Ubah Status Pembayaran Button */}
          {!isBatal && (
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ubah Status Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL 1: Ubah Status Pembayaran */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-md w-full shadow-2xl border border-[#e9ebf0] p-6 space-y-5 animate-fadeIn">
            {/* Top Icon */}
            <div className="w-10 h-10 rounded-full bg-[#e6f8f5] text-[#00b89f] flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#1e1e1e]">Ubah Status Pembayaran</h3>
              <p className="text-xs text-[#8c8c8c] mt-0.5">
                Perbarui status pembayaran invoice pasien.
              </p>
            </div>

            {/* Target Box */}
            <div className="bg-[#f9fafb] rounded-[10px] p-4 border border-[#f0f2f5] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">No. Invoice</span>
                <span className="font-semibold text-[#1e1e1e]">{billing.no_tagihan}</span>
              </div>
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">Nama Pasien</span>
                <span className="font-semibold text-[#1e1e1e]">{billing.nama_pasien}</span>
              </div>
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">Total Tagihan</span>
                <span className="font-bold text-[#00b89f]">
                  {formatRupiah(billing.total_biaya_num)}
                </span>
              </div>
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">Status Saat Ini</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {billing.status}
                </span>
              </div>
            </div>

            {/* Radio Selectors */}
            <div className="space-y-2.5">
              <span className="text-xs font-medium text-[#1e1e1e] block">
                Pilih status pembayaran
              </span>

              {/* Option Belum Dibayar */}
              <label
                onClick={() => setSelectedNewStatus("Belum Dibayar")}
                className={`flex items-center justify-between p-3.5 rounded-[10px] border cursor-pointer transition ${
                  selectedNewStatus === "Belum Dibayar"
                    ? "border-[#00b89f] bg-[#f2fbf9]"
                    : "border-[#e5e7eb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedNewStatus === "Belum Dibayar"
                        ? "border-[#00b89f] bg-[#00b89f]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {selectedNewStatus === "Belum Dibayar" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1e1e1e]">Belum Dibayar</div>
                    <div className="text-[10px] text-[#8c8c8c]">Pembayaran belum diterima</div>
                  </div>
                </div>
                {selectedNewStatus === "Belum Dibayar" && (
                  <Check className="w-4 h-4 text-[#00b89f]" />
                )}
              </label>

              {/* Option Lunas */}
              <label
                onClick={() => setSelectedNewStatus("Lunas")}
                className={`flex items-center justify-between p-3.5 rounded-[10px] border cursor-pointer transition ${
                  selectedNewStatus === "Lunas"
                    ? "border-[#00b89f] bg-[#f2fbf9]"
                    : "border-[#e5e7eb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedNewStatus === "Lunas"
                        ? "border-[#00b89f] bg-[#00b89f]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {selectedNewStatus === "Lunas" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1e1e1e]">Lunas</div>
                    <div className="text-[10px] text-[#8c8c8c]">Pembayaran telah diselesaikan</div>
                  </div>
                </div>
                {selectedNewStatus === "Lunas" && (
                  <Check className="w-4 h-4 text-[#00b89f]" />
                )}
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Batalkan Tagihan */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-white rounded-[16px] max-w-md w-full shadow-2xl border border-[#fee2e2] p-6 space-y-4 animate-fadeIn"
          >
            {/* Top Red Icon */}
            <div className="w-10 h-10 rounded-full bg-[#fdf0f0] text-[#dc2626] flex items-center justify-center">
              <X className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#1e1e1e]">Batalkan Tagihan?</h3>
              <p className="text-xs text-[#8c8c8c] mt-0.5">
                Tindakan ini akan mengubah status tagihan menjadi Batal dan tidak dapat dipulihkan.
              </p>
            </div>

            {/* Target Info */}
            <div className="bg-[#fef2f2]/60 rounded-[10px] p-3 border border-[#fecaca] text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#1e1e1e] block">{billing.no_tagihan}</span>
                <span className="text-[11px] text-[#4b5563]">{billing.nama_pasien}</span>
              </div>
              <span className="font-bold text-[#dc2626]">
                {formatRupiah(billing.total_biaya_num)}
              </span>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-medium text-[#1e1e1e] mb-1.5">
                Alasan pembatalan *
              </label>
              <textarea
                rows={3}
                required
                maxLength={200}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tuliskan alasan pembatalan tagihan..."
                className="w-full p-2.5 rounded-[8px] border border-[#e5e7eb] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-rose-500"
              />
              <div className="text-[10px] text-[#8c8c8c] text-right mt-1">
                {cancelReason.length}/200 karakter
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-medium cursor-pointer"
              >
                Ya, Batalkan Tagihan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DetailTagihanPage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pembayaran & Billing" />;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 text-xs font-sans">
          Memuat detail tagihan...
        </div>
      }
    >
      <DetailTagihanContent />
    </Suspense>
  );
}
