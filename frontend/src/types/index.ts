export type UserRole =
  | "PETUGAS_BED_MANAGEMENT"
  | "PETUGAS_ADMINISTRASI"
  | "SUPER_ADMIN";

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
  kondisi_pasien?: "Stabil" | "Darurat";
  status_penanganan?: string;
  asal_instalasi?: string;
  tanda_vital?: string;
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
  id_antrean?: number;
  petugas?: string;
}

// ==========================================
// UC-04: Daftar Tunggu Rawat Inap (FIFO)
// ==========================================
export type QueueStatus = "Menunggu" | "Dialokasikan" | "Batal";

export interface QueueItem {
  id_antrean: number;
  no_antrean: number;
  no_antrean_formatted: string; // e.g. "#01"
  id_pasien: number;
  no_rm: string;
  nama_pasien: string;
  jenis_kelamin_usia: string;
  kondisi_pasien: "Stabil" | "Darurat";
  kelas_perawatan: KelasPerawatan;
  hak_kelas_jaminan: string;
  diagnosa: string;
  dokter_dpjp: string;
  asal_instalasi: string;
  catatan_tunggu: string;
  waktu_masuk: string;
  waktu_masuk_formatted: string;
  waktu_masuk_relative: string;
  estimasi_tunggu: string;
  status: QueueStatus;
  dicatat_oleh: string;
  alokasi_bed?: {
    id_alokasi?: number;
    no_bed: string;
    nama_bangsal: string;
    waktu_alokasi?: string;
  } | null;
}

export interface CreateQueuePayload {
  id_pasien: number;
  kelas_perawatan?: KelasPerawatan;
  catatan_tunggu?: string;
}

// ==========================================
// UC-05: Rujukan Pasien Darurat
// ==========================================
export type HospitalAvailability = "Tersedia" | "Tidak Tersedia";

export type ReferralStatus = "Dibuat" | "Dikirim" | "Diterima" | "Batal";

export interface ReferralHospitalItem {
  id_rs: number;
  nama_rs: string;
  tipe_rs: string;
  jarak_estimasi: string;
  alamat: string;
  kontak: string;
  fasilitas_unggulan: string[];
  kapasitas_info: string;
  status_ketersediaan: HospitalAvailability;
  terakhir_diperbarui: string | null;
  terakhir_diperbarui_formatted: string;
  terakhir_diperbarui_oleh: string | null;
  stale: boolean;
}

export interface ReferralItem {
  id_surat: number;
  no_rujukan: string;
  id_pasien: number;
  no_rm: string;
  nama_pasien: string;
  jenis_kelamin_usia: string;
  kondisi_pasien: "Stabil" | "Darurat";
  diagnosa: string;
  dokter_dpjp: string;
  tanda_vital: string;
  id_rs: number;
  nama_rs: string;
  alamat_rs: string;
  kontak_rs: string;
  tanggal_rujukan: string;
  tanggal_rujukan_formatted: string;
  alasan_rujukan: string;
  catatan_medis: string;
  status: ReferralStatus;
  dibuat_oleh: string;
}

export interface CreateReferralPayload {
  id_pasien: number;
  id_rs: number;
  alasan_rujukan: string;
  catatan_medis?: string;
}

export interface ReferralHistoryItem {
  id_log: number;
  aksi: string;
  status_sebelumnya: string | null;
  status_baru: string | null;
  nama_petugas: string | null;
  waktu_aksi: string;
  waktu_aksi_formatted: string;
}

// ==========================================
// UC-06: Pemantauan Status Penanganan Pasien
// ==========================================
export interface MonitoringItem {
  id_pasien: number;
  no_rm: string;
  nama_pasien: string;
  jenis_kelamin_usia: string;
  kondisi_pasien: "Stabil" | "Darurat";
  status_penanganan: string;
  jalur_penanganan: "Daftar Tunggu" | "Rujukan RS Lain";
  diagnosa: string;
  dokter_dpjp: string;
  kelas_perawatan: KelasPerawatan;
  waktu_terakhir: string;
  waktu_terakhir_relative: string;
  petugas_pj: string;
  antrean?: {
    id_antrean: number;
    no_antrean: number;
    status: QueueStatus;
    waktu_masuk: string;
    dicatat_oleh: string | null;
    alokasi?: {
      id_alokasi: number;
      status_alokasi: string;
      waktu_alokasi: string;
      bed?: {
        no_bed: string;
        nama_bangsal: string;
        kelas_perawatan?: string;
      };
    } | null;
  } | null;
  rujukan?: {
    id_surat: number;
    no_rujukan: string;
    status: ReferralStatus;
    tanggal_rujukan: string;
    alasan_rujukan: string | null;
    dibuat_oleh: string | null;
    rumah_sakit?: {
      id_rs: number;
      nama_rs: string;
      alamat: string | null;
      kontak: string | null;
      status_ketersediaan: HospitalAvailability;
    } | null;
  } | null;
}


// ==========================================
// UC-07: Rekap Riwayat Layanan & Tindakan Pasien
// ==========================================
export type HistoryStatus = "Draft" | "Proses Verifikasi" | "Siap Billing";

