import prisma from "../../config/prisma.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { AUDIT_ACTION, AUDIT_TABLE, HOSPITAL_STALE_MS } from "../../shared/constants/referral.js";
import { createAuditLog } from "../../shared/utils/audit.js";
import {
    buildHospitalWhere,
    countHospitals,
    findHospitalById,
    findHospitals,
    findLastHospitalUpdates,
    updateHospitalAvailability,
} from "./referral-hospital.model.js";

function toHospitalResponse(hospital, aktor, now) {
    // Data yang belum pernah diperbarui juga dianggap stale: belum ada konfirmasi petugas.
    const stale =
        !hospital.terakhir_diperbarui || now - hospital.terakhir_diperbarui > HOSPITAL_STALE_MS;

    return { ...hospital, terakhir_diperbarui_oleh: aktor ?? null, stale };
}

async function withLastActor(hospitals) {
    const updates = await findLastHospitalUpdates(hospitals.map((hospital) => hospital.id_rs));
    const aktorById = new Map();

    for (const update of updates) {
        if (!aktorById.has(update.id_referensi)) {
            aktorById.set(update.id_referensi, update.akun?.nama_petugas ?? null);
        }
    }

    const now = Date.now();
    return hospitals.map((hospital) => toHospitalResponse(hospital, aktorById.get(hospital.id_rs), now));
}

export async function listHospitals(query) {
    const where = buildHospitalWhere(query);
    const { page, limit } = query;
    const [rows, total] = await Promise.all([
        findHospitals(where, { skip: (page - 1) * limit, take: limit }),
        countHospitals(where),
    ]);

    return {
        items: await withLastActor(rows),
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export async function getHospital(id_rs) {
    const hospital = await findHospitalById(id_rs);

    if (!hospital) {
        throw new HttpError(404, "REFERRAL_HOSPITAL_NOT_FOUND", "Rumah sakit rujukan tidak ditemukan.");
    }

    const [item] = await withLastActor([hospital]);
    return item;
}

export async function setHospitalAvailability(id_rs, status_ketersediaan, id_akun) {
    const hospital = await getHospital(id_rs);

    await prisma.$transaction(async (tx) => {
        const updated = await updateHospitalAvailability(id_rs, status_ketersediaan, tx);

        await createAuditLog(tx, {
            id_akun,
            nama_tabel: AUDIT_TABLE.HOSPITAL,
            id_referensi: id_rs,
            aksi: AUDIT_ACTION.UPDATE,
            data_sebelum: {
                status_ketersediaan: hospital.status_ketersediaan,
                terakhir_diperbarui: hospital.terakhir_diperbarui,
            },
            data_sesudah: {
                status_ketersediaan,
                terakhir_diperbarui: updated.terakhir_diperbarui,
            },
        });
    });

    // Dibaca setelah commit agar aktor dari log_audit sudah terlihat.
    return getHospital(id_rs);
}
