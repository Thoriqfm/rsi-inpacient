import { z } from "zod";
import {
    HOSPITAL_AVAILABILITY_LIST,
    REFERRAL_STATUS_LIST,
} from "../../shared/constants/referral.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const hospitalListQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        status_ketersediaan: z.enum(HOSPITAL_AVAILABILITY_LIST).optional(),
        q: z.string().trim().max(100).optional(),
    })
    .strict();

// Hanya status ketersediaan yang boleh diubah manual; data master RS tidak dikelola di sini.
export const hospitalAvailabilitySchema = z
    .object({
        status_ketersediaan: z.enum(HOSPITAL_AVAILABILITY_LIST, {
            message: `Status ketersediaan harus salah satu dari: ${HOSPITAL_AVAILABILITY_LIST.join(", ")}.`,
        }),
    })
    .strict();

export const referralListQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        status: z.enum(REFERRAL_STATUS_LIST).optional(),
        id_pasien: z.coerce.number().int().positive().optional(),
        id_rs: z.coerce.number().int().positive().optional(),
        q: z.string().trim().max(100).optional(),
    })
    .strict();

export const createReferralSchema = z
    .object({
        id_pasien: z.coerce.number().int().positive("Pasien tidak valid."),
        id_rs: z.coerce.number().int().positive("Rumah sakit rujukan tidak valid."),
        alasan_rujukan: z.string().trim().max(5000, "Alasan rujukan maksimal 5000 karakter.").optional(),
    })
    .strict();

// Nilai status divalidasi di sini; transisi yang tidak sah ditolak service sebagai 409.
export const updateReferralStatusSchema = z
    .object({
        status: z.enum(REFERRAL_STATUS_LIST, {
            message: `Status rujukan harus salah satu dari: ${REFERRAL_STATUS_LIST.join(", ")}.`,
        }),
    })
    .strict();
