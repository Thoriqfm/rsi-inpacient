// Seed tarif sintetis dari kode tindakan yang ada di rme_dummy. Idempoten.
// Jalankan dari backend: node prisma/seed-tariffs.js
import "dotenv/config";
import prisma from "../src/config/prisma.js";

const HARGA_DEFAULT = "150000.00";
const TANGGAL_BERLAKU = new Date("2020-01-01T00:00:00.000Z");

const tindakan = await prisma.rmeDummy.findMany({
    select: { kode_tindakan: true, nama_tindakan: true },
    distinct: ["kode_tindakan"],
    orderBy: { kode_tindakan: "asc" },
});

let created = 0;
let skipped = 0;

for (const row of tindakan) {
    const existing = await prisma.tarif.findFirst({
        where: { kode_tindakan: row.kode_tindakan },
        select: { id_tarif: true },
    });

    if (existing) {
        skipped += 1;
        continue;
    }

    await prisma.tarif.create({
        data: {
            kode_tindakan: row.kode_tindakan,
            nama_tindakan: row.nama_tindakan,
            harga: HARGA_DEFAULT,
            tanggal_berlaku: TANGGAL_BERLAKU,
            tanggal_berakhir: null,
            status: "Aktif",
        },
    });
    created += 1;
}

console.log(`Selesai: ${created} tarif dibuat, ${skipped} dilewati (sudah ada).`);
await prisma.$disconnect();
