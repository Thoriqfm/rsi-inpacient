import prisma from "../../config/prisma.js";
import { AUDIT_TABLE } from "../../shared/constants/referral.js";

export const hospitalSelect = {
    id_rs: true,
    nama_rs: true,
    alamat: true,
    kontak: true,
    status_ketersediaan: true,
    terakhir_diperbarui: true,
    created_at: true,
    updated_at: true,
};

export function buildHospitalWhere({ status_ketersediaan, q }) {
    return {
        ...(status_ketersediaan ? { status_ketersediaan } : {}),
        ...(q
            ? {
                  OR: [
                      { nama_rs: { contains: q } },
                      { alamat: { contains: q } },
                  ],
              }
            : {}),
    };
}

export function findHospitals(where, { skip, take }) {
    return prisma.rumahSakitRujukan.findMany({
        where,
        select: hospitalSelect,
        orderBy: { nama_rs: "asc" },
        skip,
        take,
    });
}

export function countHospitals(where) {
    return prisma.rumahSakitRujukan.count({ where });
}

export function findHospitalById(id_rs, client = prisma) {
    return client.rumahSakitRujukan.findUnique({
        where: { id_rs },
        select: hospitalSelect,
    });
}

export function updateHospitalAvailability(id_rs, status_ketersediaan, client = prisma) {
    const now = new Date();

    // Terakhir diperbarui hanya berubah lewat endpoint ketersediaan, bukan edit master.
    return client.rumahSakitRujukan.update({
        where: { id_rs },
        data: { status_ketersediaan, terakhir_diperbarui: now, updated_at: now },
        select: hospitalSelect,
    });
}

// Aktor pembaruan terakhir diambil dari log_audit, bukan kolom baru di tabel RS.
export async function findLastHospitalUpdates(id_rs_list) {
    if (id_rs_list.length === 0) {
        return [];
    }

    return prisma.logAudit.findMany({
        where: { nama_tabel: AUDIT_TABLE.HOSPITAL, id_referensi: { in: id_rs_list } },
        select: {
            id_referensi: true,
            waktu_aksi: true,
            akun: { select: { nama_petugas: true } },
        },
        orderBy: [{ waktu_aksi: "desc" }, { id_log: "desc" }],
    });
}
