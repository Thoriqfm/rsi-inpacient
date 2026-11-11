import prisma from "../../config/prisma.js";
import { ALLOCATION_STATUS } from "../../shared/constants/bed.js";

const allocationSelect = {
    id_alokasi: true,
    id_pasien: true,
    id_bed: true,
    id_akun: true,
    waktu_alokasi: true,
    waktu_selesai: true,
    status_alokasi: true,
    id_antrean: true,
    created_at: true,
    updated_at: true,
    pasien: { select: { no_rm: true, nama_pasien: true } },
    bed: { select: { no_bed: true, nama_bangsal: true, kelas_perawatan: true } },
    akun: { select: { nama_petugas: true } },
};

export function buildAllocationWhere({ status_alokasi, id_pasien, id_bed }) {
    return {
        ...(status_alokasi ? { status_alokasi } : {}),
        ...(id_pasien ? { id_pasien } : {}),
        ...(id_bed ? { id_bed } : {}),
    };
}

export function findAllocations(where, { skip, take }) {
    return prisma.rekamAlokasi.findMany({
        where,
        select: allocationSelect,
        orderBy: { id_alokasi: "desc" },
        skip,
        take,
    });
}

export function countAllocations(where) {
    return prisma.rekamAlokasi.count({ where });
}

export function findAllocationById(id_alokasi, client = prisma) {
    return client.rekamAlokasi.findUnique({
        where: { id_alokasi },
        select: allocationSelect,
    });
}

export function findPasienForAllocation(id_pasien, client = prisma) {
    return client.pasien.findUnique({
        where: { id_pasien },
        select: { id_pasien: true, no_rm: true, nama_pasien: true, status_penanganan: true },
    });
}

export function updatePasienStatusForAllocation(client, id_pasien, status_penanganan) {
    return client.pasien.update({
        where: { id_pasien },
        data: { status_penanganan, updated_at: new Date() },
    });
}

export function createRiwayatStatusForAllocation(
    client,
    { id_pasien, id_akun, status_sebelumnya, status_baru, keterangan },
) {
    return client.riwayatStatusPasien.create({
        data: {
            id_pasien,
            id_akun,
            status_sebelumnya: status_sebelumnya ?? null,
            status_baru,
            keterangan: keterangan ?? null,
            waktu_perubahan: new Date(),
        },
    });
}

export function findQueueById(id_antrean, client = prisma) {
    return client.daftarTunggu.findUnique({
        where: { id_antrean },
        select: { id_antrean: true, id_pasien: true, status: true },
    });
}

// Hanya antrean berstatus Menunggu yang boleh ditandai Dialokasikan.
export function markQueueAllocated(id_antrean, client) {
    return client.daftarTunggu.updateMany({
        where: { id_antrean, status: "Menunggu" },
        data: { status: "Dialokasikan", updated_at: new Date() },
    });
}

export function countActiveAllocationsByBed(id_bed, client = prisma) {
    return client.rekamAlokasi.count({
        where: { id_bed, status_alokasi: ALLOCATION_STATUS.AKTIF },
    });
}

export function createAllocation(client, data) {
    return client.rekamAlokasi.create({ data, select: allocationSelect });
}

// Conditional update: hanya alokasi yang masih Aktif yang boleh ditutup.
export function closeAllocation(client, id_alokasi, status_alokasi) {
    const now = new Date();

    return client.rekamAlokasi.updateMany({
        where: { id_alokasi, status_alokasi: ALLOCATION_STATUS.AKTIF },
        data: { status_alokasi, waktu_selesai: now, updated_at: now },
    });
}
