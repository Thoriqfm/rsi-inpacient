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
            LANGKAH 3 — PENERBITAN INVOICE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Penerbitan Invoice Resmi
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Tinjau lembar pratinjau invoice SIMRS sebelum diterbitkan sebagai dokumen tagihan resmi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Pratinjau Cetak</span>
        </button>
      </div>

      {/* Verified Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-xs font-bold text-emerald-900">
            Tagihan Terverifikasi
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Rincian biaya dikonfirmasi oleh {billing.dibuat_oleh || "Petugas Administrasi"} pada {billing.tanggal_diperbarui_formatted || "Hari ini"}.
          </p>
        </div>
      </div>

      {/* INVOICE PAPER SHEET */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Invoice Header / Kop */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-emerald-600">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              +
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-base tracking-wide">
                RSI HOSPITAL INPATIENT CARE
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sistem Informasi Rawat Inap Terpadu • Unit Billing &amp; Kasir
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-emerald-700 text-2xl font-bold tracking-wider font-mono">
              INVOICE
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">
              {billing.status === "Draft" ? "DRAFT (Akan dibuat otomatis)" : billing.no_tagihan}
            </div>
          </div>
        </div>

        {/* 2 Metadata Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider block mb-1">
              DITAGIHKAN KEPADA
            </span>
            <div className="font-bold text-sm text-slate-900">
              {billing.nama_pasien}
            </div>
            <div className="text-slate-600 text-xs font-mono">{billing.no_rm}</div>
            <div className="text-slate-600 text-xs">
              {billing.nama_kamar || `${billing.kelas_perawatan} • Bed`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider block mb-1">
              INFORMASI TAGIHAN
            </span>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-500">Tanggal Terbit</span>
              <span className="text-slate-900 font-medium">
                {billing.tanggal_terbit_formatted || "24 Februari 2026"}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-500">Periode Rawat</span>
              <span className="text-slate-900 font-medium">
                {billing.periode_perawatan || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-500">Status Awal</span>
              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                Belum Dibayar
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3 w-10 text-center">NO.</th>
                <th className="py-2.5 px-3">TANGGAL</th>
                <th className="py-2.5 px-3">NAMA TINDAKAN</th>
                <th className="py-2.5 px-3">KATEGORI</th>
                <th className="py-2.5 px-3">JUMLAH</th>
                <th className="py-2.5 px-3">TARIF SATUAN</th>
                <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billing.detail_tagihan_list.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 text-slate-400 text-center">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.tanggal_tindakan || "-"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{item.nama_tindakan}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {item.jumlah} {item.satuan}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-mono">
                    {formatRupiah(item.harga_satuan_num)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatRupiah(item.subtotal_num)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Row */}
        <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-1.5 max-w-sm text-xs">
            <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider block">
              CATATAN ADMINISTRASI
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {billing.catatan_penyesuaian || "Tidak ada catatan penyesuaian khusus."}
            </p>
            <div className="text-[11px] text-slate-400 pt-1">
              Diverifikasi oleh {billing.dibuat_oleh || "Petugas Administrasi"}
            </div>
          </div>

          {/* Total Box */}
          <div className="w-full md:w-80 bg-slate-900 text-white rounded-xl p-5 space-y-1 shadow-md">
            <div className="text-xs text-slate-400">Total Tagihan Rumah Sakit</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {formatRupiah(billing.total_biaya_num)}
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              {billing.detail_tagihan_list.length} item layanan terverifikasi
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
          Dokumen ini merupakan invoice resmi SIMRS Inpatient Care untuk dasar penagihan pasien rawat inap.
        </div>
      </div>

      {/* Bottom Bar Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href={`/pembayaran/buat/${idPasien}/pemeriksaan?id_tagihan=${billing.id_tagihan}`}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Pemeriksaan</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(true)}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>Terbitkan Invoice Resmi</span>
          </button>
        </div>
      </div>

      {/* MODAL: Konfirmasi Penerbitan Invoice */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-fadeIn">
            {/* Top Icon */}
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Penerbitan Invoice
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Invoice resmi akan disimpan ke database billing dan siap untuk pelunasan kasir.
              </p>
            </div>

            {/* Target Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Pasien</span>
                <span className="font-semibold text-slate-900 block">
                  {billing.nama_pasien}
                </span>
                <span className="text-xs text-slate-500 font-mono">{billing.no_rm}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Total Tagihan</span>
                <span className="font-mono font-bold text-emerald-700 text-sm block tabular-nums">
                  {formatRupiah(billing.total_biaya_num)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={issuing}
                onClick={handleConfirmIssue}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shadow-xs"
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
