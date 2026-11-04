import prisma from "../../config/prisma.js";

export const rmeSelect = {
    id_riwayat: true,
    id_pasien: true,
    kode_tindakan: true,
    nama_tindakan: true,
    tanggal_tindakan: true,
    jumlah: true,
    keterangan: true,
    created_at: true,
};

export function findPasienForRme(id_pasien) {
    return prisma.pasien.findUnique({
        where: { id_pasien },
        select: { id_pasien: true, no_rm: true, nama_pasien: true },
    });
}

export function createRme(data) {
    return prisma.rmeDummy.create({ data, select: rmeSelect });
}
