import prisma from "../../config/prisma.js";
import { AUDIT_TABLE } from "../../shared/constants/referral.js";

export const referralSelect = {
    id_surat: true,
    no_rujukan: true,
    id_pasien: true,
    id_rs: true,
    id_akun: true,
    tanggal_rujukan: true,
    alasan_rujukan: true,
    status: true,
    created_at: true,
    updated_at: true,
    pasien: {
        select: { no_rm: true, nama_pasien: true, kondisi_pasien: true, status_penanganan: true },
    },
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
    akun: { select: { nama_petugas: true } },
};

export function buildReferralWhere({ status, id_pasien, id_rs, q }) {
    return {
        ...(status ? { status } : {}),
        ...(id_pasien ? { id_pasien } : {}),
        ...(id_rs ? { id_rs } : {}),
        ...(q
            ? {
                  OR: [
                      { no_rujukan: { contains: q } },
                      { pasien: { is: { OR: [{ no_rm: { contains: q } }, { nama_pasien: { contains: q } }] } } },
                      { rumah_sakit_rujukan: { is: { nama_rs: { contains: q } } } },
                  ],
              }
            : {}),
    };
}

export function findReferrals(where, { skip, take }) {
    return prisma.suratRujukan.findMany({
        where,
        select: referralSelect,
        orderBy: [{ tanggal_rujukan: "desc" }, { id_surat: "desc" }],
        skip,
        take,
    });
}

export function countReferrals(where) {
    return prisma.suratRujukan.count({ where });
}

export function findReferralById(id_surat, client = prisma) {
    return client.suratRujukan.findUnique({
        where: { id_surat },
        select: referralSelect,
    });
}

export function findPasienForReferral(id_pasien) {
    return prisma.pasien.findUnique({
        where: { id_pasien },
        select: { id_pasien: true, no_rm: true, nama_pasien: true },
    });
}

// Format RUJ-YYYYMMDD-NNN; urutan nomor per hari.
export async function findNextReferralNumber(client = prisma) {
    const now = new Date();
    const prefix = `RUJ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
        now.getDate(),
    ).padStart(2, "0")}-`;

    const last = await client.suratRujukan.findFirst({
        where: { no_rujukan: { startsWith: prefix } },
        orderBy: { no_rujukan: "desc" },
        select: { no_rujukan: true },
    });

    const next = last ? Number(last.no_rujukan.slice(prefix.length)) + 1 : 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
}

export function createReferral(client, data) {
    return client.suratRujukan.create({ data, select: referralSelect });
}

// Conditional update: hanya transisi dari status yang dibaca service yang boleh menang.
export function updateReferralStatus(client, id_surat, status_lama, status_baru) {
    return client.suratRujukan.updateMany({
        where: { id_surat, status: status_lama },
        data: { status: status_baru, updated_at: new Date() },
    });
}

export function findReferralHistory(id_surat) {
    return prisma.logAudit.findMany({
        where: { nama_tabel: AUDIT_TABLE.REFERRAL, id_referensi: id_surat },
        select: {
            id_log: true,
            aksi: true,
            data_sebelum: true,
            data_sesudah: true,
            waktu_aksi: true,
            akun: { select: { nama_petugas: true } },
        },
        orderBy: [{ waktu_aksi: "asc" }, { id_log: "asc" }],
    });
}
