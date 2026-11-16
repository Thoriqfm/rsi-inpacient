import bcrypt from "bcryptjs";
import prisma from "./prisma.js";
import { HOSPITAL_AVAILABILITY } from "../shared/constants/referral.js";

/**
 * Idempotent bootstrap seeder for initial SIMRS reference & test data.
 * Safe for both Supabase PostgreSQL and local MySQL:
 * - Only inserts missing records; never overwrites existing account passwords.
 */
export async function runBootstrapSeed() {
    try {
        // 1. Ensure 3 core demo accounts exist without overwriting existing passwords
        const defaultAccounts = [
            {
                username: "budi.santoso",
                nama_petugas: "Budi Santoso",
                role: "Petugas Bed Management",
            },
            {
                username: "rini.aprilianti",
                nama_petugas: "Rini Aprilianti",
                role: "Petugas Administrasi",
            },
            {
                username: "admin.demo",
                nama_petugas: "Budi Santoso (Super Admin)",
                role: "Super Admin",
            },
        ];

        const isProd = process.env.NODE_ENV === "production";
        const envSeedPassword = process.env.SEED_DEFAULT_PASSWORD;
        const canSeedAccounts = !isProd || (Boolean(envSeedPassword) && envSeedPassword.length >= 8);
        const seedPassword = envSeedPassword || "password123";
        let passwordHash = null;

        if (!canSeedAccounts) {
            console.warn(
                "[Bootstrap Seed] Melewati pembuatan akun default di produksi karena SEED_DEFAULT_PASSWORD belum disetel (>= 8 karakter).",
            );
        } else {
            for (const acc of defaultAccounts) {
                const existing = await prisma.akun.findFirst({
                    where: { username: acc.username },
                    select: { id_akun: true },
                });
                if (!existing) {
                    if (!passwordHash) {
                        passwordHash = await bcrypt.hash(seedPassword, 10);
                    }
                    await prisma.akun.create({
                        data: {
                            username: acc.username,
                            password: passwordHash,
                            nama_petugas: acc.nama_petugas,
                            role: acc.role,
                        },
                    });
                }
            }
        }

        const actor =
            (await prisma.akun.findFirst({
                where: { username: "rini.aprilianti" },
                select: { id_akun: true },
            })) ||
            (await prisma.akun.findFirst({
                orderBy: { id_akun: "asc" },
                select: { id_akun: true },
            }));

        if (!actor) {
            return;
        }
        const adminId = actor.id_akun;

        // 2. Seed Referral Hospitals (8 Rumah Sakit Rujukan Jejaring)
        const now = new Date();
        const hospitalList = [
            {
                nama_rs: "RS Umum Daerah Sehat Sentosa",
                alamat: "Jl. Melati No. 12, Kec. Gubeng",
                kontak: "0215550101",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TERSEDIA,
                terakhir_diperbarui: now,
            },
            {
                nama_rs: "RS Khusus Jantung Harapan",
                alamat: "Jl. Kenanga No. 7, Kec. Tegalsari",
                kontak: "0215550102",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TERSEDIA,
                terakhir_diperbarui: now,
            },
            {
                nama_rs: "RS Ibu dan Anak Bunda Kasih",
                alamat: "Jl. Anggrek No. 45, Kec. Wonokromo",
                kontak: "0215550103",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TERSEDIA,
                terakhir_diperbarui: now,
            },
            {
                nama_rs: "RS Umum Pusat Medika Nusantara",
                alamat: "Jl. Sudirman No. 88, Kec. Sawahan",
                kontak: "0215550104",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TIDAK_TERSEDIA,
                terakhir_diperbarui: null, // intentionally stale to test verification indicator
            },
            {
                nama_rs: "RS Ortopedi & Trauma Husada",
                alamat: "Jl. Gatot Subroto Kav. 19, Jakarta Selatan",
                kontak: "0215550105",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TERSEDIA,
                terakhir_diperbarui: now,
            },
            {
                nama_rs: "RS Paru & Respirasi Bakti Mulia",
                alamat: "Jl. Ahmad Yani No. 33, Jakarta Timur",
                kontak: "0215550106",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TERSEDIA,
                terakhir_diperbarui: now,
            },
            {
                nama_rs: "RS Pusat Otak & Saraf Cendekia",
                alamat: "Jl. MT Haryono No. 54, Jakarta Timur",
                kontak: "0215550107",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TERSEDIA,
                terakhir_diperbarui: now,
            },
            {
                nama_rs: "RS Emergency Graha Medika",
                alamat: "Jl. Kebon Jeruk Raya No. 21, Jakarta Barat",
                kontak: "0215550108",
                status_ketersediaan: HOSPITAL_AVAILABILITY.TIDAK_TERSEDIA,
                terakhir_diperbarui: now,
            },
        ];

        for (const h of hospitalList) {
            const exists = await prisma.rumahSakitRujukan.findFirst({
                where: { nama_rs: h.nama_rs },
                select: { id_rs: true },
            });
            if (!exists) {
                await prisma.rumahSakitRujukan.create({ data: h });
            }
        }

        // 3. Seed Patients (35 inpatient, queue, registered, & emergency patients)
        const patientSeedData = [
            // 14 pasien Rawat Inap aktif (menempati tepat 14 bed Terisi)
            { no_rm: "RM-2026-00142", nama_pasien: "Hendra Wijaya", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1981-05-14"), alamat: "Jl. Diponegoro No. 45", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00148", nama_pasien: "Siti Aminah", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1992-08-22"), alamat: "Jl. Ahmad Yani No. 18", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00209", nama_pasien: "Andi Kusuma", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1984-01-11"), alamat: "Jl. Pemuda No. 19", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-07") },
            { no_rm: "RM-2026-00210", nama_pasien: "Dian Permata", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1990-06-30"), alamat: "Jl. Raya Gubeng No. 77", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-07") },
            { no_rm: "RM-2026-00119", nama_pasien: "Agus Setiawan", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1975-12-01"), alamat: "Jl. Flamboyan No. 34", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00124", nama_pasien: "Nurul Hidayah", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1985-03-17"), alamat: "Jl. Kamboja No. 5", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-10") },
            { no_rm: "RM-2026-00211", nama_pasien: "Arif Rahman", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1982-09-08"), alamat: "Jl. Mayjen Sungkono No. 50", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-08") },
            { no_rm: "RM-2026-00212", nama_pasien: "Kartika Sari", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1994-04-21"), alamat: "Jl. Tunjungan No. 15", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-08") },
            { no_rm: "RM-2026-00131", nama_pasien: "Doni Pratama", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1993-09-25"), alamat: "Jl. Cempaka No. 88", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-07") },
            { no_rm: "RM-2026-00136", nama_pasien: "Ratna Permata", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1988-04-11"), alamat: "Jl. Dahlia No. 16", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-08") },
            { no_rm: "RM-2026-00213", nama_pasien: "Yoga Prasetya", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1977-11-19"), alamat: "Jl. Bukit Darmo No. 3", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-09") },
            { no_rm: "RM-2026-00139", nama_pasien: "Wahyu Nugroho", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1979-11-20"), alamat: "Jl. Teratai No. 27", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-09") },
            { no_rm: "RM-2026-00145", nama_pasien: "Lina Marlina", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1991-03-04"), alamat: "Jl. Seroja No. 8", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-09") },
            { no_rm: "RM-2026-00214", nama_pasien: "Nadia Putri", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1997-02-15"), alamat: "Jl. Kedungdoro No. 64", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-10") },

            // 3 pasien selesai alokasi kamar (alokasi Selesai + rekap Siap Billing)
            { no_rm: "RM-2026-00153", nama_pasien: "Ahmad Fauzi", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1968-02-10"), alamat: "Jl. Pahlawan No. 72", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00215", nama_pasien: "Dewi Kartika", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1986-07-18"), alamat: "Jl. Walikota Mustajab No. 29", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00216", nama_pasien: "Hendarto Gunawan", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1972-10-05"), alamat: "Jl. Kertajaya Indah No. 41", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-07") },

            // 6 pasien Menunggu Stabil di Daftar Tunggu FIFO (#01 - #06)
            { no_rm: "RM-2026-00161", nama_pasien: "Dewi Lestari", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1999-11-03"), alamat: "Jl. Mawar No. 9", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-11") },
            { no_rm: "RM-2026-00202", nama_pasien: "Maya Sari", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1989-01-28"), alamat: "Jl. Merdeka No. 55", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-11") },
            { no_rm: "RM-2026-00203", nama_pasien: "Fajar Ramadhan", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1995-02-14"), alamat: "Jl. Kartini No. 31", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-11") },
            { no_rm: "RM-2026-00204", nama_pasien: "Putri Wulandari", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1996-07-09"), alamat: "Jl. Pemuda No. 40", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-11") },
            { no_rm: "RM-2026-00217", nama_pasien: "Bima Sakti", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1991-12-03"), alamat: "Jl. Raya Manyar No. 22", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-12") },
            { no_rm: "RM-2026-00218", nama_pasien: "Sari Indah", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1993-05-27"), alamat: "Jl. Pucang Anom No. 14", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-12") },

            // 5 pasien Terdaftar Stabil baru (belum masuk antrean maupun kamar)
            { no_rm: "RM-2026-00205", nama_pasien: "Rizky Pratama", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1994-10-12"), alamat: "Jl. Kusuma Bangsa No. 12", status_penanganan: "Terdaftar", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-12") },
            { no_rm: "RM-2026-00206", nama_pasien: "Intan Permatasari", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1998-05-22"), alamat: "Jl. Basuki Rahmat No. 7", status_penanganan: "Terdaftar", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-12") },
            { no_rm: "RM-2026-00207", nama_pasien: "Bagus Santoso", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1987-08-19"), alamat: "Jl. Dharmahusada No. 63", status_penanganan: "Terdaftar", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-12") },
            { no_rm: "RM-2026-00219", nama_pasien: "Taufik Hidayat", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1988-03-14"), alamat: "Jl. Ngagel Jaya No. 81", status_penanganan: "Terdaftar", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-12") },
            { no_rm: "RM-2026-00220", nama_pasien: "Nisa Aulia", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("2000-01-09"), alamat: "Jl. Jemursari No. 37", status_penanganan: "Terdaftar", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-12") },

            // 4 pasien Darurat belum dirujuk (siap tes Rujukan RS)
            { no_rm: "RM-2026-00201", nama_pasien: "Eko Prasetyo", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1970-06-12"), alamat: "Jl. Veteran No. 14", status_penanganan: "Menunggu", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-11") },
            { no_rm: "RM-2026-00208", nama_pasien: "Surya Darmawan", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1978-09-03"), alamat: "Jl. Raya Darmo No. 92", status_penanganan: "Menunggu", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-12") },
            { no_rm: "RM-2026-00221", nama_pasien: "Yusuf Mansyur", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1969-11-28"), alamat: "Jl. Perak Barat No. 105", status_penanganan: "Menunggu", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-12") },
            { no_rm: "RM-2026-00222", nama_pasien: "Hesti Rahmawati", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1983-08-16"), alamat: "Jl. Rungkut Industri No. 12", status_penanganan: "Menunggu", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-12") },

            // 3 pasien Darurat sudah dirujuk (riwayat surat rujukan awal)
            { no_rm: "RM-2026-00110", nama_pasien: "Bambang Supriyadi", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1964-04-19"), alamat: "Jl. Kenanga No. 23", status_penanganan: "Dirujuk", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00115", nama_pasien: "Rina Kartika", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1997-07-30"), alamat: "Jl. Anggrek No. 11", status_penanganan: "Dirujuk", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00225", nama_pasien: "Kusuma Wijaya", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1962-01-24"), alamat: "Jl. Diponegoro No. 118", status_penanganan: "Dirujuk", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-10") },
        ];

        for (const p of patientSeedData) {
            const exists = await prisma.pasien.findUnique({
                where: { no_rm: p.no_rm },
                select: { id_pasien: true },
            });
            if (!exists) {
                await prisma.pasien.create({ data: p });
            }
        }

        // 4. Seed Beds (32 bed terstruktur di 4 bangsal; seluruh 14 bed Terisi punya pasien aktif)
        const bedCount = await prisma.bed.count({ where: { deleted_at: null } });
        if (bedCount === 0) {
            const bedsToCreate = [
                // Anggrek 1 (Kelas 1) - 8 bed (4 Terisi, 3 Tersedia, 1 Pembersihan)
                { no_bed: "BED-ANG-101", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 101", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Terisi" },
                { no_bed: "BED-ANG-102", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 102", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Terisi" },
                { no_bed: "BED-ANG-103", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 103", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Terisi" },
                { no_bed: "BED-ANG-104", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 104", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Terisi" },
                { no_bed: "BED-ANG-105", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 105", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Tersedia" },
                { no_bed: "BED-ANG-106", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 106", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Tersedia" },
                { no_bed: "BED-ANG-107", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 107", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Tersedia" },
                { no_bed: "BED-ANG-108", nama_bangsal: "Anggrek 1", nama_kamar: "Kamar 108", kelas_perawatan: "Kelas 1", tipe_bed: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", status: "Pembersihan" },

                // Cendana 2 (Kelas 2) - 8 bed (4 Terisi, 2 Tersedia, 1 Pembersihan, 1 Pemeliharaan)
                { no_bed: "BED-CEN-201", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 201", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Terisi" },
                { no_bed: "BED-CEN-202", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 202", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Terisi" },
                { no_bed: "BED-CEN-203", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 203", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Terisi" },
                { no_bed: "BED-CEN-204", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 204", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Terisi" },
                { no_bed: "BED-CEN-205", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 205", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Tersedia" },
                { no_bed: "BED-CEN-206", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 206", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Tersedia" },
                { no_bed: "BED-CEN-207", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 207", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Pembersihan" },
                { no_bed: "BED-CEN-208", nama_bangsal: "Cendana 2", nama_kamar: "Kamar 208", kelas_perawatan: "Kelas 2", tipe_bed: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", status: "Pemeliharaan" },

                // Paviliun VIP (VIP) - 8 bed (3 Terisi, 3 Tersedia, 1 Pembersihan, 1 Pemeliharaan)
                { no_bed: "BED-VIP-001", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 01", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Terisi" },
                { no_bed: "BED-VIP-002", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 02", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Terisi" },
                { no_bed: "BED-VIP-003", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 03", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Terisi" },
                { no_bed: "BED-VIP-004", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 04", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Tersedia" },
                { no_bed: "BED-VIP-005", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 05", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Tersedia" },
                { no_bed: "BED-VIP-006", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 06", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Tersedia" },
                { no_bed: "BED-VIP-007", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 07", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Pembersihan" },
                { no_bed: "BED-VIP-008", nama_bangsal: "Paviliun VIP", nama_kamar: "Suite 08", kelas_perawatan: "VIP", tipe_bed: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", status: "Pemeliharaan" },

                // Melati 3 (Kelas 3) - 8 bed (3 Terisi, 4 Tersedia, 1 Pembersihan)
                { no_bed: "BED-MEL-301", nama_bangsal: "Melati 3", nama_kamar: "Kamar 301", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Terisi" },
                { no_bed: "BED-MEL-302", nama_bangsal: "Melati 3", nama_kamar: "Kamar 302", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Terisi" },
                { no_bed: "BED-MEL-303", nama_bangsal: "Melati 3", nama_kamar: "Kamar 303", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Terisi" },
                { no_bed: "BED-MEL-304", nama_bangsal: "Melati 3", nama_kamar: "Kamar 304", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Tersedia" },
                { no_bed: "BED-MEL-305", nama_bangsal: "Melati 3", nama_kamar: "Kamar 305", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Tersedia" },
                { no_bed: "BED-MEL-306", nama_bangsal: "Melati 3", nama_kamar: "Kamar 306", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Tersedia" },
                { no_bed: "BED-MEL-307", nama_bangsal: "Melati 3", nama_kamar: "Kamar 307", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Tersedia" },
                { no_bed: "BED-MEL-308", nama_bangsal: "Melati 3", nama_kamar: "Kamar 308", kelas_perawatan: "Kelas 3", tipe_bed: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", status: "Pembersihan" },
            ].map((b) => ({ ...b, created_at: now, updated_at: now }));

            await prisma.bed.createMany({ data: bedsToCreate, skipDuplicates: true });
        }

        // 5. Seed Active Waiting Queue if none are currently waiting (6 pasien kondisi Stabil)
        const waitingCount = await prisma.daftarTunggu.count({
            where: { status: "Menunggu" },
        });
        if (waitingCount === 0) {
            const fifoRms = [
                "RM-2026-00161",
                "RM-2026-00202",
                "RM-2026-00203",
                "RM-2026-00204",
                "RM-2026-00217",
                "RM-2026-00218",
            ];
            const candidates = await prisma.pasien.findMany({
                where: { no_rm: { in: fifoRms } },
                include: {
                    rekam_alokasi_list: { where: { status_alokasi: "Aktif" }, select: { id_alokasi: true } },
                    daftar_tunggu_list: { where: { status: "Menunggu" }, select: { id_antrean: true } },
                },
            });

            const maxRow = await prisma.daftarTunggu.findFirst({
                orderBy: { no_antrean: "desc" },
                select: { no_antrean: true },
            });
            let nextNo = (maxRow?.no_antrean || 0) + 1;

            for (let idx = 0; idx < fifoRms.length; idx++) {
                const pasien = candidates.find((c) => c.no_rm === fifoRms[idx]);
                if (pasien && pasien.rekam_alokasi_list.length === 0 && pasien.daftar_tunggu_list.length === 0) {
                    const entryTime = new Date(now.getTime() - (fifoRms.length - idx) * 60 * 1000);
                    await prisma.daftarTunggu.create({
                        data: {
                            id_pasien: pasien.id_pasien,
                            id_akun: adminId,
                            waktu_masuk: entryTime,
                            no_antrean: nextNo++,
                            status: "Menunggu",
                            created_at: entryTime,
                        },
                    });
                }
            }
        }

        // 6. Seed Referral Letters if empty (3 surat rujukan awal)
        const referralCount = await prisma.suratRujukan.count();
        if (referralCount === 0) {
            const pBambang = await prisma.pasien.findUnique({ where: { no_rm: "RM-2026-00110" } });
            const pRina = await prisma.pasien.findUnique({ where: { no_rm: "RM-2026-00115" } });
            const pKusuma = await prisma.pasien.findUnique({ where: { no_rm: "RM-2026-00225" } });
            const rsJantung = await prisma.rumahSakitRujukan.findFirst({ where: { nama_rs: { contains: "Jantung" } } });
            const rsBunda = await prisma.rumahSakitRujukan.findFirst({ where: { nama_rs: { contains: "Bunda" } } });
            const rsSaraf = await prisma.rumahSakitRujukan.findFirst({ where: { nama_rs: { contains: "Otak" } } });

            if (pBambang && rsJantung) {
                await prisma.suratRujukan.create({
                    data: {
                        no_rujukan: "RUJ-20261111-001",
                        id_pasien: pBambang.id_pasien,
                        id_rs: rsJantung.id_rs,
                        id_akun: adminId,
                        tanggal_rujukan: now,
                        alasan_rujukan: "Kapasitas ruang ICCU sedang penuh; pasien membutuhkan intervensi Primary PCI segera.",
                        status: "Dikirim",
                        created_at: now,
                    },
                });
            }
            if (pRina && rsBunda) {
                await prisma.suratRujukan.create({
                    data: {
                        no_rujukan: "RUJ-20261111-002",
                        id_pasien: pRina.id_pasien,
                        id_rs: rsBunda.id_rs,
                        id_akun: adminId,
                        tanggal_rujukan: now,
                        alasan_rujukan: "Memerlukan ruang HCU Maternal dan NICU PONEK siaga 24 jam.",
                        status: "Dibuat",
                        created_at: now,
                    },
                });
            }
            if (pKusuma && rsSaraf) {
                await prisma.suratRujukan.create({
                    data: {
                        no_rujukan: "RUJ-20261111-003",
                        id_pasien: pKusuma.id_pasien,
                        id_rs: rsSaraf.id_rs,
                        id_akun: adminId,
                        tanggal_rujukan: now,
                        alasan_rujukan: "Suspek stroke hemoragik akut; memerlukan CT Scan Angiografi & bedah saraf.",
                        status: "Diterima",
                        created_at: now,
                    },
                });
            }
        }

        // 7. Seed Tariffs (10 Master Tariffs)
        const tarifList = [
            { kode: "TND-001", nama: "Visite Dokter Spesialis Penyakit Dalam", harga: "250000.00" },
            { kode: "TND-002", nama: "Pemeriksaan Darah Lengkap (Hematologi)", harga: "185000.00" },
            { kode: "TND-003", nama: "Pemasangan Infus & Cairan Ringer Lactate", harga: "120000.00" },
            { kode: "TND-004", nama: "Injeksi Antibiotik Ceftriaxone 1g", harga: "175000.00" },
            { kode: "TND-005", nama: "Elektrokardiogram (EKG 12-Lead)", harga: "150000.00" },
            { kode: "TND-006", nama: "Foto Thorax PA (Rontgen Dada)", harga: "220000.00" },
            { kode: "TND-007", nama: "Nebulisasi Salbutamol + Combivent", harga: "95000.00" },
            { kode: "TND-008", nama: "Pemasangan Kateter Urine Folley", harga: "110000.00" },
            { kode: "TND-009", nama: "Konsultasi DPJP Jantung & Pembuluh Darah", harga: "300000.00" },
            { kode: "TND-010", nama: "USG Abdomen 2 Dimensi", harga: "350000.00" },
        ];

        for (const t of tarifList) {
            const exists = await prisma.tarif.findFirst({
                where: { kode_tindakan: t.kode },
                select: { id_tarif: true },
            });
            if (!exists) {
                await prisma.tarif.create({
                    data: {
                        kode_tindakan: t.kode,
                        nama_tindakan: t.nama,
                        harga: t.harga,
                        tanggal_berlaku: new Date("2026-01-01"),
                        status: "Aktif",
                    },
                });
            }
        }

        // 7b. Seed Room Tariffs (4 Kelas Perawatan: VIP, Kelas 1, Kelas 2, Kelas 3)
        const roomTariffDefaults = [
            { kelas_perawatan: "VIP", harga_per_malam: "750000.00" },
            { kelas_perawatan: "Kelas 1", harga_per_malam: "450000.00" },
            { kelas_perawatan: "Kelas 2", harga_per_malam: "300000.00" },
            { kelas_perawatan: "Kelas 3", harga_per_malam: "175000.00" },
        ];
        const roomTariffByClass = new Map();
        for (const rt of roomTariffDefaults) {
            let existingRt = await prisma.tarifKamar.findFirst({
                where: { kelas_perawatan: rt.kelas_perawatan },
                orderBy: { tanggal_berlaku: "desc" },
            });
            if (!existingRt) {
                existingRt = await prisma.tarifKamar.create({
                    data: {
                        kelas_perawatan: rt.kelas_perawatan,
                        harga_per_malam: rt.harga_per_malam,
                        tanggal_berlaku: new Date("2026-01-01T00:00:00.000Z"),
                    },
                });
            }
            roomTariffByClass.set(rt.kelas_perawatan, existingRt);
        }

        // 8. Seed initial RekamAlokasi for seeded Rawat Inap patients & RME Dummy
        const allPatients = await prisma.pasien.findMany();
        const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const rmeTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        const existingAllocationCount = await prisma.rekamAlokasi.count();
        if (existingAllocationCount === 0) {
            // Pasangkan tepat 1-per-1 antara 14 pasien Rawat Inap aktif dengan 14 bed berstatus Terisi
            const activeBedOccupants = [
                { no_rm: "RM-2026-00142", no_bed: "BED-ANG-101" },
                { no_rm: "RM-2026-00148", no_bed: "BED-ANG-102" },
                { no_rm: "RM-2026-00209", no_bed: "BED-ANG-103" },
                { no_rm: "RM-2026-00210", no_bed: "BED-ANG-104" },
                { no_rm: "RM-2026-00119", no_bed: "BED-CEN-201" },
                { no_rm: "RM-2026-00124", no_bed: "BED-CEN-202" },
                { no_rm: "RM-2026-00211", no_bed: "BED-CEN-203" },
                { no_rm: "RM-2026-00212", no_bed: "BED-CEN-204" },
                { no_rm: "RM-2026-00131", no_bed: "BED-VIP-001" },
                { no_rm: "RM-2026-00136", no_bed: "BED-VIP-002" },
                { no_rm: "RM-2026-00213", no_bed: "BED-VIP-003" },
                { no_rm: "RM-2026-00139", no_bed: "BED-MEL-301" },
                { no_rm: "RM-2026-00145", no_bed: "BED-MEL-302" },
                { no_rm: "RM-2026-00214", no_bed: "BED-MEL-303" },
            ];
            const allBeds = await prisma.bed.findMany({ where: { deleted_at: null } });
            for (const pair of activeBedOccupants) {
                const p = allPatients.find((row) => row.no_rm === pair.no_rm);
                const b = allBeds.find((row) => row.no_bed === pair.no_bed);
                const rt = b ? roomTariffByClass.get(b.kelas_perawatan) : null;
                if (p && b && rt) {
                    await prisma.rekamAlokasi.create({
                        data: {
                            id_pasien: p.id_pasien,
                            id_bed: b.id_bed,
                            id_akun: adminId,
                            waktu_alokasi: yesterday,
                            status_alokasi: "Aktif",
                            id_tarif_kamar: rt.id_tarif_kamar,
                            kelas_perawatan_snapshot: rt.kelas_perawatan,
                            harga_per_malam_snapshot: rt.harga_per_malam,
                        },
                    });
                }
            }

            // Alokasi selesai untuk 3 pasien Siap Billing pada 3 bed berstatus Pembersihan
            const finishedBedOccupants = [
                { no_rm: "RM-2026-00153", no_bed: "BED-VIP-007" },
                { no_rm: "RM-2026-00215", no_bed: "BED-ANG-108" },
                { no_rm: "RM-2026-00216", no_bed: "BED-MEL-308" },
            ];
            for (const pair of finishedBedOccupants) {
                const p = allPatients.find((row) => row.no_rm === pair.no_rm);
                const b = allBeds.find((row) => row.no_bed === pair.no_bed);
                const rt = b ? roomTariffByClass.get(b.kelas_perawatan) : null;
                if (p && b && rt) {
                    await prisma.rekamAlokasi.create({
                        data: {
                            id_pasien: p.id_pasien,
                            id_bed: b.id_bed,
                            id_akun: adminId,
                            waktu_alokasi: yesterday,
                            waktu_selesai: oneHourAgo,
                            status_alokasi: "Selesai",
                            id_tarif_kamar: rt.id_tarif_kamar,
                            kelas_perawatan_snapshot: rt.kelas_perawatan,
                            harga_per_malam_snapshot: rt.harga_per_malam,
                        },
                    });
                }
            }
        }

        // Seed RME Dummy hanya untuk pasien yang sudah Rawat Inap / Dirujuk (bukan Menunggu / Terdaftar)
        for (const p of allPatients) {
            if (p.status_penanganan === "Menunggu" || p.status_penanganan === "Terdaftar") {
                continue;
            }
            const existingRme = await prisma.rmeDummy.count({ where: { id_pasien: p.id_pasien } });
            if (existingRme === 0) {
                await prisma.rmeDummy.createMany({
                    data: [
                        {
                            id_pasien: p.id_pasien,
                            kode_tindakan: "TND-001",
                            nama_tindakan: "Visite Dokter Spesialis Penyakit Dalam",
                            tanggal_tindakan: rmeTime,
                            jumlah: 1,
                            keterangan: `Evaluasi klinis harian (${p.nama_pasien})`,
                        },
                        {
                            id_pasien: p.id_pasien,
                            kode_tindakan: "TND-002",
                            nama_tindakan: "Pemeriksaan Darah Lengkap (Hematologi)",
                            tanggal_tindakan: rmeTime,
                            jumlah: 1,
                            keterangan: "Cek darah rutin panel rawat inap",
                        },
                        {
                            id_pasien: p.id_pasien,
                            kode_tindakan: "TND-003",
                            nama_tindakan: "Pemasangan Infus & Cairan Ringer Lactate",
                            tanggal_tindakan: rmeTime,
                            jumlah: 2,
                            keterangan: "Pemeliharaan terapi cairan intravena",
                        },
                    ],
                });
            }
        }

        // 9. Seed initial Rekap Tindakan (3 Siap Billing + 1 Draft) if table is empty
        const existingRecapCount = await prisma.rekapTindakan.count({
            where: { deleted_at: null },
        });
        if (existingRecapCount === 0 && allPatients.length > 0) {
            const stamp = Date.now().toString().slice(-6);
            const initialRecapConfigs = [
                {
                    no_rm: "RM-2026-00153",
                    kode_rekap: `RKP-READY-${stamp}-1`,
                    status: "Siap Billing",
                    catatan: "Rekap siap cetak & hitung tagihan (VIP) untuk pengujian modul Billing.",
                    keterangan: "Tervalidasi oleh DPJP Penyakit Dalam.",
                },
                {
                    no_rm: "RM-2026-00215",
                    kode_rekap: `RKP-READY-${stamp}-2`,
                    status: "Siap Billing",
                    catatan: "Rekap siap cetak & hitung tagihan (Kelas 1) untuk pengujian modul Billing.",
                    keterangan: "Tervalidasi oleh DPJP Penyakit Dalam.",
                },
                {
                    no_rm: "RM-2026-00216",
                    kode_rekap: `RKP-READY-${stamp}-3`,
                    status: "Siap Billing",
                    catatan: "Rekap siap cetak & hitung tagihan (Kelas 3) untuk pengujian modul Billing.",
                    keterangan: "Tervalidasi oleh DPJP Penyakit Dalam.",
                },
                {
                    no_rm: "RM-2026-00148",
                    kode_rekap: `RKP-DRAFT-${stamp}-4`,
                    status: "Draft",
                    catatan: "Draft rekap tindakan rawat inap (siap diedit/difinalisasi pada modul Rekap Layanan).",
                    keterangan: "Menunggu verifikasi tindakan tambahan harian.",
                },
            ];

            for (const cfg of initialRecapConfigs) {
                const targetPasien = allPatients.find((p) => p.no_rm === cfg.no_rm);
                if (!targetPasien) continue;

                const rmeItems = await prisma.rmeDummy.findMany({
                    where: { id_pasien: targetPasien.id_pasien },
                    take: 3,
                });
                const patientAllocation = await prisma.rekamAlokasi.findFirst({
                    where: { id_pasien: targetPasien.id_pasien, status_alokasi: { not: "Batal" } },
                    orderBy: { id_alokasi: "desc" },
                });

                if (rmeItems.length > 0) {
                    await prisma.rekapTindakan.create({
                        data: {
                            kode_rekap: cfg.kode_rekap,
                            id_pasien: targetPasien.id_pasien,
                            id_alokasi: patientAllocation?.id_alokasi ?? null,
                            id_akun: adminId,
                            status: cfg.status,
                            catatan: cfg.catatan,
                            keterangan: cfg.keterangan,
                            detail_rekap_tindakan_list: {
                                create: rmeItems.map((r) => ({
                                    id_riwayat: r.id_riwayat,
                                    kode_tindakan: r.kode_tindakan,
                                    nama_tindakan: r.nama_tindakan,
                                    tanggal_tindakan: r.tanggal_tindakan,
                                    jumlah: r.jumlah,
                                })),
                            },
                        },
                    });
                }
            }
        }

        // 10. Seed Riwayat Status Pasien if empty
        const riwayatCount = await prisma.riwayatStatusPasien.count();
        if (riwayatCount === 0 && allPatients.length > 0) {
            const pHendra = allPatients.find((p) => p.no_rm === "RM-2026-00142") || allPatients[0];
            const pBambang = allPatients.find((p) => p.no_rm === "RM-2026-00110") || allPatients[0];
            await prisma.riwayatStatusPasien.createMany({
                data: [
                    {
                        id_pasien: pHendra.id_pasien,
                        id_akun: adminId,
                        status_sebelumnya: "Menunggu",
                        status_baru: "Rawat Inap",
                        keterangan: "Pasien berhasil dialokasikan ke kamar Anggrek 1.",
                        waktu_perubahan: now,
                    },
                    {
                        id_pasien: pBambang.id_pasien,
                        id_akun: adminId,
                        status_sebelumnya: "Menunggu",
                        status_baru: "Dirujuk",
                        keterangan: "Dirujuk ke RS Khusus Jantung Harapan karena kapasitas ICCU penuh.",
                        waktu_perubahan: now,
                    },
                ],
            });
        }

        console.log("[Bootstrap Seed] Database siap untuk pengujian E2E.");
    } catch (err) {
        console.warn("[Bootstrap Seed] Peringatan saat sinkronisasi data awal:", err.message);
    }
}

