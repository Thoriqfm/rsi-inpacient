import prisma from "../../config/prisma.js";
import { ALLOCATION_STATUS, BED_STATUS } from "../../shared/constants/bed.js";

// Maksimal satu alokasi aktif per bed dijaga uq_rekam_alokasi_bed_aktif.
const activeOccupantSelect = {
    where: { status_alokasi: ALLOCATION_STATUS.AKTIF },
    take: 1,
    select: { pasien: { select: { no_rm: true, nama_pasien: true } } },
};

const bedSelect = {
    id_bed: true,
    no_bed: true,
    nama_bangsal: true,
    nama_kamar: true,
    kelas_perawatan: true,
    status: true,
    tipe_bed: true,
    fasilitas: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    rekam_alokasi_list: activeOccupantSelect,
};

// Hanya field yang dibutuhkan proses alokasi; status dan data audit tidak diekspos.
const availableBedSelect = {
    id_bed: true,
    no_bed: true,
    nama_bangsal: true,
    kelas_perawatan: true,
    tipe_bed: true,
};

export function buildBedWhere({ status, q }) {
    return {
        deleted_at: null,
        ...(status ? { status } : {}),
        ...(q
            ? {
                  OR: [
                      { no_bed: { contains: q } },
                      { nama_bangsal: { contains: q } },
                  ],
              }
            : {}),
    };
}

export function findBeds(where, { skip, take }) {
    return prisma.bed.findMany({
        where,
        select: bedSelect,
        orderBy: [{ nama_bangsal: "asc" }, { no_bed: "asc" }],
        skip,
        take,
    });
}

export function countBeds(where) {
    return prisma.bed.count({ where });
}

export function findBedById(id_bed, client = prisma) {
    return client.bed.findFirst({
        where: { id_bed, deleted_at: null },
        select: bedSelect,
    });
}

export function findAvailableBeds() {
    return prisma.bed.findMany({
        where: { deleted_at: null, status: BED_STATUS.TERSEDIA },
        select: availableBedSelect,
        orderBy: [{ nama_bangsal: "asc" }, { no_bed: "asc" }],
    });
}

export function createBed(data) {
    return prisma.bed.create({ data, select: bedSelect });
}

export function updateBed(id_bed, data, client = prisma) {
    return client.bed.update({
        where: { id_bed },
        data: { ...data, updated_at: new Date() },
        select: bedSelect,
    });
}

// Sekaligus penjaga double delete & race condition terhadap alokasi: hanya baris non-Terisi yang belum soft-delete yang terpengaruh.
export function softDeleteBed(id_bed, client = prisma) {
    return client.bed.updateMany({
        where: { id_bed, deleted_at: null, status: { not: BED_STATUS.TERISI } },
        data: { deleted_at: new Date(), updated_at: new Date() },
    });
}

// Guard race condition: hanya berhasil jika status masih Tersedia saat statement dieksekusi.
export function claimBedForAllocation(id_bed, client) {
    return client.bed.updateMany({
        where: { id_bed, status: BED_STATUS.TERSEDIA, deleted_at: null },
        data: { status: BED_STATUS.TERISI, updated_at: new Date() },
    });
}

export function releaseBedAfterAllocation(id_bed, client) {
    return client.bed.updateMany({
        where: { id_bed, status: BED_STATUS.TERISI },
        data: { status: BED_STATUS.TERSEDIA, updated_at: new Date() },
    });
}
