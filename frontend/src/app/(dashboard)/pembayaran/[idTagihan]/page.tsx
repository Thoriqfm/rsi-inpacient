"use client";

import React, { useState, useEffect, useCallback } from "react";
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

export default function DetailTagihanPage() {
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
    <div className="space-y-6 pb-12 font-sans text-[#1e1e1e]">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d332f] text-white px-5 py-3 rounded-[10px] shadow-xl border border-[#00b89f]/40 flex items-center gap-3 animate-fadeIn">
          <Check className="w-5 h-5 text-[#00b89f] shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-900 text-white px-5 py-3 rounded-[10px] shadow-xl border border-rose-500/40 flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          <span className="text-xs font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#8c8c8c]">
        <Link href="/pembayaran" className="hover:text-[#00b89f] transition">
          Pembayaran (Billing)
        </Link>
        <span>/</span>
        <span className="text-[#0fa18f] font-medium">Detail Tagihan</span>
      </div>

      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1e1e1e] text-[27px] font-medium leading-[35px] tracking-[-0.675px]">
            Detail Tagihan
          </h1>
          <p className="text-[#666] text-xs font-normal mt-0.5">
            Lihat rincian biaya, status pembayaran, dan histori aktivitas invoice.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] bg-white hover:bg-slate-50 text-xs font-medium text-[#4b5563] flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
        >
          <Printer className="w-4 h-4 text-[#8c8c8c]" />
          <span>Cetak Invoice</span>
        </button>
      </div>

      {/* Alert Banner jika Tagihan Dibatalkan */}
      {isBatal && (
        <div className="bg-[#fdf0f0] border border-[#fecaca] rounded-[10px] p-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white text-[#dc2626] flex items-center justify-center shrink-0 shadow-xs">
            <X className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#dc2626]">
              Tagihan telah dibatalkan
            </div>
            <p className="text-[11px] text-[#b91c1c] mt-0.5">
              Invoice disimpan sebagai riwayat dan tidak dapat diubah. Data rekam medis pasien tetap aman.
            </p>
          </div>
        </div>
      )}

      {/* CARD 1: Top Invoice & Patient Summary Card */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.03)] space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[#0fa18f] text-[10px] font-semibold uppercase tracking-wider block">
              NO. INVOICE
            </span>
            <h2 className="text-[#1e1e1e] text-xl font-semibold mt-0.5">
              {billing.no_tagihan}
            </h2>
            <span className="text-xs text-[#8c8c8c]">
              Diterbitkan {billing.tanggal_terbit_formatted || "18 Feb 2026"} oleh {billing.dibuat_oleh || "Rina Aprilianti"}
            </span>
          </div>

          <div>
            {billing.status === "Belum Dibayar" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                Belum Dibayar
              </span>
            ) : billing.status === "Lunas" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                Lunas
              </span>
            ) : billing.status === "Batal" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#fdf0f0] text-[#dc2626] border border-[#fecaca]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                Batal
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#e7faf7] text-[#0b796b] border border-[#ccefeb]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0fa18f]" />
                Draft
              </span>
            )}
          </div>
        </div>

        {/* 4 Details Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#f0f2f5] text-xs">
          <div>
            <span className="text-[10px] text-[#8c8c8c] block">Nama Pasien</span>
            <span className="font-semibold text-[#1e1e1e]">{billing.nama_pasien}</span>
          </div>

          <div>
            <span className="text-[10px] text-[#8c8c8c] block">No. Rekam Medis</span>
            <span className="font-medium text-[#1e1e1e]">{billing.no_rm}</span>
          </div>

          <div>
            <span className="text-[10px] text-[#8c8c8c] block">Periode Perawatan</span>
            <span className="font-medium text-[#1e1e1e]">
              {billing.periode_perawatan || "8–13 Feb 2026"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#8c8c8c] block">Total Tagihan</span>
            <span className="font-bold text-[#00b89f] text-sm">
              {formatRupiah(billing.total_biaya_num)}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Columns Layout: Left Rincian, Right Histori */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri: Tabel Rincian Biaya */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#1e1e1e]">Rincian biaya</h3>
              <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                {billing.detail_tagihan_list.length} jenis layanan tercatat pada invoice.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-[#8c8c8c]">
              Tersimpan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#f0f2f5] text-[10px] font-semibold text-[#8c8c8c] uppercase tracking-wider bg-white">
                  <th className="py-3 px-6 w-12">NO.</th>
                  <th className="py-3 px-4">TANGGAL LAYANAN</th>
                  <th className="py-3 px-4">NAMA LAYANAN / TINDAKAN</th>
                  <th className="py-3 px-4">KATEGORI</th>
                  <th className="py-3 px-4">JUMLAH</th>
                  <th className="py-3 px-4">TARIF SATUAN</th>
                  <th className="py-3 px-6 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f6f8]">
                {billing.detail_tagihan_list.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#fafbfb] transition">
                    <td className="py-3.5 px-6 text-[#8c8c8c] font-medium">
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3.5 px-4 text-[#4b5563]">
                      {item.tanggal_tindakan || "15–19 Feb 2026"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#1e1e1e]">{item.nama_tindakan}</div>
                      <div className="text-[10px] text-[#8c8c8c] mt-0.5">
                        Data dummy untuk kebutuhan prototype
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[#f3f4f6] text-[10px] font-medium text-[#4b5563]">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#4b5563]">
                      {item.jumlah} {item.satuan}
                    </td>

                    <td className="py-3.5 px-4 text-[#4b5563]">
                      {formatRupiah(item.harga_satuan_num)}
                    </td>

                    <td className="py-3.5 px-6 text-right font-medium text-[#1e1e1e]">
                      {formatRupiah(item.subtotal_num)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Total Bottom */}
          <div className="p-6 border-t border-[#f0f2f5] flex items-baseline justify-end gap-4 text-xs">
            <span className="text-[#8c8c8c]">Total Tagihan</span>
            <span className="text-xl font-bold text-[#00b89f]">
              {formatRupiah(billing.total_biaya_num)}
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Histori Aktivitas Timeline */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.03)] space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-[#1e1e1e]">Histori aktivitas</h3>
            <p className="text-[11px] text-[#8c8c8c] mt-0.5">
              Jejak audit tagihan pasien
            </p>
          </div>

          {/* Timeline Nodes */}
          <div className="space-y-6 text-xs relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#f0f2f5]">
            {/* Node 1: Latest Status */}
            {isLunas && (
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-[#e6f4ef] text-[#016b46] flex items-center justify-center absolute -left-6 top-0 shadow-xs">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1e1e1e]">
                      Status pembayaran diperbarui
                    </span>
                    <span className="text-[10px] text-[#8c8c8c]">19 Feb 2026, 09.42</span>
                  </div>
                  <div className="text-[11px] text-[#016b46] mt-0.5 font-medium">
                    Belum Dibayar → Lunas
                  </div>
                  <div className="text-[10px] text-[#8c8c8c] mt-0.5">
                    Rina Aprilianti • ADM-014
                  </div>
                </div>
              </div>
            )}

            {isBatal && (
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-[#fdf0f0] text-[#dc2626] flex items-center justify-center absolute -left-6 top-0 shadow-xs">
                  <X className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#dc2626]">
                      Tagihan dibatalkan
                    </span>
                    <span className="text-[10px] text-[#8c8c8c]">13 Feb 2026, 10.16</span>
                  </div>
                  <div className="text-[11px] text-[#4b5563] mt-0.5">
                    Alasan: {billing.alasan_pembatalan || "Duplikasi data tagihan"}
                  </div>
                  <div className="text-[10px] text-[#8c8c8c] mt-0.5">
                    Rina Aprilianti • ADM-014
                  </div>
                </div>
              </div>
            )}

            {/* Node 2: Issuance */}
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-[#e7faf7] text-[#00b89f] flex items-center justify-center absolute -left-6 top-0 shadow-xs">
                <Clock className="w-3 h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1e1e1e]">
                    Invoice diterbitkan
                  </span>
                  <span className="text-[10px] text-[#8c8c8c]">
                    {billing.tanggal_terbit_formatted || "18 Feb 2026, 15.08"}
                  </span>
                </div>
                <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                  Status awal: Belum Dibayar
                </div>
                <div className="text-[10px] text-[#8c8c8c] mt-0.5">
                  {billing.dibuat_oleh || "Rina Aprilianti"} • ADM-014
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/pembayaran"
          className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] bg-white hover:bg-slate-50 text-[#4b5563] text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Tagihan</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Batalkan Tagihan Button */}
          {!isBatal && !isLunas ? (
            <button
              type="button"
              onClick={() => {
                setCancelReason("");
                setIsCancelModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-[8px] bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-medium transition cursor-pointer shadow-xs"
            >
              Batalkan Tagihan
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-4 py-2.5 rounded-[8px] bg-[#fca5a5] text-white text-xs font-medium cursor-not-allowed opacity-60"
            >
              Batalkan Tagihan
            </button>
          )}

          {/* Ubah Status Pembayaran Button */}
          {!isBatal ? (
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className="px-4 py-2.5 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ubah Status Pembayaran</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-4 py-2.5 rounded-[8px] bg-[#99f6e4] text-[#0b796b] text-xs font-medium cursor-not-allowed opacity-60"
            >
              Ubah Status Pembayaran
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
