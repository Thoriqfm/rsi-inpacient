"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  Info,
} from "lucide-react";
import { HistoryRecapItem } from "@/types";
import { fetchHistoriesApi } from "@/lib/api-client";

export default function PilihPasienBillingPage() {
  const { user } = useAuth();

  const router = useRouter();
  const [histories, setHistories] = useState<HistoryRecapItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchHistoriesApi();
      setHistories(res.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return histories.filter((h) => {
      if (!q) return true;
      return (
        h.nama_pasien.toLowerCase().includes(q) ||
        h.no_rm.toLowerCase().includes(q) ||
        h.kode_rekap.toLowerCase().includes(q)
      );
    });
  }, [histories, searchQuery]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Buat Tagihan Pasien" />;
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-emerald-700 text-xs font-semibold tracking-wider uppercase mb-1">
          LANGKAH 1 — PILIH PASIEN BILLING
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Pilih Pasien Rawat Inap
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
          Cari pasien dengan berkas rekap Siap Billing untuk menghitung rincian biaya pelayanan.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search Header Row */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-800">Cari Data Pasien</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gunakan nama lengkap, nomor rekam medis, atau kode rekap.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan nama pasien atau No. RM..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 bg-slate-50/60 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Subheader Title & count */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-800">Pasien Rawat Inap</span>
            <span className="text-[11px] text-slate-500 ml-2">
              ({filtered.length} data ditemukan)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <RefreshCw className="w-3 h-3 text-emerald-600" />
            <span>Sinkron data rekap</span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-5">NAMA PASIEN</th>
                <th className="py-3 px-4">NOMOR REKAM MEDIS</th>
                <th className="py-3 px-4">KAMAR / BED</th>
                <th className="py-3 px-4">PERIODE RAWAT INAP</th>
                <th className="py-3 px-4">STATUS REKAP</th>
                <th className="py-3 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data pasien rawat inap...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada pasien yang sesuai dengan kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isReady = item.status === "Siap Billing";
                  const activeInv = item.tagihan?.find((t) => t.status !== "Batal");
                  const canSelect = isReady && !activeInv;

                  return (
                    <tr key={item.id_rekap} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(item.nama_pasien)}
                          </div>
                          <span className="font-semibold text-slate-900">
                            {item.nama_pasien}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">{item.no_rm}</td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {item.nama_kamar || `${item.kelas_perawatan} • Bed 108`}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {item.periode_perawatan || "-"}
                      </td>

                      <td className="py-3.5 px-4">
                        {isReady ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Siap Billing
                            </span>
                            {activeInv && (
                              <div className="text-[10px] text-rose-500 mt-0.5">
                                Invoice terbit ({activeInv.no_tagihan})
                              </div>
                            )}
                          </div>
                        ) : item.status === "Proses Verifikasi" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Proses Verifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {canSelect ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/pembayaran/buat/${item.id_pasien}?id_rekap=${item.id_rekap}`
                              )
                            }
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition cursor-pointer shadow-xs"
                          >
                            Pilih Pasien
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed"
                          >
                            Pilih Pasien
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-3.5 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
              <span>Memuat data pasien...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Tidak ada pasien yang sesuai filter.
            </div>
          ) : (
            filtered.map((item) => {
              const isReady = item.status === "Siap Billing";
              const activeInv = item.tagihan?.find((t) => t.status !== "Batal");
              const canSelect = isReady && !activeInv;
              return (
                <div
                  key={item.id_rekap}
                  className="pt-3 first:pt-0 bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {item.kode_rekap}
                    </span>
                    {isReady ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Siap Billing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {item.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {item.nama_pasien}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.no_rm} • {item.nama_kamar || `${item.kelas_perawatan} • Bed`}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>{item.jumlah_tindakan} tindakan RME</span>
                    <span className="text-[11px] text-slate-400">{item.periode_perawatan || "-"}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {canSelect ? (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/pembayaran/buat/${item.id_pasien}?id_rekap=${item.id_rekap}`
                          )
                        }
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium text-center transition cursor-pointer shadow-xs"
                      >
                        Pilih Pasien untuk Billing
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium text-center cursor-not-allowed"
                      >
                        {activeInv ? "Invoice Sudah Terbit" : "Rekap Belum Siap Billing"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & back link */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <Link
            href="/pembayaran"
            className="text-slate-600 hover:text-emerald-700 flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Tagihan</span>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Hanya pasien dengan rekap Siap Billing yang dapat diproses kasir.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
