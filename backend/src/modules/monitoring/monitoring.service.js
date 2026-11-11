import { HOSPITAL_STALE_MS } from "../../shared/constants/referral.js";
import { buildMonitoringWhere, countMonitoringRows, findMonitoringRows } from "./monitoring.model.js";

// Rentang tanggal dipetakan ke daftar_tunggu.waktu_masuk (DECISION REQUIRED).
function buildTimeFilter({ dari, sampai }) {
    if (!dari && !sampai) {
        return undefined;
    }

    return {
        ...(dari ? { gte: new Date(`${dari}T00:00:00`) } : {}),
        ...(sampai ? { lt: new Date(new Date(`${sampai}T00:00:00`).getTime() + 86_400_000) } : {}),
    };
}

function toHospitalMonitoring(hospital, now) {
    if (!hospital) {
        return null;
    }

    return {
        id_rs: hospital.id_rs,
        nama_rs: hospital.nama_rs,
        alamat: hospital.alamat,
        kontak: hospital.kontak,
        status_ketersediaan: hospital.status_ketersediaan,
        terakhir_diperbarui: hospital.terakhir_diperbarui,
        // Sama dengan aturan modul Referral: null atau lebih dari 5 menit berarti stale.
        stale: !hospital.terakhir_diperbarui || now - hospital.terakhir_diperbarui > HOSPITAL_STALE_MS,
    };
}

function toMonitoringItem(pasien, now) {
    const [antrean] = pasien.daftar_tunggu_list;
    const [rujukan] = pasien.surat_rujukan_list;

    // Pasien tanpa antrean/rujukan tetap aman: bagian yang tidak ada bernilai null.
    return {
        id_pasien: pasien.id_pasien,
        no_rm: pasien.no_rm,
        nama_pasien: pasien.nama_pasien,
        kondisi_pasien: pasien.kondisi_pasien,
        status_penanganan: pasien.status_penanganan,
        tanggal_masuk: pasien.tanggal_masuk,
        tanggal_keluar: pasien.tanggal_keluar,
        antrean: antrean
            ? {
                  id_antrean: antrean.id_antrean,
                  no_antrean: antrean.no_antrean,
                  status: antrean.status,
                  waktu_masuk: antrean.waktu_masuk,
                  dicatat_oleh: antrean.akun?.nama_petugas ?? null,
                  alokasi: antrean.rekam_alokasi
                      ? {
                            id_alokasi: antrean.rekam_alokasi.id_alokasi,
                            status_alokasi: antrean.rekam_alokasi.status_alokasi,
                            waktu_alokasi: antrean.rekam_alokasi.waktu_alokasi,
                            bed: antrean.rekam_alokasi.bed,
                        }
                      : null,
              }
            : null,
        rujukan: rujukan
            ? {
                  id_surat: rujukan.id_surat,
                  no_rujukan: rujukan.no_rujukan,
                  status: rujukan.status,
                  tanggal_rujukan: rujukan.tanggal_rujukan,
                  alasan_rujukan: rujukan.alasan_rujukan,
                  dibuat_oleh: rujukan.akun?.nama_petugas ?? null,
                  rumah_sakit: toHospitalMonitoring(rujukan.rumah_sakit_rujukan, now),
              }
            : null,
        riwayat_status: (pasien.riwayat_status_pasien_list ?? []).map((item) => ({
            id_riwayat_status: item.id_riwayat_status,
            status_sebelumnya: item.status_sebelumnya,
            status_baru: item.status_baru,
            keterangan: item.keterangan,
            waktu_perubahan: item.waktu_perubahan,
            diubah_oleh: item.akun?.nama_petugas ?? null,
        })),
    };
}

export async function listMonitoring(query) {
    const where = buildMonitoringWhere({ ...query, waktuFilter: buildTimeFilter(query) });
    const { page, limit } = query;
    const [rows, total] = await Promise.all([
        findMonitoringRows(where, { skip: (page - 1) * limit, take: limit }),
        countMonitoringRows(where),
    ]);

    const now = Date.now();

    return {
        items: rows.map((row) => toMonitoringItem(row, now)),
        meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}
