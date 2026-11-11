import prisma from "../../config/prisma.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { QUEUE_STATUS } from "../../shared/constants/queue.js";
import { createAuditLog } from "../../shared/utils/audit.js";
import {
    buildQueueWhere,
    cancelQueue,
    countQueues,
    createQueue,
    createRiwayatStatusForQueue,
    findActiveQueueByPatient,
    findNextQueueNumber,
    findPasienForQueue,
    findQueueById,
    findQueues,
    lockPasienForQueue,
    updatePasienStatusForQueue,
} from "./queue.model.js";

const MAX_QUEUE_NUMBER_ATTEMPTS = 5;

export async function listQueues(query) {
    const where = buildQueueWhere(query);
    const { page, limit } = query;
    const [items, total] = await Promise.all([
        findQueues(where, { skip: (page - 1) * limit, take: limit }),
        countQueues(where),
    ]);

    return {
        items,
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export async function getQueue(id_antrean) {
    const antrean = await findQueueById(id_antrean);

    if (!antrean) {
        throw new HttpError(404, "QUEUE_NOT_FOUND", "Antrean tidak ditemukan.");
    }

    return antrean;
}

export async function registerQueue({ id_pasien }, id_akun) {
    const pasien = await findPasienForQueue(id_pasien);
    if (!pasien) {
        throw new HttpError(404, "PASIEN_NOT_FOUND", "Pasien tidak ditemukan.");
    }

    // UC-04 Alt Flow 1 & PC-20..22: Pasien kondisi Darurat harus diarahkan ke rujukan (UC-05).
    if (pasien.kondisi_pasien === "Darurat") {
        throw new HttpError(
            422,
            "QUEUE_PATIENT_EMERGENCY",
            "Pasien dalam kondisi Darurat tidak dapat masuk daftar tunggu dan harus dirujuk (UC-05).",
        );
    }

    // No_antrean unik; dua request bersamaan bisa memperoleh nomor yang sama.
    // Validasi antrean aktif ganda & pembuatan baris dibungkus transaksi dengan row lock pada pasien.
    for (let attempt = 1; attempt <= MAX_QUEUE_NUMBER_ATTEMPTS; attempt += 1) {
        try {
            return await prisma.$transaction(async (tx) => {
                await lockPasienForQueue(tx, id_pasien);

                if (await findActiveQueueByPatient(id_pasien, tx)) {
                    throw new HttpError(409, "QUEUE_ALREADY_ACTIVE", "Pasien sudah memiliki antrean aktif.");
                }

                const created = await createQueue(
                    {
                        id_pasien,
                        id_akun,
                        waktu_masuk: new Date(),
                        no_antrean: await findNextQueueNumber(tx),
                        status: QUEUE_STATUS.MENUNGGU,
                    },
                    tx,
                );

                await updatePasienStatusForQueue(tx, id_pasien, "Menunggu");
                await createRiwayatStatusForQueue(tx, {
                    id_pasien,
                    id_akun,
                    status_sebelumnya: pasien.status_penanganan,
                    status_baru: "Menunggu",
                    keterangan: `Masuk daftar tunggu FIFO (No. Antrean ${created.no_antrean})`,
                });
                await createAuditLog(tx, {
                    id_akun,
                    nama_tabel: "daftar_tunggu",
                    id_referensi: created.id_antrean,
                    aksi: "CREATE",
                    data_sesudah: {
                        id_pasien,
                        no_antrean: created.no_antrean,
                        status: created.status,
                    },
                });

                return findQueueById(created.id_antrean, tx);
            });
        } catch (err) {
            if (err.code !== "P2002" || attempt === MAX_QUEUE_NUMBER_ATTEMPTS) {
                if (err.code === "P2002") {
                    throw new HttpError(409, "QUEUE_NO_CONFLICT", "Nomor antrean sedang dipakai, coba lagi.");
                }
                throw err;
            }
        }
    }
}

export async function cancelQueueById(id_antrean, id_akun) {
    const current = await getQueue(id_antrean);

    return prisma.$transaction(async (tx) => {
        const cancelled = await cancelQueue(id_antrean, tx);
        if (cancelled.count === 0) {
            throw new HttpError(409, "QUEUE_NOT_WAITING", "Hanya antrean Menunggu yang dapat dibatalkan.");
        }

        if (id_akun) {
            await createRiwayatStatusForQueue(tx, {
                id_pasien: current.id_pasien,
                id_akun,
                status_sebelumnya: current.status,
                status_baru: QUEUE_STATUS.BATAL,
                keterangan: `Antrean No. ${current.no_antrean} dibatalkan`,
            });
            await createAuditLog(tx, {
                id_akun,
                nama_tabel: "daftar_tunggu",
                id_referensi: id_antrean,
                aksi: "STATUS_CHANGE",
                data_sebelum: { status: current.status },
                data_sesudah: { status: QUEUE_STATUS.BATAL },
            });
        }

        return findQueueById(id_antrean, tx);
    });
}
