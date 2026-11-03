import { HttpError } from "../../shared/errors/http-error.js";
import {
    buildBedWhere,
    countBeds,
    createBed,
    findAvailableBeds,
    findBedById,
    findBeds,
    softDeleteBed,
    updateBed,
} from "./bed.model.js";
import { countActiveAllocationsByBed } from "../allocation/allocation.model.js";

export async function listBeds(query) {
    const where = buildBedWhere(query);
    const { page, limit } = query;
    const [items, total] = await Promise.all([
        findBeds(where, { skip: (page - 1) * limit, take: limit }),
        countBeds(where),
    ]);

    return {
        items,
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export function listAvailableBeds() {
    return findAvailableBeds();
}

export async function getBed(id_bed) {
    const bed = await findBedById(id_bed);

    if (!bed) {
        throw new HttpError(404, "BED_NOT_FOUND", "Bed tidak ditemukan.");
    }

    return bed;
}

export async function addBed(data) {
    try {
        return await createBed(data);
    } catch (err) {
        // Nomor bed unik, termasuk bed yang sudah soft-delete.
        if (err.code === "P2002") {
            throw new HttpError(409, "BED_NO_CONFLICT", "Nomor bed sudah digunakan.");
        }
        throw err;
    }
}

export async function editBed(id_bed, data) {
    await getBed(id_bed);

    // Status Terisi adalah turunan proses alokasi; perubahan manual bisa membuat data tidak konsisten.
    if (data.status && (await countActiveAllocationsByBed(id_bed)) > 0) {
        throw new HttpError(409, "BED_IN_USE", "Status bed tidak dapat diubah selama masih ada alokasi aktif.");
    }

    try {
        return await updateBed(id_bed, data);
    } catch (err) {
        if (err.code === "P2002") {
            throw new HttpError(409, "BED_NO_CONFLICT", "Nomor bed sudah digunakan.");
        }
        throw err;
    }
}

export async function removeBed(id_bed) {
    await getBed(id_bed);

    if ((await countActiveAllocationsByBed(id_bed)) > 0) {
        throw new HttpError(409, "BED_IN_USE", "Bed masih memiliki alokasi aktif dan tidak dapat dihapus.");
    }

    await softDeleteBed(id_bed);

    // shortcut: nomor bed tetap terpakai baris soft-delete karena uq_bed_no_bed tidak parsial.
    // Upgrade bila nomor bed harus bisa dipakai ulang.
    return { id_bed, deleted: true };
}
