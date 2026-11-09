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
  AlertTriangle,
} from "lucide-react";
import { BillingItem } from "@/types";
import {
  createBillingApi,
  fetchBillingByIdApi,
  fetchBillingsApi,
  fetchHistoriesApi,
  recalculateBillingApi,
} from "@/lib/api-client";

function PemeriksaanTagihanContent() {
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
    loadData();
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
        `Tagihan ${updated.no_tagihan} berhasil dihitung ulang (Recalculate) berdasarkan tarif terbaru.`
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
      maximumFractionDigits: 0,
    }).format(val);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#8c8c8c] text-xs font-sans">
        Memuat pemeriksaan & penyesuaian tagihan pasien...
      </div>
    );
  }

  if (errorMsg || !billing) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 font-sans text-xs">
        <div className="p-5 rounded-[12px] bg-[#fdf0f0] border border-[#fecaca] text-[#dc2626] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Pemeriksaan Tagihan Gagal Dimuat</span>
          </div>
          <p className="text-[11px] text-[#b91c1c]">{errorMsg}</p>
        </div>
        <Link
          href={`/pembayaran/buat/${idPasien}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#e5e7eb] bg-white text-[#4b5563] font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Rincian Biaya</span>
        </Link>
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

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#8c8c8c]">
        <Link href="/pembayaran" className="hover:text-[#00b89f] transition">
          Pembayaran (Billing)
        </Link>
        <span>/</span>
        <Link href="/pembayaran/buat" className="hover:text-[#00b89f] transition">
          Buat Tagihan
        </Link>
        <span>/</span>
        <span className="text-[#0fa18f] font-medium">Pemeriksaan</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[#1e1e1e] text-[27px] font-medium leading-[35px] tracking-[-0.675px]">
          Pemeriksaan Tagihan
        </h1>
        <p className="text-[#666] text-xs font-normal mt-0.5">
          Pastikan seluruh rincian biaya telah sesuai dengan riwayat layanan pasien sebelum tagihan diterbitkan.
        </p>
      </div>

      {/* 2 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri: Info, Tabel Rincian, Verifikasi & Catatan Penyesuaian */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: Informasi Pasien */}
          <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.03)] space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#e6f4ef] text-[#0fa18f] font-semibold text-sm flex items-center justify-center shrink-0">
                  {getInitials(billing.nama_pasien)}
                </div>
                <div>
                  <div className="text-[#0fa18f] text-[10px] font-semibold uppercase tracking-wider">
                    INFORMASI PASIEN
                  </div>
                  <h2 className="text-[#1e1e1e] text-base font-semibold">
                    {billing.nama_pasien}
                  </h2>
                  <span className="text-xs text-[#8c8c8c]">{billing.no_rm}</span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                Siap Billing
              </span>
            </div>

            {/* 4 Details Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-[#f0f2f5] text-xs">
              <div>
                <span className="text-[10px] text-[#8c8c8c] block">Periode Perawatan</span>
                <span className="font-medium text-[#1e1e1e]">
                  {billing.periode_perawatan || "15–19 Februari 2026"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8c8c8c] block">Kamar / Bed</span>
                <span className="font-medium text-[#1e1e1e]">
                  {billing.nama_kamar || `${billing.kelas_perawatan} • Kamar 108`}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8c8c8c] block">ID Rekap</span>
                <span className="font-medium text-[#1e1e1e] font-mono">
                  {billing.kode_rekap}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#8c8c8c] block">Sumber Data</span>
                <span className="font-medium text-[#1e1e1e]">
                  RME & Rekap Layanan
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Rincian Biaya Pelayanan (Table) */}
          <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.03)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#1e1e1e]">Rincian biaya pelayanan</h3>
                <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                  Referensi: {billing.kode_rekap} • Terakhir diperbarui {billing.tanggal_diperbarui_formatted || "24 Feb 2026, 09.30"}
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-[#8c8c8c]">
                Hanya baca
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
          </div>

          {/* CARD 3: Verifikasi & Catatan Penyesuaian */}
          <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.03)] space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-[#1e1e1e]">
                Verifikasi & catatan penyesuaian
              </h3>
              <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                Catatan disimpan sebagai referensi audit dan tidak mengubah data RME.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1e1e1e] mb-1.5">
                Catatan penyesuaian (opsional)
              </label>
              <textarea
                rows={3}
                value={catatanPenyesuaian}
                onChange={(e) => setCatatanPenyesuaian(e.target.value)}
                placeholder="Contoh: Periksa kembali layanan laboratorium tanggal 16 Februari 2026..."
                className="w-full p-3 rounded-[8px] border border-[#e2e8f0] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#8c8c8c]">
              <Info className="w-3.5 h-3.5 text-[#9ca3af]" />
              <span>Gunakan &quot;Hitung Ulang&quot; untuk mengambil riwayat tindakan dan tarif terbaru.</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Summary Card, Action Buttons & Notice */}
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.03)] space-y-4">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#8c8c8c]">
                <span>Total Item Layanan</span>
                <span className="text-[#1e1e1e] font-medium">
                  {billing.detail_tagihan_list.length} jenis layanan
                </span>
              </div>

              <div className="flex items-center justify-between text-[#8c8c8c]">
                <span>Total Biaya Pelayanan</span>
                <span className="text-[#1e1e1e] font-medium">
                  {formatRupiah(billing.total_biaya_num)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#f0f2f5] flex items-baseline justify-between">
                <span className="text-xs font-semibold text-[#1e1e1e]">Total Tagihan</span>
                <span className="text-xl font-bold text-[#00b89f]">
                  {formatRupiah(billing.total_biaya_num)}
                </span>
              </div>
            </div>

            {/* Waiting Verification Notice */}
            <div className="bg-[#fef3e9] border border-[#fed7aa] rounded-[8px] p-3 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#e06a14] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[#b45309]">
                  Menunggu verifikasi
                </div>
                <div className="text-[10px] text-[#b45309]/80 mt-0.5">
                  Periksa rincian sebelum konfirmasi
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
              className="w-full py-2.5 rounded-[8px] border border-[#e5e7eb] bg-white hover:bg-slate-50 text-xs font-medium text-[#1e1e1e] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
              <span>{recalculating ? "Menghitung Ulang..." : "Hitung Ulang"}</span>
            </button>

            {/* Konfirmasi Tagihan Sesuai */}
            <button
              type="button"
              onClick={handleConfirmReady}
              className="w-full py-2.5 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Konfirmasi Tagihan Sesuai</span>
            </button>

            {/* Back link */}
            <div className="text-center pt-1">
              <Link
                href={`/pembayaran/buat/${idPasien}?id_rekap=${billing.id_rekap}`}
                className="text-xs text-[#8c8c8c] hover:text-[#00b89f] transition"
              >
                &lt; Kembali ke rincian biaya
              </Link>
            </div>
          </div>

          {/* Note info */}
          <div className="text-[11px] text-[#8c8c8c] flex items-start gap-1.5 px-1">
            <Info className="w-3.5 h-3.5 text-[#9ca3af] shrink-0 mt-0.5" />
            <span>Konfirmasi hanya dapat dilakukan jika seluruh data layanan dan tarif tersedia.</span>
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
        <div className="py-20 text-center text-[#8c8c8c] text-xs font-sans">
          Memuat pemeriksaan tagihan...
        </div>
      }
    >
      <PemeriksaanTagihanContent />
    </Suspense>
  );
}
