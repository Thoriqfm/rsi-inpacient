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
} from "lucide-react";
import { AlertBanner, Badge, PageHeader } from "@/components/ui";
import { BillingPreviewResult, HistoryRecapItem, RoomAllocation, RoomTariff } from "@/types";
import {
  closeAllocationApi,
  createBillingApi,
  fetchHistoriesApi,
  fetchRoomTariffsApi,
  fetchRoomAllocationsApi,
  reconcileRecapAllocationApi,
  reconcileRoomSnapshotApi,
  previewBillingApi,
} from "@/lib/api-client";

const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(value);

function RincianBiayaPelayananContent() {
  const { user } = useAuth();
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
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [reconcileTarget, setReconcileTarget] = useState<number | null>(null);
  const [roomRates, setRoomRates] = useState<RoomTariff[]>([]);
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [reconcileNotice, setReconcileNotice] = useState<string | null>(null);
  const [linkNeeded, setLinkNeeded] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkCandidates, setLinkCandidates] = useState<RoomAllocation[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setLinkNeeded(false);
    setPreview(null);
    try {
      setAllocations([]);
      const hRes = await fetchHistoriesApi({ id_pasien: idPasien });
      const targetRekap = queryIdRekap
        ? hRes.items.find((h) => h.id_rekap === Number(queryIdRekap))
        : hRes.items.find(
            (h) =>
              h.status === "Siap Billing" &&
              !(h.tagihan?.some((t) => t.status !== "Batal"))
          ) ||
          hRes.items.find((h) => h.status === "Siap Billing") ||
          hRes.items[0];

      if (!targetRekap) {
        setErrorMsg("Pasien ini belum memiliki dokumen Rekap Tindakan yang terverifikasi.");
        setLoading(false);
        return;
      }

      setRekapInfo(targetRekap);
      const prev = await previewBillingApi(targetRekap.id_rekap);
      setAllocations(prev.alokasi ? [prev.alokasi] : []);
      if (prev.room_error) {
        setPreview(null);
        setErrorMsg(prev.room_error.message);
      } else { setPreview(prev); }
    } catch (err: unknown) {
      const code = err instanceof Error && "code" in err ? err.code : null;
      setLinkNeeded(code === "ROOM_ALLOCATION_UNMATCHED" || code === "ROOM_ALLOCATION_AMBIGUOUS");
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
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  const openReconciliation = async (id: number) => {
    setReconcileTarget(id); setReconcileBusy(true); setReconcileError(null); setRoomRates([]);
    try { setRoomRates(await fetchRoomTariffsApi()); }
    catch (err) { setReconcileError(err instanceof Error ? err.message : "Gagal memuat tarif kamar."); }
    finally { setReconcileBusy(false); }
  };

  const submitReconciliation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reconcileTarget === null) return;
    const fields = new FormData(event.currentTarget);
    setReconcileBusy(true); setReconcileError(null); setReconcileNotice(null);
    try {
      const updated = await reconcileRoomSnapshotApi(reconcileTarget, {
        id_tarif_kamar: Number(fields.get("tarif")), alasan: String(fields.get("alasan")), konfirmasi: fields.get("konfirmasi") === "on",
      });
      setAllocations([updated]);
      setReconcileTarget(null);
      await loadData();
      setReconcileNotice("Tarif alokasi lama sudah dilengkapi. Waktu masuk tetap sama dan biaya kamar dihitung otomatis.");
    } catch (err) { setReconcileError(err instanceof Error ? err.message : "Gagal melengkapi tarif alokasi."); }
    finally { setReconcileBusy(false); }
  };

  const hasActiveRoom = allocations.some((a) => a.status_alokasi === "Aktif");
  const activeAllocation = allocations.find((a) => a.status_alokasi === "Aktif") || null;
  const [closingAlloc, setClosingAlloc] = useState(false);

  const handleCloseActiveAllocation = async () => {
    if (!activeAllocation) return;
    setClosingAlloc(true);
    setErrorMsg(null);
    setReconcileNotice(null);
    try {
      await closeAllocationApi(activeAllocation.id_alokasi, "Selesai");
      await loadData();
      setReconcileNotice("Alokasi kamar berhasil diselesaikan. Biaya final kamar sudah dihitung otomatis.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyelesaikan alokasi kamar.");
    } finally {
      setClosingAlloc(false);
    }
  };
  const openAllocationLink = async () => {
    setLinkOpen(true); setLinkBusy(true); setLinkError(null); setLinkCandidates([]);
    try {
      const rows = await fetchRoomAllocationsApi(idPasien);
      setLinkCandidates(rows.filter((a) => a.status_alokasi !== "Batal" && a.id_tagihan_kamar === null));
    } catch (err) { setLinkError(err instanceof Error ? err.message : "Gagal memuat riwayat alokasi."); }
    finally { setLinkBusy(false); }
  };

  const submitAllocationLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rekapInfo) return;
    const fields = new FormData(event.currentTarget);
    setLinkBusy(true); setLinkError(null);
    try {
      await reconcileRecapAllocationApi(rekapInfo.id_rekap, {
        id_alokasi: Number(fields.get("alokasi")), alasan: String(fields.get("alasan")), konfirmasi: fields.get("konfirmasi") === "on",
      });
      setLinkOpen(false);
      await loadData();
      setReconcileNotice("Hubungan rekap dan alokasi telah diperbaiki. Data layanan dan tanggal perawatan tetap; biaya kamar diambil otomatis.");
    } catch (err) { setLinkError(err instanceof Error ? err.message : "Gagal memperbaiki hubungan alokasi."); }
    finally { setLinkBusy(false); }
  };
  const roomSelector = (
    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
      <h2 className="font-semibold text-sm">Biaya kamar per malam</h2>
      <p className="text-slate-600">Kelas dan tarif kamar diambil otomatis dari alokasi pada rekap. Setiap 24 jam dihitung satu malam; sisa waktu dibulatkan ke atas, minimal satu malam.</p>
      {reconcileNotice && <p role="status" className="text-emerald-800">{reconcileNotice}</p>}
      {allocations.length === 0 && <p>Rekap ini tidak memiliki alokasi kamar terkait.</p>}
      {allocations.map((a) => {
        return <div key={a.id_alokasi} className="border border-slate-200 rounded-lg p-3 space-y-3">
          <div className="flex items-start gap-3">
          <span className="space-y-1">
            <span className="block font-medium">{a.bed.no_bed} · {a.kelas_perawatan_snapshot || "Tanpa snapshot kelas"} · {a.status_alokasi}</span>
            <span className="block text-slate-600">{new Date(a.waktu_alokasi).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} – {a.waktu_selesai ? new Date(a.waktu_selesai).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "Masih dirawat (estimasi)"}</span>
            <span className="block">{a.harga_per_malam_snapshot ? `${formatRupiah(Number(a.harga_per_malam_snapshot))} / malam` : "Tarif alokasi lama belum dilengkapi. Super Admin dapat merekonsiliasi tanpa membuat ulang alokasi."}{a.id_tagihan_kamar !== null ? " · Sudah ditagihkan" : ""}</span>
          </span>
          </div>
          {user?.role === "SUPER_ADMIN" && !a.harga_per_malam_snapshot && a.status_alokasi !== "Batal" && a.id_tagihan_kamar === null && (
            reconcileTarget !== a.id_alokasi ? <button type="button" disabled={reconcileBusy || creating} onClick={() => void openReconciliation(a.id_alokasi)} className="text-emerald-700 underline disabled:opacity-50">Lengkapi tarif alokasi lama</button> :
              <form onSubmit={submitReconciliation} className="space-y-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-900">Pastikan kelas dan harga sesuai perawatan pasien saat masuk. Tarif yang dipilih berlaku untuk seluruh durasi sejak waktu masuk asli, termasuk bila master tarif dibuat belakangan.</p>
                {reconcileError && <p role="alert" className="text-red-700">{reconcileError} <button type="button" disabled={reconcileBusy} onClick={() => void openReconciliation(a.id_alokasi)} className="underline">Muat ulang tarif</button></p>}
                <fieldset disabled={reconcileBusy} className="space-y-3 disabled:opacity-60">
                  <label className="block">Kelas dan tarif per malam<select name="tarif" required defaultValue="" className="block w-full mt-1 border rounded-lg p-2 bg-white">
                    <option value="">Pilih tarif yang benar</option>
                    {roomRates.map((rate) => <option key={rate.id_tarif_kamar} value={rate.id_tarif_kamar}>{rate.kelas_perawatan} · {formatRupiah(Number(rate.harga_per_malam))} / malam · {rate.tanggal_berlaku.slice(0, 10)} – {rate.tanggal_berakhir?.slice(0, 10) || "tanpa batas"}</option>)}
                  </select></label>
                  {!reconcileBusy && roomRates.length === 0 && <p>Belum ada tarif. <Link href="/pembayaran/tarif-kamar" className="underline">Isi master tarif kamar</Link> terlebih dahulu.</p>}
                  <label className="block">Alasan rekonsiliasi<textarea required name="alasan" minLength={10} maxLength={1000} className="block w-full mt-1 border rounded-lg p-2 bg-white" placeholder="Contoh: Pasien masuk sebelum fitur tarif kamar diterapkan." /></label>
                  <label className="flex items-start gap-2"><input required type="checkbox" name="konfirmasi" /><span>Saya telah memeriksa kelas dan harga untuk alokasi ini. Waktu masuk dipertahankan dan pilihan tarif akan dicatat dalam audit.</span></label>
                  <div className="flex gap-3"><button type="submit" disabled={roomRates.length === 0} className="bg-emerald-700 text-white rounded-lg px-3 py-2 disabled:opacity-50">{reconcileBusy ? "Menyimpan..." : "Simpan tarif alokasi"}</button><button type="button" onClick={() => setReconcileTarget(null)}>Batal</button></div>
                </fieldset>
              </form>
          )}
        </div>;
      })}
      {hasActiveRoom && <p role="status" className="text-amber-800">Biaya kamar aktif masih estimasi. Selesaikan alokasi sebelum membuat draf tagihan.</p>}
    </section>
  );

  const activeInv = rekapInfo?.tagihan?.find((t) => t.status !== "Batal");
  const hasFinalInvoice = Boolean(activeInv && activeInv.status !== "Draft");

  const handleProceedToInspection = async () => {
    if (!preview) return;
    if (activeInv) {
      router.push(
        activeInv.status === "Draft"
          ? `/pembayaran/buat/${idPasien}/pemeriksaan?id_tagihan=${activeInv.id_tagihan}&id_rekap=${preview.id_rekap}`
          : `/pembayaran/${activeInv.id_tagihan}`
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Rincian Biaya Pelayanan" />;
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-sans">
        Menghitung rincian biaya pelayanan pasien secara otomatis...
      </div>
    );
  }

  if (errorMsg || !preview) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 font-sans text-xs">
        {rekapInfo && roomSelector}
        <AlertBanner
          tone="error"
          message={`Perhitungan biaya tidak dapat dilanjutkan: ${errorMsg}`}
        />
        {linkNeeded && user?.role === "SUPER_ADMIN" && rekapInfo && (
          <section className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold">Perbaiki hubungan alokasi</h2>
            <p>Rekap {rekapInfo.kode_rekap} belum memiliki hubungan alokasi yang jelas. Periksa <Link href={`/rekap-layanan/${rekapInfo.id_rekap}`} className="underline">rincian rekap</Link> dan riwayat rawat inap sebelum menghubungkan. Tanggal layanan dan waktu masuk tidak akan diubah.</p>
            {!linkOpen ? <button type="button" onClick={() => void openAllocationLink()} className="text-emerald-700 underline">Perbaiki hubungan alokasi</button> : (
              <form onSubmit={submitAllocationLink} className="space-y-3">
                {linkError && <p role="alert" className="text-red-700">{linkError} <button type="button" disabled={linkBusy} onClick={() => void openAllocationLink()} className="underline">Muat ulang alokasi</button></p>}
                {linkBusy && <p role="status">Memproses...</p>}
                <fieldset disabled={linkBusy} className="space-y-3 disabled:opacity-60">
                  <label className="block">Alokasi dari perawatan yang sama<select name="alokasi" required defaultValue="" className="block w-full mt-1 border rounded-lg p-2">
                    <option value="">Pilih alokasi yang sudah diperiksa</option>
                    {linkCandidates.map((a) => <option key={a.id_alokasi} value={a.id_alokasi}>#{a.id_alokasi} · {a.bed.no_bed} · {a.kelas_perawatan_snapshot || "Tarif belum lengkap"} · {new Date(a.waktu_alokasi).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} – {a.waktu_selesai ? new Date(a.waktu_selesai).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "Masih dirawat"} · {a.status_alokasi}</option>)}
                  </select></label>
                  {!linkBusy && linkCandidates.length === 0 && <p>Tidak ada alokasi non-Batal yang belum ditagihkan untuk pasien ini.</p>}
                  <label className="block">Alasan koreksi<textarea name="alasan" required minLength={10} maxLength={1000} className="block w-full mt-1 border rounded-lg p-2" /></label>
                  <label className="flex gap-2 items-start"><input type="checkbox" name="konfirmasi" required /><span>Saya telah memeriksa bahwa tindakan pada rekap berasal dari perawatan yang sama dengan alokasi ini. Koreksi dicatat dalam audit.</span></label>
                  <div className="flex gap-3"><button type="submit" disabled={!linkCandidates.length} className="bg-emerald-700 text-white rounded-lg px-3 py-2 disabled:opacity-50">Simpan hubungan alokasi</button><button type="button" onClick={() => setLinkOpen(false)}>Batal</button></div>
                </fieldset>
              </form>
            )}
          </section>
        )}
        <Link
          href="/pembayaran/buat"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Pilih Pasien</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-900 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/pembayaran" className="hover:text-emerald-700 transition">
          Pembayaran (Billing)
        </Link>
        <span>/</span>
        <Link href="/pembayaran/buat" className="hover:text-emerald-700 transition">
          Buat Tagihan
        </Link>
        <span>/</span>
        <span className="text-emerald-700 font-medium">{preview.pasien.nama_pasien}</span>
      </div>

      <PageHeader
        eyebrow="Pratinjau Kalkulasi Tagihan"
        title="Rincian Biaya Pelayanan"
        description="Periksa rincian layanan dan tindakan pasien berdasarkan data rekam medis elektronik."
      />

      {/* CARD 1: Informasi Pasien */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center shrink-0">
              {getInitials(preview.pasien.nama_pasien)}
            </div>
            <div>
              <div className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                Informasi Pasien
              </div>
              <h2 className="text-slate-900 text-base font-bold">
                {preview.pasien.nama_pasien}
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {preview.pasien.no_rm}
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
            <span className="text-xs text-slate-500 block">Periode Perawatan</span>
            <span className="font-medium text-slate-900">
              {preview.pasien.periode_perawatan || "Lihat periode alokasi di bawah"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Kamar / Bed</span>
            <span className="font-medium text-slate-900">
              {preview.pasien.nama_kamar || preview.items.filter((item) => item.jenis_item === "KAMAR").map((item) => item.kelas_perawatan_snapshot).join(", ") || "Belum memilih alokasi kamar"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">ID Rekap</span>
            <span className="font-medium text-slate-900 font-mono tabular-nums">
              {preview.kode_rekap}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Sumber Data</span>
            <span className="font-medium text-slate-900">
              RME &amp; Rekap Layanan
            </span>
          </div>
        </div>
      </div>

      {/* Banner Perhitungan Biaya Otomatis */}
      {roomSelector}
      <AlertBanner
        tone="success"
        message="Perhitungan biaya otomatis: rincian biaya dihitung otomatis berdasarkan riwayat layanan RME dan tarif kamar yang berlaku."
        action={<Badge tone="emerald">Sumber: RME &amp; Rekap Layanan</Badge>}
      />

      {/* CARD 2: Rincian Layanan & Biaya (Table) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Rincian layanan &amp; biaya</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tabel bersifat hanya baca. Perubahan tindakan dilakukan melalui modul RME.
            </p>
          </div>
          <Badge tone="slate">Hanya baca</Badge>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-6 w-12">No.</th>
                <th className="py-3 px-4">Tanggal Layanan</th>
                <th className="py-3 px-4">Nama Layanan / Tindakan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Jumlah</th>
                <th className="py-3 px-4">Tarif Satuan</th>
                <th className="py-3 px-6 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(preview.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-6 text-slate-500 font-mono tabular-nums font-medium">
                    {String(idx + 1).padStart(2, "0")}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    {item.tanggal || item.tanggal_tindakan || "-"}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{item.nama_tindakan}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.jenis_item === "KAMAR" ? "Biaya dari alokasi kamar pasien" : "Biaya dari rekap tindakan pasien"}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge tone="slate">{item.kategori || "Tindakan Medis"}</Badge>
                  </td>

                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                    {item.jumlah} {item.satuan || "Tindakan"}
                  </td>

                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                    {formatRupiah(item.harga_satuan_num)}
                  </td>

                  <td className="py-3.5 px-6 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {formatRupiah(item.subtotal_num)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info & calculation totals */}
        <div className="p-5 sm:p-6 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Harga kamar dikunci saat masuk. Rincian dihitung oleh sistem berdasarkan tarif dan alokasi pasien.</span>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Total Item Layanan</span>
              <span className="text-slate-900 font-mono tabular-nums font-medium">
                {(preview.items || []).length} jenis layanan
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>Total Biaya Pelayanan</span>
              <span className="text-slate-900 font-mono tabular-nums font-medium">
                {formatRupiah(preview.total_biaya_num)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-900">Total Tagihan</span>
              <span className="text-xl font-mono tabular-nums font-bold text-emerald-700">
                {formatRupiah(preview.total_biaya_num)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {hasActiveRoom && (
        <div role="status" className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            Periksa Tagihan belum tersedia: pasien masih menempati kamar. Selesaikan alokasi setelah pasien keluar; biaya final kemudian dihitung otomatis.
          </span>
          <button
            type="button"
            disabled={closingAlloc || creating}
            onClick={() => void handleCloseActiveAllocation()}
            className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition cursor-pointer disabled:opacity-60"
          >
            {closingAlloc ? "Menyelesaikan..." : "Selesaikan Alokasi Sekarang"}
          </button>
        </div>
      )}
      {hasFinalInvoice && activeInv && (
        <div role="status" className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            Rekap ini sudah memiliki tagihan aktif{" "}
            <span className="font-mono font-semibold">{activeInv.no_tagihan}</span> ({activeInv.status}).
            Anda dapat langsung membuka detail tagihan tersebut.
          </span>
          <Link
            href={`/pembayaran/${activeInv.id_tagihan}`}
            className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shrink-0 transition"
          >
            Buka Tagihan {activeInv.no_tagihan}
          </Link>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/pembayaran/buat"
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>

        {hasFinalInvoice && activeInv ? (
          <Link
            href={`/pembayaran/${activeInv.id_tagihan}`}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <span>Lihat Invoice {activeInv.no_tagihan}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={creating || reconcileBusy || hasActiveRoom}
            onClick={handleProceedToInspection}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
          >
            <span>
              {creating
                ? "Memproses Draf..."
                : hasActiveRoom
                  ? "Menunggu Alokasi Selesai"
                  : activeInv?.status === "Draft"
                    ? `Lanjutkan Draf ${activeInv.no_tagihan}`
                    : "Periksa Tagihan"}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
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
        <div className="py-20 text-center text-slate-400 text-xs font-sans">
          Memuat rincian perhitungan biaya pelayanan...
        </div>
      }
    >
      <RincianBiayaPelayananContent />
    </Suspense>
  );
}
