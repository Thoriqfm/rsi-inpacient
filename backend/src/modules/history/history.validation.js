import { z } from "zod";
import { HISTORY_STATUS_LIST } from "../../shared/constants/history.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const createHistorySchema = z
    .object({
        id_pasien: z.coerce.number().int().positive("Pasien tidak valid."),
        // Bila dihilangkan, seluruh RME pasien dijadikan snapshot.
        id_riwayat: z
            .array(z.coerce.number().int().positive("Tindakan RME tidak valid."))
            .min(1)
            .max(500)
            .optional(),
        catatan: z.string().trim().max(5000).optional(),
        keterangan: z.string().trim().max(5000).optional(),
    })
    .strict();

export const updateHistorySchema = z
    .object({
        status: z.enum(HISTORY_STATUS_LIST).optional(),
        catatan: z.string().trim().max(5000).nullable().optional(),
        keterangan: z.string().trim().max(5000).nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Minimal satu field harus diisi.",
    });

export const historyListQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        status: z.enum(HISTORY_STATUS_LIST).optional(),
        id_pasien: z.coerce.number().int().positive().optional(),
        q: z.string().trim().max(100).optional(),
    })
    .strict();

export const patientSearchQuerySchema = z
    .object({
        q: z.string().trim().min(1, "Kata kunci wajib diisi.").max(100),
    })
    .strict();

export const patientRmeQuerySchema = z
    .object({
        id_pasien: z.coerce.number().int().positive("Pasien tidak valid."),
    })
    .strict();
