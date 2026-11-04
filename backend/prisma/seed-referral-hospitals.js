// Seed data sintetis rumah sakit rujukan. Jalankan hanya untuk database lokal:
//   node prisma/seed-referral-hospitals.js
// Idempoten: tidak menambah baris bila tabel sudah berisi data.
import "dotenv/config";
import prisma from "../src/config/prisma.js";
import { HOSPITAL_AVAILABILITY } from "../src/shared/constants/referral.js";

const hospitals = [
    { nama_rs: "RS Umum Daerah Sehat Sentosa", alamat: "Jl. Melati No. 12", kontak: "0215550101" },
    { nama_rs: "RS Khusus Jantung Harapan", alamat: "Jl. Kenanga No. 7", kontak: "0215550102" },
    { nama_rs: "RS Ibu dan Anak Bunda Kasih", alamat: "Jl. Anggrek No. 45", kontak: "0215550103" },
    { nama_rs: "RS Umum Pusat Medika Nusantara", alamat: "Jl. Sudirman No. 88", kontak: "0215550104" },
].map((hospital) => ({
    ...hospital,
    // Belum dikonfirmasi petugas: status awal aman dan tampil stale sampai diperbarui.
    status_ketersediaan: HOSPITAL_AVAILABILITY.TIDAK_TERSEDIA,
    terakhir_diperbarui: null,
}));

const existing = await prisma.rumahSakitRujukan.count();

if (existing > 0) {
    console.log(`Dilewati: sudah ada ${existing} rumah sakit rujukan.`);
} else {
    const created = await prisma.rumahSakitRujukan.createMany({ data: hospitals });
    console.log(`Ditambahkan ${created.count} rumah sakit rujukan (status Tidak Tersedia).`);
}

await prisma.$disconnect();
