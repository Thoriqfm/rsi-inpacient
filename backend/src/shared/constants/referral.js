// Nilai harus sama persis dengan kolom rumah_sakit_rujukan.status_ketersediaan.
export const HOSPITAL_AVAILABILITY = {
    TERSEDIA: "Tersedia",
    TIDAK_TERSEDIA: "Tidak Tersedia",
};

export const HOSPITAL_AVAILABILITY_LIST = Object.values(HOSPITAL_AVAILABILITY);

// Nilai harus sama persis dengan kolom surat_rujukan.status.
export const REFERRAL_STATUS = {
    DIBUAT: "Dibuat",
    DIKIRIM: "Dikirim",
    DITERIMA: "Diterima",
    BATAL: "Batal",
};

export const REFERRAL_STATUS_LIST = Object.values(REFERRAL_STATUS);

// DECISION REQUIRED: transisi final belum disepakati; sementara mengikuti status di schema.
export const REFERRAL_TRANSITIONS = {
    [REFERRAL_STATUS.DIBUAT]: [REFERRAL_STATUS.DIKIRIM, REFERRAL_STATUS.BATAL],
    [REFERRAL_STATUS.DIKIRIM]: [REFERRAL_STATUS.DITERIMA, REFERRAL_STATUS.BATAL],
    [REFERRAL_STATUS.DITERIMA]: [],
    [REFERRAL_STATUS.BATAL]: [],
};

// Ketersediaan RS diperbarui manual dan dianggap stale setelah 5 menit.
export const HOSPITAL_STALE_MS = 5 * 60 * 1000;

// Nilai log_audit.nama_tabel untuk modul ini.
export const AUDIT_TABLE = {
    HOSPITAL: "rumah_sakit_rujukan",
    REFERRAL: "surat_rujukan",
};

export const AUDIT_ACTION = {
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    STATUS_CHANGE: "STATUS_CHANGE",
};
