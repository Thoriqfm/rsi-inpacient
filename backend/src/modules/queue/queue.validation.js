import { z } from "zod";
import { QUEUE_STATUS, QUEUE_STATUS_LIST } from "../../shared/constants/queue.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const createQueueSchema = z
    .object({
        id_pasien: z.coerce.number().int().positive("Pasien tidak valid."),
    })
    .strict();

// Dialokasikan hanya boleh dihasilkan modul Allocation, bukan endpoint antrean.
export const updateQueueSchema = z
    .object({
        status: z.literal(QUEUE_STATUS.BATAL, {
            message: "Hanya status Batal yang dapat diubah dari modul antrean.",
        }),
    })
    .strict();

export const queueListQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        status: z.enum(QUEUE_STATUS_LIST).optional(),
        id_pasien: z.coerce.number().int().positive().optional(),
        q: z.string().trim().max(100).optional(),
    })
    .strict();
