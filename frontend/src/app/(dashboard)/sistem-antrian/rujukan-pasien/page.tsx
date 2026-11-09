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
  updateHospitalAvailabilityApi,
} from "@/lib/api-client";
import { AntrianTabs } from "@/components/sistem-antrian/AntrianTabs";
import { SuratRujukanModal } from "@/components/sistem-antrian/SuratRujukanModal";

export default function RujukanPasienPage() {
  const [hospitals, setHospitals] = useState<ReferralHospitalItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [waitingCount, setWaitingCount] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  // Extended emergency candidate list to match clinical Figma frame 322:13902
  const emergencyCandidates: PasienCandidate[] = useMemo(() => {
    const base = INITIAL_PASIEN_CANDIDATES.filter(
      (p) => p.kondisi_pasien === "Darurat"
    );
    // If fewer than 5, provide additional realistic emergency cases
    const extra: PasienCandidate[] = [
      {
        id_pasien: 101,
        no_rm: "RM-2026-00152",
        nama_pasien: "Yulia Kartika",
        jenis_kelamin_usia: "P, 38 thn",
        dokter_dpjp: "dr. Nanda Putra, Sp.PD",
        hak_kelas_jaminan: "Kelas 1 (BPJS Kesehatan)",
        kelas_rekomendasi: "Kelas 1",
        diagnosa_masuk: "Gagal napas akut (ARDS) suspek pneumonia berat",
        kondisi_pasien: "Darurat",
        status_penanganan: "Menunggu",
        asal_instalasi: "IGD Resusitasi (Triase Merah)",
        tanda_vital: "TD: 135/85 mmHg • Nadi: 118x/m • RR: 32x/m • SpO2: 89% (NRM 12L)",
      },
      {
        id_pasien: 102,
        no_rm: "RM-2026-00149",
        nama_pasien: "Agus Santoso",
        jenis_kelamin_usia: "L, 64 thn",
        dokter_dpjp: "dr. Hendri Kusuma, Sp.JP",
        hak_kelas_jaminan: "Kelas 1 (Asuransi Mandiri Inhealth)",
        kelas_rekomendasi: "Kelas 1",
        diagnosa_masuk: "Stroke iskemik akut onset < 3 jam",
        kondisi_pasien: "Darurat",
        status_penanganan: "Menunggu",
        asal_instalasi: "IGD Bedah (Triase Merah)",
        tanda_vital: "TD: 175/100 mmHg • Nadi: 94x/m • GCS: E3V4M5 • SpO2: 96%",
      },
    ];

    const all = [...base];
    for (const item of extra) {
      if (!all.some((p) => p.no_rm === item.no_rm)) {
        all.push(item);
      }
    }
    return all;
  }, []);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a2e28] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-teal-500/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#00b89f]" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#0fa18f] mb-1">
            SISTEM ANTRIAN
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1e1e1e] tracking-tight leading-tight">
            Rujukan Pasien Darurat
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1.5 max-w-2xl leading-relaxed">
            Kelola proses rujukan pasien darurat ke rumah sakit jejaring terintegrasi SPGDT.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium flex items-center gap-2 transition cursor-pointer shrink-0 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#00b89f] ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Status RS</span>
        </button>
      </div>

      {/* SUB-NAVIGATION LINE TABS (Figma node 322:13912) */}
      <AntrianTabs
        waitingCount={waitingCount}
        referralCount={emergencyCandidates.length}
        monitoringCount={waitingCount + referrals.length}
      />

      {/* 3 STAT KPI CARDS (Figma node 322:13924) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Pasien Menunggu Rujukan */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[10px] bg-[#fdf0f0] text-[#dc2626] flex items-center justify-center shrink-0">
              <Ambulance className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">
                Pasien Menunggu Rujukan
              </div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Kondisi darurat</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {emergencyCandidates.length}
          </span>
        </div>

        {/* Card 2: RS Tersedia */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[10px] bg-[#e6f4ef] text-[#016b46] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">RS Tersedia</div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">Siap menerima pasien</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {availableHospitalsCount}
          </span>
        </div>

        {/* Card 3: Rujukan Hari Ini */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[10px] bg-[#fef3e9] text-[#b45309] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#1e1e1e]">
                Rujukan Hari Ini
              </div>
              <div className="text-xs text-[#8c8c8c] mt-0.5">25 Oktober 2026</div>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-medium text-[#1e1e1e]">
            {referrals.length}
          </span>
        </div>
      </div>

      {/* MIDDLE 2-COLUMN BALANCED LAYOUT (Figma frame 322:13973) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* LEFT COLUMN: DAFTAR PASIEN DARURAT (Figma node 322:13974) */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] overflow-hidden flex flex-col">
          {/* Header & Search */}
          <div className="p-5 border-b border-[#f0f2f5] space-y-3">
            <div>
              <h2 className="text-base font-bold text-[#1e1e1e]">
                Daftar Pasien Darurat
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
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
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
              />
            </div>
          </div>

          {/* Compact Patient Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#f0f2f5] text-[11px] font-bold text-[#666666] uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-12 text-center">NO.</th>
                  <th className="py-2.5 px-3">NAMA PASIEN</th>
                  <th className="py-2.5 px-3">NO. RM</th>
                  <th className="py-2.5 px-3">KONDISI</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-4 text-center w-20">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5] text-xs">
                {filteredPatients.map((p, idx) => {
                  const isSelected = selectedPasien.id_pasien === p.id_pasien;
                  const rowNum = String(idx + 1).padStart(2, "0");

                  return (
                    <tr
                      key={p.id_pasien}
                      onClick={() => setSelectedPasien(p)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? "bg-[#f0fdf9] border-l-4 border-l-[#00b89f]"
                          : "hover:bg-slate-50/70 border-l-4 border-l-transparent"
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-xs text-[#8c8c8c]">
                        {rowNum}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1e1e1e]">
                          {p.nama_pasien}
                        </div>
                        <div className="text-[11px] text-[#666666] line-clamp-1 mt-0.5">
                          {p.diagnosa_masuk}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#4b5563] whitespace-nowrap">
                        {p.no_rm}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#fdf0f0] text-[#dc2626] border border-[#fecaca]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                          Darurat
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#fef3e9] text-[#b45309] border border-[#fed7aa]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                          Menunggu
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPasien(p);
                          }}
                          className={`px-3 py-1 rounded-[6px] text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? "bg-[#00b89f] text-white shadow-2xs font-semibold"
                              : "border border-[#00b89f] text-[#00b89f] hover:bg-[#e7faf7]"
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
          <div className="p-4 bg-[#f8faf9] border-t border-[#e9ebf0] text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-[#1e1e1e]">
                {selectedPasien.nama_pasien} ({selectedPasien.no_rm}) —{" "}
                <span className="text-[#dc2626] font-semibold">
                  {selectedPasien.asal_instalasi}
                </span>
              </div>
              <span className="text-[#666666] flex items-center gap-1 text-[11px]">
                <Stethoscope className="w-3.5 h-3.5 text-[#00b89f]" />
                {selectedPasien.dokter_dpjp}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#4b5563]">
              <HeartPulse className="w-3.5 h-3.5 text-[#dc2626] shrink-0" />
              <span className="font-medium">{selectedPasien.tanda_vital}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DAFTAR RUMAH SAKIT RUJUKAN (Figma node 322:14109) */}
        <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] overflow-hidden flex flex-col">
          {/* Header & Filter */}
          <div className="p-5 border-b border-[#f0f2f5] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#1e1e1e]">
                  Daftar Rumah Sakit Rujukan
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Pilih rumah sakit dengan status tersedia.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#4b5563] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-[#cbd5e1] text-[#00b89f] focus:ring-[#00b89f]"
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
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-[8px] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]"
              />
            </div>
          </div>

          {/* Hospital List Items */}
          <div className="divide-y divide-[#f0f2f5] overflow-y-auto max-h-[460px]">
            {filteredHospitals.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8c8c8c]">
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
                        ? "bg-[#f0fdf9] border-l-4 border-l-[#00b89f]"
                        : "hover:bg-slate-50/70 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${
                            isAvail
                              ? "bg-[#e6f4ef] text-[#016b46]"
                              : "bg-[#f3f4f6] text-[#6b7280]"
                          }`}
                        >
                          <Building2 className="w-5 h-5 stroke-[1.8]" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#1e1e1e]">
                              {rs.nama_rs}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                isAvail
                                  ? "bg-[#e6f4ef] text-[#016b46] border-[#cbe7dd]"
                                  : "bg-[#fdf0f0] text-[#dc2626] border-[#fecaca]"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvail ? "bg-[#059669]" : "bg-[#dc2626]"
                                }`}
                              />
                              {rs.status_ketersediaan}
                            </span>
                          </div>

                          <div className="text-xs text-[#666666] mt-0.5">
                            {rs.alamat}
                          </div>
                          <div className="text-xs text-[#666666] mt-0.5 flex items-center gap-3">
                            <span className="flex items-center gap-1 font-mono text-[#4b5563]">
                              <Phone className="w-3 h-3 text-[#00b89f]" />
                              {rs.kontak}
                            </span>
                            <span className="text-[#8c8c8c]">•</span>
                            <span className="text-[#0fa18f] font-medium">
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
                          className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? "bg-[#00b89f] text-white shadow-2xs font-semibold"
                              : "border border-[#00b89f] text-[#00b89f] hover:bg-[#e7faf7]"
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
                          className="text-[11px] text-[#666666] hover:text-[#1e1e1e] underline cursor-pointer"
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
                          className="px-2 py-0.5 rounded-[4px] bg-slate-100 text-[#4b5563] text-[10px]"
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

      {/* FULL-WIDTH DETAIL RUJUKAN CARD (Figma node 322:14230) */}
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] p-6 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1e1e1e]">
            Detail Rujukan
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Konfirmasi data rujukan pasien darurat dan penerbitan Surat Rujukan Resmi SPGDT.
          </p>
        </div>

        {/* 7 Summary Info Fields (Figma frame 322:14234) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 rounded-[10px] bg-[#f8faf9] border border-[#e9ebf0]">
          {/* Field 1: Nama Pasien */}
          <div className="space-y-1">
            <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-[#00b89f]" />
              Nama Pasien
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#1e1e1e] truncate">
              {selectedPasien ? selectedPasien.nama_pasien : "Belum dipilih"}
            </div>
          </div>

          {/* Field 2: No. RM */}
          <div className="space-y-1">
            <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-[#00b89f]" />
              No. RM
            </div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-[#1e1e1e]">
              {selectedPasien ? selectedPasien.no_rm : "Belum dipilih"}
            </div>
          </div>

          {/* Field 3: Kondisi Pasien */}
          <div className="space-y-1">
            <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 font-medium">
              <HeartPulse className="w-3.5 h-3.5 text-[#dc2626]" />
              Kondisi
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#dc2626] truncate">
              {selectedPasien ? selectedPasien.kondisi_pasien : "Belum dipilih"}
            </div>
          </div>

          {/* Field 4: Rumah Sakit Tujuan */}
          <div className="space-y-1">
            <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#00b89f]" />
              Rumah Sakit Tujuan
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#1e1e1e] truncate">
              {selectedHospital ? selectedHospital.nama_rs : "Belum dipilih"}
            </div>
          </div>

          {/* Field 5: Alamat RS */}
          <div className="space-y-1">
            <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#00b89f]" />
              Alamat
            </div>
            <div className="text-xs text-[#4b5563] truncate">
              {selectedHospital ? selectedHospital.alamat : "Belum dipilih"}
            </div>
          </div>

          {/* Field 6: Kontak RS */}
          <div className="space-y-1">
            <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-[#00b89f]" />
              Kontak
            </div>
            <div className="text-xs font-mono text-[#4b5563]">
              {selectedHospital ? selectedHospital.kontak : "Belum dipilih"}
            </div>
          </div>

          {/* Field 7: Status Ketersediaan */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00b89f]" />
              Status Ketersediaan
            </div>
            <div>
              {selectedHospital ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    selectedHospital.status_ketersediaan === "Tersedia"
                      ? "bg-[#e6f4ef] text-[#016b46] border-[#cbe7dd]"
                      : "bg-[#fdf0f0] text-[#dc2626] border-[#fecaca]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedHospital.status_ketersediaan === "Tersedia"
                        ? "bg-[#059669]"
                        : "bg-[#dc2626]"
                    }`}
                  />
                  {selectedHospital.status_ketersediaan}
                </span>
              ) : (
                <span className="text-xs text-[#8c8c8c]">Belum dipilih</span>
              )}
            </div>
          </div>
        </div>

        {/* Textareas & Form Actions */}
        <form onSubmit={handleCreateReferral} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-[8px] bg-[#fdf0f0] border border-[#fecaca] text-[#dc2626] text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1e1e1e] mb-1.5">
              Alasan Rujukan (Indikasi Medis & Kapasitas) *
            </label>
            <textarea
              rows={2}
              value={alasanRujukan}
              onChange={(e) => setAlasanRujukan(e.target.value)}
              required
              placeholder="Kondisi pasien membutuhkan penanganan lanjutan yang fasilitasnya sedang penuh di RSI..."
              className="w-full px-3.5 py-2.5 text-xs text-[#1e1e1e] rounded-[8px] border border-[#e2e8f0] focus:outline-none focus:border-[#00b89f] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1e1e1e] mb-1.5">
              Ringkasan Tindakan / Terapi Stabilisasi Awal di IGD
            </label>
            <textarea
              rows={2}
              value={catatanMedis}
              onChange={(e) => setCatatanMedis(e.target.value)}
              placeholder="Catat terapi stabilisasi awal, oksigenasi, infus, dan obat emergensi yang telah diberikan..."
              className="w-full px-3.5 py-2.5 text-xs text-[#1e1e1e] rounded-[8px] border border-[#e2e8f0] focus:outline-none focus:border-[#00b89f] transition"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#f0f2f5]">
            <div className="text-[11px] text-[#666666]">
              * Pastikan rumah sakit penerima telah siap dan status terkonfirmasi sebelum merujuk.
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedHospital ||
                selectedHospital.status_ketersediaan !== "Tersedia"
              }
              className="px-6 py-2.5 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer shrink-0"
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
      <div className="bg-white rounded-[12px] border border-[#e9ebf0] shadow-[0px_4px_8px_rgba(26,39,50,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1e1e1e]">
              Riwayat Surat Rujukan Pasien Darurat
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Daftar surat rujukan resmi yang telah diterbitkan untuk penanganan lanjutan SPGDT
            </p>
          </div>
          <span className="text-xs font-medium text-[#4b5563] bg-slate-100 px-2.5 py-1 rounded-full">
            Total: {referrals.length} Surat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f2f5] text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                <th className="py-3 px-5">NO. SURAT RUJUKAN</th>
                <th className="py-3 px-4">PASIEN DARURAT</th>
                <th className="py-3 px-4">RUMAH SAKIT TUJUAN</th>
                <th className="py-3 px-4">ALASAN & DIAGNOSA</th>
                <th className="py-3 px-4">STATUS RUJUKAN</th>
                <th className="py-3 px-5 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] text-xs">
              {referrals.map((r) => (
                <tr key={r.id_surat} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-5">
                    <div className="font-mono font-bold text-[#1e1e1e]">
                      {r.no_rujukan}
                    </div>
                    <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                      {r.tanggal_rujukan_formatted}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#1e1e1e]">
                      {r.nama_pasien}
                    </div>
                    <div className="text-[11px] text-[#666666] font-mono">
                      {r.no_rm} • {r.jenis_kelamin_usia}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#1e1e1e]">{r.nama_rs}</div>
                    <div className="text-[11px] text-[#666666]">
                      {r.alamat_rs}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="font-medium text-[#dc2626] line-clamp-1">
                      {r.diagnosa}
                    </div>
                    <div className="text-[11px] text-[#666666] line-clamp-1 mt-0.5">
                      {r.alasan_rujukan}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        r.status === "Diterima"
                          ? "bg-[#e6f4ef] text-[#016b46] border-[#cbe7dd]"
                          : r.status === "Dikirim"
                          ? "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]"
                          : r.status === "Batal"
                          ? "bg-[#fdf0f0] text-[#dc2626] border-[#fecaca]"
                          : "bg-[#fef3e9] text-[#b45309] border-[#fed7aa]"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          r.status === "Diterima"
                            ? "bg-[#059669]"
                            : r.status === "Dikirim"
                            ? "bg-[#2563eb]"
                            : r.status === "Batal"
                            ? "bg-[#dc2626]"
                            : "bg-[#f59e0b]"
                        }`}
                      />
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setActiveSuratModal(r)}
                      className="px-3 py-1.5 rounded-[8px] bg-white hover:bg-slate-50 text-[#1e1e1e] border border-[#e2e8f0] text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#00b89f]" />
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
