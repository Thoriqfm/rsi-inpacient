import prisma from "../../config/prisma.js";

const billingListSelect = {
    id_tagihan: true,
    id_pasien: true,
    id_rekap: true,
    no_tagihan: true,
    total_biaya: true,
    status: true,
    catatan_penyesuaian: true,
    alasan_pembatalan: true,
    tanggal_dibuat: true,
    tanggal_diperbarui: true,
    tanggal_dibatalkan: true,
    pasien: { select: { no_rm: true, nama_pasien: true } },
    akun: { select: { nama_petugas: true } },
    rekap_tindakan: { select: { kode_rekap: true } },
    _count: { select: { detail_tagihan_list: true } },
};

export const billingDetailSelect = {
    ...billingListSelect,
    detail_tagihan_list: {
        select: {
            id_detail_tagihan: true,
            id_detail_rekap: true,
            id_tarif: true,
            nama_tindakan: true,
            jumlah: true,
            harga_satuan: true,
            subtotal: true,
        },
        orderBy: { id_detail_tagihan: "asc" },
    },
};

export function buildBillingWhere({ status, id_pasien, q }) {
    return {
        ...(status ? { status } : {}),
        ...(id_pasien ? { id_pasien } : {}),
        ...(q
            ? {
                  OR: [
                      { no_tagihan: { contains: q } },
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

export function findBillings(where, { skip, take }) {
    return prisma.tagihan.findMany({
        where,
        select: billingListSelect,
        orderBy: [{ tanggal_dibuat: "desc" }, { id_tagihan: "desc" }],
        skip,
        take,
    });
}

export function countBillings(where) {
    return prisma.tagihan.count({ where });
}

export function findBillingById(id_tagihan, client = prisma) {
    return client.tagihan.findUnique({
        where: { id_tagihan },
        select: billingDetailSelect,
    });
}

// Satu rekap hanya boleh punya satu tagihan non-Batal (BILL-D07).
export function findActiveBillingByRekap(id_rekap, client = prisma) {
    return client.tagihan.findFirst({
        where: { id_rekap, status: { not: "Batal" } },
        select: { id_tagihan: true, no_tagihan: true, status: true },
    });
}

export function findRekapForBilling(id_rekap, client = prisma) {
    return client.rekapTindakan.findFirst({
        where: { id_rekap, deleted_at: null },
        select: {
            id_rekap: true,
            kode_rekap: true,
            id_pasien: true,
            status: true,
            pasien: { select: { no_rm: true, nama_pasien: true } },
            detail_rekap_tindakan_list: {
                select: {
                    id_detail_rekap: true,
                    kode_tindakan: true,
                    nama_tindakan: true,
                    tanggal_tindakan: true,
                    jumlah: true,
                },
                orderBy: [{ tanggal_tindakan: "asc" }, { id_detail_rekap: "asc" }],
            },
        },
    });
}

// Kunci baris rekap agar create/recalculate untuk rekap yang sama antre, bukan balapan.
export function lockRekapRow(client, id_rekap) {
    return client.$queryRaw`SELECT id_rekap FROM rekap_tindakan WHERE id_rekap = ${id_rekap} FOR UPDATE`;
}

export function findTariffsForCodes(kode_tindakan_list) {
    return prisma.tarif.findMany({
        where: { kode_tindakan: { in: kode_tindakan_list } },
        select: {
            id_tarif: true,
            kode_tindakan: true,
            harga: true,
            tanggal_berlaku: true,
            tanggal_berakhir: true,
            status: true,
        },
        orderBy: [{ tanggal_berlaku: "desc" }, { id_tarif: "desc" }],
    });
}

export async function findNextTagihanNumber(client = prisma) {
    const now = new Date();
    const prefix = `TGH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
        now.getDate(),
    ).padStart(2, "0")}`;

    const last = await client.tagihan.findFirst({
        where: { no_tagihan: { startsWith: `${prefix}-` } },
        orderBy: { no_tagihan: "desc" },
        select: { no_tagihan: true },
    });

    const lastSequence = Number(last?.no_tagihan.split("-").pop());
    const nextSequence = Number.isInteger(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}-${String(nextSequence).padStart(3, "0")}`;
}

export function createBilling(client, data, details) {
    return client.tagihan.create({
        data: {
            ...data,
            detail_tagihan_list: { create: details },
        },
        select: { id_tagihan: true },
    });
}

export function updateBillingStatus(client, id_tagihan, status_sebelumnya, data) {
    return client.tagihan.updateMany({
        where: { id_tagihan, status: status_sebelumnya },
        data,
    });
}

export async function replaceBillingDetails(client, id_tagihan, details) {
    await client.detailTagihan.deleteMany({ where: { id_tagihan } });

    return client.detailTagihan.createMany({
        data: details.map((detail) => ({ ...detail, id_tagihan })),
    });
}
