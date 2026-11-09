import { z } from "zod";
import { TAGIHAN_STATUS_LIST } from "../../shared/constants/billing.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);
const idRekapSchema = z.coerce.number().int().positive("Rekap tidak valid.");

export const billingListQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        status: z.enum(TAGIHAN_STATUS_LIST).optional(),
        id_pasien: z.coerce.number().int().positive().optional(),
        q: z.string().trim().max(100).optional(),
    })
    .strict();

export const previewBillingSchema = z.object({ id_rekap: idRekapSchema }).strict();

export const createBillingSchema = z
    .object({
        id_rekap: idRekapSchema,
        catatan: z.string().trim().max(5000).optional(),
    })
    .strict();

export const updateBillingStatusSchema = z
    .object({ status: z.enum(TAGIHAN_STATUS_LIST) })
    .strict();

export const cancelBillingSchema = z
    .object({ alasan: z.string().trim().min(1, "Alasan pembatalan wajib diisi.").max(5000) })
    .strict();
