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
} from "lucide-react";
import { BillingItem, BillingStatus } from "@/types";
import {
  cancelBillingApi,
  fetchBillingByIdApi,
  updateBillingStatusApi,
} from "@/lib/api-client";
import {
  AlertBanner,
  Badge,
  Button,
  Modal,
  PageHeader,
  Toast,
} from "@/components/ui";

function DetailTagihanContent() {
  const { user } = useAuth();

  const params = useParams();
  const idTagihan = Number(params?.idTagihan || 1);

  const [billing, setBilling] = useState<BillingItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Ubah Status Pembayaran
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<BillingStatus>("Lunas");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modal Batalkan Tagihan
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  // Handler Simpan Perubahan Status
  const handleSaveStatus = async () => {
    if (!billing || updatingStatus) return;
    setUpdatingStatus(true);
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
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handler Batalkan Tagihan
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billing || cancelling) return;
    if (!cancelReason.trim()) {
      showError("Alasan pembatalan tagihan wajib diisi.");
      return;
    }

    setCancelling(true);
    try {
      const updated = await cancelBillingApi(billing.id_tagihan, cancelReason);
      setBilling(updated);
      setIsCancelModalOpen(false);
      showToast(`Tagihan ${updated.no_tagihan} telah dibatalkan.`);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Gagal membatalkan tagihan."
      );
    } finally {
      setCancelling(false);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    }).format(val);

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Detail Tagihan Pasien" />;
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-sans">
        Memuat detail tagihan pasien...
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 font-sans text-xs">
        <AlertBanner tone="error" message="Tagihan tidak ditemukan." />
        <Link
          href="/pembayaran"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition"
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
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      <Toast message={errorMsg} tone="error" onClose={() => setErrorMsg(null)} />

      <div className="no-print">
        <PageHeader
          eyebrow="Rincian Invoice Tagihan"
          title="Detail Tagihan & Pembayaran"
          description="Lihat rincian biaya medis, status pelunasan kasir, dan jejak audit aktivitas invoice."
          actions={
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Invoice</span>
            </Button>
          }
        />
      </div>

      {/* Alert Banner jika Tagihan Dibatalkan */}
      {isBatal && (
        <AlertBanner
          tone="error"
          message="Tagihan telah dibatalkan: invoice ini disimpan sebagai riwayat audit dan dinonaktifkan dari penagihan kasir."
        />
      )}

      {/* CARD 1: Top Invoice & Patient Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wider block">
              No. Invoice Resmi
            </span>
            <h2 className="text-slate-900 text-xl font-bold font-mono tabular-nums mt-0.5">
              {billing.no_tagihan}
            </h2>
            <span className="text-xs text-slate-500">
              Diterbitkan {billing.tanggal_terbit_formatted || "-"} oleh {billing.dibuat_oleh || "Petugas Administrasi"}
            </span>
          </div>

          <div>
            {billing.status === "Belum Dibayar" ? (
              <Badge tone="amber" dot>
                Belum Dibayar
              </Badge>
            ) : billing.status === "Lunas" ? (
              <Badge tone="emerald" dot>
                Lunas
              </Badge>
            ) : billing.status === "Batal" ? (
              <Badge tone="rose" dot>
                Batal
              </Badge>
            ) : (
              <Badge tone="slate" dot>
                Draft
              </Badge>
            )}
          </div>
        </div>

        {/* 4 Details Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 text-xs block">Nama Pasien</span>
            <span className="font-semibold text-slate-900">{billing.nama_pasien}</span>
          </div>

          <div>
            <span className="text-slate-500 text-xs block">No. Rekam Medis</span>
            <span className="font-mono tabular-nums font-medium text-slate-800">{billing.no_rm}</span>
          </div>

          <div>
            <span className="text-slate-500 text-xs block">Periode Perawatan</span>
            <span className="font-medium text-slate-800">
              {billing.periode_perawatan || "-"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-xs block">Total Tagihan</span>
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
              <p className="text-xs text-slate-500 mt-0.5">
                {billing.detail_tagihan_list.length} jenis layanan tercatat pada invoice resmi.
              </p>
            </div>
            <Badge tone="slate">Tersimpan</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Tindakan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Jumlah</th>
                  <th className="py-3 px-4">Tarif Satuan</th>
                  <th className="py-3 px-5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billing.detail_tagihan_list.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-400 text-center font-mono tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.tanggal_tindakan_formatted || item.tanggal_tindakan || "-"}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.nama_tindakan}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge tone="slate">{item.kategori}</Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {item.jumlah} {item.satuan}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono tabular-nums">
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
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => !updatingStatus && setIsStatusModalOpen(false)}
        title="Ubah Status Pembayaran"
        description="Perbarui status pembayaran invoice pasien."
        maxWidthClass="max-w-md"
      >
        <div className="space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-xs block">No. Invoice</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {billing.no_tagihan}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Nama Pasien</span>
              <span className="font-semibold text-slate-900">{billing.nama_pasien}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Total Tagihan</span>
              <span className="font-mono tabular-nums font-bold text-emerald-700">
                {formatRupiah(billing.total_biaya_num)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Status Saat Ini</span>
              <Badge tone={billing.status === "Lunas" ? "emerald" : "amber"} dot>
                {billing.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-800 block">
              Pilih status pembayaran
            </span>

            <label
              onClick={() => setSelectedNewStatus("Belum Dibayar")}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                selectedNewStatus === "Belum Dibayar"
                  ? "border-emerald-600 bg-emerald-50/50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedNewStatus === "Belum Dibayar"
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-slate-300"
                  }`}
                >
                  {selectedNewStatus === "Belum Dibayar" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Belum Dibayar</div>
                  <div className="text-xs text-slate-500">Pembayaran belum diterima</div>
                </div>
              </div>
              {selectedNewStatus === "Belum Dibayar" && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </label>

            <label
              onClick={() => setSelectedNewStatus("Lunas")}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                selectedNewStatus === "Lunas"
                  ? "border-emerald-600 bg-emerald-50/50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedNewStatus === "Lunas"
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-slate-300"
                  }`}
                >
                  {selectedNewStatus === "Lunas" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Lunas</div>
                  <div className="text-xs text-slate-500">Pembayaran telah diselesaikan</div>
                </div>
              </div>
              {selectedNewStatus === "Lunas" && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={updatingStatus}
              onClick={() => setIsStatusModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              loading={updatingStatus}
              disabled={updatingStatus}
              onClick={handleSaveStatus}
            >
              {updatingStatus ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Batalkan Tagihan */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !cancelling && setIsCancelModalOpen(false)}
        title="Batalkan Tagihan?"
        description="Tindakan ini akan mengubah status tagihan menjadi Batal dan tidak dapat dipulihkan."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div className="bg-rose-50/70 rounded-xl p-3.5 border border-rose-200 text-xs flex items-center justify-between">
            <div>
              <span className="font-mono tabular-nums font-semibold text-slate-900 block">
                {billing.no_tagihan}
              </span>
              <span className="text-xs text-slate-600">{billing.nama_pasien}</span>
            </div>
            <span className="font-mono tabular-nums font-bold text-rose-700">
              {formatRupiah(billing.total_biaya_num)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Alasan pembatalan *
            </label>
            <textarea
              rows={3}
              required
              maxLength={200}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tuliskan alasan pembatalan tagihan..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
            />
            <div className="text-xs font-mono tabular-nums text-slate-500 text-right mt-1">
              {cancelReason.length}/200 karakter
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={cancelling}
              onClick={() => setIsCancelModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={cancelling}
              disabled={cancelling}
            >
              {cancelling ? "Membatalkan..." : "Ya, Batalkan Tagihan"}
            </Button>
          </div>
        </form>
      </Modal>
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
