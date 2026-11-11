import prisma from "../../config/prisma.js";
import { HttpError } from "../../shared/errors/http-error.js";
import {
    AUDIT_ACTION,
    AUDIT_TABLE,
    REFERRAL_STATUS,
    REFERRAL_TRANSITIONS,
} from "../../shared/constants/referral.js";
import { createAuditLog, parseAuditData } from "../../shared/utils/audit.js";
import { findHospitalById } from "./referral-hospital.model.js";
import {
    buildReferralWhere,
    countReferrals,
    createReferral,
    createRiwayatStatusForReferral,
    findNextReferralNumber,
    findPasienForReferral,
    findReferralById,
    findReferralHistory,
    findReferrals,
    updatePasienStatusForReferral,
    updateReferralStatus,
} from "./referral.model.js";

const MAX_REFERRAL_NUMBER_ATTEMPTS = 5;

export async function listReferrals(query) {
    const where = buildReferralWhere(query);
    const { page, limit } = query;
    const [items, total] = await Promise.all([
        findReferrals(where, { skip: (page - 1) * limit, take: limit }),
        countReferrals(where),
    ]);

    return {
        items,
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}

export async function getReferral(id_surat) {
    const referral = await findReferralById(id_surat);

    if (!referral) {
        throw new HttpError(404, "REFERRAL_NOT_FOUND", "Rujukan tidak ditemukan.");
    }

    return referral;
}

export async function getReferralHistory(id_surat) {
    await getReferral(id_surat);

    const rows = await findReferralHistory(id_surat);

    return rows.map((row) => ({
        id_log: row.id_log,
        aksi: row.aksi,
        status_sebelumnya: parseAuditData(row.data_sebelum)?.status ?? null,
        status_baru: parseAuditData(row.data_sesudah)?.status ?? null,
        nama_petugas: row.akun?.nama_petugas ?? null,
        waktu_aksi: row.waktu_aksi,
    }));
}

export async function registerReferral({ id_pasien, id_rs, alasan_rujukan }, id_akun) {
    const pasien = await findPasienForReferral(id_pasien);
    if (!pasien) {
        throw new HttpError(404, "PASIEN_NOT_FOUND", "Pasien tidak ditemukan.");
    }

    // PC-21: Rujukan ke RS rujukan diperuntukkan bagi pasien kondisi Darurat.
    if (pasien.kondisi_pasien && pasien.kondisi_pasien !== "Darurat") {
        throw new HttpError(
            422,
            "REFERRAL_PATIENT_NOT_EMERGENCY",
            "Surat rujukan darurat hanya dapat diterbitkan untuk pasien dengan kondisi Darurat.",
        );
    }

    const hospital = await findHospitalById(id_rs);
    if (!hospital) {
        throw new HttpError(404, "REFERRAL_HOSPITAL_NOT_FOUND", "Rumah sakit rujukan tidak ditemukan.");
    }

    // PC-27 & UC-05 Alt Flow 1: Tolak bila RS rujukan sedang tidak tersedia.
    if (hospital.status_ketersediaan !== "Tersedia") {
        throw new HttpError(
            409,
            "REFERRAL_HOSPITAL_UNAVAILABLE",
            `Rumah sakit rujukan sedang tidak tersedia (status: ${hospital.status_ketersediaan}).`,
        );
    }

    // No_rujukan unik; request bersamaan bisa memperoleh nomor yang sama.
    // Nomor dihitung ulang di transaksi baru setiap kali unique constraint menolak.
    for (let attempt = 1; attempt <= MAX_REFERRAL_NUMBER_ATTEMPTS; attempt += 1) {
        try {
            return await prisma.$transaction(async (tx) => {
                // UC-05 Alt Flow 2: Pastikan ketersediaan RS masih Tersedia saat transaksi dieksekusi.
                const freshHospital = await findHospitalById(id_rs, tx);
                if (!freshHospital || freshHospital.status_ketersediaan !== "Tersedia") {
                    throw new HttpError(
                        409,
                        "REFERRAL_HOSPITAL_UNAVAILABLE",
                        "Status rumah sakit rujukan berubah menjadi tidak tersedia sebelum konfirmasi.",
                    );
                }

                const created = await createReferral(tx, {
                    no_rujukan: await findNextReferralNumber(tx),
                    id_pasien,
                    id_rs,
                    id_akun,
                    tanggal_rujukan: new Date(),
                    alasan_rujukan: alasan_rujukan ?? null,
                    status: REFERRAL_STATUS.DIBUAT,
                });

                // PC-28: Simpan status penanganan & riwayat_status_pasien serta log_audit.
                await updatePasienStatusForReferral(tx, id_pasien, "Dirujuk");
                await createRiwayatStatusForReferral(tx, {
                    id_pasien,
                    id_akun,
                    status_sebelumnya: pasien.status_penanganan,
                    status_baru: REFERRAL_STATUS.DIBUAT,
                    keterangan: `Surat rujukan ${created.no_rujukan} diterbitkan ke ${freshHospital.nama_rs}`,
                });
                await createAuditLog(tx, {
                    id_akun,
                    nama_tabel: AUDIT_TABLE.REFERRAL,
                    id_referensi: created.id_surat,
                    aksi: AUDIT_ACTION.CREATE,
                    data_sesudah: { status: created.status, no_rujukan: created.no_rujukan },
                });

                return findReferralById(created.id_surat, tx);
            });
        } catch (err) {
            if (err.code !== "P2002") {
                throw err;
            }
            if (attempt === MAX_REFERRAL_NUMBER_ATTEMPTS) {
                throw new HttpError(409, "REFERRAL_NO_CONFLICT", "Nomor rujukan sedang dipakai, coba lagi.");
            }
        }
    }
}

export async function changeReferralStatus(id_surat, status_baru, id_akun) {
    const referral = await getReferral(id_surat);
    const allowed = REFERRAL_TRANSITIONS[referral.status] ?? [];

    if (!allowed.includes(status_baru)) {
        throw new HttpError(
            409,
            "REFERRAL_STATUS_INVALID",
            `Status ${referral.status} tidak dapat berubah menjadi ${status_baru}.`,
        );
    }

    return prisma.$transaction(async (tx) => {
        const updated = await updateReferralStatus(tx, id_surat, referral.status, status_baru);
        if (updated.count === 0) {
            throw new HttpError(409, "REFERRAL_STATUS_INVALID", "Status rujukan sudah diubah petugas lain.");
        }

        await createRiwayatStatusForReferral(tx, {
            id_pasien: referral.id_pasien,
            id_akun,
            status_sebelumnya: referral.status,
            status_baru,
            keterangan: `Status rujukan ${referral.no_rujukan} diubah menjadi ${status_baru}`,
        });
        await createAuditLog(tx, {
            id_akun,
            nama_tabel: AUDIT_TABLE.REFERRAL,
            id_referensi: id_surat,
            aksi: AUDIT_ACTION.STATUS_CHANGE,
            data_sebelum: { status: referral.status },
            data_sesudah: { status: status_baru },
        });

        return findReferralById(id_surat, tx);
    });
}
