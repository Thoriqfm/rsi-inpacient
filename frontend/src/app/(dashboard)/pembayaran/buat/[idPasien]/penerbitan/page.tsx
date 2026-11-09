"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Printer,
  Receipt,
  Check,
  ChevronLeft,
  Info,
  AlertTriangle,
} from "lucide-react";
import { BillingItem } from "@/types";
import {
  fetchBillingByIdApi,
  fetchBillingsApi,
  updateBillingStatusApi,
} from "@/lib/api-client";

function PenerbitanInvoiceContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const idPasien = Number(params?.idPasien || 1);
  const queryIdTagihan = searchParams.get("id_tagihan");

  const [billing, setBilling] = useState<BillingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (queryIdTagihan) {
        const data = await fetchBillingByIdApi(Number(queryIdTagihan));
        setBilling(data);
      } else {
        const list = await fetchBillingsApi({ id_pasien: idPasien });
        setBilling(list.items.find((b) => b.status !== "Batal") || null);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Data invoice tidak ditemukan."
      );
    } finally {
      setLoading(false);
    }
  }, [idPasien, queryIdTagihan]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Issue invoice transition: Draft -> Belum Dibayar
  const handleConfirmIssue = async () => {
    if (!billing) return;
    setIssuing(true);
    setErrorMsg(null);
    try {
      if (billing.status === "Draft") {
        const updated = await updateBillingStatusApi(
          billing.id_tagihan,
          "Belum Dibayar"
        );
        setBilling(updated);
        setIsConfirmModalOpen(false);
        showToast(
          `Invoice ${updated.no_tagihan} resmi diterbitkan ("Belum Dibayar").`
        );
        setTimeout(() => {
          router.push(`/pembayaran/${updated.id_tagihan}`);
        }, 1200);
      } else {
        setIsConfirmModalOpen(false);
        router.push(`/pembayaran/${billing.id_tagihan}`);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menerbitkan invoice."
      );
      setIssuing(false);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  if (loading || !billing) {
    return (
      <div className="py-20 text-center text-[#8c8c8c] text-xs font-sans">
        Memuat pratinjau penerbitan invoice resmi...
      </div>
    );
  }

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
        <Link
          href={`/pembayaran/buat/${idPasien}/pemeriksaan?id_tagihan=${billing.id_tagihan}`}
          className="hover:text-[#00b89f] transition"
        >
          Pemeriksaan
        </Link>
        <span>/</span>
        <span className="text-[#0fa18f] font-medium">Penerbitan</span>
      </div>

      {/* Header & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1e1e1e] text-[27px] font-medium leading-[35px] tracking-[-0.675px]">
            Terbitkan Tagihan Pasien
          </h1>
          <p className="text-[#666] text-xs font-normal mt-0.5">
            Tinjau informasi akhir tagihan sebelum disimpan sebagai invoice resmi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] bg-white hover:bg-slate-50 text-xs font-medium text-[#4b5563] flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
        >
          <Printer className="w-4 h-4 text-[#8c8c8c]" />
          <span>Pratinjau Cetak</span>
        </button>
      </div>

      {/* Verified Banner */}
      <div className="bg-[#e7faf7] border border-[#ccefeb] rounded-[10px] p-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-white text-[#0fa18f] flex items-center justify-center shrink-0 shadow-xs">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#0b796b]">
            Tagihan telah diverifikasi
          </div>
          <p className="text-[11px] text-[#0fa18f]/90 mt-0.5">
            Rincian biaya dikonfirmasi oleh {billing.dibuat_oleh || "Rina Aprilianti"} pada {billing.tanggal_diperbarui_formatted || "24 Feb 2026, 09.46"}.
          </p>
        </div>
      </div>

      {/* INVOICE PAPER SHEET */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-8 sm:p-10 shadow-[0px_6px_16px_rgba(26,39,50,0.04)] space-y-8">
        {/* Invoice Header / Kop */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#00b89f]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[10px] bg-[#00b89f] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              +
            </div>
            <div>
              <h2 className="text-[#1e1e1e] font-bold text-sm tracking-wide">
                RS INPATIENT CARE
              </h2>
              <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                Jl. Kesehatan No. 10, Jakarta • (021) 555-0198
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[#00b89f] text-2xl font-semibold tracking-wider">
              INVOICE
            </div>
            <div className="text-[11px] text-[#8c8c8c] mt-0.5">
              {billing.status === "Draft" ? "Akan dibuat otomatis" : billing.no_tagihan}
            </div>
          </div>
        </div>

        {/* 2 Metadata Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-[#0fa18f] text-[10px] font-semibold uppercase tracking-wider block mb-1">
              DITAGIHKAN KEPADA
            </span>
            <div className="font-semibold text-sm text-[#1e1e1e]">
              {billing.nama_pasien}
            </div>
            <div className="text-[#4b5563] text-xs mt-0.5">{billing.no_rm}</div>
            <div className="text-[#4b5563] text-xs">
              {billing.nama_kamar || `${billing.kelas_perawatan} • Kamar 108`}
            </div>
          </div>

          <div>
            <span className="text-[#0fa18f] text-[10px] font-semibold uppercase tracking-wider block mb-1">
              INFORMASI TAGIHAN
            </span>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#8c8c8c]">Tanggal terbit</span>
              <span className="text-[#1e1e1e] font-medium">
                {billing.tanggal_terbit_formatted || "24 Februari 2026"}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#8c8c8c]">Periode rawat</span>
              <span className="text-[#1e1e1e] font-medium">
                {billing.periode_perawatan || "15–19 Februari 2026"}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#8c8c8c]">Status awal</span>
              <span className="text-[#1e1e1e] font-medium">Belum Dibayar</span>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5] text-[10px] font-semibold text-[#8c8c8c] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10">NO.</th>
                <th className="py-2.5 px-3">TANGGAL LAYANAN</th>
                <th className="py-2.5 px-3">NAMA LAYANAN / TINDAKAN</th>
                <th className="py-2.5 px-3">KATEGORI</th>
                <th className="py-2.5 px-3">JUMLAH</th>
                <th className="py-2.5 px-3">TARIF SATUAN</th>
                <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f6f8]">
              {billing.detail_tagihan_list.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 text-[#8c8c8c]">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 px-3 text-[#4b5563]">
                    {item.tanggal_tindakan || "15–19 Feb 2026"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-[#1e1e1e]">{item.nama_tindakan}</div>
                    <div className="text-[10px] text-[#8c8c8c]">
                      Data dummy untuk kebutuhan prototype
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#f3f4f6] text-[10px] text-[#4b5563]">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#4b5563]">
                    {item.jumlah} {item.satuan}
                  </td>
                  <td className="py-3 px-3 text-[#4b5563]">
                    {formatRupiah(item.harga_satuan_num)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-[#1e1e1e]">
                    {formatRupiah(item.subtotal_num)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Row */}
        <div className="pt-4 border-t border-[#f0f2f5] flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-1.5 max-w-sm text-xs">
            <span className="text-[#0fa18f] text-[10px] font-semibold uppercase tracking-wider block">
              CATATAN PENYESUAIAN
            </span>
            <p className="text-xs text-[#4b5563]">
              {billing.catatan_penyesuaian || "Tidak ada catatan penyesuaian."}
            </p>
            <div className="text-[11px] text-[#8c8c8c] pt-1">
              Diverifikasi oleh {billing.dibuat_oleh || "Rina Aprilianti"} • ADM-014
            </div>
          </div>

          {/* Dark Total Box */}
          <div className="w-full md:w-72 bg-[#132a2f] text-white rounded-[10px] p-5 space-y-1 shadow-sm">
            <div className="text-[11px] text-slate-300">Total Tagihan</div>
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatRupiah(billing.total_biaya_num)}
            </div>
            <div className="text-[11px] text-[#00b89f]">
              {billing.detail_tagihan_list.length} jenis layanan
            </div>
          </div>
        </div>

        {/* Bottom Academic Disclaimer */}
        <div className="text-center text-[10px] text-[#9ca3af] pt-4 border-t border-[#f5f6f8]">
          Dokumen ini merupakan invoice demo untuk kebutuhan prototype akademik dan bukan bukti pembayaran resmi.
        </div>
      </div>

      {/* Bottom Bar Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={`/pembayaran/buat/${idPasien}/pemeriksaan?id_tagihan=${billing.id_tagihan}`}
          className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] bg-white hover:bg-slate-50 text-[#4b5563] text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Pemeriksaan</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#8c8c8c] hidden sm:inline">
            Invoice hanya dapat diterbitkan satu kali.
          </span>
          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            className="px-5 py-2.5 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>Terbitkan Invoice</span>
          </button>
        </div>
      </div>

      {/* MODAL: Konfirmasi Penerbitan Invoice (matches 228:18082 & modal_pelunasan.png) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] max-w-md w-full shadow-2xl border border-[#e9ebf0] p-6 space-y-5 animate-fadeIn">
            {/* Top Icon */}
            <div className="w-10 h-10 rounded-[10px] bg-[#e7faf7] text-[#00b89f] flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#1e1e1e]">
                Konfirmasi Penerbitan Invoice
              </h3>
              <p className="text-xs text-[#8c8c8c] mt-0.5">
                Pastikan rincian dan total tagihan sudah sesuai. Invoice akan disimpan sebagai rekam tagihan pasien.
              </p>
            </div>

            {/* Target Box */}
            <div className="bg-[#f9fafb] rounded-[10px] p-4 border border-[#f0f2f5] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#8c8c8c] text-[10px] block">Pasien</span>
                <span className="font-semibold text-[#1e1e1e] block">
                  {billing.nama_pasien}
                </span>
                <span className="text-[10px] text-[#8c8c8c]">{billing.no_rm}</span>
              </div>
              <div className="text-right">
                <span className="text-[#8c8c8c] text-[10px] block">Total tagihan</span>
                <span className="font-bold text-[#00b89f] text-sm block">
                  {formatRupiah(billing.total_biaya_num)}
                </span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="bg-[#f3f4f6] rounded-[8px] p-3 text-[11px] text-[#6b7280] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
              <span>Invoice yang sudah diterbitkan tidak dapat dibuat ulang.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-[8px] border border-[#e5e7eb] text-xs font-medium text-[#4b5563] hover:bg-[#f9fafb] cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={issuing}
                onClick={handleConfirmIssue}
                className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium cursor-pointer disabled:opacity-60"
              >
                {issuing ? "Menerbitkan..." : "Ya, Terbitkan Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PenerbitanInvoicePage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Penerbitan Invoice Tagihan" />;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-[#8c8c8c] text-xs font-sans">
          Memuat penerbitan invoice...
        </div>
      }
    >
      <PenerbitanInvoiceContent />
    </Suspense>
  );
}
