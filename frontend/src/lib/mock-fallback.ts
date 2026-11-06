import {
  BedItem,
  BedStatus,
  KelasPerawatan,
  MonitoringItem,
  PasienCandidate,
  QueueItem,
  ReferralHospitalItem,
  ReferralItem,
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
    id_pasien: 1,
    no_rm: "RM-2026-00142",
    nama_pasien: "Hendra Wijaya",
    jenis_kelamin_usia: "L, 45 thn",
    dokter_dpjp: "dr. Nanda Putra, Sp.PD",
    hak_kelas_jaminan: "Kelas 1 (BPJS Kesehatan / Asuransi)",
    kelas_rekomendasi: "Kelas 1",
    diagnosa_masuk: "Demam Berdarah Dengue (DBD) Derajat II",
    kondisi_pasien: "Stabil",
    status_penanganan: "Menunggu",
    asal_instalasi: "Poli Penyakit Dalam",
    tanda_vital: "TD: 120/80 mmHg • Nadi: 84x/m • Suhu: 38.2°C • SpO2: 98%",
  },
  {
    id_pasien: 2,
    no_rm: "RM-2026-00148",
    nama_pasien: "Siti Aminah",
    jenis_kelamin_usia: "P, 34 thn",
    dokter_dpjp: "dr. Ratna Sari, Sp.OG",
    hak_kelas_jaminan: "VIP (Asuransi Mandiri Inhealth)",
    kelas_rekomendasi: "VIP",
    diagnosa_masuk: "Observasi Post-Partum & Hipertensi Gestasional",
    kondisi_pasien: "Stabil",
    status_penanganan: "Menunggu",
    asal_instalasi: "VK / Kebidanan",
    tanda_vital: "TD: 135/88 mmHg • Nadi: 82x/m • Suhu: 36.8°C • SpO2: 99%",
  },
  {
    id_pasien: 3,
    no_rm: "RM-2026-00153",
    nama_pasien: "Ahmad Fauzi",
    jenis_kelamin_usia: "L, 58 thn",
    dokter_dpjp: "dr. Hendri Kusuma, Sp.JP",
    hak_kelas_jaminan: "Kelas 2 (BPJS Kesehatan)",
    kelas_rekomendasi: "Kelas 2",
    diagnosa_masuk: "Congestive Heart Failure (CHF) NYHA II",
    kondisi_pasien: "Stabil",
    status_penanganan: "Menunggu",
    asal_instalasi: "IGD Triase Kuning",
    tanda_vital: "TD: 140/90 mmHg • Nadi: 92x/m • Suhu: 37.0°C • SpO2: 96%",
  },
  {
    id_pasien: 4,
    no_rm: "RM-2026-00161",
    nama_pasien: "Dewi Lestari",
    jenis_kelamin_usia: "P, 27 thn",
    dokter_dpjp: "dr. Nanda Putra, Sp.PD",
    hak_kelas_jaminan: "Kelas 3 (BPJS Kesehatan - PBI)",
    kelas_rekomendasi: "Kelas 3",
    diagnosa_masuk: "Demam Tifoid Akut & Dehidrasi Sedang",
    kondisi_pasien: "Stabil",
    status_penanganan: "Terdaftar",
    asal_instalasi: "Poli Umum",
    tanda_vital: "TD: 110/70 mmHg • Nadi: 88x/m • Suhu: 38.6°C • SpO2: 98%",
  },
  {
    id_pasien: 5,
    no_rm: "RM-2026-00175",
    nama_pasien: "Bambang Supriyadi",
    jenis_kelamin_usia: "L, 62 thn",
    dokter_dpjp: "dr. Hendri Kusuma, Sp.JP",
    hak_kelas_jaminan: "Kelas 1 (BPJS Kesehatan)",
    kelas_rekomendasi: "Kelas 1",
    diagnosa_masuk: "Sindrom Koroner Akut (STEMI Anterior) + Edema Paru",
    kondisi_pasien: "Darurat",
    status_penanganan: "Dirujuk",
    asal_instalasi: "IGD Resusitasi (Triase Merah)",
    tanda_vital: "TD: 165/105 mmHg • Nadi: 114x/m • RR: 28x/m • SpO2: 91% (NRM)",
  },
  {
    id_pasien: 6,
    no_rm: "RM-2026-00182",
    nama_pasien: "Rina Kartika",
    jenis_kelamin_usia: "P, 29 thn",
    dokter_dpjp: "dr. Ratna Sari, Sp.OG",
    hak_kelas_jaminan: "Kelas 2 (BPJS Kesehatan)",
    kelas_rekomendasi: "Kelas 2",
    diagnosa_masuk: "Preeklamsia Berat (PEB) G2P1A0 Uk 36 Minggu",
    kondisi_pasien: "Darurat",
    status_penanganan: "Terdaftar",
    asal_instalasi: "IGD Ponek (Triase Merah)",
    tanda_vital: "TD: 170/110 mmHg • Nadi: 104x/m • RR: 24x/m • SpO2: 95%",
  },
  {
    id_pasien: 7,
    no_rm: "RM-2026-00189",
    nama_pasien: "Agus Setiawan",
    jenis_kelamin_usia: "L, 51 thn",
    dokter_dpjp: "dr. Budi Raharjo, Sp.B",
    hak_kelas_jaminan: "Kelas 1 (Asuransi Prudential)",
    kelas_rekomendasi: "Kelas 1",
    diagnosa_masuk: "Apendisitis Akut Perforasi Suspek Peritonitis",
    kondisi_pasien: "Darurat",
    status_penanganan: "Terdaftar",
    asal_instalasi: "IGD Bedah (Triase Merah)",
    tanda_vital: "TD: 130/85 mmHg • Nadi: 108x/m • Suhu: 39.1°C • SpO2: 97%",
  },
  {
    id_pasien: 8,
    no_rm: "RM-2026-00194",
    nama_pasien: "Nurul Hidayah",
    jenis_kelamin_usia: "P, 41 thn",
    dokter_dpjp: "dr. Nanda Putra, Sp.PD",
    hak_kelas_jaminan: "Kelas 2 (BPJS Kesehatan)",
    kelas_rekomendasi: "Kelas 2",
    diagnosa_masuk: "Gastritis Erosif + Anemia Gravis",
    kondisi_pasien: "Stabil",
    status_penanganan: "Terdaftar",
    asal_instalasi: "Poli Penyakit Dalam",
    tanda_vital: "TD: 105/70 mmHg • Nadi: 90x/m • Suhu: 36.7°C • SpO2: 98%",
  },
  {
    id_pasien: 9,
    no_rm: "RM-2026-00201",
    nama_pasien: "Doni Pratama",
    jenis_kelamin_usia: "L, 33 thn",
    dokter_dpjp: "dr. Budi Raharjo, Sp.B",
    hak_kelas_jaminan: "VIP (Umum / Pribadi)",
    kelas_rekomendasi: "VIP",
    diagnosa_masuk: "Observasi Pasca Reposisi Fraktur Klavikula",
    kondisi_pasien: "Stabil",
    status_penanganan: "Terdaftar",
    asal_instalasi: "Poli Ortopedi",
    tanda_vital: "TD: 120/78 mmHg • Nadi: 78x/m • Suhu: 36.5°C • SpO2: 99%",
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
        id_pasien: 1,
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

// ==========================================
// Seed Data UC-04: Daftar Tunggu (FIFO)
// ==========================================
function buildSeedQueues(): QueueItem[] {
  return [
    {
      id_antrean: 1,
      no_antrean: 1,
      no_antrean_formatted: "#01",
      id_pasien: 1,
      no_rm: "RM-2026-00142",
      nama_pasien: "Hendra Wijaya",
      jenis_kelamin_usia: "L, 45 thn",
      kondisi_pasien: "Stabil",
      kelas_perawatan: "Kelas 1",
      hak_kelas_jaminan: "Kelas 1 (BPJS Kesehatan)",
      diagnosa: "Demam Berdarah Dengue (DBD) Derajat II",
      dokter_dpjp: "dr. Nanda Putra, Sp.PD",
      asal_instalasi: "Poli Penyakit Dalam",
      catatan_tunggu: "Menunggu bed Kelas 1 Anggrek 1 selesai sterilisasi.",
      waktu_masuk: "2026-11-06T08:15:00.000Z",
      waktu_masuk_formatted: "Hari ini, 08:15 WIB",
      waktu_masuk_relative: "2 jam 15 mnt lalu",
      estimasi_tunggu: "± 30 Menit",
      status: "Menunggu",
      dicatat_oleh: "Rini Aprilianti",
      alokasi_bed: null,
    },
    {
      id_antrean: 2,
      no_antrean: 2,
      no_antrean_formatted: "#02",
      id_pasien: 2,
      no_rm: "RM-2026-00148",
      nama_pasien: "Siti Aminah",
      jenis_kelamin_usia: "P, 34 thn",
      kondisi_pasien: "Stabil",
      kelas_perawatan: "VIP",
      hak_kelas_jaminan: "VIP (Asuransi Mandiri Inhealth)",
      diagnosa: "Observasi Post-Partum & Hipertensi Gestasional",
      dokter_dpjp: "dr. Ratna Sari, Sp.OG",
      asal_instalasi: "VK / Kebidanan",
      catatan_tunggu: "Preferensi Paviliun VIP Utama lantai 1.",
      waktu_masuk: "2026-11-06T09:05:00.000Z",
      waktu_masuk_formatted: "Hari ini, 09:05 WIB",
      waktu_masuk_relative: "1 jam 25 mnt lalu",
      estimasi_tunggu: "± 45 Menit",
      status: "Menunggu",
      dicatat_oleh: "Rini Aprilianti",
      alokasi_bed: null,
    },
    {
      id_antrean: 3,
      no_antrean: 3,
      no_antrean_formatted: "#03",
      id_pasien: 3,
      no_rm: "RM-2026-00153",
      nama_pasien: "Ahmad Fauzi",
      jenis_kelamin_usia: "L, 58 thn",
      kondisi_pasien: "Stabil",
      kelas_perawatan: "Kelas 2",
      hak_kelas_jaminan: "Kelas 2 (BPJS Kesehatan)",
      diagnosa: "Congestive Heart Failure (CHF) NYHA II",
      dokter_dpjp: "dr. Hendri Kusuma, Sp.JP",
      asal_instalasi: "IGD Triase Kuning",
      catatan_tunggu: "Perlu bed dekat nurse station dengan oksigen sentral.",
      waktu_masuk: "2026-11-06T09:40:00.000Z",
      waktu_masuk_formatted: "Hari ini, 09:40 WIB",
      waktu_masuk_relative: "50 menit lalu",
      estimasi_tunggu: "± 1 Jam",
      status: "Menunggu",
      dicatat_oleh: "Budi Santoso",
      alokasi_bed: null,
    },
    {
      id_antrean: 4,
      no_antrean: 4,
      no_antrean_formatted: "#04",
      id_pasien: 8,
      no_rm: "RM-2026-00194",
      nama_pasien: "Nurul Hidayah",
      jenis_kelamin_usia: "P, 41 thn",
      kondisi_pasien: "Stabil",
      kelas_perawatan: "Kelas 2",
      hak_kelas_jaminan: "Kelas 2 (BPJS Kesehatan)",
      diagnosa: "Gastritis Erosif + Anemia Gravis",
      dokter_dpjp: "dr. Nanda Putra, Sp.PD",
      asal_instalasi: "Poli Penyakit Dalam",
      catatan_tunggu: "Sudah dialokasikan ke Bangsal Cendana 2.",
      waktu_masuk: "2026-11-06T07:30:00.000Z",
      waktu_masuk_formatted: "Hari ini, 07:30 WIB",
      waktu_masuk_relative: "3 jam lalu",
      estimasi_tunggu: "Selesai Dialokasikan",
      status: "Dialokasikan",
      dicatat_oleh: "Rini Aprilianti",
      alokasi_bed: {
        id_alokasi: 1,
        no_bed: "BED-CEN-201",
        nama_bangsal: "Cendana 2",
        waktu_alokasi: "Hari ini, 08:10 WIB",
      },
    },
  ];
}

// ==========================================
// Seed Data UC-05: Rumah Sakit Rujukan & Surat Rujukan
// ==========================================
function buildSeedReferralHospitals(): ReferralHospitalItem[] {
  return [
    {
      id_rs: 1,
      nama_rs: "RS Umum Daerah Sehat Sentosa",
      tipe_rs: "RS Tipe A • Pusat Rujukan Regional",
      jarak_estimasi: "2.8 km (± 8 menit)",
      alamat: "Jl. Melati No. 12, Kec. Gubeng",
      kontak: "021-5550101",
      fasilitas_unggulan: [
        "ICU & ICCU Tersedia (3 Bed)",
        "IGD Trauma Center 24 Jam",
        "Cath Lab & Hemodialisa",
      ],
      kapasitas_info: "Tersedia: 3 Bed ICU, 5 Bed Kelas 1/2",
      status_ketersediaan: "Tersedia",
      terakhir_diperbarui: new Date().toISOString(),
      terakhir_diperbarui_formatted: "Baru saja dikonfirmasi",
      terakhir_diperbarui_oleh: "Rini Aprilianti",
      stale: false,
    },
    {
      id_rs: 2,
      nama_rs: "RS Khusus Jantung Harapan",
      tipe_rs: "RS Khusus Tipe A • Kardiovaskular",
      jarak_estimasi: "4.1 km (± 12 menit)",
      alamat: "Jl. Kenanga No. 7, Kec. Tegalsari",
      kontak: "021-5550102",
      fasilitas_unggulan: [
        "ICCU Jantung Siaga (2 Bed)",
        "Dokter Spesialis Jantung On-Site",
        "Primary PCI 24 Jam",
      ],
      kapasitas_info: "Tersedia: 2 Bed ICCU, 4 Bed Isolasi",
      status_ketersediaan: "Tersedia",
      terakhir_diperbarui: new Date().toISOString(),
      terakhir_diperbarui_formatted: "2 menit lalu",
      terakhir_diperbarui_oleh: "Budi Santoso",
      stale: false,
    },
    {
      id_rs: 3,
      nama_rs: "RS Ibu dan Anak Bunda Kasih",
      tipe_rs: "RSIA Tipe B • PONEK 24 Jam",
      jarak_estimasi: "3.5 km (± 10 menit)",
      alamat: "Jl. Anggrek No. 45, Kec. Wonokromo",
      kontak: "021-5550103",
      fasilitas_unggulan: [
        "NICU & PICU Tersedia (2 Inkubator)",
        "Kamar Bersalin PONEK Siaga",
        "HCU Maternal",
      ],
      kapasitas_info: "Tersedia: 1 HCU Maternal, 2 NICU",
      status_ketersediaan: "Tersedia",
      terakhir_diperbarui: new Date().toISOString(),
      terakhir_diperbarui_formatted: "4 menit lalu",
      terakhir_diperbarui_oleh: "Rini Aprilianti",
      stale: false,
    },
    {
      id_rs: 4,
      nama_rs: "RS Umum Pusat Medika Nusantara",
      tipe_rs: "RS Tipe B • Mitra Jejaring BPJS",
      jarak_estimasi: "6.2 km (± 18 menit)",
      alamat: "Jl. Sudirman No. 88, Kec. Sawahan",
      kontak: "021-5550104",
      fasilitas_unggulan: [
        "Bedah Sentral 24 Jam",
        "Ventilator ICU",
        "Radiologi CT-Scan",
      ],
      kapasitas_info: "Kapasitas ICU & Rawat Inap Penuh",
      status_ketersediaan: "Tidak Tersedia",
      terakhir_diperbarui: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      terakhir_diperbarui_formatted: "15 menit lalu (Perlu Konfirmasi Ulang)",
      terakhir_diperbarui_oleh: "Budi Santoso",
      stale: true,
    },
  ];
}

function buildSeedReferrals(): ReferralItem[] {
  return [
    {
      id_surat: 1,
      no_rujukan: "RUJ-20261106-001",
      id_pasien: 5,
      no_rm: "RM-2026-00175",
      nama_pasien: "Bambang Supriyadi",
      jenis_kelamin_usia: "L, 62 thn",
      kondisi_pasien: "Darurat",
      diagnosa: "Sindrom Koroner Akut (STEMI Anterior) + Edema Paru",
      dokter_dpjp: "dr. Hendri Kusuma, Sp.JP",
      tanda_vital: "TD: 165/105 mmHg • Nadi: 114x/m • RR: 28x/m • SpO2: 91% (NRM)",
      id_rs: 2,
      nama_rs: "RS Khusus Jantung Harapan",
      alamat_rs: "Jl. Kenanga No. 7, Kec. Tegalsari",
      kontak_rs: "021-5550102",
      tanggal_rujukan: "2026-11-06T09:15:00.000Z",
      tanggal_rujukan_formatted: "06 Nov 2026, 09:15 WIB",
      alasan_rujukan:
        "Kapasitas ruang ICCU & Bed Kelas 1 di RSI sedang penuh (100% Terisi). Pasien memerlukan intervensi Primary PCI segera dan pemantauan intensif kardiovaskular.",
      catatan_medis:
        "Telah diberikan terapi awal: Oksigen NRM 10 lpm, Aspilet 160mg, Clopidogrel 300mg, ISDN 5mg sublingual, dan pemasangan IV line RL.",
      status: "Dikirim",
      dibuat_oleh: "Rini Aprilianti",
    },
    {
      id_surat: 2,
      no_rujukan: "RUJ-20261106-002",
      id_pasien: 6,
      no_rm: "RM-2026-00182",
      nama_pasien: "Rina Kartika",
      jenis_kelamin_usia: "P, 29 thn",
      kondisi_pasien: "Darurat",
      diagnosa: "Preeklamsia Berat (PEB) G2P1A0 Uk 36 Minggu",
      dokter_dpjp: "dr. Ratna Sari, Sp.OG",
      tanda_vital: "TD: 170/110 mmHg • Nadi: 104x/m • RR: 24x/m • SpO2: 95%",
      id_rs: 3,
      nama_rs: "RS Ibu dan Anak Bunda Kasih",
      alamat_rs: "Jl. Anggrek No. 45, Kec. Wonokromo",
      kontak_rs: "021-5550103",
      tanggal_rujukan: "2026-11-06T08:40:00.000Z",
      tanggal_rujukan_formatted: "06 Nov 2026, 08:40 WIB",
      alasan_rujukan:
        "Ruang HCU Maternal dan NICU RSI penuh. Pasien memerlukan terminasi kehamilan segera dengan dukungan fasilitas PONEK & NICU.",
      catatan_medis:
        "Telah diberikan loading dose MgSO4 4g IV bolus lambat dan Nifedipine 10mg PO. Kateter urin terpasang.",
      status: "Diterima",
      dibuat_oleh: "Rini Aprilianti",
    },
  ];
}

const STORAGE_KEY_BEDS = "rsi_inpatient_beds_v1";
const STORAGE_KEY_QUEUES = "rsi_inpatient_queues_v1";
const STORAGE_KEY_HOSPITALS = "rsi_inpatient_hospitals_v1";
const STORAGE_KEY_REFERRALS = "rsi_inpatient_referrals_v1";

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

export function getMockQueues(): QueueItem[] {
  if (typeof window === "undefined") {
    return buildSeedQueues();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUES);
    if (!raw) {
      const seed = buildSeedQueues();
      localStorage.setItem(STORAGE_KEY_QUEUES, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return buildSeedQueues();
  }
}

export function saveMockQueues(queues: QueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_QUEUES, JSON.stringify(queues));
  } catch {
    // ignore
  }
}

