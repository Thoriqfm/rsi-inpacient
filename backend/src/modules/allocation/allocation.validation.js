import { z } from "zod";
import { ALLOCATION_STATUS } from "../../shared/constants/bed.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const createAllocationSchema = z.object({
    id_pasien: z.coerce.number().int().positive("Pasien tidak valid."),
    id_bed: z.coerce.number().int().positive("Bed tidak valid."),
    id_antrean: z.coerce.number().int().positive().optional(),
});

// Hanya transisi dari Aktif. Pindah bed belum termasuk scope (DECISION REQUIRED).
export const updateAllocationSchema = z.object({
    status_alokasi: z.enum([ALLOCATION_STATUS.SELESAI, ALLOCATION_STATUS.BATAL], {
        message: "Status alokasi harus Selesai atau Batal.",
    }),
});

export const allocationListQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        status_alokasi: z.enum(Object.values(ALLOCATION_STATUS)).optional(),
        id_pasien: z.coerce.number().int().positive().optional(),
        id_bed: z.coerce.number().int().positive().optional(),
    })
    .strict();
