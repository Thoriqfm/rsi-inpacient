import { HttpError } from "../../shared/errors/http-error.js";
import { QUEUE_STATUS } from "../../shared/constants/queue.js";
import {
    buildQueueWhere,
    cancelQueue,
    countQueues,
    createQueue,
    findActiveQueueByPatient,
    findNextQueueNumber,
    findPasienForQueue,
    findQueueById,
    findQueues,
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

    // Satu pasien hanya boleh memiliki satu antrean aktif (Menunggu).
    // DECISION REQUIRED: cakupan antrean per unit belum ditetapkan.
    if (await findActiveQueueByPatient(id_pasien)) {
        throw new HttpError(409, "QUEUE_ALREADY_ACTIVE", "Pasien sudah memiliki antrean aktif.");
    }

    // No_antrean unik; dua request bersamaan bisa memperoleh nomor yang sama.
    // Nomor dihitung ulang dan create diulang saat unique constraint menolak.
    for (let attempt = 1; attempt <= MAX_QUEUE_NUMBER_ATTEMPTS; attempt += 1) {
        try {
            return await createQueue({
                id_pasien,
                id_akun,
                waktu_masuk: new Date(),
                no_antrean: await findNextQueueNumber(),
                status: QUEUE_STATUS.MENUNGGU,
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

export async function cancelQueueById(id_antrean) {
    await getQueue(id_antrean);

    const cancelled = await cancelQueue(id_antrean);
    if (cancelled.count === 0) {
        throw new HttpError(409, "QUEUE_NOT_WAITING", "Hanya antrean Menunggu yang dapat dibatalkan.");
    }

    return getQueue(id_antrean);
}