export function getMockReferralHospitals(): ReferralHospitalItem[] {
  if (typeof window === "undefined") {
    return buildSeedReferralHospitals();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HOSPITALS);
    if (!raw) {
      const seed = buildSeedReferralHospitals();
      localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as ReferralHospitalItem[];
  } catch {
    return buildSeedReferralHospitals();
  }
}

export function saveMockReferralHospitals(hospitals: ReferralHospitalItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(hospitals));
  } catch {
    // ignore
  }
}

export function getMockReferrals(): ReferralItem[] {
  if (typeof window === "undefined") {
    return buildSeedReferrals();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFERRALS);
    if (!raw) {
      const seed = buildSeedReferrals();
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as ReferralItem[];
  } catch {
    return buildSeedReferrals();
  }
}

export function saveMockReferrals(referrals: ReferralItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(referrals));
  } catch {
    // ignore
  }
}

export function buildMockMonitoringFromStore(): MonitoringItem[] {
  const queues = getMockQueues();
  const referrals = getMockReferrals();
  const items: MonitoringItem[] = [];

  for (const q of queues) {
    items.push({
      id_pasien: q.id_pasien,
      no_rm: q.no_rm,
      nama_pasien: q.nama_pasien,
      jenis_kelamin_usia: q.jenis_kelamin_usia,
      kondisi_pasien: q.kondisi_pasien,
      status_penanganan:
        q.status === "Dialokasikan"
          ? "Rawat Inap"
          : q.status === "Batal"
          ? "Dibatalkan"
          : "Menunggu Antrean",
      jalur_penanganan: "Daftar Tunggu",
      diagnosa: q.diagnosa,
      dokter_dpjp: q.dokter_dpjp,
      kelas_perawatan: q.kelas_perawatan,
      waktu_terakhir: q.waktu_masuk_formatted,
      waktu_terakhir_relative: q.waktu_masuk_relative,
      petugas_pj: q.dicatat_oleh,
      antrean: {
        id_antrean: q.id_antrean,
        no_antrean: q.no_antrean,
        status: q.status,
        waktu_masuk: q.waktu_masuk,
        dicatat_oleh: q.dicatat_oleh,
        alokasi: q.alokasi_bed
          ? {
              id_alokasi: q.alokasi_bed.id_alokasi || 1,
              status_alokasi: "Aktif",
              waktu_alokasi: q.alokasi_bed.waktu_alokasi || q.waktu_masuk,
              bed: {
                no_bed: q.alokasi_bed.no_bed,
                nama_bangsal: q.alokasi_bed.nama_bangsal,
                kelas_perawatan: q.kelas_perawatan,
              },
            }
          : null,
      },
      rujukan: null,
    });
  }

  for (const r of referrals) {
    items.push({
      id_pasien: r.id_pasien,
      no_rm: r.no_rm,
      nama_pasien: r.nama_pasien,
      jenis_kelamin_usia: r.jenis_kelamin_usia,
      kondisi_pasien: r.kondisi_pasien,
      status_penanganan:
        r.status === "Diterima"
          ? "Dirujuk (Diterima RS Tujuan)"
          : r.status === "Dikirim"
          ? "Dalam Perjalanan Rujukan"
          : r.status === "Batal"
          ? "Rujukan Dibatalkan"
          : "Surat Rujukan Dibuat",
      jalur_penanganan: "Rujukan RS Lain",
      diagnosa: r.diagnosa,
      dokter_dpjp: r.dokter_dpjp,
      kelas_perawatan: "Kelas 1",
      waktu_terakhir: r.tanggal_rujukan_formatted,
      waktu_terakhir_relative: "Hari ini",
      petugas_pj: r.dibuat_oleh,
      antrean: null,
      rujukan: {
        id_surat: r.id_surat,
        no_rujukan: r.no_rujukan,
        status: r.status,
        tanggal_rujukan: r.tanggal_rujukan,
        alasan_rujukan: r.alasan_rujukan,
        dibuat_oleh: r.dibuat_oleh,
        rumah_sakit: {
          id_rs: r.id_rs,
          nama_rs: r.nama_rs,
          alamat: r.alamat_rs,
          kontak: r.kontak_rs,
          status_ketersediaan: "Tersedia",
        },
      },
    });
  }

  return items;
}

export function resetMockBeds(): BedItem[] {
  const seed = buildSeedBeds();
  saveMockBeds(seed);
  saveMockQueues(buildSeedQueues());
  saveMockReferralHospitals(buildSeedReferralHospitals());
  saveMockReferrals(buildSeedReferrals());
  return seed;
}
