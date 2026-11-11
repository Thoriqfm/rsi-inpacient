import prisma from "../../config/prisma.js";
import { HttpError } from "../../shared/errors/http-error.js";
import {
    HISTORY_AUDIT_TABLE,
    HISTORY_STATUS,
    HISTORY_TRANSITIONS,
} from "../../shared/constants/history.js";
import { createAuditLog } from "../../shared/utils/audit.js";
import {
    buildHistoryWhere,
    countHistories,
    createHistoryRecap,
    findHistories,
    findHistoryById,
    findLatestHistoryUpdateActor,
    findNextRekapCode,
    findPasienForHistory,
    findRmeByPatient,
    lockHistoryRow,
    searchPatientsForHistory,
    softDeleteHistoryRecap,
    updateHistoryRecap,
} from "./history.model.js";

const MAX_REKAP_CODE_ATTEMPTS = 5;

function toHistoryItem(row) {
    const { akun, _count, ...rest } = row;

    return {
        ...rest,
        dibuat_oleh: akun?.nama_petugas ?? null,
        jumlah_tindakan: _count?.detail_rekap_tindakan_list ?? 0,
    };
}

function toHistoryDetail(row, diperbaruiOleh = null) {
    const { akun, _count, detail_rekap_tindakan_list, tagihan_list, ...rest } = row;

    return {
        ...rest,
        dibuat_oleh: akun?.nama_petugas ?? null,
        diperbarui_oleh: diperbaruiOleh ?? akun?.nama_petugas ?? null,
        jumlah_tindakan: _count?.detail_rekap_tindakan_list ?? 0,
        detail_tindakan: detail_rekap_tindakan_list,
        tagihan: tagihan_list,
    };
}

