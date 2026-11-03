import { z } from "zod";
import { BED_STATUS, BED_STATUS_LIST } from "../../shared/constants/bed.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

const noBed = z.string().trim().min(1, "Nomor bed wajib diisi.").max(20, "Nomor bed maksimal 20 karakter.");
const namaBangsal = z.string().trim().min(1, "Nama bangsal wajib diisi.").max(100, "Nama bangsal maksimal 100 karakter.");
const kelasPerawatan = z.string().trim().min(1, "Kelas perawatan wajib diisi.").max(50, "Kelas perawatan maksimal 50 karakter.");
const tipeBed = z.string().trim().max(50, "Tipe bed maksimal 50 karakter.").nullish();
const namaKamar = z.string().trim().max(50, "Nama kamar maksimal 50 karakter.").nullish();
const fasilitas = z.string().trim().max(255, "Fasilitas maksimal 255 karakter.").nullish();

export const createBedSchema = z.object({
    no_bed: noBed,
    nama_bangsal: namaBangsal,
    nama_kamar: namaKamar,
    kelas_perawatan: kelasPerawatan,
    tipe_bed: tipeBed,
    fasilitas,
    // Terisi hanya boleh dihasilkan oleh proses alokasi.
    status: z.enum(BED_STATUS_LIST.filter((status) => status !== BED_STATUS.TERISI)).optional(),
});

export const updateBedSchema = z
    .object({
        no_bed: noBed.optional(),
        nama_bangsal: namaBangsal.optional(),
        nama_kamar: namaKamar.optional(),
        kelas_perawatan: kelasPerawatan.optional(),
        tipe_bed: tipeBed.optional(),
        fasilitas: fasilitas.optional(),
        status: z.enum(BED_STATUS_LIST.filter((status) => status !== BED_STATUS.TERISI)).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Minimal satu field harus diisi.",
    });

export const bedListQuerySchema = z.object({
    page: pageSchema,
    limit: limitSchema,
    status: z.enum(BED_STATUS_LIST).optional(),
    q: z.string().trim().max(100).optional(),
});
