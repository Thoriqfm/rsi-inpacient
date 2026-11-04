import prisma from "../../config/prisma.js";

// Read-only: hanya SELECT. Monitoring tidak memiliki model/tabel status sendiri.
const latestQueueSelect = {
    select: {
        id_antrean: true,
        no_antrean: true,
        waktu_masuk: true,
        status: true,
        akun: { select: { nama_petugas: true } },
        rekam_alokasi: {
            select: {
                id_alokasi: true,
                status_alokasi: true,
                waktu_alokasi: true,
                bed: { select: { no_bed: true, nama_bangsal: true, kelas_perawatan: true } },
            },
        },
    },
    orderBy: [{ waktu_masuk: "desc" }, { id_antrean: "desc" }],
    take: 1,
};

const latestReferralSelect = {
    select: {
        id_surat: true,
        no_rujukan: true,
        tanggal_rujukan: true,
        alasan_rujukan: true,
        status: true,
        akun: { select: { nama_petugas: true } },
        rumah_sakit_rujukan: {
            select: {
                id_rs: true,
                nama_rs: true,
                alamat: true,
                kontak: true,
                status_ketersediaan: true,
                terakhir_diperbarui: true,
            },
        },
    },
    orderBy: [{ tanggal_rujukan: "desc" }, { id_surat: "desc" }],
    take: 1,
};

const monitoringSelect = {
    id_pasien: true,
    no_rm: true,
    nama_pasien: true,
    kondisi_pasien: true,
    status_penanganan: true,
    tanggal_masuk: true,
    tanggal_keluar: true,
    daftar_tunggu_list: latestQueueSelect,
    surat_rujukan_list: latestReferralSelect,
};

// Cakupan default: pasien yang pernah masuk antrean atau pernah dirujuk (DECISION REQUIRED).
const involvedFilter = {
    OR: [{ daftar_tunggu_list: { some: {} } }, { surat_rujukan_list: { some: {} } }],
};

export function buildMonitoringWhere({ q, status_antrean, status_rujukan, waktuFilter }) {
    // Satu objek `some` agar filter status dan rentang waktu tidak saling menimpa.
    const queueSome = {
        ...(status_antrean ? { status: status_antrean } : {}),
        ...(waktuFilter ? { waktu_masuk: waktuFilter } : {}),
    };

    return {
        AND: [
            involvedFilter,
            ...(q ? [{ OR: [{ no_rm: { contains: q } }, { nama_pasien: { contains: q } }] }] : []),
            ...(Object.keys(queueSome).length > 0 ? [{ daftar_tunggu_list: { some: queueSome } }] : []),
            ...(status_rujukan ? [{ surat_rujukan_list: { some: { status: status_rujukan } } }] : []),
        ],
    };
}

export function findMonitoringRows(where, { skip, take }) {
    return prisma.pasien.findMany({
        where,
        select: monitoringSelect,
        orderBy: { id_pasien: "desc" },
        skip,
        take,
    });
}

export function countMonitoringRows(where) {
    return prisma.pasien.count({ where });
}
