import prisma from "../../config/prisma.js";
import { ALLOCATION_STATUS, BED_STATUS } from "../../shared/constants/bed.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { createAuditLog } from "../../shared/utils/audit.js";
import { jakartaDate } from "../../shared/utils/room-billing.js";
import { lockRoomClass, lockRoomAllocations } from "../billing/billing.model.js";
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

function allocationResponse(row) {
    return { ...row, harga_per_malam_snapshot: row.harga_per_malam_snapshot?.toFixed(2) ?? null };
}

export async function listAllocations(query) {
    const where = buildAllocationWhere(query);
    const { page, limit } = query;
    const [items, total] = await Promise.all([
        findAllocations(where, { skip: (page - 1) * limit, take: limit }),
        countAllocations(where),
    ]);

    return {
        items: items.map(allocationResponse),
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export async function getAllocation(id_alokasi) {
    const alokasi = await findAllocationById(id_alokasi);

    if (!alokasi) {
        throw new HttpError(404, "ALLOCATION_NOT_FOUND", "Alokasi tidak ditemukan.");
    }

    return allocationResponse(alokasi);
}

export async function reconcileRoomSnapshot(id_alokasi, { id_tarif_kamar, alasan }, id_akun) {
    return prisma.$transaction(async (tx) => {
        await lockRoomAllocations(tx, [id_alokasi]);
        const allocation = await findAllocationById(id_alokasi, tx);
        if (!allocation) throw new HttpError(404, "ALLOCATION_NOT_FOUND", "Alokasi tidak ditemukan.");
        if (![ALLOCATION_STATUS.AKTIF, ALLOCATION_STATUS.SELESAI].includes(allocation.status_alokasi)) {
            throw new HttpError(409, "ROOM_ALLOCATION_INVALID", "Alokasi yang dibatalkan tidak dapat direkonsiliasi.");
        }
        if (allocation.id_tagihan_kamar !== null || await tx.detailTagihan.findFirst({ where: { id_alokasi }, select: { id_detail_tagihan: true } })) {
            throw new HttpError(409, "ROOM_ALREADY_BILLED", "Snapshot alokasi yang pernah ditagihkan tidak dapat diubah.");
        }
        if (allocation.id_tarif_kamar !== null || allocation.kelas_perawatan_snapshot !== null || allocation.harga_per_malam_snapshot !== null) {
            throw new HttpError(409, "ROOM_SNAPSHOT_EXISTS", "Snapshot tarif sudah terisi. Muat ulang halaman; harga yang tersimpan tidak ditimpa.");
        }
        const rate = await tx.tarifKamar.findUnique({ where: { id_tarif_kamar } });
        if (!rate) throw new HttpError(404, "ROOM_TARIFF_NOT_FOUND", "Tarif kamar tidak ditemukan.");
        if (rate.tanggal_berlaku > jakartaDate(new Date())) {
            throw new HttpError(422, "ROOM_TARIFF_INVALID", "Tarif yang belum mulai berlaku tidak dapat dipakai untuk rekonsiliasi.");
        }
        const snapshot = { id_tarif_kamar, kelas_perawatan_snapshot: rate.kelas_perawatan, harga_per_malam_snapshot: rate.harga_per_malam };
        const updated = await tx.rekamAlokasi.updateMany({
            where: { id_alokasi, id_tagihan_kamar: null, id_tarif_kamar: null, kelas_perawatan_snapshot: null, harga_per_malam_snapshot: null },
            data: { ...snapshot, updated_at: new Date() },
        });
        if (updated.count !== 1) throw new HttpError(409, "ROOM_SNAPSHOT_EXISTS", "Snapshot telah diisi oleh petugas lain.");
        const masuk = jakartaDate(allocation.waktu_alokasi);
        await createAuditLog(tx, {
            id_akun, nama_tabel: "rekam_alokasi", id_referensi: id_alokasi, aksi: "UPDATE",
            data_sebelum: { id_tarif_kamar: null, kelas_perawatan_snapshot: null, harga_per_malam_snapshot: null },
            data_sesudah: { ...snapshot, harga_per_malam_snapshot: rate.harga_per_malam.toFixed(2),
                operasi: "RECONCILE_ROOM_SNAPSHOT", alasan,
                tarif_di_luar_periode_masuk: rate.tanggal_berlaku > masuk || (rate.tanggal_berakhir !== null && rate.tanggal_berakhir <= masuk) },
        });
        return allocationResponse(await findAllocationById(id_alokasi, tx));
    }, { isolationLevel: "ReadCommitted" });
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

            const currentBed = await findBedById(id_bed, tx);
            await lockRoomClass(tx, currentBed.kelas_perawatan);
            const waktuAlokasi = new Date(Math.floor(Date.now() / 1000) * 1000);
            const tanggal = jakartaDate(waktuAlokasi);
            const rates = await tx.tarifKamar.findMany({ where: {
                kelas_perawatan: currentBed.kelas_perawatan,
                tanggal_berlaku: { lte: tanggal },
                OR: [{ tanggal_berakhir: null }, { tanggal_berakhir: { gt: tanggal } }],
            } });
            if (rates.length !== 1) {
                throw new HttpError(422, "ROOM_TARIFF_NOT_FOUND", "Tarif kamar untuk kelas dan tanggal masuk belum tersedia atau ambigu. Hubungi Super Admin.");
            }
            const rate = rates[0];

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
                waktu_alokasi: waktuAlokasi,
                id_tarif_kamar: rate.id_tarif_kamar,
                kelas_perawatan_snapshot: currentBed.kelas_perawatan,
                harga_per_malam_snapshot: rate.harga_per_malam,
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

            return allocationResponse(created);
        }, { isolationLevel: "ReadCommitted" });
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

        return allocationResponse(await findAllocationById(id_alokasi, tx));
    });
}
