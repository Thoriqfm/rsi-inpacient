import { HttpError } from "../../shared/errors/http-error.js";
import { createRme, findPasienForRme } from "./rme.model.js";

export async function addRme({ id_pasien, kode_tindakan, nama_tindakan, tanggal_tindakan, jumlah, keterangan }) {
    if (!(await findPasienForRme(id_pasien))) {
        throw new HttpError(404, "PASIEN_NOT_FOUND", "Pasien tidak ditemukan.");
    }

    // Data RME sumber bersifat read-only bagi modul History; hanya Super Admin menambah di sini.
    return createRme({
        id_pasien,
        kode_tindakan,
        nama_tindakan,
        tanggal_tindakan: tanggal_tindakan ?? new Date(),
        jumlah: jumlah ?? 1,
        keterangan: keterangan ?? null,
    });
}
