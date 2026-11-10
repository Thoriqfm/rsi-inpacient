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
    <div className="space-y-6 pb-12 font-sans text-[#1e1e1e]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#8c8c8c]">
        <Link href="/pembayaran" className="hover:text-[#00b89f] transition">
          Pembayaran (Billing)
        </Link>
        <span>/</span>
        <span className="text-[#8c8c8c]">Buat Tagihan</span>
        <span>/</span>
        <span className="text-[#0fa18f] font-medium">Pilih Pasien</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[#1e1e1e] text-[27px] font-medium leading-[35px] tracking-[-0.675px]">
          Pilih Pasien Rawat Inap
        </h1>
        <p className="text-[#666] text-xs font-normal mt-0.5">
          Cari pasien untuk melihat dan menghitung biaya pelayanan selama perawatan.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.03)] overflow-hidden">
        {/* Search Header Row */}
        <div className="p-6 border-b border-[#f0f2f5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-xs">
            <h3 className="text-xs font-semibold text-[#1e1e1e]">Cari data pasien</h3>
            <p className="text-[11px] text-[#8c8c8c] mt-0.5">
              Gunakan nama lengkap atau nomor rekam medis pasien.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-xl justify-end">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9ca3af] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan nama pasien atau No. Rekam Medis..."
                className="w-full pl-9 pr-4 py-2 rounded-[8px] border border-[#e2e8f0] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
              />
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium transition cursor-pointer shrink-0"
            >
              Cari Pasien
            </button>
          </div>
        </div>

        {/* Subheader Title & Sync time */}
        <div className="px-6 py-3.5 border-b border-[#f0f2f5] flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-[#1e1e1e]">Pasien rawat inap</h4>
            <span className="text-[10px] text-[#8c8c8c]">
              {filtered.length} data ditemukan
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[#8c8c8c]">
            <RefreshCw className="w-3 h-3 text-[#9ca3af]" />
            <span>Data sinkron • 24 Feb 2026, 09:30</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5] text-[10px] font-semibold text-[#8c8c8c] uppercase tracking-wider bg-white">
                <th className="py-3 px-6">NAMA PASIEN</th>
                <th className="py-3 px-4">NOMOR REKAM MEDIS</th>
                <th className="py-3 px-4">KAMAR / BED</th>
                <th className="py-3 px-4">PERIODE RAWAT INAP</th>
                <th className="py-3 px-4">STATUS REKAP</th>
                <th className="py-3 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f6f8]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8c8c8c]">
                    Memuat data pasien rawat inap...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8c8c8c]">
                    Tidak ada pasien yang sesuai dengan kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isReady = item.status === "Siap Billing";
                  const activeInv = item.tagihan?.find((t) => t.status !== "Batal");
                  const canSelect = isReady && !activeInv;

                  return (
                    <tr key={item.id_rekap} className="hover:bg-[#fafbfb] transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e6f4ef] text-[#0fa18f] font-semibold text-[11px] flex items-center justify-center shrink-0">
                            {getInitials(item.nama_pasien)}
                          </div>
                          <span className="font-medium text-[#1e1e1e]">
                            {item.nama_pasien}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-[#4b5563]">{item.no_rm}</td>

                      <td className="py-4 px-4 text-[#4b5563]">
                        {item.nama_kamar || `${item.kelas_perawatan} • Bed 108`}
                      </td>

                      <td className="py-4 px-4 text-[#4b5563]">
                        {item.periode_perawatan || "15–19 Februari 2026"}
                      </td>

                      <td className="py-4 px-4">
                        {isReady ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ef] text-[#016b46] border border-[#cbe7dd]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                              Siap Billing
                            </span>
                            {activeInv && (
                              <div className="text-[10px] text-rose-500 mt-0.5">
                                Invoice sudah terbit ({activeInv.no_tagihan})
                              </div>
                            )}
                          </div>
                        ) : item.status === "Proses Verifikasi" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                            Belum Lengkap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fdf0f0] text-[#dc2626] border border-[#fecaca]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                            Belum Tersedia
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {canSelect ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/pembayaran/buat/${item.id_pasien}?id_rekap=${item.id_rekap}`
                              )
                            }
                            className="px-3.5 py-1.5 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium transition cursor-pointer shadow-xs"
                          >
                            Pilih Pasien
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3.5 py-1.5 rounded-[8px] bg-[#f5f6f8] text-[#bfbfbf] border border-[#e9ebf0] text-xs font-medium cursor-not-allowed"
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

        {/* Footer info & back link */}
        <div className="p-4 border-t border-[#f0f2f5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <Link
            href="/pembayaran"
            className="text-[#4b5563] hover:text-[#00b89f] flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Tagihan</span>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-[#8c8c8c]">
            <Info className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span>Hanya pasien dengan rekap Siap Billing yang dapat dipilih.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
