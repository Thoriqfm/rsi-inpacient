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
import { countRoomNights, jakartaDate } from "../../shared/utils/room-billing.js";
import { resolveRecapAllocation } from "../../shared/utils/recap-allocation.js";
import { createAuditLog, parseAuditData } from "../../shared/utils/audit.js";
import {
    buildBillingWhere,
    countBillings,
    createBilling,
    createTarif,
    findActiveBillingByRekap,
    findAllTariffs,
    findBillingAuditTrail,
    findBillingById,
    findBillings,
    findNextTagihanNumber,
    findRekapForBilling,
    findTariffsForCodes,
    lockRekapRow,
    lockRoomClass,
    lockRoomAllocations,
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

function toBillingDetail(row, auditTrail = null) {
    return {
        ...baseFields(row),
        detail_tagihan_list: row.detail_tagihan_list.map((detail) => ({
            ...detail,
            harga_satuan: detail.harga_satuan.toFixed(2),
            subtotal: detail.subtotal.toFixed(2),
        })),
        ...(auditTrail ? { audit_trail: auditTrail } : {}),
    };
}

// Bandingkan tanggal tarif (DATE) dengan tanggal tindakan tanpa jam.
function dateOnly(value) {
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

// PC-17: tarif dipilih dari tanggal tindakan, status = "Aktif", dan periode terbaru yang berlaku menang.
function resolveTariff(tariffsByCode, detail) {
    const reference = dateOnly(detail.tanggal_tindakan);
    const candidates = (tariffsByCode.get(detail.kode_tindakan) ?? []).filter((tarif) => {
        if (tarif.status !== "Aktif") {
            return false;
        }
        const mulai = dateOnly(tarif.tanggal_berlaku);
        const selesai = tarif.tanggal_berakhir ? dateOnly(tarif.tanggal_berakhir) : null;

        return mulai <= reference && (selesai === null || selesai >= reference);
    });

    // findTariffsForCodes sudah mengurutkan tanggal_berlaku desc, id_tarif desc.
    return candidates[0] ?? null;
}

async function calculateRekap(rekap, client = prisma, allocationIds = [], { preview = false, invoiceId = null } = {}) {
    if (rekap.detail_rekap_tindakan_list.length === 0 && allocationIds.length === 0) {
        throw new HttpError(422, "BILLING_NO_DETAILS", "Rekap belum memiliki tindakan.");
    }

    const tariffs = await findTariffsForCodes(
        [...new Set(rekap.detail_rekap_tindakan_list.map((detail) => detail.kode_tindakan))],
        client,
    );

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
            jenis_item: "TINDAKAN",
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

    const waktuEstimasi = new Date(Math.floor(Date.now() / 1000) * 1000);
    const allocations = allocationIds.length ? await client.rekamAlokasi.findMany({
        where: { id_alokasi: { in: allocationIds } }, orderBy: { id_alokasi: "asc" },
    }) : [];
    if (allocations.length !== allocationIds.length) {
        throw new HttpError(422, "ROOM_ALLOCATION_INVALID", "Alokasi kamar tidak ditemukan.");
    }
    let roomError = null;
    for (const allocation of allocations) {
        if (allocation.id_pasien !== rekap.id_pasien || !["Aktif", "Selesai"].includes(allocation.status_alokasi)) {
            throw new HttpError(422, "ROOM_ALLOCATION_INVALID", "Alokasi harus milik pasien yang sama dan tidak dibatalkan.");
        }
        if (allocation.id_tagihan_kamar !== null && allocation.id_tagihan_kamar !== invoiceId) {
            throw new HttpError(409, "ROOM_ALREADY_BILLED", "Alokasi kamar sudah tercantum pada tagihan lain.");
        }
        if (!allocation.id_tarif_kamar || !allocation.kelas_perawatan_snapshot || !allocation.harga_per_malam_snapshot) {
            if (preview) {
                roomError = { code: "ROOM_SNAPSHOT_MISSING", message: "Tarif alokasi lama belum lengkap. Super Admin perlu merekonsiliasi tarif sebelum biaya kamar dihitung." };
                continue;
            }
            throw new HttpError(422, "ROOM_SNAPSHOT_MISSING", "Alokasi lama belum memiliki snapshot tarif. Perlu rekonsiliasi Backend Lead.");
        }
        const estimasi = allocation.status_alokasi === "Aktif";
        if (estimasi && !preview) {
            throw new HttpError(409, "ROOM_ALLOCATION_ACTIVE", "Selesaikan alokasi sebelum membuat tagihan biaya kamar.");
        }
        const end = estimasi ? waktuEstimasi : allocation.waktu_selesai;
        const jumlah = countRoomNights(allocation.waktu_alokasi, end);
        const subtotal = allocation.harga_per_malam_snapshot.mul(jumlah);
        total = total.add(subtotal);
        items.push({
            jenis_item: "KAMAR", id_detail_rekap: null, id_tarif: null,
            id_alokasi: allocation.id_alokasi, id_tarif_kamar: allocation.id_tarif_kamar,
            kelas_perawatan_snapshot: allocation.kelas_perawatan_snapshot,
            nama_tindakan: `Akomodasi ${allocation.kelas_perawatan_snapshot}`,
            waktu_mulai: allocation.waktu_alokasi, waktu_selesai: end,
            estimasi, jumlah, harga_satuan: allocation.harga_per_malam_snapshot.toFixed(2),
            subtotal: subtotal.toFixed(2),
        });
    }
    return { items, total, total_biaya: total.toFixed(2), waktu_estimasi: waktuEstimasi, room_error: roomError };
}

function roomSource(allocation) {
    if (!allocation) return null;
    return { id_alokasi: allocation.id_alokasi, waktu_alokasi: allocation.waktu_alokasi,
        waktu_selesai: allocation.waktu_selesai, status_alokasi: allocation.status_alokasi,
        kelas_perawatan_snapshot: allocation.kelas_perawatan_snapshot,
        harga_per_malam_snapshot: allocation.harga_per_malam_snapshot?.toFixed(2) ?? null,
        id_tagihan_kamar: allocation.id_tagihan_kamar, bed: allocation.bed };
}

function validateLegacyRoomSelection(requested, automatic) {
    if (requested !== undefined && (requested.length !== automatic.length || requested.some((id) => !automatic.includes(id)))) {
        throw new HttpError(400, "ROOM_ALLOCATION_AUTOMATIC", "Kamar ditentukan otomatis dari alokasi pada rekap, bukan dipilih melalui payload billing.");
    }
}

function invoiceDetails(items) {
    return items.map(({ kode_tindakan, tanggal_tindakan, estimasi, ...item }) => ({
        ...item, harga_satuan: new Prisma.Decimal(item.harga_satuan), subtotal: new Prisma.Decimal(item.subtotal),
    }));
}

export async function listRoomTariffs() {
    const rows = await prisma.tarifKamar.findMany({ orderBy: [{ kelas_perawatan: "asc" }, { tanggal_berlaku: "desc" }] });
    return rows.map((row) => ({ ...row, harga_per_malam: row.harga_per_malam.toFixed(2) }));
}

export async function addRoomTariff({ id_tarif_sebelumnya, ...data }, id_akun) {
    try {
        return await prisma.$transaction(async (tx) => {
            await lockRoomClass(tx, data.kelas_perawatan);
            if (id_tarif_sebelumnya) {
                const previous = await tx.tarifKamar.findUnique({ where: { id_tarif_kamar: id_tarif_sebelumnya } });
                if (!previous || previous.kelas_perawatan !== data.kelas_perawatan || previous.tanggal_berakhir ||
                    previous.tanggal_berlaku >= data.tanggal_berlaku || data.tanggal_berlaku < jakartaDate(new Date())) {
                    throw new HttpError(409, "ROOM_TARIFF_CONFLICT", "Tarif sebelumnya harus satu kelas, masih terbuka, dan berakhir mulai hari ini atau setelahnya.");
                }
                await tx.tarifKamar.update({ where: { id_tarif_kamar: id_tarif_sebelumnya },
                    data: { tanggal_berakhir: data.tanggal_berlaku, updated_at: new Date() } });
            }
            const overlap = await tx.tarifKamar.findFirst({ where: {
                kelas_perawatan: data.kelas_perawatan,
                ...(data.tanggal_berakhir ? { tanggal_berlaku: { lt: data.tanggal_berakhir } } : {}),
                OR: [{ tanggal_berakhir: null }, { tanggal_berakhir: { gt: data.tanggal_berlaku } }],
            } });
            if (overlap) throw new HttpError(409, "ROOM_TARIFF_CONFLICT", "Periode tarif kamar untuk kelas ini bertumpang tindih.");
            const row = await tx.tarifKamar.create({ data });
            await createAuditLog(tx, { id_akun, nama_tabel: "tarif_kamar", id_referensi: row.id_tarif_kamar,
                aksi: "CREATE", data_sesudah: { ...data, id_tarif_sebelumnya: id_tarif_sebelumnya ?? null } });
            return { ...row, harga_per_malam: row.harga_per_malam.toFixed(2) };
        });
    } catch (err) {
        if (err.code === "P2002") throw new HttpError(409, "ROOM_TARIFF_CONFLICT", "Tarif kelas pada tanggal tersebut sudah ada.");
        throw err;
    }
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

export async function listTariffs() {
    const rows = await findAllTariffs();
    return rows.map((row) => ({
        ...row,
        harga: row.harga.toFixed(2),
    }));
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

    const logs = await findBillingAuditTrail(id_tagihan);
    const auditTrail = logs.map((log) => ({
        id_log: log.id_log,
        aksi: log.aksi,
        data_sebelum: parseAuditData(log.data_sebelum),
        data_sesudah: parseAuditData(log.data_sesudah),
        waktu_aksi: log.waktu_aksi,
        nama_petugas: log.akun?.nama_petugas ?? null,
    }));

    return toBillingDetail(row, auditTrail);
}

export async function previewBillingCost(id_rekap, requestedIds) {
    const rekap = await findRekapForBilling(id_rekap);
    ensureRekapReady(rekap);

    // Existing invoices are shown from their stored source and amounts, including
    // old action-only invoices. Never attach room charges to them retroactively.
    const active = await findActiveBillingByRekap(id_rekap);
    if (active) {
        const invoice = toBillingDetail(await findBillingById(active.id_tagihan));
        const ids = invoice.detail_tagihan_list.filter((item) => item.jenis_item === "KAMAR").map((item) => item.id_alokasi);
        validateLegacyRoomSelection(requestedIds, ids);
        const allocation = ids.length === 1 ? await prisma.rekamAlokasi.findUnique({ where: { id_alokasi: ids[0] }, include: { bed: { select: { no_bed: true } } } }) : null;
        return { id_rekap, kode_rekap: rekap.kode_rekap, status: rekap.status, pasien: rekap.pasien,
            acuan_tarif: "snapshot_invoice", items: invoice.detail_tagihan_list, total_biaya: invoice.total_biaya,
            alokasi: roomSource(allocation), room_error: null };
    }
    const allocation = await resolveRecapAllocation(rekap, prisma);
    const allocationIds = allocation ? [allocation.id_alokasi] : [];
    validateLegacyRoomSelection(requestedIds, allocationIds);
    const calculation = await calculateRekap(rekap, prisma, allocationIds, { preview: true });

    return {
        id_rekap: rekap.id_rekap,
        kode_rekap: rekap.kode_rekap,
        status: rekap.status,
        pasien: rekap.pasien,
        acuan_tarif: "tanggal_tindakan",
        items: calculation.items,
        total_biaya: calculation.total_biaya,
        waktu_estimasi: calculation.waktu_estimasi,
        alokasi: roomSource(allocation),
        room_error: calculation.room_error,
    };
}

export async function createInvoice({ id_rekap, catatan, id_alokasi_list: requestedIds }, id_akun) {
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

                const allocation = await resolveRecapAllocation(rekap, tx);
                const id_alokasi_list = allocation ? [allocation.id_alokasi] : [];
                validateLegacyRoomSelection(requestedIds, id_alokasi_list);
                await lockRoomAllocations(tx, id_alokasi_list);
                const calculation = await calculateRekap(rekap, tx, id_alokasi_list);

                if (allocation && rekap.id_alokasi === null) {
                    await tx.rekapTindakan.update({ where: { id_rekap }, data: { id_alokasi: allocation.id_alokasi } });
                }

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
                    invoiceDetails(calculation.items),
                );

                if (id_alokasi_list.length) {
                    const claimed = await tx.rekamAlokasi.updateMany({
                        where: { id_alokasi: { in: id_alokasi_list }, id_tagihan_kamar: null },
                        data: { id_tagihan_kamar: created.id_tagihan },
                    });
                    if (claimed.count !== id_alokasi_list.length) {
                        throw new HttpError(409, "ROOM_ALREADY_BILLED", "Alokasi kamar sudah ditagihkan petugas lain.");
                    }
                }

                await createAuditLog(tx, {
                    id_akun,
                    nama_tabel: BILLING_AUDIT_TABLE,
                    id_referensi: created.id_tagihan,
                    aksi: "CREATE",
                    data_sesudah: {
                        status: TAGIHAN_STATUS.DRAFT,
                        id_rekap,
                        total_biaya: calculation.total_biaya,
                        id_alokasi: allocation?.id_alokasi ?? null,
                        jumlah_item: calculation.items.length,
                    },
                });

                return toBillingDetail(await findBillingById(created.id_tagihan, tx));
            }, { isolationLevel: "ReadCommitted" });
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

export async function recalculateBilling(id_tagihan, payload = {}, id_akun) {
    // Kompatibilitas pemanggilan lama recalculateBilling(id_tagihan, id_akun)
    if (typeof payload === "number") {
        id_akun = payload;
        payload = {};
    }

    return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id_tagihan FROM tagihan WHERE id_tagihan = ${id_tagihan} FOR UPDATE`;
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

        const ids = current.detail_tagihan_list.filter((item) => item.jenis_item === "KAMAR").map((item) => item.id_alokasi);
        await lockRoomAllocations(tx, ids);
        const calculation = await calculateRekap(rekap, tx, ids, { invoiceId: id_tagihan });
        const hasCatatanUpdate = payload && payload.catatan_penyesuaian !== undefined;
        const nextCatatan = hasCatatanUpdate
            ? payload.catatan_penyesuaian
            : current.catatan_penyesuaian;

        const updated = await updateBillingStatus(tx, id_tagihan, TAGIHAN_STATUS.DRAFT, {
            total_biaya: calculation.total,
            ...(hasCatatanUpdate ? { catatan_penyesuaian: payload.catatan_penyesuaian } : {}),
            tanggal_diperbarui: new Date(),
        });

        if (updated.count === 0) {
            throw new HttpError(409, "BILLING_CONFLICT", "Tagihan sudah diubah petugas lain.");
        }

        await replaceBillingDetails(
            tx,
            id_tagihan,
            invoiceDetails(calculation.items),
        );

        await createAuditLog(tx, {
            id_akun,
            nama_tabel: BILLING_AUDIT_TABLE,
            id_referensi: id_tagihan,
            aksi: "UPDATE",
            data_sebelum: {
                total_biaya: current.total_biaya.toFixed(2),
                catatan_penyesuaian: current.catatan_penyesuaian,
            },
            data_sesudah: {
                total_biaya: calculation.total_biaya,
                catatan_penyesuaian: nextCatatan,
            },
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

        await lockRoomAllocations(tx, current.detail_tagihan_list.filter((item) => item.jenis_item === "KAMAR").map((item) => item.id_alokasi));
        await tx.rekamAlokasi.updateMany({ where: { id_tagihan_kamar: id_tagihan }, data: { id_tagihan_kamar: null } });

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
