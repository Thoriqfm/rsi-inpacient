import prisma from "../../config/prisma.js";
import { QUEUE_STATUS } from "../../shared/constants/queue.js";

export const queueSelect = {
    id_antrean: true,
    id_pasien: true,
    no_antrean: true,
    waktu_masuk: true,
    status: true,
    created_at: true,
    updated_at: true,
    pasien: {
        select: {
            no_rm: true,
            nama_pasien: true,
            kondisi_pasien: true,
            status_penanganan: true,
        },
    },
    akun: { select: { nama_petugas: true } },
    rekam_alokasi: {
        select: {
            id_alokasi: true,
            status_alokasi: true,
            waktu_alokasi: true,
            bed: { select: { no_bed: true, nama_bangsal: true } },
        },
    },
};

export function buildQueueWhere({ status, id_pasien, q }) {
    return {
        ...(status ? { status } : {}),
        ...(id_pasien ? { id_pasien } : {}),
        ...(q
            ? {
                  pasien: {
                      is: {
                          OR: [
                              { no_rm: { contains: q } },
                              { nama_pasien: { contains: q } },
                          ],
                      },
                  },
              }
            : {}),
    };
}

// FIFO: waktu masuk lalu id_antrean sebagai tie-breaker yang deterministik.
export function findQueues(where, { skip, take }) {
    return prisma.daftarTunggu.findMany({
        where,
        select: queueSelect,
        orderBy: [{ waktu_masuk: "asc" }, { id_antrean: "asc" }],
        skip,
        take,
    });
}

export function countQueues(where) {
    return prisma.daftarTunggu.count({ where });
}

export function findQueueById(id_antrean, client = prisma) {
    return client.daftarTunggu.findUnique({
        where: { id_antrean },
        select: queueSelect,
    });
}

export function findPasienForQueue(id_pasien) {
    return prisma.pasien.findUnique({
        where: { id_pasien },
        select: {
            id_pasien: true,
            no_rm: true,
            nama_pasien: true,
            kondisi_pasien: true,
            status_penanganan: true,
        },
    });
}

export function findActiveQueueByPatient(id_pasien, client = prisma) {
    return client.daftarTunggu.findFirst({
        where: { id_pasien, status: QUEUE_STATUS.MENUNGGU },
        select: { id_antrean: true },
    });
}

// no_antrean unik global; nilai maksimum memberi urutan nomor yang monoton.
export async function findNextQueueNumber(client = prisma) {
    const result = await client.daftarTunggu.aggregate({ _max: { no_antrean: true } });

    return (result._max.no_antrean ?? 0) + 1;
}

export function createQueue(data) {
    return prisma.daftarTunggu.create({ data, select: queueSelect });
}

// Conditional update: hanya antrean Menunggu yang boleh dibatalkan.
export function cancelQueue(id_antrean, client = prisma) {
    return client.daftarTunggu.updateMany({
        where: { id_antrean, status: QUEUE_STATUS.MENUNGGU },
        data: { status: QUEUE_STATUS.BATAL, updated_at: new Date() },
    });
}
