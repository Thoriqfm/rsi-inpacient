"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Info,
  User,
  FileText,
  Calendar,
  Activity,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { HistoryStatus, PasienCandidate, RmeRecordItem } from "@/types";
import { createHistoryApi, fetchPatientRmeApi } from "@/lib/api-client";

export default function BuatRekapBaruPage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Buat Rekap Tindakan Baru" />;
  }

  const params = useParams();
  const router = useRouter();
  const idPasien = Number(params?.idPasien || 1);

  const [pasien, setPasien] = useState<PasienCandidate | null>(null);
  const [rmeItems, setRmeItems] = useState<RmeRecordItem[]>([]);
  const [status, setStatus] = useState<HistoryStatus>("Draft");
  const [catatan, setCatatan] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [showAllRme, setShowAllRme] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPatientRmeApi(idPasien);
      setPasien(res.pasien);
      setRmeItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [idPasien]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasien) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const created = await createHistoryApi({
        id_pasien: idPasien,
        id_riwayat: rmeItems.map((r) => r.id_riwayat),
        catatan,
        keterangan,
      });
      router.push(`/rekap-layanan/${created.id_rekap}`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal membuat rekap riwayat layanan."
      );
      setSubmitting(false);
    }
  };

  if (loading || !pasien) {
    return (
      <div className="max-w-[1200px] mx-auto py-16 text-center text-slate-500 text-sm">
        Memuat data rekap dan formulir pembuatan...
      </div>
    );
  }

  const displayedRme = showAllRme ? rmeItems : rmeItems.slice(0, 3);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-16 text-[#1e1e1e]">
      {/* Breadcrumb & Header (Figma 144:5006 - 144:5010) */}
      <div className="space-y-1">
        <p className="font-semibold text-[#0fa18f] text-[10px] tracking-[1px] uppercase">
          REKAP BARU
        </p>
        <h1 className="text-[27px] font-medium leading-[35px] text-[#1e1e1e] tracking-[-0.675px]">
          Buat Rekap Riwayat Layanan &amp; Tindakan
        </h1>
        <p className="text-[13px] text-[#667085] leading-[21px]">
          Data pasien dan riwayat RME bersifat read-only. Lengkapi informasi
          administratif rekap.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Two-Column Form Layout (Figma 144:5003) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Ringkasan Pasien & Rekam Medis */}
            <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.05)] space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1e1e1e]">
                    Ringkasan Pasien &amp; Rekam Medis
                  </h2>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Informasi berikut diambil langsung dari RME
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                  <Info className="w-3.5 h-3.5" />
                  <span>Tidak dapat diubah</span>
                </span>
              </div>

              {/* Patient Detail 6 Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-[11px] text-[#98a2b3] block">Nama Pasien</span>
                  <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
                    {pasien.nama_pasien}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#98a2b3] block">
                    Nomor Rekam Medis
                  </span>
                  <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
                    {pasien.no_rm}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#98a2b3] block">Jenis Kelamin</span>
                  <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
                    {pasien.jenis_kelamin_usia.startsWith("L")
                      ? "Laki-laki"
                      : "Perempuan"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#98a2b3] block">
                    Tanggal Lahir / Usia
                  </span>
                  <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
                    12 Mei 1994 ({pasien.jenis_kelamin_usia})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#98a2b3] block">
                    Periode Perawatan
                  </span>
                  <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
                    18–22 Februari 2026
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#98a2b3] block">
                    Ruang Perawatan
                  </span>
                  <span className="text-[13px] font-medium text-[#1e1e1e] mt-0.5 block">
                    {pasien.kelas_rekomendasi} • Kamar 204
                  </span>
                </div>
              </div>

              {/* Pratinjau Riwayat RME Table */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-[#1e1e1e]">
                    Pratinjau Riwayat RME
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAllRme(!showAllRme)}
                    className="text-[11px] font-medium text-[#0b796b] hover:text-[#07594f] cursor-pointer"
                  >
                    {showAllRme ? "Tampilkan Lebih Sedikit" : "Lihat Seluruh Riwayat >"}
                  </button>
                </div>

                <div className="border border-[#e9ebf0] rounded-[9px] overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#f8faf9] border-b border-[#e9ebf0] text-[9px] font-medium text-[#667085] uppercase tracking-[0.225px]">
                        <th className="py-2.5 pl-4 pr-2 w-[40px]">No.</th>
                        <th className="py-2.5 px-3">Jenis Layanan / Tindakan</th>
                        <th className="py-2.5 px-3">Tanggal &amp; Waktu</th>
                        <th className="py-2.5 pl-3 pr-4">Tenaga Kesehatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f1]">
                      {displayedRme.map((r, idx) => (
                        <tr key={r.id_riwayat}>
                          <td className="py-2.5 pl-4 pr-2 text-[#475467]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#1e1e1e]">
                            {r.nama_tindakan}
                          </td>
                          <td className="py-2.5 px-3 text-[#475467]">
                            {r.tanggal_tindakan_formatted || "18 Feb 2026, 10.15"}
                          </td>
                          <td className="py-2.5 pl-3 pr-4 text-[#475467]">
                            {r.dokter_pelaksana}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Card 2: Informasi Administratif Rekap */}
            <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-6 shadow-[0px_4px_8px_rgba(26,39,50,0.05)] space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-[15px] font-semibold text-[#1e1e1e]">
                  Informasi Administratif Rekap
                </h2>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  Perubahan tersimpan setelah Anda menekan Simpan Rekap
                </p>
              </div>

              {/* Status Rekap */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#344054] block">
                  Status Rekap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as HistoryStatus)}
                    className="w-full bg-[#fbfcfc] border border-[#d7dce4] rounded-[9px] px-3.5 py-2.5 text-[12px] text-[#1e1e1e] appearance-none focus:outline-none focus:ring-1 focus:ring-[#0fa18f]"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Proses Verifikasi">Proses Verifikasi</option>
                    <option value="Siap Billing">Siap Billing</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#98a2b3]">
                  {status === "Draft"
                    ? "Rekap masih dapat dilengkapi dan belum masuk proses pemeriksaan."
                    : status === "Proses Verifikasi"
                    ? "Rekap sedang dalam proses pemeriksaan dan verifikasi kelengkapan layanan."
                    : "Rekap telah diverifikasi lengkap dan siap diteruskan ke modul Billing."}
                </p>
              </div>

              {/* Catatan Administrasi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#344054]">
                    Catatan Administrasi{" "}
                    <span className="text-[#98a2b3] font-normal">Opsional</span>
                  </label>
                  <span className="text-[10px] text-[#98a2b3]">
                    {catatan.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan administratif untuk rekap ini..."
                  className="w-full bg-[#fbfcfc] border border-[#d7dce4] rounded-[9px] p-3 text-[12px] text-[#1e1e1e] placeholder-[#a6acb5] focus:outline-none focus:ring-1 focus:ring-[#0fa18f]"
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#344054] block">
                  Keterangan{" "}
                  <span className="text-[#98a2b3] font-normal">Opsional</span>
                </label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Tambahkan keterangan jika diperlukan..."
                  className="w-full bg-[#fbfcfc] border border-[#d7dce4] rounded-[9px] p-3 text-[12px] text-[#1e1e1e] placeholder-[#a6acb5] focus:outline-none focus:ring-1 focus:ring-[#0fa18f]"
                />
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar, 4 cols) */}
          <div className="lg:col-span-4 space-y-4 sticky top-24">
            {/* Card 1: Ringkasan Rekap */}
            <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-5 shadow-[0px_4px_8px_rgba(26,39,50,0.05)] space-y-4">
              <h3 className="text-[11px] font-semibold text-[#667085] tracking-wider uppercase border-b border-slate-100 pb-3">
                RINGKASAN REKAP
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-[#0fa18f] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#98a2b3] block">Pasien</span>
                    <span className="font-medium text-[#1e1e1e]">
                      {pasien.nama_pasien}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-[#0fa18f] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#98a2b3] block">Nomor RM</span>
                    <span className="font-medium text-[#1e1e1e]">{pasien.no_rm}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#0fa18f] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#98a2b3] block">Periode</span>
                    <span className="font-medium text-[#1e1e1e]">
                      18–22 Februari 2026
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-[#0fa18f] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#98a2b3] block">
                      Layanan &amp; Tindakan
                    </span>
                    <span className="font-medium text-[#1e1e1e]">
                      {rmeItems.length} item
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Blue Notice Box */}
            <div className="rounded-[12px] bg-[#eff8ff] border border-[#b2ddff] p-4 flex items-start gap-3 text-xs text-[#175cd3]">
              <Info className="w-4 h-4 text-[#2e90fa] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-[11px]">Pemisahan data</p>
                <p className="text-[11px] text-[#175cd3]/90 leading-relaxed">
                  Hanya status, catatan administrasi, dan keterangan yang dapat
                  diubah di halaman ini.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white border border-[#e9ebf0] rounded-[12px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0px_4px_8px_rgba(26,39,50,0.05)]">
          <p className="text-[11px] text-[#667085]">
            Pastikan informasi administratif sudah sesuai sebelum disimpan.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href={`/rekap-layanan/pasien/${idPasien}`}
              className="px-5 py-2.5 rounded-[9px] border border-[#d7dce4] bg-white hover:bg-slate-50 text-[#344054] font-medium text-xs transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-[9px] bg-[#00b89f] hover:bg-[#00a38d] text-white font-medium text-xs shadow-xs transition cursor-pointer"
            >
              {submitting ? "Menyimpan..." : "Simpan Rekap"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
