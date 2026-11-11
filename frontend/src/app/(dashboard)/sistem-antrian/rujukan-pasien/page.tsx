"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

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
  ChevronRight,
  User,
  ShieldCheck,
  Activity,
  Check,
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
  searchHistoryPatientsApi,
  updateHospitalAvailabilityApi,
} from "@/lib/api-client";
import { AntrianTabs } from "@/components/sistem-antrian/AntrianTabs";
import { SuratRujukanModal } from "@/components/sistem-antrian/SuratRujukanModal";

export default function RujukanPasienPage() {
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState<ReferralHospitalItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [waitingCount, setWaitingCount] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  const [emergencyCandidates, setEmergencyCandidates] = useState<
    PasienCandidate[]
  >(() =>
    INITIAL_PASIEN_CANDIDATES.filter((p) => p.kondisi_pasien === "Darurat")
  );

  const [selectedPasien, setSelectedPasien] = useState<PasienCandidate>(
    emergencyCandidates[0] || INITIAL_PASIEN_CANDIDATES[4]
  );
  const [patientSearch, setPatientSearch] = useState("");
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
      const [hRes, rRes, qRes, pRes] = await Promise.all([
        fetchReferralHospitalsApi(),
        fetchReferralsApi(),
        fetchQueuesApi(),
        searchHistoryPatientsApi("").catch(() => []),
      ]);
      setHospitals(hRes.items);
      setReferrals(rRes.items);
      setWaitingCount(
        qRes.items.filter((q) => q.status === "Menunggu").length
      );

      if (pRes.length > 0) {
        const dbEmergency: PasienCandidate[] = pRes
          .filter((p) => p.kondisi_pasien === "Darurat")
          .map((p) => {
            const matched = INITIAL_PASIEN_CANDIDATES.find(
              (seed) => seed.no_rm === p.no_rm
            );
            return {
              id_pasien: p.id_pasien,
              no_rm: p.no_rm,
              nama_pasien: p.nama_pasien,
              jenis_kelamin_usia:
                matched?.jenis_kelamin_usia || p.jenis_kelamin_usia || "L/P",
              dokter_dpjp: matched?.dokter_dpjp || p.dokter_dpjp || "dr. DPJP",
              hak_kelas_jaminan:
                matched?.hak_kelas_jaminan ||
                p.hak_kelas_jaminan ||
                "BPJS Kesehatan",
              kelas_rekomendasi:
                matched?.kelas_rekomendasi || p.kelas_perawatan || "Kelas 1",
              diagnosa_masuk:
                matched?.diagnosa_masuk ||
                p.diagnosa_masuk ||
                "Penanganan Darurat IGD",
              kondisi_pasien: "Darurat",
              status_penanganan:
                (p.status_penanganan as PasienCandidate["status_penanganan"]) ||
                "Menunggu",
              asal_instalasi:
                matched?.asal_instalasi || "IGD Resusitasi (Triase Merah)",
              tanda_vital:
                matched?.tanda_vital ||
                "TD: 165/105 mmHg • Nadi: 114x/m • RR: 28x/m • SpO2: 91%",
            };
          });
        if (dbEmergency.length > 0) {
          setEmergencyCandidates(dbEmergency);
          setSelectedPasien((prev) =>
            dbEmergency.find((d) => d.no_rm === prev?.no_rm) || dbEmergency[0]
          );
        }
      }

      // Select first available hospital by default if none selected
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

  // Filter emergency patients
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return emergencyCandidates;
    const q = patientSearch.toLowerCase();
    return emergencyCandidates.filter(
      (p) =>
        p.nama_pasien.toLowerCase().includes(q) ||
        p.no_rm.toLowerCase().includes(q) ||
        p.diagnosa_masuk.toLowerCase().includes(q)
    );
  }, [emergencyCandidates, patientSearch]);

  // Filter hospitals
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

  const availableHospitalsCount = useMemo(
    () => hospitals.filter((h) => h.status_ketersediaan === "Tersedia").length,
    [hospitals]
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

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Sistem Rujukan Pasien Darurat" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#064e3b] text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            SISTEM ANTREAN & RUJUKAN
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            Rujukan Pasien Darurat (SPGDT)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Kelola alur rujukan darurat ke rumah sakit jejaring saat fasilitas atau ruang intensif di RSI penuh.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="self-start sm:self-auto px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-2 transition cursor-pointer shrink-0 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Status RS</span>
        </button>
      </div>

      {/* SUB-NAVIGATION LINE TABS */}
      <AntrianTabs
        waitingCount={waitingCount}
        referralCount={emergencyCandidates.length}
        monitoringCount={waitingCount + referrals.length}
      />

      {/* 3 STAT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Pasien Menunggu Rujukan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Ambulance className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Pasien Menunggu Rujukan
              </div>
              <div className="text-[11px] text-slate-500">Kondisi darurat</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {emergencyCandidates.length}
          </span>
        </div>

        {/* Card 2: RS Tersedia */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">RS Tersedia</div>
              <div className="text-[11px] text-slate-500">Siap menerima</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {availableHospitalsCount}
          </span>
        </div>

        {/* Card 3: Rujukan Terbit */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Rujukan Terbit
              </div>
              <div className="text-[11px] text-slate-500">Surat resmi terbit</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {referrals.length}
          </span>
        </div>
      </div>

      {/* MIDDLE 2-COLUMN BALANCED LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* LEFT COLUMN: DAFTAR PASIEN DARURAT */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Header & Search */}
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Daftar Pasien Darurat
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih pasien kondisi darurat (Triase Merah / IGD / PONEK) untuk dirujuk
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Cari nama pasien atau No. RM..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Compact Patient Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">NO.</th>
                  <th className="py-2.5 px-3">NAMA PASIEN</th>
                  <th className="py-2.5 px-3">NO. RM</th>
                  <th className="py-2.5 px-3">KONDISI</th>
                  <th className="py-2.5 px-3 text-center w-20">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPatients.map((p, idx) => {
                  const isSelected = selectedPasien.id_pasien === p.id_pasien;
                  const rowNum = String(idx + 1).padStart(2, "0");

                  return (
                    <tr
                      key={p.id_pasien}
                      onClick={() => setSelectedPasien(p)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/40 border-l-4 border-l-emerald-600"
                          : "hover:bg-slate-50/60 border-l-4 border-l-transparent"
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-400">
                        {rowNum}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {p.nama_pasien}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {p.diagnosa_masuk}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {p.no_rm}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          Darurat
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPasien(p);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                              : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {isSelected ? "Terpilih" : "Pilih"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Active Patient Clinical Card Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-slate-900">
                {selectedPasien.nama_pasien} ({selectedPasien.no_rm}) —{" "}
                <span className="text-rose-700 font-semibold">
                  {selectedPasien.asal_instalasi}
                </span>
              </div>
              <span className="text-slate-600 flex items-center gap-1 text-[11px]">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                {selectedPasien.dokter_dpjp}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-700">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="font-medium">{selectedPasien.tanda_vital}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DAFTAR RUMAH SAKIT RUJUKAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Header & Filter */}
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Daftar Rumah Sakit Rujukan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih rumah sakit jejaring dengan kapasitas tersedia
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Hanya RS Tersedia</span>
              </label>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                placeholder="Cari nama RS, lokasi, atau fasilitas..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Hospital List Items */}
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[460px]">
            {filteredHospitals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Tidak ada rumah sakit yang sesuai pencarian.
              </div>
            ) : (
              filteredHospitals.map((rs) => {
                const isSelected = selectedHospitalId === rs.id_rs;
                const isAvail = rs.status_ketersediaan === "Tersedia";

                return (
                  <div
                    key={rs.id_rs}
                    onClick={() => setSelectedHospitalId(rs.id_rs)}
                    className={`p-4 transition cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-emerald-50/40 border-l-4 border-l-emerald-600"
                        : "hover:bg-slate-50/60 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isAvail
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Building2 className="w-5 h-5 stroke-[1.8]" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {rs.nama_rs}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                isAvail
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvail ? "bg-emerald-600" : "bg-rose-600"
                                }`}
                              />
                              {rs.status_ketersediaan}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {rs.alamat}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                            <span className="flex items-center gap-1 font-mono text-slate-600">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {rs.kontak}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-700 font-medium">
                              {rs.jarak_estimasi}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospitalId(rs.id_rs);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                              : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {isSelected ? "Terpilih" : "Pilih RS"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleHospitalAvailability(rs);
                          }}
                          disabled={updatingHospitalId === rs.id_rs}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          {updatingHospitalId === rs.id_rs
                            ? "Menyimpan..."
                            : isAvail
                            ? "Tandai Penuh"
                            : "Konfirmasi Siaga"}
                        </button>
                      </div>
                    </div>

                    {/* Facilities chips */}
                    <div className="flex flex-wrap gap-1 mt-1 pl-13">
                      {rs.fasilitas_unggulan.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FULL-WIDTH DETAIL RUJUKAN CARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Detail & Penerbitan Surat Rujukan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfirmasi data rujukan pasien darurat dan penerbitan Surat Rujukan Resmi SPGDT.
          </p>
        </div>

        {/* 7 Summary Info Fields */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          {/* Field 1: Nama Pasien */}
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Nama Pasien
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {selectedPasien ? selectedPasien.nama_pasien : "Belum dipilih"}
            </div>
          </div>

          {/* Field 2: No. RM */}
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              No. RM
            </div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-slate-900">
              {selectedPasien ? selectedPasien.no_rm : "Belum dipilih"}
            </div>
          </div>

          {/* Field 3: Kondisi Pasien */}
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              Kondisi
            </div>
            <div className="text-xs sm:text-sm font-semibold text-rose-700 truncate">
              {selectedPasien ? selectedPasien.kondisi_pasien : "Belum dipilih"}
            </div>
          </div>

          {/* Field 4: Rumah Sakit Tujuan */}
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              RS Tujuan
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {selectedHospital ? selectedHospital.nama_rs : "Belum dipilih"}
            </div>
          </div>

          {/* Field 5: Alamat RS */}
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Alamat
            </div>
            <div className="text-xs text-slate-600 truncate">
              {selectedHospital ? selectedHospital.alamat : "Belum dipilih"}
            </div>
          </div>

          {/* Field 6: Kontak RS */}
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Kontak
            </div>
            <div className="text-xs font-mono text-slate-600">
              {selectedHospital ? selectedHospital.kontak : "Belum dipilih"}
            </div>
          </div>

          {/* Field 7: Status Ketersediaan */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Status Ketersediaan
            </div>
            <div>
              {selectedHospital ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    selectedHospital.status_ketersediaan === "Tersedia"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedHospital.status_ketersediaan === "Tersedia"
                        ? "bg-emerald-600"
                        : "bg-rose-600"
                    }`}
                  />
                  {selectedHospital.status_ketersediaan}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Belum dipilih</span>
              )}
            </div>
          </div>
        </div>

        {/* Textareas & Form Actions */}
        <form onSubmit={handleCreateReferral} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Alasan Rujukan (Indikasi Medis & Kapasitas) *
            </label>
            <textarea
              rows={2}
              value={alasanRujukan}
              onChange={(e) => setAlasanRujukan(e.target.value)}
              required
              placeholder="Kondisi pasien membutuhkan penanganan lanjutan yang fasilitasnya sedang penuh di RSI..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Ringkasan Tindakan / Terapi Stabilisasi Awal di IGD
            </label>
            <textarea
              rows={2}
              value={catatanMedis}
              onChange={(e) => setCatatanMedis(e.target.value)}
              placeholder="Catat terapi stabilisasi awal, oksigenasi, infus, dan obat emergensi yang telah diberikan..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500">
              * Pastikan rumah sakit penerima telah siap dan status terkonfirmasi sebelum merujuk.
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedHospital ||
                selectedHospital.status_ketersediaan !== "Tersedia"
              }
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>
                {submitting
                  ? "Menerbitkan Surat..."
                  : "Konfirmasi & Terbitkan Surat Rujukan"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM TABLE: RIWAYAT SURAT RUJUKAN PASIEN DARURAT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Riwayat Surat Rujukan Pasien Darurat
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar surat rujukan resmi yang telah diterbitkan untuk penanganan lanjutan SPGDT
            </p>
          </div>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            Total: {referrals.length} Surat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">NO. SURAT RUJUKAN</th>
                <th className="py-3 px-4">PASIEN DARURAT</th>
                <th className="py-3 px-4">RUMAH SAKIT TUJUAN</th>
                <th className="py-3 px-4">ALASAN & DIAGNOSA</th>
                <th className="py-3 px-4">STATUS RUJUKAN</th>
                <th className="py-3 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {referrals.map((r) => (
                <tr key={r.id_surat} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-5">
                    <div className="font-mono font-bold text-slate-900">
                      {r.no_rujukan}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {r.tanggal_rujukan_formatted}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {r.nama_pasien}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {r.no_rm} • {r.jenis_kelamin_usia}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{r.nama_rs}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.alamat_rs}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="font-medium text-rose-700 line-clamp-1">
                      {r.diagnosa}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {r.alasan_rujukan}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        r.status === "Diterima"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "Dikirim"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : r.status === "Batal"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          r.status === "Diterima"
                            ? "bg-emerald-600"
                            : r.status === "Dikirim"
                            ? "bg-blue-600"
                            : r.status === "Batal"
                            ? "bg-rose-600"
                            : "bg-amber-500"
                        }`}
                      />
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setActiveSuratModal(r)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
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
