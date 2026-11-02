import { z } from "zod";
import { ROLE_LIST } from "../../shared/constants/roles.js";

export const loginSchema = z.object({
    username: z.string().trim().min(1, "Username wajib diisi.").max(50, "Username maksimal 50 karakter."),
    password: z.string().min(1, "Password wajib diisi.").max(255, "Password maksimal 255 karakter."),
});

export const createAkunSchema = z.object({
    username: z.string().trim().min(3, "Username minimal 3 karakter.").max(50, "Username maksimal 50 karakter."),
    password: z.string().min(8, "Password minimal 8 karakter.").max(255, "Password maksimal 255 karakter."),
    role: z.enum(ROLE_LIST, { message: `Role harus salah satu dari: ${ROLE_LIST.join(", ")}.` }),
    nama_petugas: z.string().trim().min(1, "Nama petugas wajib diisi.").max(100, "Nama petugas maksimal 100 karakter."),
});
