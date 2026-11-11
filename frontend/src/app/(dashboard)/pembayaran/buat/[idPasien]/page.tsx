"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
} from "lucide-react";
import { BillingPreviewResult, HistoryRecapItem } from "@/types";
import {
  createBillingApi,
  fetchHistoriesApi,
  previewBillingApi,
} from "@/lib/api-client";

function RincianBiayaPelayananContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const idPasien = Number(params?.idPasien || 1);
  const queryIdRekap = searchParams.get("id_rekap");

  const [preview, setPreview] = useState<BillingPreviewResult | null>(null);
  const [rekapInfo, setRekapInfo] = useState<HistoryRecapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const hRes = await fetchHistoriesApi({ id_pasien: idPasien });
      const targetRekap = queryIdRekap
        ? hRes.items.find((h) => h.id_rekap === Number(queryIdRekap))
        : hRes.items.find((h) => h.status === "Siap Billing") || hRes.items[0];

      if (!targetRekap) {
        setErrorMsg("Pasien ini belum memiliki dokumen Rekap Tindakan yang terverifikasi.");
        setLoading(false);
        return;
      }

      setRekapInfo(targetRekap);
      const prev = await previewBillingApi(targetRekap.id_rekap);
      setPreview(prev);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal menghitung rincian biaya pelayanan pasien."
      );
    } finally {
      setLoading(false);
    }
  }, [idPasien, queryIdRekap]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProceedToInspection = async () => {
    if (!preview) return;
    const activeInv = rekapInfo?.tagihan?.find((t) => t.status !== "Batal");
    if (activeInv) {
      router.push(
        `/pembayaran/buat/${idPasien}/pemeriksaan?id_tagihan=${activeInv.id_tagihan}&id_rekap=${preview.id_rekap}`
      );
      return;
    }

    setCreating(true);
    setErrorMsg(null);
    try {
      const created = await createBillingApi({
        id_rekap: preview.id_rekap,
        catatan: `Draf tagihan awal dari rekap ${preview.kode_rekap} atas nama ${preview.pasien.nama_pasien}.`,
      });
      router.push(
        `/pembayaran/buat/${idPasien}/pemeriksaan?id_tagihan=${created.id_tagihan}&id_rekap=${preview.id_rekap}`
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal membuat draf tagihan."
      );
      setCreating(false);
    }
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
        Menghitung rincian biaya pelayanan pasien secara otomatis...
      </div>
    );
  }

  if (errorMsg || !preview) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 font-sans text-xs">
        <div className="p-5 rounded-[12px] bg-[#fdf0f0] border border-[#fecaca] text-[#dc2626] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Perhitungan Biaya Tidak Dapat Dilanjutkan</span>
          </div>
          <p className="text-[11px] text-[#b91c1c]">{errorMsg}</p>
        </div>
        <Link
          href="/pembayaran/buat"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#e5e7eb] bg-white text-[#4b5563] font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Pilih Pasien</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-[#1e1e1e]">
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
        <span className="text-[#0fa18f] font-medium">{preview.pasien.nama_pasien}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[#1e1e1e] text-[27px] font-medium leading-[35px] tracking-[-0.675px]">
          Rincian Biaya Pelayanan
        </h1>
        <p className="text-[#666] text-xs font-normal mt-0.5">
          Periksa rincian layanan dan tindakan pasien berdasarkan data rekam medis elektronik.
        </p>
      </div>

      {/* CARD 1: Informasi Pasien */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.03)] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#e6f4ef] text-[#0fa18f] font-semibold text-sm flex items-center justify-center shrink-0">
              {getInitials(preview.pasien.nama_pasien)}
            </div>
            <div>
              <div className="text-[#0fa18f] text-[10px] font-semibold uppercase tracking-wider">
                INFORMASI PASIEN
              </div>
              <h2 className="text-[#1e1e1e] text-base font-semibold">
                {preview.pasien.nama_pasien}
              </h2>
              <span className="text-xs text-[#8c8c8c]">{preview.pasien.no_rm}</span>
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
              {preview.pasien.periode_perawatan || "15–19 Februari 2026"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#8c8c8c] block">Kamar / Bed</span>
            <span className="font-medium text-[#1e1e1e]">
              {preview.pasien.nama_kamar || `${preview.pasien.kelas_perawatan} • Kamar 108`}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#8c8c8c] block">ID Rekap</span>
            <span className="font-medium text-[#1e1e1e] font-mono">
              {preview.kode_rekap}
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

      {/* Banner Perhitungan Biaya Otomatis */}
      <div className="bg-[#e7faf7] border border-[#ccefeb] rounded-[10px] p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white text-[#0fa18f] flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#0b796b]">
              Perhitungan biaya otomatis
            </div>
            <p className="text-[11px] text-[#0fa18f]/90 mt-0.5">
              Rincian biaya dihitung otomatis berdasarkan riwayat layanan dan tarif pelayanan yang berlaku.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-white text-[10px] font-medium text-[#4b5563] border border-[#ccefeb] shrink-0">
          Sumber: RME & Rekap Layanan
        </span>
      </div>

      {/* CARD 2: Rincian Layanan & Biaya (Table) */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.03)] overflow-hidden">
        {/* Subheader */}
        <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#1e1e1e]">Rincian layanan & biaya</h3>
            <p className="text-[11px] text-[#8c8c8c] mt-0.5">
              Tabel bersifat hanya baca. Perubahan tindakan dilakukan melalui modul RME.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-[#8c8c8c]">
            Hanya baca
          </span>
        </div>

        {/* Table */}
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
              {(preview.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-[#fafbfb] transition">
                  <td className="py-3.5 px-6 text-[#8c8c8c] font-medium">
                    {String(idx + 1).padStart(2, "0")}
                  </td>

                  <td className="py-3.5 px-4 text-[#4b5563]">
                    {item.tanggal || item.tanggal_tindakan || "15–19 Feb 2026"}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#1e1e1e]">{item.nama_tindakan}</div>
                    <div className="text-[10px] text-[#8c8c8c] mt-0.5">
                      Data dummy untuk kebutuhan prototype
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-[6px] bg-[#f3f4f6] text-[10px] font-medium text-[#4b5563]">
                      {item.kategori || "Tindakan Medis"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[#4b5563]">
                    {item.jumlah} {item.satuan || "Tindakan"}
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

        {/* Footer info & calculation totals */}
        <div className="p-6 border-t border-[#f0f2f5] flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span>Tarif yang ditampilkan merupakan data dummy untuk kebutuhan prototype.</span>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#8c8c8c]">
              <span>Total Item Layanan</span>
              <span className="text-[#1e1e1e] font-medium">
                {(preview.items || []).length} jenis layanan
              </span>
            </div>

            <div className="flex items-center justify-between text-[#8c8c8c]">
              <span>Total Biaya Pelayanan</span>
              <span className="text-[#1e1e1e] font-medium">
                {formatRupiah(preview.total_biaya_num)}
              </span>
            </div>

            <div className="pt-2 border-t border-[#f0f2f5] flex items-baseline justify-between">
              <span className="text-xs font-semibold text-[#1e1e1e]">Total Tagihan</span>
              <span className="text-xl font-bold text-[#00b89f]">
                {formatRupiah(preview.total_biaya_num)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/pembayaran/buat"
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>

        <button
          type="button"
          disabled={creating}
          onClick={handleProceedToInspection}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
        >
          <span>{creating ? "Memproses Draf..." : "Periksa Tagihan"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function RincianBiayaPelayananPage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Formulir Tagihan Pasien" />;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-[#8c8c8c] text-xs font-sans">
          Memuat rincian perhitungan biaya pelayanan...
        </div>
      }
    >
      <RincianBiayaPelayananContent />
    </Suspense>
  );
}
