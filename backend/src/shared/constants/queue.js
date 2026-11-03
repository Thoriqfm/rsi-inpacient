// Nilai harus sama persis dengan kolom daftar_tunggu.status di database.
export const QUEUE_STATUS = {
    MENUNGGU: "Menunggu",
    DIALOKASIKAN: "Dialokasikan",
    BATAL: "Batal",
};

export const QUEUE_STATUS_LIST = Object.values(QUEUE_STATUS);
