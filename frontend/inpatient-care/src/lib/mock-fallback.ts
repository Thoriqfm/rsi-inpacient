import {
  BedItem,
  BedStatus,
  KelasPerawatan,
  PasienCandidate,
  UserAccount,
} from "@/types";

export const DEMO_USERS: Record<
  string,
  { account: UserAccount; password: string }
> = {
  "budi.santoso": {
    password: "password123",
    account: {
      id_akun: 1,
      username: "budi.santoso",
      nama_petugas: "Budi Santoso",
      jabatan_label: "Petugas Bed Management",
      inisial: "BS",
      role: "PETUGAS_BED_MANAGEMENT",
    },
  },
  "rini.aprilianti": {
    password: "password123",
    account: {
      id_akun: 2,
      username: "rini.aprilianti",
      nama_petugas: "Rini Aprilianti",
      jabatan_label: "Petugas Administrasi",
      inisial: "RA",
      role: "PETUGAS_ADMINISTRASI",
    },
  },
  "nanda.putra": {
    password: "password123",
    account: {
      id_akun: 3,
      username: "nanda.putra",
      nama_petugas: "dr. Nanda Putra, Sp.PD",
      jabatan_label: "Petugas Medis",
      inisial: "NP",
      role: "PETUGAS_MEDIS",
    },
  },
};

export const INITIAL_PASIEN_CANDIDATES: PasienCandidate[] = [
  {
    id_pasien: 101,
    no_rm: "RM-2026-00142",
    nama_pasien: "Hendra Wijaya",
    jenis_kelamin_usia: "L, 45 thn",
    dokter_dpjp: "dr. Nanda Putra, Sp.PD",
    hak_kelas_jaminan: "Kelas 1 (BPJS Kesehatan / Asuransi)",
    kelas_rekomendasi: "Kelas 1",
    diagnosa_masuk: "Demam Berdarah Dengue (DBD) Derajat II",
  },
  {
    id_pasien: 102,
    no_rm: "RM-2026-00148",
    nama_pasien: "Siti Aminah",
    jenis_kelamin_usia: "P, 34 thn",
    dokter_dpjp: "dr. Ratna Sari, Sp.OG",
    hak_kelas_jaminan: "VIP (Asuransi Mandiri Inhealth)",
    kelas_rekomendasi: "VIP",
    diagnosa_masuk: "Observasi Post-Partum & Hipertensi Gestasional",
  },
  {
    id_pasien: 103,
    no_rm: "RM-2026-00153",
    nama_pasien: "Ahmad Fauzi",
    jenis_kelamin_usia: "L, 58 thn",
    dokter_dpjp: "dr. Hendri Kusuma, Sp.JP",
    hak_kelas_jaminan: "Kelas 2 (BPJS Kesehatan)",
    kelas_rekomendasi: "Kelas 2",
    diagnosa_masuk: "Congestive Heart Failure (CHF) NYHA II",
  },
  {
    id_pasien: 104,
    no_rm: "RM-2026-00161",
    nama_pasien: "Dewi Lestari",
    jenis_kelamin_usia: "P, 27 thn",
    dokter_dpjp: "dr. Nanda Putra, Sp.PD",
    hak_kelas_jaminan: "Kelas 3 (BPJS Kesehatan - PBI)",
    kelas_rekomendasi: "Kelas 3",
    diagnosa_masuk: "Demam Tifoid Akut & Dehidrasi Sedang",
  },
];

export const BANGSAL_OPTIONS = [
  {
    label: "Bangsal Anggrek 1",
    shortName: "Anggrek 1",
    prefix: "ANG",
    defaultKelas: "Kelas 1" as KelasPerawatan,
  },
  {
    label: "Bangsal Cendana 2",
    shortName: "Cendana 2",
    prefix: "CEN",
    defaultKelas: "Kelas 2" as KelasPerawatan,
  },
  {
    label: "Paviliun VIP Utama",
    shortName: "Paviliun VIP",
    prefix: "VIP",
    defaultKelas: "VIP" as KelasPerawatan,
  },
  {
    label: "Bangsal Melati 3",
    shortName: "Melati 3",
    prefix: "MEL",
    defaultKelas: "Kelas 3" as KelasPerawatan,
  },
  {
    label: "Bangsal Bougenville 4",
    shortName: "Bougenville 4",
    prefix: "BGV",
    defaultKelas: "Kelas 2" as KelasPerawatan,
  },
];

