export type UserRole =
  | "PETUGAS_BED_MANAGEMENT"
  | "PETUGAS_ADMINISTRASI"
  | "PETUGAS_MEDIS";

export interface UserAccount {
  id_akun: number;
  username: string;
  nama_petugas: string;
  jabatan_label: string;
  inisial: string;
  role: UserRole;
}

export type BedStatus =
  | "Tersedia"
  | "Terisi"
  | "Pembersihan"
  | "Pemeliharaan";

export type KelasPerawatan = "VIP" | "Kelas 1" | "Kelas 2" | "Kelas 3";

export interface OccupantInfo {
  id_pasien?: number;
  nama_pasien: string;
  no_rm: string;
  dokter_dpjp?: string;
  diagnosa?: string;
}

export interface BedItem {
  id_bed: number;
  no_bed: string; // e.g. "BED-ANG-101"
  nama_bangsal: string; // e.g. "Anggrek 1"
  nama_kamar: string; // e.g. "Kamar 101"
  kelas_perawatan: KelasPerawatan;
  tipe_bed: string; // e.g. "1 Bed/Rm", "2 Bed/Rm"
  status: BedStatus;
  fasilitas: string; // e.g. "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central"
  updated_relative: string; // e.g. "10 menit lalu"
  updated_timestamp: string; // e.g. "Hari ini, 14:20 WIB"
  occupant?: OccupantInfo | null;
}

export interface PasienCandidate {
  id_pasien: number;
  no_rm: string;
  nama_pasien: string;
  jenis_kelamin_usia: string; // e.g. "L, 45 thn"
  dokter_dpjp: string;
  hak_kelas_jaminan: string;
  kelas_rekomendasi: KelasPerawatan;
  diagnosa_masuk: string;
}

export interface CreateBedPayload {
  no_bed: string;
  nama_bangsal: string;
  nama_kamar?: string | null;
  kelas_perawatan: KelasPerawatan;
  tipe_bed?: string | null;
  fasilitas?: string | null;
}

export interface UpdateBedStatusPayload {
  id_bed: number;
  status: BedStatus;
  petugas?: string;
}

export interface CreateAllocationPayload {
  id_pasien: number;
  id_bed: number;
  petugas?: string;
}
