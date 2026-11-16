"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { AlertBanner, Badge, Button, Modal } from "@/components/ui";
import { KelasPerawatan, PasienCandidate, QueueItem } from "@/types";
import {
  createQueueApi,
  fetchActiveAllocatedPatientIdsApi,
  searchHistoryPatientsApi,
} from "@/lib/api-client";

interface TambahAntreanModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingQueues: QueueItem[];
  onSuccess: (created: QueueItem) => void;
}

export function TambahAntreanModal({
  isOpen,
  onClose,
  existingQueues,
  onSuccess,
}: TambahAntreanModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [candidateList, setCandidateList] = useState<PasienCandidate[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<PasienCandidate | null>(
    null
  );
  const [kelasTarget, setKelasTarget] = useState<KelasPerawatan>("Kelas 1");
  const [catatan, setCatatan] = useState(
    "Menunggu ketersediaan kamar rawat inap sesuai hak kelas pasien (urutan FIFO)."
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeWaitingIds = useMemo(
    () =>
      new Set(
        existingQueues
          .filter((q) => q.status === "Menunggu")
          .map((q) => q.id_pasien)
      ),
    [existingQueues]
  );
  const waitingIdsRef = useRef(activeWaitingIds);
  useEffect(() => {
    waitingIdsRef.current = activeWaitingIds;
  }, [activeWaitingIds]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.all([
      searchHistoryPatientsApi(""),
      fetchActiveAllocatedPatientIdsApi().catch(() => [] as number[]),
    ])
      .then(([rows, activeAllocatedIds]) => {
        if (!active) return;
        const activeAllocatedSet = new Set(activeAllocatedIds);
        const mapped: PasienCandidate[] = rows
          .filter(
            (p) =>
              !activeAllocatedSet.has(p.id_pasien) &&
              p.status_penanganan !== "Rawat Inap" &&
              p.status_penanganan !== "Dirujuk"
          )
          .map((p) => ({
            id_pasien: p.id_pasien,
            no_rm: p.no_rm,
            nama_pasien: p.nama_pasien,
            jenis_kelamin_usia: p.jenis_kelamin_usia || "-",
            dokter_dpjp: p.dokter_dpjp || "DPJP Rawat Inap",
            hak_kelas_jaminan: p.hak_kelas_jaminan || "BPJS Kesehatan",
            kelas_rekomendasi: p.kelas_perawatan || "Kelas 1",
            diagnosa_masuk: p.diagnosa_masuk || "Rawat Inap",
            kondisi_pasien:
              p.kondisi_pasien ||
              (p.status_penanganan?.includes("Darurat") ? "Darurat" : "Stabil"),
            status_penanganan:
              (p.status_penanganan as PasienCandidate["status_penanganan"]) ||
              "Menunggu",
            asal_instalasi: "IGD / Poli",
          }));
        setCandidateList(mapped);
        const waitingSet = waitingIdsRef.current;
        const preferred =
          mapped.find(
            (m) => m.kondisi_pasien === "Stabil" && !waitingSet.has(m.id_pasien)
          ) ||
          mapped.find((m) => m.kondisi_pasien === "Stabil") ||
          mapped[0] ||
          null;
        setSelectedPasien(preferred);
        if (preferred) {
          setKelasTarget(preferred.kelas_rekomendasi);
        }
      })
      .catch((err) => {
        if (active) {
          setErrorMsg(
            err instanceof Error ? err.message : "Gagal memuat daftar pasien."
          );
        }
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = !q
      ? candidateList
      : candidateList.filter(
          (p) =>
            p.nama_pasien.toLowerCase().includes(q) ||
            p.no_rm.toLowerCase().includes(q) ||
            p.diagnosa_masuk.toLowerCase().includes(q)
        );
    const rank = (p: PasienCandidate) => {
      if (p.kondisi_pasien === "Darurat") return 2;
      if (activeWaitingIds.has(p.id_pasien)) return 1;
      return 0;
    };
    return [...list].sort((a, b) => rank(a) - rank(b));
  }, [searchQuery, candidateList, activeWaitingIds]);

  if (!isOpen) return null;

  const isDarurat = selectedPasien?.kondisi_pasien === "Darurat";
  const isAlreadyWaiting = selectedPasien
    ? activeWaitingIds.has(selectedPasien.id_pasien)
    : false;

  const nextFifoNumber =
    existingQueues.length > 0
      ? Math.max(...existingQueues.map((q) => q.no_antrean)) + 1
      : 1;

  const handleSelectPatient = (p: PasienCandidate) => {
    setSelectedPasien(p);
    setKelasTarget(p.kelas_rekomendasi);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPasien) {
      setErrorMsg("Silakan pilih pasien terlebih dahulu.");
      return;
    }
    if (isDarurat) {
      setErrorMsg(
        "Pasien dengan kondisi Darurat tidak dapat dimasukkan ke daftar tunggu. Gunakan menu Rujukan Pasien Darurat."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await createQueueApi({
        id_pasien: selectedPasien.id_pasien,
        kelas_perawatan: kelasTarget,
        catatan_tunggu: catatan.trim(),
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan pasien ke daftar tunggu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Pasien ke Daftar Tunggu (FIFO)"
      description="Pencatatan otomatis nomor urut antrean berdasarkan waktu masuk"
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* FIFO Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sistem menerapkan antrean <strong>First-In First-Out (FIFO)</strong> khusus untuk <strong>Pasien Kondisi Stabil</strong>.
            </span>
          </div>
          <Badge tone="emerald" className="font-mono tabular-nums shrink-0 self-start sm:self-auto">
            Estimasi No: #{String(nextFifoNumber).padStart(2, "0")}
          </Badge>
        </div>

        {errorMsg && <AlertBanner tone="error" message={errorMsg} />}

        {/* Search & Select Patient */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            1. Cari &amp; Pilih Data Pasien (SIMRS / RME)
          </label>
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik No. RM, Nama Pasien, atau Diagnosa..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {filteredCandidates.length === 0 ? (
              <div className="sm:col-span-2 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                Tidak ada pasien yang tersedia untuk didaftarkan ke daftar tunggu (pasien sudah Rawat Inap atau Dirujuk).
              </div>
            ) : (
              filteredCandidates.map((p) => {
                const isSelected = selectedPasien?.id_pasien === p.id_pasien;
                const inQueue = activeWaitingIds.has(p.id_pasien);
                const emergency = p.kondisi_pasien === "Darurat";

                return (
                  <button
                    key={p.id_pasien}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {p.nama_pasien}
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {p.no_rm}
                          {p.jenis_kelamin_usia && p.jenis_kelamin_usia !== "-" && p.jenis_kelamin_usia !== "L/P"
                            ? ` • ${p.jenis_kelamin_usia}`
                            : ""}
                        </div>
                      </div>
                      <Badge tone={emergency ? "rose" : "emerald"}>
                        {p.kondisi_pasien || "Stabil"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Hak: {p.kelas_rekomendasi}
                      </span>
                      {inQueue && (
                        <span className="text-amber-700 font-semibold">
                          Sudah Mengantre
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Patient Summary Card */}
        {selectedPasien && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">
                  Ringkasan Klinis Pasien Terpilih
                </span>
              </div>
              <Badge tone={isDarurat ? "rose" : "emerald"}>
                Kondisi: {selectedPasien.kondisi_pasien || "Stabil"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nama &amp; No. RM</span>
                <span className="font-bold text-slate-800">
                  {selectedPasien.nama_pasien}{" "}
                  <span className="font-mono tabular-nums font-medium text-slate-600">
                    ({selectedPasien.no_rm})
                  </span>
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Dokter DPJP</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedPasien.dokter_dpjp}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Diagnosa Masuk</span>
                <span className="font-semibold text-slate-800">
                  {selectedPasien.diagnosa_masuk}
                </span>
              </div>
            </div>

            {/* Warning if Darurat */}
            {isDarurat && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      Pasien Kondisi Darurat Tidak Boleh Masuk Daftar Tunggu!
                    </p>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Sesuai prosedur keselamatan pasien, jika bed penuh maka pasien darurat wajib segera dirujuk ke RS jejaring.
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/sistem-antrian/rujukan-pasien?id_pasien=${selectedPasien.id_pasien}`
                    );
                  }}
                >
                  <span>Buat Rujukan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Kelas & Catatan Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kelas Kamar Diminta
            </label>
            <select
              value={kelasTarget}
              onChange={(e) =>
                setKelasTarget(e.target.value as KelasPerawatan)
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="VIP">VIP</option>
              <option value="Kelas 1">Kelas 1</option>
              <option value="Kelas 2">Kelas 2</option>
              <option value="Kelas 3">Kelas 3</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan / Keterangan Antrean
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Menunggu bed Anggrek 1 selesai sterilisasi..."
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={submitting}
            disabled={submitting || !selectedPasien || isDarurat || isAlreadyWaiting}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {submitting
                ? "Menyimpan Antrean..."
                : `Simpan ke Antrean (#${String(nextFifoNumber).padStart(
                    2,
                    "0"
                  )})`}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
