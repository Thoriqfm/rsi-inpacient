import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { HttpError } from "../../shared/errors/http-error.js";
import { ROLE_LIST } from "../../shared/constants/roles.js";
import { findAkunById, findAkunByUsername, createAkun as insertAkun } from "./auth.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const BCRYPT_ROUNDS = 10;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET wajib diisi minimal 32 karakter pada environment.");
}

// Compared against when the username is unknown so timing stays close to a real check.
const DUMMY_HASH = "$2b$10$5tI3YcxkxmRow9EH7L0NsenJj9wAVAnyHSP1zHL93kdamWE1pOu3S";

export function toPublicAkun(akun) {
    return {
        id_akun: akun.id_akun,
        username: akun.username,
        nama_petugas: akun.nama_petugas,
        role: akun.role,
    };
}

export function verifyAccessToken(token) {
    try {
        const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
        const id_akun = Number(payload.sub);

        if (!Number.isInteger(id_akun) || !payload.username || !ROLE_LIST.includes(payload.role)) {
            throw new Error("Claim wajib tidak lengkap atau role tidak dikenali.");
        }

        return { id_akun, username: payload.username, role: payload.role };
    } catch {
        throw new HttpError(401, "UNAUTHENTICATED", "Token tidak valid atau sudah kedaluwarsa.");
    }
}

export async function authenticate(username, password) {
    const akun = await findAkunByUsername(username);
    const passwordValid = await bcrypt.compare(password, akun?.password ?? DUMMY_HASH);

    if (!akun || !passwordValid) {
        throw new HttpError(401, "INVALID_CREDENTIALS", "Username atau password salah.");
    }

    // Data akun rusak: jangan terbitkan token yang pasti ditolak middleware.
    if (!ROLE_LIST.includes(akun.role)) {
        throw new HttpError(403, "FORBIDDEN", "Role akun tidak dikenali. Hubungi Backend Lead.");
    }

    const token = jwt.sign(
        { username: akun.username, role: akun.role },
        JWT_SECRET,
        { subject: String(akun.id_akun), algorithm: "HS256", expiresIn: JWT_EXPIRES_IN },
    );
    const { iat, exp } = jwt.decode(token);

    return {
        token,
        token_type: "Bearer",
        expires_in: exp - iat,
        user: toPublicAkun(akun),
    };
}

export async function createAkun({ username, password, role, nama_petugas }) {
    const existing = await findAkunByUsername(username);

    if (existing) {
        throw new HttpError(409, "CONFLICT", "Username sudah digunakan.");
    }

    try {
        return await insertAkun({
            username,
            password: await bcrypt.hash(password, BCRYPT_ROUNDS),
            role,
            nama_petugas,
        });
    } catch (err) {
        // Unique constraint tetap bisa kena saat dua request bersamaan.
        if (err.code === "P2002") {
            throw new HttpError(409, "CONFLICT", "Username sudah digunakan.");
        }
        throw err;
    }
}

export async function getCurrentUser(id_akun) {
    const akun = await findAkunById(id_akun);

    if (!akun) {
        throw new HttpError(401, "UNAUTHENTICATED", "Akun tidak ditemukan.");
    }

    return toPublicAkun(akun);
}
