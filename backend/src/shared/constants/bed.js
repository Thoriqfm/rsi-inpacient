// Nilai harus sama persis dengan isi kolom bed.status dan rekam_alokasi.status_alokasi.
export const BED_STATUS = {
    TERSEDIA: "Tersedia",
    TERISI: "Terisi",
    PEMBERSIHAN: "Pembersihan",
    PEMELIHARAAN: "Pemeliharaan",
};

export const BED_STATUS_LIST = Object.values(BED_STATUS);
export const ROOM_CLASSES = ["VIP", "Kelas 1", "Kelas 2", "Kelas 3"];

export const ALLOCATION_STATUS = {
    AKTIF: "Aktif",
    SELESAI: "Selesai",
    BATAL: "Batal",
};

export const ALLOCATION_STATUS_LIST = Object.values(ALLOCATION_STATUS);
