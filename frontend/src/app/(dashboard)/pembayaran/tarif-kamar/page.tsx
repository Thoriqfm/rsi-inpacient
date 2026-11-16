"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";
import { createRoomTariffApi, fetchRoomTariffsApi } from "@/lib/api-client";
import type { KelasPerawatan, RoomTariff } from "@/types";

const classes: KelasPerawatan[] = ["VIP", "Kelas 1", "Kelas 2", "Kelas 3"];
const rupiah = (value: string) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(Number(value));

export default function RoomTariffsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<RoomTariff[]>([]);
  const [kelas, setKelas] = useState<KelasPerawatan>("Kelas 1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setItems(await fetchRoomTariffsApi()); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat tarif kamar."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user && user.role !== "PETUGAS_BED_MANAGEMENT") void Promise.resolve().then(load);
  }, [user, load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true); setError(null); setSuccess(null);
    try {
      await createRoomTariffApi({
        kelas_perawatan: kelas,
        harga_per_malam: String(values.get("harga")),
        tanggal_berlaku: String(values.get("mulai")),
        ...(values.get("akhir") ? { tanggal_berakhir: String(values.get("akhir")) } : {}),
        ...(values.get("sebelumnya") ? { id_tarif_sebelumnya: Number(values.get("sebelumnya")) } : {}),
      });
      form.reset();
      await load();
      setSuccess("Tarif kamar berhasil disimpan. Harga pada alokasi sebelumnya tetap tersimpan.");
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan tarif."); }
    finally { setSaving(false); }
  }

  if (user?.role === "PETUGAS_BED_MANAGEMENT") return <RoleAccessDenied moduleName="Tarif Kamar" />;

  return <div className="max-w-5xl mx-auto space-y-6 text-sm">
    <Link href="/pembayaran" className="text-emerald-700 underline">Kembali ke pembayaran</Link>
    <div><h1 className="text-2xl font-semibold text-slate-900">Tarif kamar per malam</h1>
      <p className="mt-2 text-slate-600">Satu malam adalah 24 jam, dengan pembulatan ke atas dan minimal satu malam. Tarif dikunci saat pasien dialokasikan.</p></div>
    {error && <p role="alert" className="p-4 bg-red-50 text-red-800 rounded-lg">{error} <button type="button" onClick={() => void load()} className="underline">Muat ulang</button></p>}
    {success && <p role="status" className="p-4 bg-emerald-50 text-emerald-800 rounded-lg">{success}</p>}
    {user?.role === "SUPER_ADMIN" && <form onSubmit={submit} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
      <h2 className="font-semibold">Tambah periode tarif</h2>
      <fieldset disabled={saving || loading} className="grid sm:grid-cols-2 gap-4 disabled:opacity-60">
        <label className="space-y-1">Kelas perawatan<select value={kelas} onChange={(e) => setKelas(e.target.value as KelasPerawatan)} className="block w-full border rounded-lg p-2">
          {classes.map((value) => <option key={value}>{value}</option>)}
        </select></label>
        <label className="space-y-1">Harga per malam (Rp)<input required name="harga" type="text" inputMode="decimal" pattern="[0-9]{1,13}(\.[0-9]{1,2})?" placeholder="Contoh: 400000.00" className="block w-full border rounded-lg p-2" /></label>
        <label className="space-y-1">Berlaku mulai (tanggal Jakarta)<input required name="mulai" type="date" className="block w-full border rounded-lg p-2" /></label>
        <label className="space-y-1">Berakhir sebelum (opsional)<input name="akhir" type="date" className="block w-full border rounded-lg p-2" /></label>
        <label className="space-y-1 sm:col-span-2">Ganti tarif terbuka sebelumnya (opsional)<select key={kelas} name="sebelumnya" className="block w-full border rounded-lg p-2">
          <option value="">Tambah periode terpisah</option>
          {items.filter((item) => item.kelas_perawatan === kelas && !item.tanggal_berakhir).map((item) => <option key={item.id_tarif_kamar} value={item.id_tarif_kamar}>
            {item.kelas_perawatan} · {rupiah(item.harga_per_malam)} · sejak {item.tanggal_berlaku.slice(0, 10)}
          </option>)}
        </select></label>
        <p className="sm:col-span-2 text-xs text-slate-600">Saat mengganti tarif, periode sebelumnya ditutup pada tanggal mulai tarif baru dalam satu transaksi. Penggantian berlaku mulai hari ini atau tanggal mendatang.</p>
        <button className="bg-emerald-600 text-white rounded-lg px-4 py-2 sm:col-span-2" type="submit">{saving ? "Menyimpan..." : "Simpan tarif kamar"}</button>
      </fieldset>
    </form>}
    <section className="bg-white border border-slate-200 rounded-xl overflow-x-auto" aria-busy={loading}>
      {loading ? <p role="status" className="p-5">Memuat tarif kamar...</p> : items.length === 0 ? <p className="p-5">Belum ada tarif kamar. Super Admin perlu mengisi tarif sebelum alokasi baru dapat dibuat.</p> :
        <table className="w-full text-left"><caption className="sr-only">Periode tarif kamar per kelas</caption>
          <thead className="bg-slate-50"><tr><th className="p-3">Kelas</th><th className="p-3">Harga / malam</th><th className="p-3">Berlaku mulai</th><th className="p-3">Berakhir sebelum</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id_tarif_kamar} className="border-t"><td className="p-3">{item.kelas_perawatan}</td><td className="p-3">{rupiah(item.harga_per_malam)}</td><td className="p-3">{item.tanggal_berlaku.slice(0, 10)}</td><td className="p-3">{item.tanggal_berakhir?.slice(0, 10) || "Tanpa batas"}</td></tr>)}</tbody>
        </table>}
    </section>
  </div>;
}
