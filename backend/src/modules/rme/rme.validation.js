import { z } from "zod";

// Tanggal tindakan opsional; diisi server bila kosong karena data ini simulasi manual.
export const createRmeSchema = z
    .object({
        id_pasien: z.coerce.number().int().positive("Pasien tidak valid."),
        kode_tindakan: z.string().trim().min(1).max(20, "Kode tindakan maksimal 20 karakter."),
        nama_tindakan: z.string().trim().min(1).max(100, "Nama tindakan maksimal 100 karakter."),
        tanggal_tindakan: z.coerce.date().optional(),
        // CHECK jumlah > 0 ada di migration; validasi di sini agar 400, bukan 500.
        jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1.").default(1),
        keterangan: z.string().trim().max(5000).nullable().optional(),
    })
    .strict();
