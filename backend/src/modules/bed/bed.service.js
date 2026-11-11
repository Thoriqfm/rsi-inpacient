import prisma from "../../config/prisma.js";
import { BED_STATUS } from "../../shared/constants/bed.js";
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

// Relasi alokasi aktif dipadatkan menjadi occupant agar bentuk Prisma tidak bocor ke API.
function toBedResponse(bed) {
    const { rekam_alokasi_list, ...rest } = bed;
    return { ...rest, occupant: rekam_alokasi_list[0]?.pasien ?? null };
}

export async function listBeds(query) {
    const where = buildBedWhere(query);
    const { page, limit } = query;
    const [items, total] = await Promise.all([
        findBeds(where, { skip: (page - 1) * limit, take: limit }),
        countBeds(where),
    ]);

    return {
        items: items.map(toBedResponse),
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

    return toBedResponse(bed);
}

export async function addBed(data) {
    try {
        return toBedResponse(await createBed(data));
    } catch (err) {
        // Nomor bed unik, termasuk bed yang sudah soft-delete.
        if (err.code === "P2002") {
            throw new HttpError(409, "BED_NO_CONFLICT", "Nomor bed sudah digunakan.");
        }
        throw err;
    }
}

export async function editBed(id_bed, data) {
    try {
        return await prisma.$transaction(async (tx) => {
            const bed = await findBedById(id_bed, tx);
            if (!bed) {
                throw new HttpError(404, "BED_NOT_FOUND", "Bed tidak ditemukan.");
            }

            // Status Terisi adalah turunan proses alokasi; perubahan manual bisa membuat data tidak konsisten.
            if (data.status && (await countActiveAllocationsByBed(id_bed, tx)) > 0) {
                throw new HttpError(
                    409,
                    "BED_IN_USE",
                    "Status bed tidak dapat diubah selama masih ada alokasi aktif.",
                );
            }

            return toBedResponse(await updateBed(id_bed, data, tx));
        });
    } catch (err) {
        if (err.code === "P2002") {
            throw new HttpError(409, "BED_NO_CONFLICT", "Nomor bed sudah digunakan.");
        }
        throw err;
    }
}

export async function removeBed(id_bed) {
    await prisma.$transaction(async (tx) => {
        const bed = await findBedById(id_bed, tx);
        if (!bed) {
            throw new HttpError(404, "BED_NOT_FOUND", "Bed tidak ditemukan.");
        }

        if (
            bed.status === BED_STATUS.TERISI ||
            (await countActiveAllocationsByBed(id_bed, tx)) > 0
        ) {
            throw new HttpError(
                409,
                "BED_IN_USE",
                "Bed berstatus Terisi atau masih memiliki alokasi aktif dan tidak dapat dihapus.",
            );
        }

        const deleted = await softDeleteBed(id_bed, tx);
        if (deleted.count === 0) {
            throw new HttpError(
                409,
                "BED_IN_USE",
                "Bed sedang digunakan atau sudah dihapus oleh petugas lain.",
            );
        }
    });

    return { id_bed, deleted: true };
}