export interface RmeRecordItem {
  id_riwayat: number;
  id_pasien: number;
  kode_tindakan: string;
  nama_tindakan: string;
  kategori?: string;
  tanggal_tindakan: string;
  tanggal_tindakan_formatted: string;
  jumlah: number;
  keterangan: string | null;
  catatan_medis?: string | null;
  dokter_pelaksana?: string;
  harga_estimasi?: number;
}

export interface DetailRekapItem {
  id_detail_rekap: number;
  id_riwayat: number;
  kode_tindakan: string;
  nama_tindakan: string;
  tanggal_tindakan: string;
  tanggal_tindakan_formatted: string;
  jumlah: number;
  catatan_khusus?: string;
  dokter_pelaksana?: string;
  harga_satuan?: number;
  subtotal?: number;
}

export interface HistoryTagihanRef {
  id_tagihan: number;
  no_tagihan: string;
  status: BillingStatus;
}

export interface HistoryRecapItem {
  id_rekap: number;
  kode_rekap: string;
  id_pasien: number;
  no_rm: string;
  nama_pasien: string;
  jenis_kelamin_usia: string;
  kelas_perawatan: KelasPerawatan;
  nama_kamar?: string;
  periode_perawatan?: string;
  dokter_dpjp: string;
  diagnosa: string;
  hak_kelas_jaminan: string;
  status: HistoryStatus;
  catatan: string | null;
  keterangan: string | null;
  tanggal_dibuat: string;
  tanggal_dibuat_formatted: string;
  tanggal_diperbarui: string | null;
  tanggal_diperbarui_formatted: string;
  dibuat_oleh: string;
  diperbarui_oleh?: string;
  jumlah_tindakan: number;
  detail_tindakan: DetailRekapItem[];
  tagihan: HistoryTagihanRef[];
}

export interface HistoryPatientSummary {
  id_pasien: number;
  no_rm: string;
  nama_pasien: string;
  jenis_kelamin_usia: string;
  kelas_perawatan: KelasPerawatan;
  hak_kelas_jaminan: string;
  dokter_dpjp: string;
  diagnosa_masuk: string;
  kondisi_pasien?: "Stabil" | "Darurat";
  status_penanganan: string;
  tanggal_masuk_formatted: string;
  periode_perawatan?: string;
  has_recap?: boolean;
  jumlah_rme: number;
  jumlah_rekap: number;
}

export interface CreateHistoryPayload {
  id_pasien: number;
  id_riwayat?: number[];
  catatan?: string;
  keterangan?: string;
}

export interface UpdateHistoryPayload {
  status?: HistoryStatus;
  catatan?: string | null;
  keterangan?: string | null;
}

// ==========================================
// UC-08 & UC-09: Perhitungan Biaya & Pengelolaan Tagihan (Billing)
// ==========================================
export type BillingStatus = "Draft" | "Belum Dibayar" | "Lunas" | "Batal";

export interface TarifItem {
  id_tarif: number;
  kode_tindakan: string;
  nama_tindakan: string;
  kategori: string;
  harga: string;
  harga_num: number;
  tanggal_berlaku: string;
  tanggal_berakhir: string | null;
  status: "Aktif" | "Nonaktif";
}

export interface BillingDetailItem {
  id_detail_tagihan?: number;
  id_detail_rekap: number;
  id_tarif: number;
  kode_tindakan: string;
  nama_tindakan: string;
  kategori?: string;
  satuan?: string;
  tanggal_tindakan?: string;
  tanggal_tindakan_formatted?: string;
  tanggal?: string;
  jumlah: number;
  harga_satuan: string;
  harga_satuan_num: number;
  subtotal: string;
  subtotal_num: number;
}

export interface BillingPreviewResult {
  id_rekap: number;
  kode_rekap: string;
  status: HistoryStatus;
  pasien: {
    id_pasien: number;
    no_rm: string;
    nama_pasien: string;
    jenis_kelamin_usia: string;
    kelas_perawatan: KelasPerawatan;
    dokter_dpjp: string;
    diagnosa: string;
    hak_kelas_jaminan: string;
    periode_perawatan?: string;
    nama_kamar?: string;
  };
  acuan_tarif: string;
  items: BillingDetailItem[];
  rincian_biaya?: BillingDetailItem[];
  total_biaya: string;
  total_biaya_num: number;
}

export interface BillingItem {
  id_tagihan: number;
  id_pasien: number;
  id_rekap: number;
  kode_rekap: string;
  no_tagihan: string;
  no_rm: string;
  nama_pasien: string;
  jenis_kelamin_usia: string;
  kelas_perawatan: KelasPerawatan;
  dokter_dpjp: string;
  diagnosa: string;
  hak_kelas_jaminan: string;
  periode_perawatan?: string;
  nama_kamar?: string;
  total_biaya: string;
  total_biaya_num: number;
  status: BillingStatus;
  catatan_penyesuaian: string | null;
  alasan_pembatalan: string | null;
  tanggal_dibuat: string;
  tanggal_dibuat_formatted: string;
  tanggal_terbit_formatted?: string;
  tanggal_diperbarui: string | null;
  tanggal_diperbarui_formatted: string;
  tanggal_dibatalkan: string | null;
  tanggal_dibatalkan_formatted: string | null;
  dibuat_oleh: string;
  jumlah_item: number;
  detail_tagihan_list: BillingDetailItem[];
}

export interface CreateBillingPayload {
  id_rekap: number;
  catatan?: string;
}
