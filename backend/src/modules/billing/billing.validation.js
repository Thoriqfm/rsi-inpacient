import { z } from "zod";
import { TAGIHAN_STATUS_LIST, TARIF_STATUS_LIST } from "../../shared/constants/billing.js";

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

export const recalculateBillingSchema = z
    .object({
        catatan_penyesuaian: z
            .string()
            .trim()
            .max(1000, "Catatan penyesuaian maksimal 1000 karakter.")
            .nullable()
            .optional(),
    })
    .strict()
    .default({});

export const cancelBillingSchema = z
    .object({ alasan: z.string().trim().min(1, "Alasan pembatalan wajib diisi.").max(5000) })
    .strict();

const hargaSchema = z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    // DECIMAL(15,2): maksimal 13 digit bulat dan 2 digit desimal.
    .refine((value) => /^\d{1,13}(\.\d{1,2})?$/.test(value) && Number(value) > 0, {
        message: "Harga harus angka positif maksimal 2 digit desimal.",
    });

const dateOnlySchema = z.coerce.date().transform((value) => {
    // Kolom DATE: buang komponen jam agar perbandingan periode konsisten.
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
});

export const createTariffSchema = z
    .object({
        kode_tindakan: z.string().trim().min(1).max(20, "Kode tindakan maksimal 20 karakter."),
        nama_tindakan: z.string().trim().min(1).max(100, "Nama tindakan maksimal 100 karakter."),
        harga: hargaSchema,
        tanggal_berlaku: dateOnlySchema,
        tanggal_berakhir: dateOnlySchema.nullable().optional(),
        status: z.enum(TARIF_STATUS_LIST).default("Aktif"),
    })
    .strict()
    .refine(
        (data) => !data.tanggal_berakhir || data.tanggal_berakhir >= data.tanggal_berlaku,
        { path: ["tanggal_berakhir"], message: "Tanggal berakhir tidak boleh sebelum tanggal berlaku." },
    );
