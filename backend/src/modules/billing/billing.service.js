import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { HttpError } from "../../shared/errors/http-error.js";
import {
    BILLING_AUDIT_TABLE,
    TAGIHAN_OPEN_STATUSES,
    TAGIHAN_STATUS,
    TAGIHAN_TRANSITIONS,
} from "../../shared/constants/billing.js";
import { HISTORY_STATUS } from "../../shared/constants/history.js";
import { createAuditLog } from "../../shared/utils/audit.js";
import {
    buildBillingWhere,
    countBillings,
    createBilling,
    createTarif,
    findActiveBillingByRekap,
    findBillingById,
    findBillings,
    findNextTagihanNumber,
    findRekapForBilling,
    findTariffsForCodes,
    lockRekapRow,
    replaceBillingDetails,
    updateBillingStatus,
} from "./billing.model.js";

const MAX_INVOICE_NUMBER_ATTEMPTS = 5;

function baseFields(row) {
    const { akun, rekap_tindakan, _count, detail_tagihan_list, ...rest } = row;

    return {
        ...rest,
        total_biaya: rest.total_biaya.toFixed(2),
        dibuat_oleh: akun?.nama_petugas ?? null,
        kode_rekap: rekap_tindakan?.kode_rekap ?? null,
        jumlah_item: _count?.detail_tagihan_list ?? 0,
    };
}

function toBillingItem(row) {
    return baseFields(row);
}

function toBillingDetail(row) {
    return {
        ...baseFields(row),
        detail_tagihan_list: row.detail_tagihan_list.map((detail) => ({
            ...detail,
            harga_satuan: detail.harga_satuan.toFixed(2),
            subtotal: detail.subtotal.toFixed(2),
        })),
    };
}

