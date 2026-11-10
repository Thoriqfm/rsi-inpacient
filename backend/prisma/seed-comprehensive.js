// Skrip seeder komprehensif data RME Dummy, Tarif, Rekap Tindakan, dan Tagihan Billing.
// Idempoten (aman dijalankan berkali-kali).
import "dotenv/config";
import prisma from "../src/config/prisma.js";

async function main() {
  console.log("=== Memulai Sinkronisasi Data Seeder SIMRS ===");

  const rini = await prisma.akun.findFirst({
    where: { username: "rini.aprilianti" },
  });
  if (!rini) {
    throw new Error("Akun rini.aprilianti tidak ditemukan di database!");
  }
  const idAkunAdmin = rini.id_akun;

  // 1. Seed Tarif Dasar Tindakan
  const tarifData = [
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

  const tarifMap = new Map();
  for (const t of tarifData) {
    let row = await prisma.tarif.findFirst({
      where: { kode_tindakan: t.kode },
    });
    if (!row) {
      row = await prisma.tarif.create({
        data: {
          kode_tindakan: t.kode,
          nama_tindakan: t.nama,
          harga: t.harga,
          tanggal_berlaku: new Date("2026-01-01"),
          status: "Aktif",
        },
      });
    }
    tarifMap.set(t.kode, row);
  }
  console.log(`[OK] ${tarifData.length} master tarif tindakan aktif.`);

  // 2. Seed RME Dummy untuk Pasien 101, 102, 105
  const rmeSamples = [
    // Pasien 101 (Hendra Wijaya)
    { id_pasien: 101, kode: "TND-001", nama: "Visite Dokter Spesialis Penyakit Dalam", tgl: "2026-11-07T08:30:00Z", jml: 1, ket: "Kondisi stabil, trombosit 98.000" },
    { id_pasien: 101, kode: "TND-002", nama: "Pemeriksaan Darah Lengkap (Hematologi)", tgl: "2026-11-07T09:15:00Z", jml: 1, ket: "Evaluasi serial trombosit & leukosit" },
    { id_pasien: 101, kode: "TND-003", nama: "Pemasangan Infus & Cairan Ringer Lactate", tgl: "2026-11-07T10:00:00Z", jml: 2, ket: "Rehidrasi kristaloid 20 tpm" },
    { id_pasien: 101, kode: "TND-004", nama: "Injeksi Antibiotik Ceftriaxone 1g", tgl: "2026-11-08T06:00:00Z", jml: 2, ket: "Dosis kedua intravena" },

    // Pasien 102 (Siti Aminah)
    { id_pasien: 102, kode: "TND-001", nama: "Visite Dokter Spesialis Penyakit Dalam", tgl: "2026-11-08T09:00:00Z", jml: 1, ket: "Evaluasi post-partum hari ke-2" },
    { id_pasien: 102, kode: "TND-005", nama: "Elektrokardiogram (EKG 12-Lead)", tgl: "2026-11-08T10:30:00Z", jml: 1, ket: "Irama sinus ritmis, TD terkontrol" },
    { id_pasien: 102, kode: "TND-002", nama: "Pemeriksaan Darah Lengkap (Hematologi)", tgl: "2026-11-08T11:00:00Z", jml: 1, ket: "Hb 11.8 g/dL, leukosit normal" },

    // Pasien 105 (Bambang Supriyadi)
    { id_pasien: 105, kode: "TND-009", nama: "Konsultasi DPJP Jantung & Pembuluh Darah", tgl: "2026-11-06T14:00:00Z", jml: 1, ket: "Evaluasi pasca heparinisasi STEMI" },
    { id_pasien: 105, kode: "TND-005", nama: "Elektrokardiogram (EKG 12-Lead)", tgl: "2026-11-06T15:00:00Z", jml: 2, ket: "Serial EKG evaluasi elevasi segmen ST" },
    { id_pasien: 105, kode: "TND-006", nama: "Foto Thorax PA (Rontgen Dada)", tgl: "2026-11-06T16:30:00Z", jml: 1, ket: "Kardiomegali dengan tanda kongesti vaskular paru" },
    { id_pasien: 105, kode: "TND-007", nama: "Nebulisasi Salbutamol + Combivent", tgl: "2026-11-07T07:00:00Z", jml: 2, ket: "Mengatasi sesak & wheezing" },
  ];

  const rmeMap = [];
  for (const r of rmeSamples) {
    let existing = await prisma.rmeDummy.findFirst({
      where: {
        id_pasien: r.id_pasien,
        kode_tindakan: r.kode,
        tanggal_tindakan: new Date(r.tgl),
      },
    });
    if (!existing) {
      existing = await prisma.rmeDummy.create({
        data: {
          id_pasien: r.id_pasien,
          kode_tindakan: r.kode,
          nama_tindakan: r.nama,
          tanggal_tindakan: new Date(r.tgl),
          jumlah: r.jml,
          keterangan: r.ket,
        },
      });
    }
    rmeMap.push(existing);
  }
  console.log(`[OK] ${rmeMap.length} item RME Dummy siap digunakan.`);

  // 3. Seed Rekap Tindakan (Draft, Proses Verifikasi, Siap Billing)
  // Rekap 1: Hendra Wijaya (101) -> Siap Billing
  let rekap1 = await prisma.rekapTindakan.findFirst({
    where: { kode_rekap: "RKP-20261108-001" },
  });
  if (!rekap1) {
    rekap1 = await prisma.rekapTindakan.create({
      data: {
        kode_rekap: "RKP-20261108-001",
        id_pasien: 101,
        id_akun: idAkunAdmin,
        status: "Siap Billing",
        catatan: "Seluruh tindakan rawat inap 3 hari telah divalidasi DPJP dan kepala perawat.",
        keterangan: "Siap untuk kalkulasi tagihan invoice resmi rawat inap.",
        tanggal_dibuat: new Date("2026-11-08T10:00:00Z"),
      },
    });

    // Detail rekap 1
    const p1Rme = rmeMap.filter((m) => m.id_pasien === 101);
    for (const r of p1Rme) {
      await prisma.detailRekapTindakan.create({
        data: {
          id_rekap: rekap1.id_rekap,
          id_riwayat: r.id_riwayat,
          kode_tindakan: r.kode_tindakan,
          nama_tindakan: r.nama_tindakan,
          tanggal_tindakan: r.tanggal_tindakan,
          jumlah: r.jumlah,
        },
      });
    }
  }

  // Rekap 2: Siti Aminah (102) -> Proses Verifikasi
  let rekap2 = await prisma.rekapTindakan.findFirst({
    where: { kode_rekap: "RKP-20261108-002" },
  });
  if (!rekap2) {
    rekap2 = await prisma.rekapTindakan.create({
      data: {
        kode_rekap: "RKP-20261108-002",
        id_pasien: 102,
        id_akun: idAkunAdmin,
        status: "Proses Verifikasi",
        catatan: "Menunggu tanda tangan digital resume medis dari DPJP spesialis kebidanan.",
        keterangan: "Verifikasi tindakan kebidanan dan laboratorium darah.",
        tanggal_dibuat: new Date("2026-11-08T14:30:00Z"),
      },
    });

    const p2Rme = rmeMap.filter((m) => m.id_pasien === 102);
    for (const r of p2Rme) {
      await prisma.detailRekapTindakan.create({
        data: {
          id_rekap: rekap2.id_rekap,
          id_riwayat: r.id_riwayat,
          kode_tindakan: r.kode_tindakan,
          nama_tindakan: r.nama_tindakan,
          tanggal_tindakan: r.tanggal_tindakan,
          jumlah: r.jumlah,
        },
      });
    }
  }

  // Rekap 3: Bambang Supriyadi (105) -> Draft
  let rekap3 = await prisma.rekapTindakan.findFirst({
    where: { kode_rekap: "RKP-20261107-003" },
  });
  if (!rekap3) {
    rekap3 = await prisma.rekapTindakan.create({
      data: {
        kode_rekap: "RKP-20261107-003",
        id_pasien: 105,
        id_akun: idAkunAdmin,
        status: "Draft",
        catatan: "Pasien baru masuk bangsal jantung setelah stabil dari resusitasi IGD.",
        keterangan: "Rekap awal tindakan kardiologi serial.",
        tanggal_dibuat: new Date("2026-11-07T18:00:00Z"),
      },
    });

    const p5Rme = rmeMap.filter((m) => m.id_pasien === 105);
    for (const r of p5Rme) {
      await prisma.detailRekapTindakan.create({
        data: {
          id_rekap: rekap3.id_rekap,
          id_riwayat: r.id_riwayat,
          kode_tindakan: r.kode_tindakan,
          nama_tindakan: r.nama_tindakan,
          tanggal_tindakan: r.tanggal_tindakan,
          jumlah: r.jumlah,
        },
      });
    }
  }
  console.log("[OK] 3 Rekap Tindakan (Draft, Verifikasi, Siap Billing) berhasil disiapkan.");

  // 4. Seed Tagihan Billing
  // Tagihan 1: Hendra Wijaya (101) dari Rekap 1 -> Belum Dibayar
  let bill1 = await prisma.tagihan.findFirst({
    where: { no_tagihan: "INV-20261108-001" },
  });
  if (!bill1) {
    const details = await prisma.detailRekapTindakan.findMany({
      where: { id_rekap: rekap1.id_rekap },
    });

    let total = 0;
    const detailPayloads = [];

    for (const d of details) {
      const tarif = tarifMap.get(d.kode_tindakan);
      const harga = tarif ? parseFloat(tarif.harga) : 150000;
      const subtotal = harga * d.jumlah;
      total += subtotal;
      detailPayloads.push({
        id_detail_rekap: d.id_detail_rekap,
        id_tarif: tarif ? tarif.id_tarif : 1,
        nama_tindakan: d.nama_tindakan,
        jumlah: d.jumlah,
        harga_satuan: harga,
        subtotal: subtotal,
      });
    }

    bill1 = await prisma.tagihan.create({
      data: {
        no_tagihan: "INV-20261108-001",
        id_pasien: 101,
        id_rekap: rekap1.id_rekap,
        id_akun: idAkunAdmin,
        total_biaya: total,
        status: "Belum Dibayar",
        catatan_penyesuaian: "Termasuk biaya visit DPJP, infus dan obat rehidrasi DBD.",
        tanggal_dibuat: new Date("2026-11-08T11:00:00Z"),
      },
    });

    for (const dp of detailPayloads) {
      await prisma.detailTagihan.create({
        data: {
          id_tagihan: bill1.id_tagihan,
          ...dp,
        },
      });
    }
  }

  // Tagihan 2: Pasien 105 (Bambang Supriyadi) -> Lunas
  let bill2 = await prisma.tagihan.findFirst({
    where: { no_tagihan: "INV-20261107-002" },
  });
  if (!bill2) {
    const details = await prisma.detailRekapTindakan.findMany({
      where: { id_rekap: rekap3.id_rekap },
    });

    let total = 0;
    const detailPayloads = [];

    for (const d of details) {
      const tarif = tarifMap.get(d.kode_tindakan);
      const harga = tarif ? parseFloat(tarif.harga) : 200000;
      const subtotal = harga * d.jumlah;
      total += subtotal;
      detailPayloads.push({
        id_detail_rekap: d.id_detail_rekap,
        id_tarif: tarif ? tarif.id_tarif : 1,
        nama_tindakan: d.nama_tindakan,
        jumlah: d.jumlah,
        harga_satuan: harga,
        subtotal: subtotal,
      });
    }

    bill2 = await prisma.tagihan.create({
      data: {
        no_tagihan: "INV-20261107-002",
        id_pasien: 105,
        id_rekap: rekap3.id_rekap,
        id_akun: idAkunAdmin,
        total_biaya: total,
        status: "Lunas",
        catatan_penyesuaian: "Pelunasan via BPJS Kesehatan rujukan darurat IGD.",
        tanggal_dibuat: new Date("2026-11-07T19:30:00Z"),
      },
    });

    for (const dp of detailPayloads) {
      await prisma.detailTagihan.create({
        data: {
          id_tagihan: bill2.id_tagihan,
          ...dp,
        },
      });
    }
  }
  console.log("[OK] Tagihan Billing siap (Belum Dibayar & Lunas).");

  console.log("=== Selesai: Sinkronisasi Data Seeder Berhasil! ===");
}

main()
  .catch((e) => {
    console.error("Error Seeder:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
