"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Info,
  User,
  FileText,
  Calendar,
  Activity,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { HistoryRecapItem, HistoryStatus } from "@/types";
import { fetchHistoryByIdApi, updateHistoryApi } from "@/lib/api-client";
import { AlertBanner, Badge, Button, PageHeader } from "@/components/ui";

function EditRekapContent() {
  const { user } = useAuth();

  const params = useParams();
  const router = useRouter();
  const idRekap = Number(params?.idRekap || 1);

  const [rekap, setRekap] = useState<HistoryRecapItem | null>(null);
  const [status, setStatus] = useState<HistoryStatus>("Draft");
  const [catatan, setCatatan] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [showAllRme, setShowAllRme] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHistoryByIdApi(idRekap);
      setRekap(data);
      setStatus(data.status);
      setCatatan(data.catatan || "");
      setKeterangan(data.keterangan || "");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Data rekap tidak ditemukan."
      );
    } finally {
      setLoading(false);
    }
  }, [idRekap]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rekap) return;
    setErrorMsg(null);
    setSaving(true);

    try {
      await updateHistoryApi(rekap.id_rekap, {
        status,
        catatan,
        keterangan,
      });
      router.push(`/rekap-layanan/${rekap.id_rekap}`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan perubahan rekap."
      );
      setSaving(false);
    }
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Edit Rekap Tindakan" />;
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto py-16 text-center text-slate-500 text-sm">
        Memuat formulir edit rekap...
      </div>
    );
  }

  if (!rekap) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 text-xs">
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Data Rekap Tidak Ditemukan</span>
          </div>
          <p>{errorMsg || "Rekap riwayat layanan tidak dapat dimuat."}</p>
        </div>
        <Link
          href="/rekap-layanan"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
        >
          ← Kembali ke Daftar Rekap
        </Link>
      </div>
    );
  }

  const isLocked = rekap.status === "Siap Billing";
  const displayedItems = showAllRme
    ? rekap.detail_tindakan
    : rekap.detail_tindakan.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 text-slate-800">
      <PageHeader
        eyebrow="Perbarui Rekap"
        title="Edit Rekap Riwayat Layanan & Tindakan"
        description="Data pasien dan riwayat RME bersifat read-only. Lengkapi informasi administratif rekap."
      />

      {isLocked && (
        <AlertBanner
          tone="warning"
          message={`Dokumen rekap ${rekap.kode_rekap} sudah berstatus Siap Billing dan terkunci secara administratif. Data tidak dapat diubah kembali.`}
        />
      )}

      {errorMsg && <AlertBanner tone="error" message={errorMsg} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Ringkasan Pasien & Rekam Medis */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Ringkasan Pasien &amp; Rekam Medis
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi berikut diambil langsung dari RME
                  </p>
                </div>
                <Badge tone="slate">
                  <Info className="w-3.5 h-3.5" />
                  <span>Tidak dapat diubah</span>
                </Badge>
              </div>

              {/* Patient Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-xs text-slate-500 block">Nama Pasien</span>
                  <span className="text-sm font-medium text-slate-900 mt-0.5 block">
                    {rekap.nama_pasien}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    Nomor Rekam Medis
                  </span>
                  <span className="text-sm font-mono tabular-nums font-medium text-slate-900 mt-0.5 block">
                    {rekap.no_rm}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    Jenis Kelamin &amp; Usia
                  </span>
                  <span className="text-sm font-medium text-slate-900 mt-0.5 block">
                    {rekap.jenis_kelamin_usia || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    Dokter DPJP
                  </span>
                  <span className="text-sm font-medium text-slate-900 mt-0.5 block">
                    {rekap.dokter_dpjp || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    Periode Perawatan
                  </span>
                  <span className="text-sm font-medium text-slate-900 mt-0.5 block">
                    {rekap.periode_perawatan || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    Ruang Perawatan
                  </span>
                  <span className="text-sm font-medium text-slate-900 mt-0.5 block">
                    {rekap.kelas_perawatan} • {rekap.nama_kamar || "Kamar Rawat Inap"}
                  </span>
                </div>
              </div>

              {/* Pratinjau Riwayat RME */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Pratinjau Riwayat RME
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAllRme(!showAllRme)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    {showAllRme ? "Tampilkan Lebih Sedikit" : "Lihat Seluruh Riwayat >"}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 pl-4 pr-2 w-10">No.</th>
                        <th className="py-2.5 px-3">Jenis Layanan / Tindakan</th>
                        <th className="py-2.5 px-3">Tanggal &amp; Waktu</th>
                        <th className="py-2.5 pl-3 pr-4">Tenaga Kesehatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedItems.map((r, idx) => (
                        <tr key={r.id_detail_rekap} className="hover:bg-slate-50/60">
                          <td className="py-2.5 pl-4 pr-2 text-slate-500 font-mono tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {r.nama_tindakan}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {r.tanggal_tindakan_formatted || "-"}
                          </td>
                          <td className="py-2.5 pl-3 pr-4 text-slate-600">
                            {r.dokter_pelaksana || rekap.dokter_dpjp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Card 2: Informasi Administratif Rekap */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-semibold text-slate-900">
                  Informasi Administratif Rekap
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perubahan tersimpan setelah Anda menekan Simpan Perubahan
                </p>
              </div>

              {/* Status Rekap */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Status Rekap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    disabled={isLocked}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as HistoryStatus)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Proses Verifikasi">Proses Verifikasi</option>
                    <option value="Siap Billing">Siap Billing</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500">
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
                  <label className="text-xs font-semibold text-slate-700">
                    Catatan Administrasi{" "}
                    <span className="text-slate-400 font-normal">Opsional</span>
                  </label>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {catatan.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  disabled={isLocked}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan administratif untuk rekap ini..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Keterangan{" "}
                  <span className="text-slate-400 font-normal">Opsional</span>
                </label>
                <textarea
                  rows={2}
                  disabled={isLocked}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Tambahkan keterangan jika diperlukan..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar, 4 cols) */}
          <div className="lg:col-span-4 space-y-4 sticky top-24">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 tracking-wider uppercase border-b border-slate-100 pb-3">
                Ringkasan Rekap
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">Pasien</span>
                    <span className="font-semibold text-slate-900">
                      {rekap.nama_pasien}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">Nomor RM</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {rekap.no_rm}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">Periode</span>
                    <span className="font-semibold text-slate-900">
                      {rekap.periode_perawatan || "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 block">
                      Layanan &amp; Tindakan
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {rekap.jumlah_tindakan} item
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <AlertBanner
              tone="info"
              message="Pemisahan data: hanya status, catatan administrasi, dan keterangan yang dapat diubah di halaman ini."
            />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <p className="text-xs text-slate-500">
            Pastikan informasi administratif sudah sesuai sebelum disimpan.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href={`/rekap-layanan/${idRekap}`}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
            >
              Batal
            </Link>
            <Button
              type="submit"
              size="sm"
              loading={saving}
              disabled={saving || isLocked}
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function EditRekapPage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Edit Rekap Tindakan" />;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 text-xs font-sans">
          Memuat formulir edit rekap...
        </div>
      }
    >
      <EditRekapContent />
    </Suspense>
  );
}
