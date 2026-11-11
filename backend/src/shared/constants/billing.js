// Nilai harus sama persis dengan kolom tagihan.status.
export const TAGIHAN_STATUS = {
    DRAFT: "Draft",
    BELUM_DIBAYAR: "Belum Dibayar",
    LUNAS: "Lunas",
    BATAL: "Batal",
};

export const TAGIHAN_STATUS_LIST = Object.values(TAGIHAN_STATUS);

// DECISION REQUIRED (BILL-D01/D03/D04): state machine final belum disetujui TFM.
// Sementara: Draft -> Belum Dibayar -> Lunas; Batal hanya lewat endpoint cancel.
export const TAGIHAN_TRANSITIONS = {
    [TAGIHAN_STATUS.DRAFT]: [TAGIHAN_STATUS.BELUM_DIBAYAR],
    [TAGIHAN_STATUS.BELUM_DIBAYAR]: [TAGIHAN_STATUS.LUNAS],
    [TAGIHAN_STATUS.LUNAS]: [],
    [TAGIHAN_STATUS.BATAL]: [],
};

// Hanya status ini yang masih boleh dihitung ulang / dibatalkan.
export const TAGIHAN_OPEN_STATUSES = [TAGIHAN_STATUS.DRAFT, TAGIHAN_STATUS.BELUM_DIBAYAR];

// Nilai log_audit.nama_tabel untuk modul ini.
export const BILLING_AUDIT_TABLE = "tagihan";

// Nilai kolom tarif.status yang dipakai seed dan test.
export const TARIF_STATUS = {
    AKTIF: "Aktif",
    NONAKTIF: "Nonaktif",
};

export const TARIF_STATUS_LIST = Object.values(TARIF_STATUS);
