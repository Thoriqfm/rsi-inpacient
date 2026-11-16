import { HttpError } from "../errors/http-error.js";

// A recap can be written after checkout. Never substitute a later admission.
export function matchRecapAllocation(recap, allocations) {
    if (recap.id_alokasi != null) {
        const linked = allocations.find((row) => row.id_alokasi === recap.id_alokasi);
        if (!linked || linked.id_pasien !== recap.id_pasien || linked.status_alokasi === "Batal") {
            throw new HttpError(422, "ROOM_ALLOCATION_INVALID", "Alokasi pada rekap tidak valid untuk pasien ini.");
        }
        return linked;
    }
    const candidates = allocations.filter((row) => row.status_alokasi !== "Batal" && row.waktu_alokasi <= recap.tanggal_dibuat);
    if (candidates.length === 0) return null;
    const dates = recap.detail_rekap_tindakan_list.map((item) => item.tanggal_tindakan);
    const start = dates.length ? new Date(Math.min(...dates.map(Number))) : recap.tanggal_dibuat;
    const end = dates.length ? new Date(Math.max(...dates.map(Number))) : recap.tanggal_dibuat;
    const matches = candidates.filter((row) => row.waktu_alokasi <= start && (row.waktu_selesai === null || row.waktu_selesai >= end));
    if (matches.length === 1) return matches[0];
    if (matches.length === 0) {
        throw new HttpError(409, "ROOM_ALLOCATION_UNMATCHED", "Tanggal layanan pada rekap tidak cocok dengan periode alokasi pasien. Periksa riwayat rawat inap; biaya kamar tidak diambil dari kunjungan lain.");
    }
    throw new HttpError(409, "ROOM_ALLOCATION_AMBIGUOUS", "Rekap belum terhubung ke satu alokasi yang jelas. Periksa tanggal tindakan dan riwayat rawat inap; sistem tidak memilih kamar secara sembarang.");
}

export async function resolveRecapAllocation(recap, client) {
    const allocations = await client.rekamAlokasi.findMany({ where: recap.id_alokasi != null
        ? { id_alokasi: recap.id_alokasi } : { id_pasien: recap.id_pasien },
        include: { bed: { select: { no_bed: true } } },
        orderBy: { id_alokasi: "asc" },
    });
    return matchRecapAllocation(recap, allocations);
}
