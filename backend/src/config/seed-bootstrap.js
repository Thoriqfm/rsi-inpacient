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

        const seedPassword = process.env.SEED_DEFAULT_PASSWORD || "password123";
        let passwordHash = null;

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

        // 3. Seed Patients (11 inpatient & emergency patients)
        const patientSeedData = [
            { no_rm: "RM-2026-00142", nama_pasien: "Hendra Wijaya", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1981-05-14"), alamat: "Jl. Diponegoro No. 45", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00148", nama_pasien: "Siti Aminah", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1992-08-22"), alamat: "Jl. Ahmad Yani No. 18", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00153", nama_pasien: "Ahmad Fauzi", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1968-02-10"), alamat: "Jl. Pahlawan No. 72", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00161", nama_pasien: "Dewi Lestari", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1999-11-03"), alamat: "Jl. Mawar No. 9", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-11") },
            { no_rm: "RM-2026-00110", nama_pasien: "Bambang Supriyadi", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1964-04-19"), alamat: "Jl. Kenanga No. 23", status_penanganan: "Dirujuk", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00115", nama_pasien: "Rina Kartika", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1997-07-30"), alamat: "Jl. Anggrek No. 11", status_penanganan: "Dirujuk", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00119", nama_pasien: "Agus Setiawan", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1975-12-01"), alamat: "Jl. Flamboyan No. 34", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-06") },
            { no_rm: "RM-2026-00124", nama_pasien: "Nurul Hidayah", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1985-03-17"), alamat: "Jl. Kamboja No. 5", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-10") },
            { no_rm: "RM-2026-00131", nama_pasien: "Doni Pratama", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1993-09-25"), alamat: "Jl. Cempaka No. 88", status_penanganan: "Rawat Inap", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-07") },
            { no_rm: "RM-2026-00201", nama_pasien: "Eko Prasetyo", jenis_kelamin: "Laki-laki", tanggal_lahir: new Date("1970-06-12"), alamat: "Jl. Veteran No. 14", status_penanganan: "Menunggu", kondisi_pasien: "Darurat", tanggal_masuk: new Date("2026-11-11") },
            { no_rm: "RM-2026-00202", nama_pasien: "Maya Sari", jenis_kelamin: "Perempuan", tanggal_lahir: new Date("1989-01-28"), alamat: "Jl. Merdeka No. 55", status_penanganan: "Menunggu", kondisi_pasien: "Stabil", tanggal_masuk: new Date("2026-11-11") },
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

        // 4. Seed Beds (If active bed count is 0, create 66 inpatient beds across 4 wards)
        const bedCount = await prisma.bed.count({ where: { deleted_at: null } });
        if (bedCount === 0) {
            const bedsToCreate = [];
            const wards = [
                { prefix: "ANG", bangsal: "Anggrek 1", kelas: "Kelas 1", tipe: "2 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central", count: 20, start: 101 },
                { prefix: "CEN", bangsal: "Cendana 2", kelas: "Kelas 2", tipe: "4 Bed/Rm", fasilitas: "1 Tempat Tidur, AC, Kamar Mandi Dalam, TV LED", count: 18, start: 201 },
                { prefix: "VIP", bangsal: "Paviliun VIP", kelas: "VIP", tipe: "1 Bed/Rm", fasilitas: "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas Mini", count: 10, start: 1 },
                { prefix: "MEL", bangsal: "Melati 3", kelas: "Kelas 3", tipe: "6 Bed/Rm", fasilitas: "1 Tempat Tidur, Kipas Sentral, Oksigen Wall Outlet", count: 18, start: 301 },
            ];
            let globalIdx = 0;
            for (const w of wards) {
                for (let i = 0; i < w.count; i++) {
                    const numStr = w.prefix === "VIP" ? String(w.start + i).padStart(3, "0") : String(w.start + i);
                    const no_bed = `BED-${w.prefix}-${numStr}`;
                    const nama_kamar = w.prefix === "VIP" ? `Suite ${String(w.start + i).padStart(2, "0")}` : `Kamar ${numStr}`;
                    let status = "Tersedia";
                    if (globalIdx < 42) status = "Terisi";
                    else if (globalIdx < 47) status = "Pembersihan";
                    else if (globalIdx < 51) status = "Pemeliharaan";

                    if (no_bed === "BED-ANG-105" || no_bed === "BED-ANG-106" || no_bed === "BED-ANG-108") {
                        status = "Tersedia";
                    }

                    bedsToCreate.push({
                        no_bed,
                        nama_bangsal: w.bangsal,
                        nama_kamar,
                        kelas_perawatan: w.kelas,
                        tipe_bed: w.tipe,
                        fasilitas: w.fasilitas,
                        status,
                        created_at: now,
                        updated_at: now,
                    });
                    globalIdx++;
                }
            }
            await prisma.bed.createMany({ data: bedsToCreate, skipDuplicates: true });
        }

        // 5. Seed Active Waiting Queue if none are currently waiting
        const waitingCount = await prisma.daftarTunggu.count({
            where: { status: "Menunggu" },
        });
        if (waitingCount === 0) {
            const candidates = await prisma.pasien.findMany({
                where: { no_rm: { in: ["RM-2026-00201", "RM-2026-00161", "RM-2026-00202"] } },
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

            for (const pasien of candidates) {
                if (pasien.rekam_alokasi_list.length === 0 && pasien.daftar_tunggu_list.length === 0) {
                    await prisma.daftarTunggu.create({
                        data: {
                            id_pasien: pasien.id_pasien,
                            id_akun: adminId,
                            waktu_masuk: new Date(),
                            no_antrean: nextNo++,
                            status: "Menunggu",
                            created_at: new Date(),
                        },
                    });
                }
            }
        }

        // 6. Seed Referral Letters if empty
        const referralCount = await prisma.suratRujukan.count();
        if (referralCount === 0) {
            const pBambang = await prisma.pasien.findUnique({ where: { no_rm: "RM-2026-00110" } });
            const pRina = await prisma.pasien.findUnique({ where: { no_rm: "RM-2026-00115" } });
            const rsJantung = await prisma.rumahSakitRujukan.findFirst({ where: { nama_rs: { contains: "Jantung" } } });
            const rsBunda = await prisma.rumahSakitRujukan.findFirst({ where: { nama_rs: { contains: "Bunda" } } });

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

        // 8. Seed RME Dummy for any patient without RME rows yet
        const allPatients = await prisma.pasien.findMany();
        for (const p of allPatients) {
            const existingRme = await prisma.rmeDummy.count({ where: { id_pasien: p.id_pasien } });
            if (existingRme === 0) {
                await prisma.rmeDummy.createMany({
                    data: [
                        {
                            id_pasien: p.id_pasien,
                            kode_tindakan: "TND-001",
                            nama_tindakan: "Visite Dokter Spesialis Penyakit Dalam",
                            tanggal_tindakan: now,
                            jumlah: 1,
                            keterangan: `Evaluasi klinis harian (${p.nama_pasien})`,
                        },
                        {
                            id_pasien: p.id_pasien,
                            kode_tindakan: "TND-002",
                            nama_tindakan: "Pemeriksaan Darah Lengkap (Hematologi)",
                            tanggal_tindakan: now,
                            jumlah: 1,
                            keterangan: "Cek darah rutin panel rawat inap",
                        },
                        {
                            id_pasien: p.id_pasien,
                            kode_tindakan: "TND-003",
                            nama_tindakan: "Pemasangan Infus & Cairan Ringer Lactate",
                            tanggal_tindakan: now,
                            jumlah: 2,
                            keterangan: "Pemeliharaan terapi cairan intravena",
                        },
                    ],
                });
            }
        }

        // 9. Ensure at least one Rekap Tindakan is 'Siap Billing' without an active Tagihan
        const siapBillingRecaps = await prisma.rekapTindakan.findMany({
            where: { status: "Siap Billing", deleted_at: null },
            include: { tagihan_list: { where: { status: { not: "Batal" } } } },
        });
        const unbilledReadyRecap = siapBillingRecaps.find((r) => r.tagihan_list.length === 0);

        if (!unbilledReadyRecap && allPatients.length > 0) {
            const targetPasien =
                allPatients.find((p) => p.no_rm === "RM-2026-00153") ||
                allPatients[0];

            const rmeItems = await prisma.rmeDummy.findMany({
                where: { id_pasien: targetPasien.id_pasien },
                take: 3,
            });

            if (rmeItems.length > 0) {
                await prisma.rekapTindakan.create({
                    data: {
                        kode_rekap: `RKP-READY-${Date.now().toString().slice(-6)}`,
                        id_pasien: targetPasien.id_pasien,
                        id_akun: adminId,
                        status: "Siap Billing",
                        catatan: "Rekap siap cetak & hitung tagihan untuk pengujian modul Billing.",
                        keterangan: "Tervalidasi oleh DPJP Penyakit Dalam.",
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

