"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Check,
  RefreshCw,
  Clock,
  ChevronLeft,
  Info,
} from "lucide-react";
import { AlertBanner, Badge, PageHeader, Toast } from "@/components/ui";
import { BillingItem } from "@/types";
import {
  createBillingApi,
  fetchBillingByIdApi,
  fetchBillingsApi,
  fetchHistoriesApi,
  recalculateBillingApi,
} from "@/lib/api-client";

function PemeriksaanTagihanContent() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const idPasien = Number(params?.idPasien || 1);
  const queryIdTagihan = searchParams.get("id_tagihan");
  const queryIdRekap = searchParams.get("id_rekap");

  const [billing, setBilling] = useState<BillingItem | null>(null);
  const [catatanPenyesuaian, setCatatanPenyesuaian] = useState("");
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let targetBilling: BillingItem | null = null;

      if (queryIdTagihan) {
        targetBilling = await fetchBillingByIdApi(Number(queryIdTagihan));
      } else {
        const bList = await fetchBillingsApi({ id_pasien: idPasien });
        targetBilling = bList.items.find((b) => b.status !== "Batal") || null;

        if (!targetBilling && queryIdRekap) {
          targetBilling = await createBillingApi({
            id_rekap: Number(queryIdRekap),
          });
        } else if (!targetBilling) {
          const hList = await fetchHistoriesApi({
            id_pasien: idPasien,
            status: "Siap Billing",
          });
          if (hList.items[0]) {
            targetBilling = await createBillingApi({
              id_rekap: hList.items[0].id_rekap,
            });
          }
        }
      }

      if (!targetBilling) {
        setErrorMsg("Data draf tagihan tidak ditemukan untuk pasien ini.");
      } else {
        setBilling(targetBilling);
        setCatatanPenyesuaian(targetBilling.catatan_penyesuaian || "");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memuat pemeriksaan tagihan."
      );
    } finally {
      setLoading(false);
    }
  }, [idPasien, queryIdTagihan, queryIdRekap]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  // Recalculate handler
  const handleRecalculate = async () => {
    if (!billing) return;
    setRecalculating(true);
    setErrorMsg(null);
    try {
      const updated = await recalculateBillingApi(
        billing.id_tagihan,
        catatanPenyesuaian
      );
      setBilling(updated);
      showToast(
        `Tagihan ${updated.no_tagihan} berhasil dihitung ulang (Recalculate) berdasarkan rekap tindakan dan snapshot tarif kamar.`
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghitung ulang tagihan."
      );
    } finally {
      setRecalculating(false);
    }
  };

  // Continue to issuance
  const handleConfirmReady = async () => {
    if (!billing) return;
    if (billing.status === "Draft" && catatanPenyesuaian !== (billing.catatan_penyesuaian || "")) {
      try {
        await recalculateBillingApi(billing.id_tagihan, catatanPenyesuaian);
      } catch {
        // continue
      }
    }

    router.push(
      `/pembayaran/buat/${idPasien}/penerbitan?id_tagihan=${billing.id_tagihan}`
    );
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    }).format(val);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pemeriksaan Tagihan" />;
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-sans">
        Memuat pemeriksaan &amp; penyesuaian tagihan pasien...
      </div>
    );
  }

  if (errorMsg || !billing) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 font-sans text-xs">
        <AlertBanner
          tone="error"
          message={`Pemeriksaan Tagihan Gagal Dimuat: ${errorMsg}`}
        />
        <Link
          href={`/pembayaran/buat/${idPasien}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Rincian Biaya</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {errorMsg && <AlertBanner tone="error" message={errorMsg} />}

      <PageHeader
        eyebrow="Langkah 2 — Pemeriksaan Biaya"
        title="Pemeriksaan & Penyesuaian Tagihan"
        description="Pastikan seluruh rincian tarif dan tindakan telah sesuai dengan rekam medis pasien sebelum invoice diterbitkan."
      />

      {/* 2 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Info, Tabel Rincian, Verifikasi (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* CARD 1: Informasi Pasien */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center shrink-0">
                  {getInitials(billing.nama_pasien)}
                </div>
                <div>
                  <div className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                    Informasi Pasien
                  </div>
                  <h2 className="text-slate-900 text-base font-bold">
                    {billing.nama_pasien}
                  </h2>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {billing.no_rm}
                  </span>
                </div>
              </div>

              <Badge tone="emerald" dot>
                Siap Billing
              </Badge>
            </div>

            {/* 4 Details Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Periode Perawatan</span>
                <span className="font-medium text-slate-800">
                  {billing.periode_perawatan || "15–19 Feb 2026"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Kamar / Bed</span>
                <span className="font-medium text-slate-800">
                  {billing.nama_kamar || `${billing.kelas_perawatan} • Bed 108`}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">ID Rekap</span>
                <span className="font-mono font-medium text-slate-800">
                  {billing.kode_rekap}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Sumber Data</span>
                <span className="font-medium text-slate-800">
                  RME &amp; Rekap Rawat Inap
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Rincian Biaya Pelayanan (Table) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-800">Rincian Biaya Pelayanan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Referensi:{" "}
                  <span className="font-mono tabular-nums">{billing.kode_rekap}</span> •
                  Terakhir diperbarui {billing.tanggal_diperbarui_formatted || "-"}
                </p>
              </div>
              <Badge tone="slate">Data RME</Badge>
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
                      <td className="py-3 px-4 text-slate-400 text-center font-mono tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {item.tanggal_tindakan_formatted || item.tanggal_tindakan || "-"}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.nama_tindakan}
                      </td>

                      <td className="py-3 px-4">
                        <Badge tone="slate">{item.kategori}</Badge>
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {item.jumlah} {item.satuan}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-mono tabular-nums">
                        {formatRupiah(item.harga_satuan_num)}
                      </td>

                      <td className="py-3 px-5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(item.subtotal_num)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 3: Verifikasi & Catatan Penyesuaian */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">
                Verifikasi &amp; Catatan Penyesuaian
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Catatan audit internal untuk kasir dan tidak mengubah data rekam medis.
              </p>
            </div>

            <div>
              <textarea
                rows={3}
                value={catatanPenyesuaian}
                onChange={(e) => setCatatanPenyesuaian(e.target.value)}
                placeholder="Contoh: Periksa kembali komponen pemakaian oksigen central..."
                className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Hitung ulang memperbarui biaya tindakan. Tarif kamar tetap memakai snapshot saat masuk.</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Summary Card, Action Buttons (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          {/* Summary Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Item Layanan</span>
                <span className="text-slate-900 font-semibold">
                  {billing.detail_tagihan_list.length} item
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>Total Biaya Pelayanan</span>
                <span className="text-slate-900 font-mono font-bold">
                  {formatRupiah(billing.total_biaya_num)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-900">Total Tagihan</span>
                <span className="text-xl font-mono font-bold text-emerald-700 tabular-nums">
                  {formatRupiah(billing.total_biaya_num)}
                </span>
              </div>
            </div>

            {/* Waiting Verification Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-amber-900">
                  Pemeriksaan Berkas
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5">
                  Konfirmasi rincian sebelum invoice diterbitkan
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Box */}
          <div className="space-y-2.5">
            {/* Hitung Ulang Button */}
            <button
              type="button"
              disabled={recalculating}
              onClick={handleRecalculate}
              className="w-full py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
              <span>{recalculating ? "Menghitung Ulang..." : "Hitung Ulang Tarif"}</span>
            </button>

            {/* Konfirmasi Tagihan Sesuai */}
            <button
              type="button"
              onClick={handleConfirmReady}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Konfirmasi Tagihan Sesuai →</span>
            </button>

            {/* Back link */}
            <div className="text-center pt-1">
              <Link
                href="/pembayaran/buat"
                className="text-xs text-slate-500 hover:text-emerald-700 transition"
              >
                ← Kembali ke pemilihan pasien
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PemeriksaanTagihanPage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pemeriksaan Tagihan" />;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 text-xs font-sans">
          Memuat pemeriksaan tagihan...
        </div>
      }
    >
      <PemeriksaanTagihanContent />
    </Suspense>
  );
}
