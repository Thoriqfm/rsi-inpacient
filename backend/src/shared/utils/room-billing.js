import { HttpError } from "../errors/http-error.js";

export function countRoomNights(start, end) {
    if (!(start instanceof Date) || !(end instanceof Date) ||
        !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) {
        throw new HttpError(422, "ROOM_ALLOCATION_INVALID", "Waktu menginap tidak valid.");
    }
    return Math.max(1, Math.ceil((end - start) / 86_400_000));
}

// DATE tarif mengikuti tanggal setempat, durasi tetap dihitung sebagai elapsed time.
export function jakartaDate(instant) {
    const local = new Date(instant.getTime() + 7 * 60 * 60 * 1000);
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}