// Bandingkan tanggal tarif (DATE) dengan tanggal tindakan tanpa jam.
function dateOnly(value) {
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

// DECISION REQUIRED (BILL-D05/D06/D17): tarif dipilih dari tanggal tindakan,
// periode terbaru yang berlaku menang, dan status master tidak menyaring tarif historis.
function resolveTariff(tariffsByCode, detail) {
    const reference = dateOnly(detail.tanggal_tindakan);
    const candidates = (tariffsByCode.get(detail.kode_tindakan) ?? []).filter((tarif) => {
        const mulai = dateOnly(tarif.tanggal_berlaku);
        const selesai = tarif.tanggal_berakhir ? dateOnly(tarif.tanggal_berakhir) : null;

        return mulai <= reference && (selesai === null || selesai >= reference);
    });

    // findTariffsForCodes sudah mengurutkan tanggal_berlaku desc, id_tarif desc.
    return candidates[0] ?? null;
}

async function calculateRekap(rekap) {
    if (rekap.detail_rekap_tindakan_list.length === 0) {
        throw new HttpError(422, "BILLING_NO_DETAILS", "Rekap belum memiliki tindakan.");
    }

    const tariffs = await findTariffsForCodes([
        ...new Set(rekap.detail_rekap_tindakan_list.map((detail) => detail.kode_tindakan)),
    ]);

    const tariffsByCode = new Map();
    for (const tarif of tariffs) {
        const list = tariffsByCode.get(tarif.kode_tindakan) ?? [];
        list.push(tarif);
        tariffsByCode.set(tarif.kode_tindakan, list);
    }

    const missing = [];
    let total = new Prisma.Decimal(0);

    const items = rekap.detail_rekap_tindakan_list.map((detail) => {
        const tarif = resolveTariff(tariffsByCode, detail);

        if (!tarif) {
            missing.push({ kode_tindakan: detail.kode_tindakan, nama_tindakan: detail.nama_tindakan });
            return null;
        }

        const subtotal = tarif.harga.mul(detail.jumlah);
        total = total.add(subtotal);

        return {
            id_detail_rekap: detail.id_detail_rekap,
            kode_tindakan: detail.kode_tindakan,
            nama_tindakan: detail.nama_tindakan,
            tanggal_tindakan: detail.tanggal_tindakan,
            jumlah: detail.jumlah,
            id_tarif: tarif.id_tarif,
            harga_satuan: tarif.harga.toFixed(2),
            subtotal: subtotal.toFixed(2),
        };
    });

    if (missing.length > 0) {
        throw new HttpError(
            422,
            "TARIFF_NOT_FOUND",
            "Tarif tidak ditemukan untuk tanggal tindakan.",
            missing,
        );
    }

    return { items, total, total_biaya: total.toFixed(2) };
}

function ensureRekapReady(rekap) {
    if (!rekap) {
        throw new HttpError(404, "BILLING_REKAP_NOT_FOUND", "Rekap tidak ditemukan.");
    }

    if (rekap.status !== HISTORY_STATUS.SIAP_BILLING) {
        throw new HttpError(
            422,
            "BILLING_NOT_READY",
            "Hanya rekap Siap Billing yang dapat ditagihkan.",
        );
    }
}

export async function listBillings(query) {
    const where = buildBillingWhere(query);
    const { page, limit } = query;
    const [rows, total] = await Promise.all([
        findBillings(where, { skip: (page - 1) * limit, take: limit }),
        countBillings(where),
    ]);

    return {
        items: rows.map(toBillingItem),
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export async function addTariff(data) {
    try {
        const tarif = await createTarif(data);

        return { ...tarif, harga: tarif.harga.toFixed(2) };
    } catch (err) {
        // Unique (kode_tindakan, tanggal_berlaku): periode yang sama tidak boleh ganda.
        if (err.code === "P2002") {
            throw new HttpError(
                409,
                "TARIFF_CONFLICT",
                "Tarif untuk kode dan tanggal berlaku tersebut sudah ada.",
            );
        }
        throw err;
    }
}

export async function getBilling(id_tagihan) {
    const row = await findBillingById(id_tagihan);

    if (!row) {
        throw new HttpError(404, "BILLING_NOT_FOUND", "Tagihan tidak ditemukan.");
    }

    return toBillingDetail(row);
}

export async function previewBillingCost(id_rekap) {
    const rekap = await findRekapForBilling(id_rekap);
    ensureRekapReady(rekap);

    const calculation = await calculateRekap(rekap);

    return {
        id_rekap: rekap.id_rekap,
        kode_rekap: rekap.kode_rekap,
        status: rekap.status,
        pasien: rekap.pasien,
        acuan_tarif: "tanggal_tindakan",
        items: calculation.items,
        total_biaya: calculation.total_biaya,
    };
}

export async function createInvoice({ id_rekap, catatan }, id_akun) {
    // no_tagihan unik; request bersamaan bisa memperoleh nomor yang sama.
    // Nomor dihitung ulang di transaksi baru setiap kali unique constraint menolak.
    for (let attempt = 1; attempt <= MAX_INVOICE_NUMBER_ATTEMPTS; attempt += 1) {
        try {
            return await prisma.$transaction(async (tx) => {
                // Lock rekap lebih dulu agar dua request untuk rekap sama tidak lolos cek ganda.
                await lockRekapRow(tx, id_rekap);

                const rekap = await findRekapForBilling(id_rekap, tx);
                ensureRekapReady(rekap);

                const active = await findActiveBillingByRekap(id_rekap, tx);
                if (active) {
                    throw new HttpError(
                        409,
                        "BILLING_ALREADY_INVOICED",
                        `Rekap sudah memiliki tagihan aktif ${active.no_tagihan}.`,
                    );
                }

                const calculation = await calculateRekap(rekap);

                const created = await createBilling(
                    tx,
                    {
                        id_pasien: rekap.id_pasien,
                        id_rekap,
                        id_akun,
                        no_tagihan: await findNextTagihanNumber(tx),
                        total_biaya: calculation.total,
                        status: TAGIHAN_STATUS.DRAFT,
                        catatan_penyesuaian: catatan ?? null,
                        tanggal_dibuat: new Date(),
                    },
                    calculation.items.map((item) => ({
                        id_detail_rekap: item.id_detail_rekap,
                        id_tarif: item.id_tarif,
                        nama_tindakan: item.nama_tindakan,
                        jumlah: item.jumlah,
                        harga_satuan: new Prisma.Decimal(item.harga_satuan),
                        subtotal: new Prisma.Decimal(item.subtotal),
                    })),
                );

                await createAuditLog(tx, {
                    id_akun,
                    nama_tabel: BILLING_AUDIT_TABLE,
                    id_referensi: created.id_tagihan,
                    aksi: "CREATE",
                    data_sesudah: {
                        status: TAGIHAN_STATUS.DRAFT,
                        id_rekap,
                        total_biaya: calculation.total_biaya,
                        jumlah_item: calculation.items.length,
                    },
                });

                return toBillingDetail(await findBillingById(created.id_tagihan, tx));
            });
        } catch (err) {
            if (err.code !== "P2002") {
                throw err;
            }
            if (attempt === MAX_INVOICE_NUMBER_ATTEMPTS) {
                throw new HttpError(409, "BILLING_NUMBER_CONFLICT", "Nomor tagihan sedang dipakai, coba lagi.");
            }
        }
    }
}

export async function changeBillingStatus(id_tagihan, status_baru, id_akun) {
    const current = await findBillingById(id_tagihan);

    if (!current) {
        throw new HttpError(404, "BILLING_NOT_FOUND", "Tagihan tidak ditemukan.");
    }

    if (status_baru === TAGIHAN_STATUS.BATAL) {
        throw new HttpError(409, "BILLING_USE_CANCEL", "Gunakan endpoint cancel dengan alasan.");
    }

    if (!(TAGIHAN_TRANSITIONS[current.status] ?? []).includes(status_baru)) {
        throw new HttpError(
            409,
            "BILLING_STATUS_INVALID",
            `Status ${current.status} tidak dapat berubah menjadi ${status_baru}.`,
        );
    }

    return prisma.$transaction(async (tx) => {
        const updated = await updateBillingStatus(tx, id_tagihan, current.status, {
            status: status_baru,
            tanggal_diperbarui: new Date(),
        });

        if (updated.count === 0) {
            throw new HttpError(409, "BILLING_CONFLICT", "Tagihan sudah diubah petugas lain.");
        }

        await createAuditLog(tx, {
            id_akun,
            nama_tabel: BILLING_AUDIT_TABLE,
            id_referensi: id_tagihan,
            aksi: "STATUS_CHANGE",
            data_sebelum: { status: current.status },
            data_sesudah: { status: status_baru },
        });

        return toBillingDetail(await findBillingById(id_tagihan, tx));
    });
}

export async function recalculateBilling(id_tagihan, id_akun) {
    return prisma.$transaction(async (tx) => {
        const current = await findBillingById(id_tagihan, tx);

        if (!current) {
            throw new HttpError(404, "BILLING_NOT_FOUND", "Tagihan tidak ditemukan.");
        }

        if (current.status !== TAGIHAN_STATUS.DRAFT) {
            throw new HttpError(
                409,
                "BILLING_RECALC_NOT_ALLOWED",
                "Hanya tagihan Draft yang dapat dihitung ulang.",
            );
        }

        await lockRekapRow(tx, current.id_rekap);

        const rekap = await findRekapForBilling(current.id_rekap, tx);
        ensureRekapReady(rekap);

        const calculation = await calculateRekap(rekap);

        const updated = await updateBillingStatus(tx, id_tagihan, TAGIHAN_STATUS.DRAFT, {
            total_biaya: calculation.total,
            tanggal_diperbarui: new Date(),
        });

        if (updated.count === 0) {
            throw new HttpError(409, "BILLING_CONFLICT", "Tagihan sudah diubah petugas lain.");
        }

        await replaceBillingDetails(
            tx,
            id_tagihan,
            calculation.items.map((item) => ({
                id_detail_rekap: item.id_detail_rekap,
                id_tarif: item.id_tarif,
                nama_tindakan: item.nama_tindakan,
                jumlah: item.jumlah,
                harga_satuan: new Prisma.Decimal(item.harga_satuan),
                subtotal: new Prisma.Decimal(item.subtotal),
            })),
        );

        await createAuditLog(tx, {
            id_akun,
            nama_tabel: BILLING_AUDIT_TABLE,
            id_referensi: id_tagihan,
            aksi: "UPDATE",
            data_sebelum: { total_biaya: current.total_biaya.toFixed(2) },
            data_sesudah: { total_biaya: calculation.total_biaya },
        });

        return toBillingDetail(await findBillingById(id_tagihan, tx));
    });
}

export async function cancelBilling(id_tagihan, alasan, id_akun) {
    const current = await findBillingById(id_tagihan);

    if (!current) {
        throw new HttpError(404, "BILLING_NOT_FOUND", "Tagihan tidak ditemukan.");
    }

    if (!TAGIHAN_OPEN_STATUSES.includes(current.status)) {
        throw new HttpError(
            409,
            "BILLING_CANCEL_NOT_ALLOWED",
            `Tagihan berstatus ${current.status} tidak dapat dibatalkan.`,
        );
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.tagihan.updateMany({
            where: { id_tagihan, status: current.status },
            data: {
                status: TAGIHAN_STATUS.BATAL,
                alasan_pembatalan: alasan,
                tanggal_dibatalkan: new Date(),
                tanggal_diperbarui: new Date(),
            },
        });

        if (updated.count === 0) {
            throw new HttpError(409, "BILLING_CONFLICT", "Tagihan sudah diubah petugas lain.");
        }

        await createAuditLog(tx, {
            id_akun,
            nama_tabel: BILLING_AUDIT_TABLE,
            id_referensi: id_tagihan,
            aksi: "CANCEL",
            data_sebelum: { status: current.status },
            data_sesudah: { status: TAGIHAN_STATUS.BATAL, alasan },
        });

        return toBillingDetail(await findBillingById(id_tagihan, tx));
    });
}
