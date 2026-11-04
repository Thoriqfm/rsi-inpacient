import { z } from "zod";
import { QUEUE_STATUS_LIST } from "../../shared/constants/queue.js";
import { REFERRAL_STATUS_LIST } from "../../shared/constants/referral.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

// Tanggal saja (YYYY-MM-DD); `sampai` inklusif seluruh hari.
const dateOnly = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.");

export const monitoringQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        q: z.string().trim().max(100).optional(),
        status_antrean: z.enum(QUEUE_STATUS_LIST).optional(),
        status_rujukan: z.enum(REFERRAL_STATUS_LIST).optional(),
        dari: dateOnly.optional(),
        sampai: dateOnly.optional(),
    })
    .strict()
    .refine((data) => !data.dari || !data.sampai || data.dari <= data.sampai, {
        message: "Tanggal 'dari' tidak boleh melewati 'sampai'.",
        path: ["dari"],
    });
