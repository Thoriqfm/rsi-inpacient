// Satu-satunya mekanisme riwayat/audit yang sudah tersedia; jangan buat tabel riwayat baru.
export function createAuditLog(client, { id_akun, nama_tabel, id_referensi, aksi, data_sebelum, data_sesudah }) {
    return client.logAudit.create({
        data: {
            id_akun,
            nama_tabel,
            id_referensi,
            aksi,
            data_sebelum: data_sebelum ? JSON.stringify(data_sebelum) : null,
            data_sesudah: data_sesudah ? JSON.stringify(data_sesudah) : null,
        },
    });
}

// data_sebelum/data_sesudah disimpan sebagai teks JSON; baris rusak tidak boleh memecah response.
export function parseAuditData(value) {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
