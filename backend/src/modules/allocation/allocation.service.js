import prisma from "../../config/prisma.js";
import { ALLOCATION_STATUS, BED_STATUS } from "../../shared/constants/bed.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { createAuditLog } from "../../shared/utils/audit.js";
import { claimBedForAllocation, findBedById, releaseBedAfterAllocation } from "../bed/bed.model.js";
import {
    buildAllocationWhere,
    closeAllocation,
    countAllocations,
    createAllocation,
    createRiwayatStatusForAllocation,
    findAllocationById,
    findAllocations,
    findPasienForAllocation,
    findQueueById,
    markQueueAllocated,
    updatePasienStatusForAllocation,
} from "./allocation.model.js";

export async function listAllocations(query) {
    const where = buildAllocationWhere(query);
    const { page, limit } = query;
    const [items, total] = await Promise.all([
        findAllocations(where, { skip: (page - 1) * limit, take: limit }),
        countAllocations(where),
    ]);

    return {
        items,
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export async function getAllocation(id_alokasi) {
    const alokasi = await findAllocationById(id_alokasi);

    if (!alokasi) {
        throw new HttpError(404, "ALLOCATION_NOT_FOUND", "Alokasi tidak ditemukan.");
    }

    return alokasi;
}

export async function createAllocationForBed({ id_pasien, id_bed, id_antrean }, id_akun) {
    const pasien = await findPasienForAllocation(id_pasien);
    if (!pasien) {
        throw new HttpError(404, "PASIEN_NOT_FOUND", "Pasien tidak ditemukan.");
    }

    if (id_antrean) {
        const antrean = await findQueueById(id_antrean);

        if (!antrean) {
            throw new HttpError(404, "QUEUE_NOT_FOUND", "Antrean tidak ditemukan.");
        }
        if (antrean.status !== "Menunggu") {
            throw new HttpError(409, "QUEUE_NOT_WAITING", "Antrean sudah tidak berstatus Menunggu.");
        }
        if (antrean.id_pasien !== id_pasien) {
            throw new HttpError(409, "QUEUE_PATIENT_MISMATCH", "Antrean bukan milik pasien yang dialokasikan.");
        }
    }

    const bed = await findBedById(id_bed);
    if (!bed) {
        throw new HttpError(404, "BED_NOT_FOUND", "Bed tidak ditemukan.");
    }
    if (bed.status !== BED_STATUS.TERSEDIA) {
        throw new HttpError(
            409,
            "BED_UNAVAILABLE",
            `Bed tidak tersedia untuk alokasi (status: ${bed.status}).`,
        );
    }

    try {
        return await prisma.$transaction(async (tx) => {
            // Kunci bersyarat: request kedua pada bed yang sama akan mendapat count 0.
            const claimed = await claimBedForAllocation(id_bed, tx);
            if (claimed.count === 0) {
                throw new HttpError(409, "BED_UNAVAILABLE", "Bed sudah dialokasikan oleh petugas lain.");
            }

            if (id_antrean) {
                const marked = await markQueueAllocated(id_antrean, tx);
                if (marked.count === 0) {
                    throw new HttpError(409, "QUEUE_NOT_WAITING", "Antrean sudah tidak berstatus Menunggu.");
                }
            }

            const created = await createAllocation(tx, {
                id_pasien,
                id_bed,
                id_akun,
                id_antrean: id_antrean ?? null,
                waktu_alokasi: new Date(),
                status_alokasi: ALLOCATION_STATUS.AKTIF,
            });

            // PC-06: Perbarui status penanganan pasien menjadi Rawat Inap & catat riwayat/audit.
            await updatePasienStatusForAllocation(tx, id_pasien, "Rawat Inap");
            await createRiwayatStatusForAllocation(tx, {
                id_pasien,
                id_akun,
                status_sebelumnya: pasien.status_penanganan,
                status_baru: "Rawat Inap",
                keterangan: `Dialokasikan ke bed ${bed.no_bed} (${bed.nama_bangsal})`,
            });
            await createAuditLog(tx, {
                id_akun,
                nama_tabel: "rekam_alokasi",
                id_referensi: created.id_alokasi,
                aksi: "CREATE",
                data_sesudah: {
                    id_pasien,
                    id_bed,
                    id_antrean: id_antrean ?? null,
                    status_alokasi: created.status_alokasi,
                },
            });

            return created;
        });
    } catch (err) {
        // Guard DB uq_rekam_alokasi_bed_aktif / uq_rekam_alokasi_antrean.
        if (err.code === "P2002") {
            throw new HttpError(
                409,
                "ALLOCATION_CONFLICT",
                "Bed sudah memiliki alokasi aktif atau antrean sudah pernah dialokasikan.",
            );
        }
        throw err;
    }
}

export async function closeAllocationById(id_alokasi, status_alokasi, id_akun) {
    const alokasi = await getAllocation(id_alokasi);

    if (alokasi.status_alokasi !== ALLOCATION_STATUS.AKTIF) {
        throw new HttpError(409, "ALLOCATION_NOT_ACTIVE", "Hanya alokasi Aktif yang dapat ditutup.");
    }

    return prisma.$transaction(async (tx) => {
        const closed = await closeAllocation(tx, id_alokasi, status_alokasi);
        if (closed.count === 0) {
            throw new HttpError(409, "ALLOCATION_NOT_ACTIVE", "Alokasi sudah ditutup oleh petugas lain.");
        }

        await releaseBedAfterAllocation(alokasi.id_bed, tx);
        await createAuditLog(tx, {
            id_akun: id_akun ?? alokasi.id_akun,
            nama_tabel: "rekam_alokasi",
            id_referensi: id_alokasi,
            aksi: "STATUS_CHANGE",
            data_sebelum: { status_alokasi: alokasi.status_alokasi },
            data_sesudah: { status_alokasi },
        });

        return findAllocationById(id_alokasi, tx);
    });
}
