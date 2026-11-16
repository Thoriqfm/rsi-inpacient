"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Printer,
  Receipt,
  Check,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { BillingItem } from "@/types";
import {
  fetchBillingByIdApi,
  fetchBillingsApi,
  updateBillingStatusApi,
} from "@/lib/api-client";
import { Badge, Button, Modal, PageHeader, Toast } from "@/components/ui";

function PenerbitanInvoiceContent() {
  const { user } = useAuth();
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
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

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
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
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
        redirectTimerRef.current = setTimeout(() => {
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
      maximumFractionDigits: 2,
    }).format(val);

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Penerbitan Invoice" />;
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-sans">
        Memuat pratinjau penerbitan invoice resmi...
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 font-sans text-xs">
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Pratinjau Invoice Tidak Tersedia</span>
          </div>
          <p>{errorMsg || "Data draf tagihan tidak ditemukan untuk pasien ini."}</p>
        </div>
        <Link
          href="/pembayaran/buat"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Buat Tagihan</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      <Toast message={errorMsg} tone="error" onClose={() => setErrorMsg(null)} />

      <div className="no-print">
        <PageHeader
          eyebrow="Langkah 3 — Penerbitan Invoice"
          title="Penerbitan Invoice Resmi"
          description="Tinjau lembar pratinjau invoice SIMRS sebelum diterbitkan sebagai dokumen tagihan resmi."
          actions={
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Pratinjau Cetak</span>
            </Button>
          }
        />
      </div>

      {/* Verified Banner */}
      <div className="no-print bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-xs font-bold text-emerald-900">
            Tagihan Terverifikasi
          </div>
          <p className="text-xs text-emerald-700 mt-0.5">
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
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider block mb-1">
              Ditagihkan Kepada
            </span>
            <div className="font-bold text-sm text-slate-900">
              {billing.nama_pasien}
            </div>
            <div className="text-slate-600 text-xs font-mono tabular-nums">{billing.no_rm}</div>
            <div className="text-slate-600 text-xs">
              {billing.nama_kamar || `${billing.kelas_perawatan} • Bed`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider block mb-1">
              Informasi Tagihan
            </span>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-500">Tanggal Terbit</span>
              <span className="text-slate-900 font-medium">
                {billing.tanggal_terbit_formatted || "-"}
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
              <Badge tone="amber" dot>
                Belum Dibayar
              </Badge>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3 w-10 text-center">No.</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Nama Tindakan</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Jumlah</th>
                <th className="py-2.5 px-3">Tarif Satuan</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billing.detail_tagihan_list.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 text-slate-400 text-center font-mono tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.tanggal_tindakan_formatted || item.tanggal_tindakan || "-"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{item.nama_tindakan}</div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge tone="slate">{item.kategori}</Badge>
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                    {item.jumlah} {item.satuan}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-mono tabular-nums">
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
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider block">
              Catatan Administrasi
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {billing.catatan_penyesuaian || "Tidak ada catatan penyesuaian khusus."}
            </p>
            <div className="text-xs text-slate-500 pt-1">
              Diverifikasi oleh {billing.dibuat_oleh || "Petugas Administrasi"}
            </div>
          </div>

          {/* Total Box */}
          <div className="w-full md:w-80 bg-slate-900 text-white rounded-xl p-5 space-y-1 shadow-md">
            <div className="text-xs text-slate-300">Total Tagihan Rumah Sakit</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {formatRupiah(billing.total_biaya_num)}
            </div>
            <div className="text-xs text-emerald-400 font-medium font-mono tabular-nums">
              {billing.detail_tagihan_list.length} item layanan terverifikasi
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
          Dokumen ini merupakan invoice resmi SIMRS Inpatient Care untuk dasar penagihan pasien rawat inap.
        </div>
      </div>

      {/* Bottom Bar Actions */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          href={`/pembayaran/buat/${idPasien}/pemeriksaan?id_tagihan=${billing.id_tagihan}`}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Pemeriksaan</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsConfirmModalOpen(true)}>
            <Receipt className="w-4 h-4" />
            <span>Terbitkan Invoice Resmi</span>
          </Button>
        </div>
      </div>

      {/* MODAL: Konfirmasi Penerbitan Invoice */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !issuing && setIsConfirmModalOpen(false)}
        title="Konfirmasi Penerbitan Invoice"
        description="Invoice resmi akan disimpan ke database billing dan siap untuk pelunasan kasir."
        maxWidthClass="max-w-md"
      >
        <div className="space-y-5">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-xs block">Pasien</span>
              <span className="font-semibold text-slate-900 block">
                {billing.nama_pasien}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {billing.no_rm}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-xs block">Total Tagihan</span>
              <span className="font-mono font-bold text-emerald-700 text-sm block tabular-nums">
                {formatRupiah(billing.total_biaya_num)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={issuing}
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              loading={issuing}
              disabled={issuing}
              onClick={handleConfirmIssue}
            >
              {issuing ? "Menerbitkan..." : "Ya, Terbitkan Invoice"}
            </Button>
          </div>
        </div>
      </Modal>
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
        <div className="py-20 text-center text-slate-400 text-xs font-sans">
          Memuat penerbitan invoice...
        </div>
      }
    >
      <PenerbitanInvoiceContent />
    </Suspense>
  );
}