function buildSeedBeds(): BedItem[] {
  // Exact first 5 items as shown in Figma frame 164:3797
  const coreBeds: BedItem[] = [
    {
      id_bed: 1,
      no_bed: "BED-ANG-101",
      nama_bangsal: "Anggrek 1",
      nama_kamar: "Kamar 101",
      kelas_perawatan: "Kelas 1",
      tipe_bed: "2 Bed/Rm",
      status: "Tersedia",
      fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central",
      updated_relative: "10 menit lalu",
      updated_timestamp: "Hari ini, 14:20 WIB",
      occupant: null,
    },
    {
      id_bed: 2,
      no_bed: "BED-ANG-102",
      nama_bangsal: "Anggrek 1",
      nama_kamar: "Kamar 102",
      kelas_perawatan: "Kelas 1",
      tipe_bed: "2 Bed/Rm",
      status: "Terisi",
      fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central",
      updated_relative: "2 jam lalu",
      updated_timestamp: "Hari ini, 12:15 WIB",
      occupant: {
        id_pasien: 101,
        nama_pasien: "Hendra Wijaya",
        no_rm: "RM-2026-00142",
        dokter_dpjp: "dr. Nanda Putra, Sp.PD",
        diagnosa: "Demam Berdarah Dengue (DBD) Derajat II",
      },
    },
    {
      id_bed: 3,
      no_bed: "BED-CEN-204",
      nama_bangsal: "Cendana 2",
      nama_kamar: "Kamar 204",
      kelas_perawatan: "Kelas 2",
      tipe_bed: "4 Bed/Rm",
      status: "Pembersihan",
      fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • TV LED",
      updated_relative: "25 menit lalu",
      updated_timestamp: "Hari ini, 14:05 WIB",
      occupant: null,
    },
    {
      id_bed: 4,
      no_bed: "BED-VIP-003",
      nama_bangsal: "Paviliun VIP",
      nama_kamar: "Suite 03",
      kelas_perawatan: "VIP",
      tipe_bed: "1 Bed/Rm",
      status: "Tersedia",
      fasilitas: "1 Tempat Tidur Elektrik • AC • Sofa Penunggu • Smart TV • Kulkas",
      updated_relative: "1 jam lalu",
      updated_timestamp: "Hari ini, 13:10 WIB",
      occupant: null,
    },
    {
      id_bed: 5,
      no_bed: "BED-MEL-308",
      nama_bangsal: "Melati 3",
      nama_kamar: "Kamar 308",
      kelas_perawatan: "Kelas 3",
      tipe_bed: "6 Bed/Rm",
      status: "Pemeliharaan",
      fasilitas: "1 Tempat Tidur • Kipas Sentral • Oksigen Wall Outlet",
      updated_relative: "Kemarin",
      updated_timestamp: "19 Apr, 16:40 WIB",
      occupant: null,
    },
    // Additional beds featured in Alokasi Kamar screen (193:9909)
    {
      id_bed: 6,
      no_bed: "BED-ANG-104",
      nama_bangsal: "Anggrek 1",
      nama_kamar: "Kamar 104",
      kelas_perawatan: "Kelas 1",
      tipe_bed: "2 Bed/Rm",
      status: "Tersedia",
      fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central",
      updated_relative: "35 menit lalu",
      updated_timestamp: "Hari ini, 13:55 WIB",
      occupant: null,
    },
    {
      id_bed: 7,
      no_bed: "BED-CEN-201",
      nama_bangsal: "Cendana 2",
      nama_kamar: "Kamar 201",
      kelas_perawatan: "Kelas 1",
      tipe_bed: "2 Bed/Rm",
      status: "Tersedia",
      fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • TV LED",
      updated_relative: "45 menit lalu",
      updated_timestamp: "Hari ini, 13:45 WIB",
      occupant: null,
    },
  ];

  // Target total = 68 beds:
  // Tersedia: 18 (already have 4 in coreBeds -> need 14 more)
  // Terisi: 42 (already have 1 in coreBeds -> need 41 more)
  // Pembersihan: 5 (already have 1 in coreBeds -> need 4 more)
  // Pemeliharaan: 3 (already have 1 in coreBeds -> need 2 more)
  const remainingStatuses: BedStatus[] = [
    ...Array(14).fill("Tersedia"),
    ...Array(41).fill("Terisi"),
    ...Array(4).fill("Pembersihan"),
    ...Array(2).fill("Pemeliharaan"),
  ];

  const samplePatients = [
    { nama: "Bambang Supriyadi", rm: "RM-2026-00110", dpjp: "dr. Nanda Putra, Sp.PD" },
    { nama: "Rina Kartika", rm: "RM-2026-00115", dpjp: "dr. Ratna Sari, Sp.OG" },
    { nama: "Agus Setiawan", rm: "RM-2026-00119", dpjp: "dr. Hendri Kusuma, Sp.JP" },
    { nama: "Nurul Hidayah", rm: "RM-2026-00124", dpjp: "dr. Nanda Putra, Sp.PD" },
    { nama: "Doni Pratama", rm: "RM-2026-00131", dpjp: "dr. Budi Raharjo, Sp.B" },
  ];

  const generated: BedItem[] = remainingStatuses.map((status, idx) => {
    const id_bed = coreBeds.length + idx + 1;
    const wardIdx = idx % 4;
    const wards = [
      {
        bangsal: "Anggrek 1",
        prefix: "ANG",
        baseRoom: 105,
        kelas: "Kelas 1" as KelasPerawatan,
        tipe: "2 Bed/Rm",
        fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central",
      },
      {
        bangsal: "Cendana 2",
        prefix: "CEN",
        baseRoom: 205,
        kelas: "Kelas 2" as KelasPerawatan,
        tipe: "4 Bed/Rm",
        fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • TV LED",
      },
      {
        bangsal: "Paviliun VIP",
        prefix: "VIP",
        baseRoom: 4,
        kelas: "VIP" as KelasPerawatan,
        tipe: "1 Bed/Rm",
        fasilitas: "1 Tempat Tidur Elektrik • AC • Sofa Penunggu • Smart TV",
      },
      {
        bangsal: "Melati 3",
        prefix: "MEL",
        baseRoom: 309,
        kelas: "Kelas 3" as KelasPerawatan,
        tipe: "6 Bed/Rm",
        fasilitas: "1 Tempat Tidur • Kipas Sentral • Oksigen Wall Outlet",
      },
    ];
    const w = wards[wardIdx];
    const num = w.baseRoom + Math.floor(idx / 4);
    const numStr = w.prefix === "VIP" ? String(num).padStart(3, "0") : String(num);
    const roomLabel = w.prefix === "VIP" ? `Suite ${String(num).padStart(2, "0")}` : `Kamar ${numStr}`;
    const p = samplePatients[idx % samplePatients.length];

    return {
      id_bed,
      no_bed: `BED-${w.prefix}-${numStr}`,
      nama_bangsal: w.bangsal,
      nama_kamar: roomLabel,
      kelas_perawatan: w.kelas,
      tipe_bed: w.tipe,
      status,
      fasilitas: w.fasilitas,
      updated_relative: idx % 3 === 0 ? "1 jam lalu" : idx % 3 === 1 ? "3 jam lalu" : "Hari ini",
      updated_timestamp: "Hari ini, 11:30 WIB",
      occupant:
        status === "Terisi"
          ? {
              id_pasien: 200 + idx,
              nama_pasien: p.nama,
              no_rm: p.rm,
              dokter_dpjp: p.dpjp,
            }
          : null,
    };
  });

  return [...coreBeds, ...generated];
}

const STORAGE_KEY_BEDS = "rsi_inpatient_beds_v1";

export function getMockBeds(): BedItem[] {
  if (typeof window === "undefined") {
    return buildSeedBeds();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BEDS);
    if (!raw) {
      const seed = buildSeedBeds();
      localStorage.setItem(STORAGE_KEY_BEDS, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as BedItem[];
  } catch {
    return buildSeedBeds();
  }
}

export function saveMockBeds(beds: BedItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_BEDS, JSON.stringify(beds));
  } catch {
    // ignore storage errors
  }
}

export function resetMockBeds(): BedItem[] {
  const seed = buildSeedBeds();
  saveMockBeds(seed);
  return seed;
}
