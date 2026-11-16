"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";


import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Info, Plus } from "lucide-react";
import {
  HistoryRecapItem,
  PasienCandidate,
  RmeRecordItem,
  TarifItem,
} from "@/types";
import {
  createRmeApi,
  fetchPatientRmeApi,
  fetchTariffsApi,
} from "@/lib/api-client";
import {
  AlertBanner,
  Badge,
  Button,
  Modal,
  PageHeader,
} from "@/components/ui";

function InformasiDataPasienContent() {
  const { user } = useAuth();

  const params = useParams();
  const idPasien = Number(params?.idPasien || 1);

  const [pasien, setPasien] = useState<PasienCandidate | null>(null);
  const [rmeItems, setRmeItems] = useState<RmeRecordItem[]>([]);
  const [existingRekap, setExistingRekap] = useState<HistoryRecapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tariffs, setTariffs] = useState<TarifItem[]>([]);
  const [showAddRmeModal, setShowAddRmeModal] = useState(false);
  const [selectedTarifCode, setSelectedTarifCode] = useState("");
  const [rmeJumlah, setRmeJumlah] = useState(1);
  const [rmeKeterangan, setRmeKeterangan] = useState("");
  const [addingRme, setAddingRme] = useState(false);
  const [rmeError, setRmeError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [res, tarifRes] = await Promise.all([
        fetchPatientRmeApi(idPasien),
        isSuperAdmin
          ? fetchTariffsApi().catch(() => [] as TarifItem[])
          : Promise.resolve([] as TarifItem[]),
      ]);
      setPasien(res.pasien);
      setRmeItems(res.items);
      setExistingRekap(res.rekap_existing);
      setTariffs(tarifRes);
      if (tarifRes.length > 0) {
        setSelectedTarifCode((prev) => prev || tarifRes[0].kode_tindakan);
      }
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data pasien dan riwayat RME."
      );
    } finally {
      setLoading(false);
    }
  }, [idPasien, isSuperAdmin]);

  const handleAddRme = async (e: React.FormEvent) => {
    e.preventDefault();
    const tarif = tariffs.find((t) => t.kode_tindakan === selectedTarifCode);
    if (!tarif) {
      setRmeError("Pilih jenis tindakan dari Master Tarif.");
      return;
    }
    setAddingRme(true);
    setRmeError(null);
    try {
      await createRmeApi({
        id_pasien: idPasien,
        kode_tindakan: tarif.kode_tindakan,
        nama_tindakan: tarif.nama_tindakan,
        jumlah: rmeJumlah,
        keterangan: rmeKeterangan,
      });
      setShowAddRmeModal(false);
      setRmeJumlah(1);
      setRmeKeterangan("");
      await loadData();
    } catch (err) {
      setRmeError(
        err instanceof Error ? err.message : "Gagal mencatat tindakan RME."
      );
    } finally {
      setAddingRme(false);
    }
  };

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Data Pasien & Riwayat RME" />;
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto py-16 text-center text-slate-500 text-sm">
        Memuat data pasien dan riwayat layanan dari RME...
      </div>
    );
  }

  if (!pasien) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 text-xs">
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1.5">
          <div className="font-semibold text-sm">Data Pasien Tidak Ditemukan</div>
          <p>{loadError || "Pasien atau riwayat RME tidak dapat dimuat."}</p>
        </div>
        <Link
          href="/rekap-layanan"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
        >
          ← Kembali ke Rekap Layanan
        </Link>
      </div>
    );
  }

  const activeRekap = existingRekap.find((r) => r.status !== "Draft") || existingRekap[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 text-slate-800">
      <PageHeader
        eyebrow="Data Pasien & Riwayat RME"
        title="Data Pasien & Riwayat Medis"
        description="Periksa identitas pasien dan riwayat layanan dari RME sebelum membuat rekap billing."
      />

      {/* Card 1: Data Pasien Rawat Inap */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-base flex items-center justify-center shrink-0">
              {getInitials(pasien.nama_pasien)}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Data Pasien Rawat Inap
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {pasien.nama_pasien}
              </h2>
              <p className="text-xs font-mono tabular-nums text-slate-500">
                {pasien.no_rm}
              </p>
            </div>
          </div>

          <Badge tone={rmeItems.length > 0 ? "emerald" : "amber"} dot>
            {rmeItems.length > 0 ? "Memenuhi syarat rekap" : "Menunggu tindakan RME"}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8 text-xs">
          <div>
            <span className="text-xs text-slate-500 block">Nama Pasien</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {pasien.nama_pasien}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Nomor Rekam Medis</span>
            <span className="text-sm font-mono tabular-nums font-medium text-slate-900 mt-0.5 block">
              {pasien.no_rm}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Jenis Kelamin &amp; Usia</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {pasien.jenis_kelamin_usia || "-"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Dokter DPJP</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {pasien.dokter_dpjp || "-"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Diagnosa Masuk</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {pasien.diagnosa_masuk || "-"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Kelas Perawatan</span>
            <span className="text-sm font-medium text-slate-900 mt-0.5 block">
              {pasien.kelas_rekomendasi} ({pasien.hak_kelas_jaminan})
            </span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <AlertBanner
        tone="info"
        message="Data medis hanya dapat dilihat: data layanan dan tindakan bersumber dari RME bangsal. Perubahan data medis dilakukan melalui sistem RME yang berwenang."
      />

      {/* Card 3: Table Riwayat Layanan & Tindakan dari RME */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Riwayat Layanan &amp; Tindakan dari RME
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {rmeItems.length} item tercatat selama periode perawatan
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {user?.role === "SUPER_ADMIN" && (
              <Button
                size="sm"
                onClick={() => {
                  setRmeError(null);
                  setShowAddRmeModal(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tindakan RME</span>
              </Button>
            )}
            <Badge tone="slate">
              <Info className="w-3.5 h-3.5" />
              <span>Data read-only</span>
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pl-5 pr-3 w-12">No.</th>
                <th className="py-3 px-3">Jenis Layanan / Tindakan</th>
                <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                <th className="py-3 px-3">Tenaga Kesehatan</th>
                <th className="py-3 pl-3 pr-5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rmeItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                    Pasien ini belum memiliki catatan tindakan RME selama rawat inap.{" "}
                    {user?.role === "SUPER_ADMIN"
                      ? 'Klik "Tambah Tindakan RME" untuk mencatat tindakan.'
                      : "Hubungi Super Admin untuk mencatat tindakan RME terlebih dahulu."}
                  </td>
                </tr>
              ) : (
                rmeItems.map((r, idx) => (
                  <tr key={r.id_riwayat} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 pl-5 pr-3 text-slate-500 font-mono tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-900">
                      {r.nama_tindakan}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {r.tanggal_tindakan_formatted || "-"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {r.dokter_pelaksana || "DPJP Rawat Inap"}
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-slate-500">
                      {r.keterangan || r.catatan_medis || "Pemeriksaan rawat inap"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/rekap-layanan"
          className="px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
        >
          ← Kembali
        </Link>

        {activeRekap ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Rekap sudah dibuat:{" "}
              <span className="font-mono tabular-nums">{activeRekap.kode_rekap}</span> (
              {activeRekap.status})
            </span>
            <Link
              href={`/rekap-layanan/${activeRekap.id_rekap}`}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition"
            >
              <span>Buka Dokumen Rekap</span>
            </Link>
          </div>
        ) : rmeItems.length === 0 ? (
          <Button disabled variant="secondary" size="sm">
            <Plus className="w-4 h-4" />
            <span>Buat Rekap Baru (Butuh Minimal 1 RME)</span>
          </Button>
        ) : (
          <Link
            href={`/rekap-layanan/pasien/${pasien.id_pasien}/buat`}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[2.25]" />
            <span>Buat Rekap Baru</span>
          </Link>
        )}
      </div>

      {/* Modal Tambah Tindakan RME (Super Admin) */}
      <Modal
        isOpen={showAddRmeModal}
        onClose={() => !addingRme && setShowAddRmeModal(false)}
        title="Tambah Tindakan RME (Simulasi)"
        description={`Catat tindakan klinis untuk ${pasien.nama_pasien} agar dapat direkap dan ditagihkan.`}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleAddRme} className="space-y-4">
          {rmeError && <AlertBanner tone="error" message={rmeError} />}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Tindakan (Master Tarif) *
            </label>
            <select
              required
              value={selectedTarifCode}
              onChange={(e) => setSelectedTarifCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              {tariffs.map((t) => (
                <option key={t.id_tarif} value={t.kode_tindakan}>
                  {t.kode_tindakan} — {t.nama_tindakan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah *
            </label>
            <input
              type="number"
              min={1}
              max={99}
              required
              value={rmeJumlah}
              onChange={(e) => setRmeJumlah(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan Klinis (Opsional)
            </label>
            <textarea
              rows={2}
              value={rmeKeterangan}
              onChange={(e) => setRmeKeterangan(e.target.value)}
              placeholder="Catatan dokter / tindakan perawatan..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={addingRme}
              onClick={() => setShowAddRmeModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={addingRme}
              disabled={addingRme || !selectedTarifCode}
            >
              {addingRme ? "Menyimpan..." : "Simpan Tindakan RME"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function InformasiDataPasienPage() {
  const { user } = useAuth();
  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Informasi Pasien" />;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 text-xs font-sans">
          Memuat informasi data pasien...
        </div>
      }
    >
      <InformasiDataPasienContent />
    </Suspense>
  );
}
