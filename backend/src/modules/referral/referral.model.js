import prisma from "../../config/prisma.js";
import { AUDIT_TABLE } from "../../shared/constants/referral.js";
import { containsInsensitive } from "../../shared/utils/prisma-search.js";

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
                      { no_rujukan: containsInsensitive(q) },
                      { pasien: { is: { OR: [{ no_rm: containsInsensitive(q) }, { nama_pasien: containsInsensitive(q) }] } } },
                      { rumah_sakit_rujukan: { is: { nama_rs: containsInsensitive(q) } } },
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

export function findPasienForReferral(id_pasien, client = prisma) {
    return client.pasien.findUnique({
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

export function lockPasienForReferral(client, id_pasien) {
    return client.$queryRaw`SELECT id_pasien FROM pasien WHERE id_pasien = ${id_pasien} FOR UPDATE`;
}

export function findActiveAllocationForReferral(id_pasien, client = prisma) {
    return client.rekamAlokasi.findFirst({
        where: { id_pasien, status_alokasi: "Aktif" },
        select: { id_alokasi: true },
    });
}

export function findActiveReferralByPatient(id_pasien, client = prisma) {
    return client.suratRujukan.findFirst({
        where: { id_pasien, status: { not: "Batal" } },
        select: { id_surat: true, no_rujukan: true, status: true },
    });
}

export function updatePasienStatusForReferral(client, id_pasien, status_penanganan) {
    return client.pasien.update({
        where: { id_pasien },
        data: { status_penanganan, updated_at: new Date() },
    });
}

export function createRiwayatStatusForReferral(
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