export async function listHistories(query) {
    const where = buildHistoryWhere(query);
    const { page, limit } = query;
    const [rows, total] = await Promise.all([
        findHistories(where, { skip: (page - 1) * limit, take: limit }),
        countHistories(where),
    ]);

    return {
        items: rows.map(toHistoryItem),
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export async function getHistoryRecap(id_rekap) {
    const row = await findHistoryById(id_rekap);

    if (!row) {
        throw new HttpError(404, "HISTORY_NOT_FOUND", "Rekap tidak ditemukan.");
    }

    const latestUpdate = await findLatestHistoryUpdateActor(id_rekap);
    return toHistoryDetail(row, latestUpdate?.akun?.nama_petugas ?? null);
}

export async function searchPatients(q) {
    const rows = await searchPatientsForHistory(q);

    return rows.map((row) => {
        const { _count, ...rest } = row;

        return {
            ...rest,
            jumlah_rme: _count?.rme_dummy_list ?? 0,
            jumlah_rekap: _count?.rekap_tindakan_list ?? 0,
        };
    });
}

export async function listPatientRme(id_pasien) {
    const pasien = await findPasienForHistory(id_pasien);
    if (!pasien) {
        throw new HttpError(404, "PASIEN_NOT_FOUND", "Pasien tidak ditemukan.");
    }

    return {
        pasien,
        items: await findRmeByPatient(id_pasien),
    };
}

export async function registerHistoryRecap({ id_pasien, id_riwayat, catatan, keterangan }, id_akun) {
    const pasien = await findPasienForHistory(id_pasien);
    if (!pasien) {
        throw new HttpError(404, "PASIEN_NOT_FOUND", "Pasien tidak ditemukan.");
    }

    const requestedIds = id_riwayat ? [...new Set(id_riwayat)] : null;
    if (id_riwayat && requestedIds.length !== id_riwayat.length) {
        throw new HttpError(400, "VALIDATION_ERROR", "id_riwayat tidak boleh duplikat.");
    }

    const rme = await findRmeByPatient(id_pasien, requestedIds);

    // Snapshot hanya boleh berasal dari RME milik pasien yang sama.
    if (requestedIds && rme.length !== requestedIds.length) {
        throw new HttpError(
            422,
            "HISTORY_RME_MISMATCH",
            "Sebagian tindakan RME tidak ditemukan untuk pasien ini.",
        );
    }

    if (rme.length === 0) {
        throw new HttpError(422, "HISTORY_NO_RME", "Pasien belum memiliki data RME untuk direkap.");
    }

    const snapshot = rme.map((row) => ({
        id_riwayat: row.id_riwayat,
        kode_tindakan: row.kode_tindakan,
        nama_tindakan: row.nama_tindakan,
        tanggal_tindakan: row.tanggal_tindakan,
        jumlah: row.jumlah,
    }));

    // kode_rekap unik; request bersamaan bisa memperoleh nomor yang sama.
    // Nomor dihitung ulang di transaksi baru setiap kali unique constraint menolak.
    for (let attempt = 1; attempt <= MAX_REKAP_CODE_ATTEMPTS; attempt += 1) {
        try {
            return await prisma.$transaction(async (tx) => {
                const created = await createHistoryRecap(
                    tx,
                    {
                        kode_rekap: await findNextRekapCode(tx),
                        id_pasien,
                        id_akun,
                        status: HISTORY_STATUS.DRAFT,
                        catatan: catatan ?? null,
                        keterangan: keterangan ?? null,
                    },
                    snapshot,
                );

                await createAuditLog(tx, {
                    id_akun,
                    nama_tabel: HISTORY_AUDIT_TABLE,
                    id_referensi: created.id_rekap,
                    aksi: "CREATE",
                    data_sesudah: {
                        status: HISTORY_STATUS.DRAFT,
                        id_pasien,
                        jumlah_tindakan: snapshot.length,
                    },
                });

                return toHistoryDetail(await findHistoryById(created.id_rekap, tx));
            });
        } catch (err) {
            if (err.code !== "P2002") {
                throw err;
            }
            if (attempt === MAX_REKAP_CODE_ATTEMPTS) {
                throw new HttpError(409, "HISTORY_CODE_CONFLICT", "Nomor rekap sedang dipakai, coba lagi.");
            }
        }
    }
}

export async function updateHistoryRecapById(id_rekap, payload, id_akun) {
    const current = await findHistoryById(id_rekap);

    if (!current) {
        throw new HttpError(404, "HISTORY_NOT_FOUND", "Rekap tidak ditemukan.");
    }

    // DECISION REQUIRED: koreksi rekap setelah Siap Billing belum disepakati;
    // sementara seluruh perubahan ditolak agar snapshot yang dipakai Billing stabil.
    if (current.status === HISTORY_STATUS.SIAP_BILLING) {
        throw new HttpError(409, "HISTORY_LOCKED", "Rekap Siap Billing tidak dapat diubah.");
    }

    const statusChanged = payload.status !== undefined && payload.status !== current.status;
    if (statusChanged && !(HISTORY_TRANSITIONS[current.status] ?? []).includes(payload.status)) {
        throw new HttpError(
            409,
            "HISTORY_STATUS_INVALID",
            `Status ${current.status} tidak dapat berubah menjadi ${payload.status}.`,
        );
    }

    const nextStatus = statusChanged ? payload.status : current.status;
    if (nextStatus === HISTORY_STATUS.SIAP_BILLING && current.detail_rekap_tindakan_list.length === 0) {
        throw new HttpError(422, "HISTORY_INCOMPLETE", "Rekap tanpa tindakan tidak dapat siap billing.");
    }

    const data = { tanggal_diperbarui: new Date() };
    if (payload.catatan !== undefined) data.catatan = payload.catatan;
    if (payload.keterangan !== undefined) data.keterangan = payload.keterangan;
    if (statusChanged) data.status = payload.status;

    return prisma.$transaction(async (tx) => {
        const updated = await updateHistoryRecap(tx, id_rekap, current.status, data);
        if (updated.count === 0) {
            throw new HttpError(409, "HISTORY_CONFLICT", "Rekap sudah diubah petugas lain.");
        }

        await createAuditLog(tx, {
            id_akun,
            nama_tabel: HISTORY_AUDIT_TABLE,
            id_referensi: id_rekap,
            aksi: statusChanged ? "STATUS_CHANGE" : "UPDATE",
            data_sebelum: {
                status: current.status,
                catatan: current.catatan,
                keterangan: current.keterangan,
            },
            data_sesudah: {
                status: nextStatus,
                catatan: payload.catatan !== undefined ? payload.catatan : current.catatan,
                keterangan:
                    payload.keterangan !== undefined ? payload.keterangan : current.keterangan,
            },
        });

        const latestUpdate = await findLatestHistoryUpdateActor(id_rekap, tx);
        return toHistoryDetail(
            await findHistoryById(id_rekap, tx),
            latestUpdate?.akun?.nama_petugas ?? null,
        );
    });
}

export async function removeHistoryRecap(id_rekap, id_akun) {
    const deleted_at = new Date();

    await prisma.$transaction(async (tx) => {
        await lockHistoryRow(tx, id_rekap);

        const current = await findHistoryById(id_rekap, tx);
        if (!current) {
            throw new HttpError(404, "HISTORY_NOT_FOUND", "Rekap tidak ditemukan.");
        }

        // Tidak boleh menghapus rekap yang sudah menjadi dasar tagihan aktif (non-Batal).
        const hasActiveInvoice = current.tagihan_list.some((tagihan) => tagihan.status !== "Batal");
        if (hasActiveInvoice) {
            throw new HttpError(409, "HISTORY_HAS_INVOICE", "Rekap sudah digunakan pada tagihan.");
        }

        const updated = await softDeleteHistoryRecap(tx, id_rekap, deleted_at);
        if (updated.count === 0) {
            throw new HttpError(409, "HISTORY_CONFLICT", "Rekap sudah dihapus petugas lain.");
        }

        await createAuditLog(tx, {
            id_akun,
            nama_tabel: HISTORY_AUDIT_TABLE,
            id_referensi: id_rekap,
            aksi: "DELETE",
            data_sebelum: { kode_rekap: current.kode_rekap, status: current.status },
        });
    });

    return { id_rekap, deleted: true };
}
