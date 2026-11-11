import prisma from "../../config/prisma.js";

export const historyListSelect = {
    id_rekap: true,
    kode_rekap: true,
    id_pasien: true,
    status: true,
    catatan: true,
    keterangan: true,
    tanggal_dibuat: true,
    tanggal_diperbarui: true,
    deleted_at: true,
    pasien: { select: { no_rm: true, nama_pasien: true } },
    akun: { select: { nama_petugas: true } },
    _count: { select: { detail_rekap_tindakan_list: true } },
};

export const historyDetailSelect = {
    ...historyListSelect,
    detail_rekap_tindakan_list: {
        select: {
            id_detail_rekap: true,
            id_riwayat: true,
            kode_tindakan: true,
            nama_tindakan: true,
            tanggal_tindakan: true,
            jumlah: true,
        },
        orderBy: [{ tanggal_tindakan: "asc" }, { id_detail_rekap: "asc" }],
    },
    tagihan_list: {
        select: { id_tagihan: true, no_tagihan: true, status: true },
    },
};

export function buildHistoryWhere({ status, id_pasien, q }) {
    return {
        deleted_at: null,
        ...(status ? { status } : {}),
        ...(id_pasien ? { id_pasien } : {}),
        ...(q
            ? {
                  OR: [
                      { kode_rekap: { contains: q } },
                      {
                          pasien: {
                              is: {
                                  OR: [
                                      { no_rm: { contains: q } },
                                      { nama_pasien: { contains: q } },
                                  ],
                              },
                          },
                      },
                  ],
              }
            : {}),
    };
}

export function findHistories(where, { skip, take }) {
    return prisma.rekapTindakan.findMany({
        where,
        select: historyListSelect,
        orderBy: [{ tanggal_dibuat: "desc" }, { id_rekap: "desc" }],
        skip,
        take,
    });
}

export function countHistories(where) {
    return prisma.rekapTindakan.count({ where });
}

export function findHistoryById(id_rekap, client = prisma) {
    return client.rekapTindakan.findFirst({
        where: { id_rekap, deleted_at: null },
        select: historyDetailSelect,
    });
}

export function findPasienForHistory(id_pasien) {
    return prisma.pasien.findUnique({
        where: { id_pasien },
        select: { id_pasien: true, no_rm: true, nama_pasien: true },
    });
}

export function findRmeByPatient(id_pasien, id_riwayat_list) {
    return prisma.rmeDummy.findMany({
        where: {
            id_pasien,
            ...(id_riwayat_list ? { id_riwayat: { in: id_riwayat_list } } : {}),
        },
        orderBy: [{ tanggal_tindakan: "asc" }, { id_riwayat: "asc" }],
    });
}

// kode_rekap unik dan berurutan per hari, mis. RKP-20261104-001.
export async function findNextRekapCode(client = prisma) {
    const now = new Date();
    const prefix = `RKP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
        now.getDate(),
    ).padStart(2, "0")}`;

    const last = await client.rekapTindakan.findFirst({
        where: { kode_rekap: { startsWith: `${prefix}-` } },
        orderBy: { kode_rekap: "desc" },
        select: { kode_rekap: true },
    });

    const lastSequence = Number(last?.kode_rekap.split("-").pop());
    const nextSequence = Number.isInteger(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}-${String(nextSequence).padStart(3, "0")}`;
}

export function createHistoryRecap(client, data, details) {
    return client.rekapTindakan.create({
        data: {
            ...data,
            detail_rekap_tindakan_list: { create: details },
        },
        select: { id_rekap: true },
    });
}

// status pada where membuat perubahan bersamaan kalah secara deterministik.
export function updateHistoryRecap(client, id_rekap, status_sebelumnya, data) {
    return client.rekapTindakan.updateMany({
        where: { id_rekap, status: status_sebelumnya, deleted_at: null },
        data,
    });
}

export function softDeleteHistoryRecap(client, id_rekap, deleted_at) {
    return client.rekapTindakan.updateMany({
        where: { id_rekap, deleted_at: null },
        data: { deleted_at },
    });
}

export function lockHistoryRow(client, id_rekap) {
    return client.$queryRaw`SELECT id_rekap FROM rekap_tindakan WHERE id_rekap = ${id_rekap} FOR UPDATE`;
}

export function findLatestHistoryUpdateActor(id_rekap, client = prisma) {
    return client.logAudit.findFirst({
        where: {
            nama_tabel: "rekap_tindakan",
            id_referensi: id_rekap,
            aksi: { in: ["UPDATE", "STATUS_CHANGE"] },
        },
        select: {
            waktu_aksi: true,
            akun: { select: { nama_petugas: true } },
        },
        orderBy: [{ waktu_aksi: "desc" }, { id_log: "desc" }],
    });
}

export function searchPatientsForHistory(q) {
    return prisma.pasien.findMany({
        where: {
            OR: [{ no_rm: { contains: q } }, { nama_pasien: { contains: q } }],
        },
        select: {
            id_pasien: true,
            no_rm: true,
            nama_pasien: true,
            jenis_kelamin: true,
            tanggal_lahir: true,
            tanggal_masuk: true,
            status_penanganan: true,
            _count: {
                select: {
                    rme_dummy_list: true,
                    rekap_tindakan_list: { where: { deleted_at: null } },
                },
            },
        },
        orderBy: [{ nama_pasien: "asc" }, { id_pasien: "asc" }],
        take: 20,
    });
}
