"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Ambulance,
  Search,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  HeartPulse,
  Stethoscope,
  Send,
  Printer,
  ShieldAlert,
  Clock,
} from "lucide-react";
import {
  HospitalAvailability,
  PasienCandidate,
  ReferralHospitalItem,
  ReferralItem,
} from "@/types";
import { INITIAL_PASIEN_CANDIDATES } from "@/lib/mock-fallback";
import {
  createReferralApi,
  fetchQueuesApi,
  fetchReferralHospitalsApi,
  fetchReferralsApi,
  updateHospitalAvailabilityApi,
} from "@/lib/api-client";
import { AntrianTabs } from "@/components/sistem-antrian/AntrianTabs";
import { SuratRujukanModal } from "@/components/sistem-antrian/SuratRujukanModal";

export default function RujukanPasienPage() {
  const [hospitals, setHospitals] = useState<ReferralHospitalItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [waitingCount, setWaitingCount] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  // Emergency patients first
  const emergencyCandidates = useMemo(
    () =>
      INITIAL_PASIEN_CANDIDATES.filter((p) => p.kondisi_pasien === "Darurat"),
    []
  );

  const [selectedPasien, setSelectedPasien] = useState<PasienCandidate>(
    emergencyCandidates[2] || INITIAL_PASIEN_CANDIDATES[4] // Agus Setiawan
  );
  const [selectedHospitalId, setSelectedHospitalId] = useState<number>(1);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [alasanRujukan, setAlasanRujukan] = useState(
    "Kapasitas ruang perawatan intensif (ICU/HCU) dan bed Kelas 1 di RSI sedang penuh (100% Terisi). Pasien kondisi darurat memerlukan intervensi definitif segera."
  );
  const [catatanMedis, setCatatanMedis] = useState(
    "Pasien telah distabilisasi awal di IGD RSI: oksigenasi NRM 10 lpm, pemasangan akses IV line RL 20 tpm, pemberian analgesik & terapi emergensi awal."
  );

  const [submitting, setSubmitting] = useState(false);
  const [updatingHospitalId, setUpdatingHospitalId] = useState<number | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeSuratModal, setActiveSuratModal] =
    useState<ReferralItem | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, rRes, qRes] = await Promise.all([
        fetchReferralHospitalsApi(),
        fetchReferralsApi(),
        fetchQueuesApi(),
      ]);
      setHospitals(hRes.items);
      setReferrals(rRes.items);
      setWaitingCount(
        qRes.items.filter((q) => q.status === "Menunggu").length
      );

      // Select first available hospital by default if current isn't available
      const firstAvail = hRes.items.find(
        (h) => h.status_ketersediaan === "Tersedia"
      );
      if (firstAvail) {
        setSelectedHospitalId((prev) => prev || firstAvail.id_rs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      if (onlyAvailable && h.status_ketersediaan !== "Tersedia") return false;
      if (hospitalSearch.trim()) {
        const q = hospitalSearch.toLowerCase();
        const matchName = h.nama_rs.toLowerCase().includes(q);
        const matchAddr = h.alamat.toLowerCase().includes(q);
        const matchFac = h.fasilitas_unggulan.some((f) =>
          f.toLowerCase().includes(q)
        );
        if (!matchName && !matchAddr && !matchFac) return false;
      }
      return true;
    });
  }, [hospitals, onlyAvailable, hospitalSearch]);

  const selectedHospital = useMemo(
    () => hospitals.find((h) => h.id_rs === selectedHospitalId) || null,
    [hospitals, selectedHospitalId]
  );

  const handleToggleHospitalAvailability = async (
    hospital: ReferralHospitalItem
  ) => {
    const nextStatus: HospitalAvailability =
      hospital.status_ketersediaan === "Tersedia"
        ? "Tidak Tersedia"
        : "Tersedia";
    setUpdatingHospitalId(hospital.id_rs);
    try {
      const updated = await updateHospitalAvailabilityApi(
        hospital.id_rs,
        nextStatus
      );
      setHospitals((prev) =>
        prev.map((h) => (h.id_rs === hospital.id_rs ? updated : h))
      );
      showToast(
        `Status ketersediaan ${hospital.nama_rs} diperbarui menjadi "${nextStatus}".`
      );
    } finally {
      setUpdatingHospitalId(null);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedHospital) {
      setErrorMsg("Silakan pilih Rumah Sakit Rujukan tujuan terlebih dahulu.");
      return;
    }
    if (selectedHospital.status_ketersediaan !== "Tersedia") {
      setErrorMsg(
        `Rumah sakit "${selectedHospital.nama_rs}" saat ini berstatus Tidak Tersedia. Konfirmasi ketersediaan terlebih dahulu atau pilih RS lain.`
      );
      return;
    }
    if (!alasanRujukan.trim()) {
      setErrorMsg("Alasan rujukan wajib diisi secara jelas.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createReferralApi({
        id_pasien: selectedPasien.id_pasien,
        id_rs: selectedHospital.id_rs,
        alasan_rujukan: alasanRujukan.trim(),
        catatan_medis: catatanMedis.trim(),
      });
      setReferrals((prev) => [created, ...prev]);
      setActiveSuratModal(created);
      showToast(
        `Surat Rujukan ${created.no_rujukan} untuk ${created.nama_pasien} berhasil diterbitkan!`
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menerbitkan surat rujukan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d332f] text-white px-4 py-3 rounded-xl shadow-xl border border-teal-500/30 flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#13c9b3] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <AntrianTabs
        waitingCount={waitingCount}
        referralCount={referrals.length}
        monitoringCount={waitingCount + referrals.length + 1}
      />

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-[11px] font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>UC-05 • Penanganan Cepat Pasien Kondisi Darurat (SPGDT)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rujukan Pasien Darurat ke RS Lain
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cari rumah sakit jejaring yang memiliki kapasitas tersedia dan terbitkan Surat Rujukan Resmi secara instan.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="self-start lg:self-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Status RS Jejaring</span>
        </button>
      </div>

      {/* Emergency Protocol Alert Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-red-50/70 to-orange-50/50 border border-rose-200/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-rose-500/30">
            <Ambulance className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-rose-950">
              Protokol Rujukan Darurat (Kapasitas ICU / Kamar Sesuai Penuh)
            </h3>
            <p className="text-xs text-rose-800/90 mt-0.5 leading-relaxed">
              Pasien dengan triase <strong>Darurat (Merah)</strong> tidak boleh menunggu di daftar tunggu. Petugas wajib mengonfirmasi ketersediaan RS tujuan via telepon SPGDT (status ketersediaan dianggap kedaluwarsa/<em>stale</em> setelah 5 menit) sebelum menerbitkan surat rujukan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs">
            {
              hospitals.filter((h) => h.status_ketersediaan === "Tersedia")
                .length
            }{" "}
            dari {hospitals.length} RS Siaga Menerima
          </span>
        </div>
      </div>

      {/* Main Two-Column Grid: Left (Select Patient + Hospital), Right (Referral Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Step 1 Patient & Step 2 Hospital Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Select Emergency Patient */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  Langkah 1
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Pilih Pasien Kondisi Darurat (IGD / PONEK)
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                Triase Merah • Darurat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {emergencyCandidates.map((p) => {
                const isSelected = selectedPasien.id_pasien === p.id_pasien;
                return (
                  <button
                    key={p.id_pasien}
                    type="button"
                    onClick={() => setSelectedPasien(p)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {p.nama_pasien}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {p.no_rm} • {p.jenis_kelamin_usia}
                    </div>
                    <div className="text-[11px] font-semibold text-rose-700 mt-1.5 line-clamp-1">
                      {p.diagnosa_masuk}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Patient Clinical Card */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-slate-900">
                  {selectedPasien.nama_pasien} ({selectedPasien.no_rm}) —{" "}
                  <span className="text-rose-700">
                    {selectedPasien.asal_instalasi}
                  </span>
                </div>
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  {selectedPasien.dokter_dpjp}
                </span>
              </div>
              <div className="text-slate-700">
                <strong>Diagnosa:</strong> {selectedPasien.diagnosa_masuk}
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-800 font-semibold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{selectedPasien.tanda_vital}</span>
              </div>
            </div>
          </div>

          {/* Step 2: Select Destination Referral Hospital */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Langkah 2
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Pilih Rumah Sakit Rujukan Tujuan
                </h2>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-slate-300 text-[#0d332f] focus:ring-[#13c9b3]"
                />
                <span>Hanya tampilkan RS Tersedia</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                placeholder="Cari nama Rumah Sakit, lokasi, atau fasilitas (ICU, PONEK, Cath Lab)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]"
              />
            </div>

            {/* Hospital List */}
            {filteredHospitals.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Rumah sakit rujukan tidak ditemukan
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Tidak ada RS yang cocok dengan kata kunci &ldquo;{hospitalSearch}&rdquo;. Coba kata kunci lain atau matikan filter ketersediaan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHospitals.map((rs) => {
                  const isSelected = selectedHospitalId === rs.id_rs;
                  const isAvail = rs.status_ketersediaan === "Tersedia";

                  return (
                    <div
                      key={rs.id_rs}
                      onClick={() => setSelectedHospitalId(rs.id_rs)}
                      className={`p-4 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? "border-[#13c9b3] bg-teal-50/40 ring-2 ring-[#13c9b3]/30"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isAvail
                                ? "bg-teal-100 text-[#0d332f]"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                {rs.nama_rs}
                              </h3>
                              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                                {rs.jarak_estimasi}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {rs.tipe_rs}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isAvail
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {rs.status_ketersediaan}
                          </span>
                        </div>
                      </div>

                      {/* Facilities & Contact */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {rs.fasilitas_unggulan.map((fac) => (
                          <span
                            key={fac}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            {fac}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        <div className="flex flex-wrap items-center gap-3 text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {rs.alamat}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-teal-600" />
                            {rs.kontak}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`flex items-center gap-1 ${
                              rs.stale
                                ? "text-amber-600 font-semibold"
                                : "text-slate-400"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {rs.terakhir_diperbarui_formatted}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHospitalAvailability(rs);
                            }}
                            disabled={updatingHospitalId === rs.id_rs}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                          >
                            {updatingHospitalId === rs.id_rs
                              ? "Menyimpan..."
                              : isAvail
                              ? "Tandai Penuh"
                              : "Konfirmasi Tersedia"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Step 3 Form Penerbitan Surat Rujukan */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCreateReferral}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden sticky top-24"
          >
            <div className="bg-gradient-to-r from-[#0d332f] to-[#11423d] px-5 py-4 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#13c9b3]">
                Langkah 3 • Konfirmasi & Cetak
              </span>
              <h2 className="text-base font-bold mt-0.5">
                Formulir Surat Rujukan Pasien
              </h2>
              <p className="text-xs text-teal-200/80">
                Pastikan RS tujuan telah dikonfirmasi berstatus Tersedia
              </p>
            </div>

            <div className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Summary Box */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pasien Dirujuk:</span>
                  <span className="font-bold text-slate-900">
                    {selectedPasien.nama_pasien} ({selectedPasien.no_rm})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">RS Tujuan:</span>
                  <span className="font-bold text-[#0d332f]">
                    {selectedHospital?.nama_rs || "Belum dipilih"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Ketersediaan RS:</span>
                  {selectedHospital ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedHospital.status_ketersediaan === "Tersedia"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {selectedHospital.status_ketersediaan}
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alasan Rujukan (Indikasi Medis & Kapasitas) *
                </label>
                <textarea
                  rows={3}
                  value={alasanRujukan}
                  onChange={(e) => setAlasanRujukan(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]"
                  placeholder="Jelaskan alasan kapasitas kamar penuh dan kebutuhan fasilitas di RS tujuan..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ringkasan Tindakan / Terapi Stabilisasi Awal di IGD
                </label>
                <textarea
                  rows={3}
                  value={catatanMedis}
                  onChange={(e) => setCatatanMedis(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#13c9b3]"
                  placeholder="Catat terapi awal, oksigenasi, infus, dan obat emergensi yang telah diberikan..."
                />
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !selectedHospital ||
                  selectedHospital.status_ketersediaan !== "Tersedia"
                }
                className="w-full py-3 px-4 rounded-xl bg-[#0d332f] hover:bg-[#144943] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-950/15 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#13c9b3]" />
                <span>
                  {submitting
                    ? "Menerbitkan Surat Rujukan..."
                    : "Terbitkan & Cetak Surat Rujukan"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Table: Daftar Surat Rujukan yang Telah Diterbitkan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Riwayat Surat Rujukan Pasien Darurat
            </h2>
            <p className="text-xs text-slate-500">
              Klik &ldquo;Lihat & Cetak Surat&rdquo; untuk mencetak dokumen resmi atau memperbarui status pengiriman ambulans
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            Total: {referrals.length} Surat Rujukan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">No. Surat Rujukan</th>
                <th className="py-3.5 px-4">Pasien Darurat</th>
                <th className="py-3.5 px-4">Rumah Sakit Tujuan</th>
                <th className="py-3.5 px-4">Alasan & Diagnosa</th>
                <th className="py-3.5 px-4">Status Rujukan</th>
                <th className="py-3.5 px-5 text-right">Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {referrals.map((r) => (
                <tr key={r.id_surat} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-5">
                    <div className="font-mono font-bold text-[#0d332f]">
                      {r.no_rujukan}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {r.tanggal_rujukan_formatted}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900">
                      {r.nama_pasien}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {r.no_rm} • {r.jenis_kelamin_usia}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-800">{r.nama_rs}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.alamat_rs} • {r.kontak_rs}
                    </div>
                  </td>
                  <td className="py-4 px-4 max-w-[260px]">
                    <div className="font-semibold text-rose-700 line-clamp-1">
                      {r.diagnosa}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {r.alasan_rujukan}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        r.status === "Diterima"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "Dikirim"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : r.status === "Batal"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {r.status === "Dikirim" && <Send className="w-3 h-3" />}
                      {r.status === "Diterima" && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveSuratModal(r)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0d332f] border border-teal-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-700" />
                      <span>Lihat & Cetak Surat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Official Referral Letter Modal */}
      <SuratRujukanModal
        referral={activeSuratModal}
        onClose={() => setActiveSuratModal(null)}
        onStatusUpdated={(updated) => {
          setActiveSuratModal(updated);
          showToast(
            `Status rujukan ${updated.no_rujukan} berhasil diubah menjadi "${updated.status}".`
          );
          loadData();
        }}
      />
    </div>
  );
}
