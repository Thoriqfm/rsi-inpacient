import { HttpError } from "../errors/http-error.js";

// Path param bukan angka harus 404, bukan 500 dari query Prisma.
export function parseId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id < 1) {
        throw new HttpError(404, "NOT_FOUND", "Resource tidak ditemukan.");
    }

    return id;
}
