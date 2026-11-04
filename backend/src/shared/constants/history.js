// Nilai harus sama persis dengan kolom rekap_tindakan.status.
export const HISTORY_STATUS = {
    DRAFT: "Draft",
    PROSES_VERIFIKASI: "Proses Verifikasi",
    SIAP_BILLING: "Siap Billing",
};

export const HISTORY_STATUS_LIST = Object.values(HISTORY_STATUS);

// DECISION REQUIRED: transisi final belum disepakati. Sementara hanya maju satu langkah;
// koreksi rekap setelah Siap Billing belum diizinkan.
export const HISTORY_TRANSITIONS = {
    [HISTORY_STATUS.DRAFT]: [HISTORY_STATUS.PROSES_VERIFIKASI],
    [HISTORY_STATUS.PROSES_VERIFIKASI]: [HISTORY_STATUS.SIAP_BILLING],
    [HISTORY_STATUS.SIAP_BILLING]: [],
};

// Nilai log_audit.nama_tabel untuk modul ini.
export const HISTORY_AUDIT_TABLE = "rekap_tindakan";
