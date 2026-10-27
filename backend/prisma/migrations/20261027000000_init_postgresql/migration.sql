-- Initial PostgreSQL adaptation; generated offline, never applied.
BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "akun" (
    "id_akun" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "nama_petugas" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "akun_pkey" PRIMARY KEY ("id_akun")
);

-- CreateTable
CREATE TABLE "pasien" (
    "id_pasien" SERIAL NOT NULL,
    "no_rm" VARCHAR(20) NOT NULL,
    "nama_pasien" VARCHAR(100) NOT NULL,
    "jenis_kelamin" VARCHAR(10),
    "tanggal_lahir" DATE,
    "alamat" VARCHAR(255),
    "tanggal_masuk" DATE,
    "tanggal_keluar" DATE,
    "status_penanganan" VARCHAR(50) NOT NULL DEFAULT 'Terdaftar',
    "kondisi_pasien" VARCHAR(30),
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "pasien_pkey" PRIMARY KEY ("id_pasien")
);

-- CreateTable
CREATE TABLE "bed" (
    "id_bed" SERIAL NOT NULL,
    "no_bed" VARCHAR(20) NOT NULL,
    "nama_bangsal" VARCHAR(100) NOT NULL,
    "kelas_perawatan" VARCHAR(50) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Tersedia',
    "tipe_bed" VARCHAR(50),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "bed_pkey" PRIMARY KEY ("id_bed")
);

-- CreateTable
CREATE TABLE "rekam_alokasi" (
    "id_alokasi" SERIAL NOT NULL,
    "id_pasien" INTEGER NOT NULL,
    "id_bed" INTEGER NOT NULL,
    "id_akun" INTEGER NOT NULL,
    "waktu_alokasi" TIMESTAMP(0) NOT NULL,
    "waktu_selesai" TIMESTAMP(0),
    "status_alokasi" VARCHAR(30) NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "rekam_alokasi_pkey" PRIMARY KEY ("id_alokasi")
);

-- CreateTable
CREATE TABLE "daftar_tunggu" (
    "id_antrean" SERIAL NOT NULL,
    "id_pasien" INTEGER NOT NULL,
    "id_akun" INTEGER NOT NULL,
    "waktu_masuk" TIMESTAMP(0) NOT NULL,
    "no_antrean" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Menunggu',
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "daftar_tunggu_pkey" PRIMARY KEY ("id_antrean")
);

-- CreateTable
CREATE TABLE "rumah_sakit_rujukan" (
    "id_rs" SERIAL NOT NULL,
    "nama_rs" VARCHAR(100) NOT NULL,
    "alamat" VARCHAR(255),
    "kontak" VARCHAR(20),
    "status_ketersediaan" VARCHAR(30) NOT NULL,
    "terakhir_diperbarui" TIMESTAMP(0),
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "rumah_sakit_rujukan_pkey" PRIMARY KEY ("id_rs")
);

-- CreateTable
CREATE TABLE "surat_rujukan" (
    "id_surat" SERIAL NOT NULL,
    "no_rujukan" VARCHAR(30) NOT NULL,
    "id_pasien" INTEGER NOT NULL,
    "id_rs" INTEGER NOT NULL,
    "id_akun" INTEGER NOT NULL,
    "tanggal_rujukan" TIMESTAMP(0) NOT NULL,
    "alasan_rujukan" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Dibuat',
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "surat_rujukan_pkey" PRIMARY KEY ("id_surat")
);

-- CreateTable
CREATE TABLE "riwayat_status_pasien" (
    "id_riwayat_status" SERIAL NOT NULL,
    "id_pasien" INTEGER NOT NULL,
    "id_akun" INTEGER NOT NULL,
    "status_sebelumnya" VARCHAR(50),
    "status_baru" VARCHAR(50) NOT NULL,
    "keterangan" TEXT,
    "waktu_perubahan" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "riwayat_status_pasien_pkey" PRIMARY KEY ("id_riwayat_status")
);

-- CreateTable
CREATE TABLE "rme_dummy" (
    "id_riwayat" SERIAL NOT NULL,
    "id_pasien" INTEGER NOT NULL,
    "kode_tindakan" VARCHAR(20) NOT NULL,
    "nama_tindakan" VARCHAR(100) NOT NULL,
    "tanggal_tindakan" TIMESTAMP(0) NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rme_dummy_pkey" PRIMARY KEY ("id_riwayat")
);

-- CreateTable
CREATE TABLE "rekap_tindakan" (
    "id_rekap" SERIAL NOT NULL,
    "kode_rekap" VARCHAR(30) NOT NULL,
    "id_pasien" INTEGER NOT NULL,
    "id_akun" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Draft',
    "catatan" TEXT,
    "keterangan" TEXT,
    "tanggal_dibuat" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_diperbarui" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "rekap_tindakan_pkey" PRIMARY KEY ("id_rekap")
);

-- CreateTable
CREATE TABLE "detail_rekap_tindakan" (
    "id_detail_rekap" SERIAL NOT NULL,
    "id_rekap" INTEGER NOT NULL,
    "id_riwayat" INTEGER NOT NULL,
    "kode_tindakan" VARCHAR(20) NOT NULL,
    "nama_tindakan" VARCHAR(100) NOT NULL,
    "tanggal_tindakan" TIMESTAMP(0) NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "detail_rekap_tindakan_pkey" PRIMARY KEY ("id_detail_rekap")
);

-- CreateTable
CREATE TABLE "tarif" (
    "id_tarif" SERIAL NOT NULL,
    "kode_tindakan" VARCHAR(20) NOT NULL,
    "nama_tindakan" VARCHAR(100) NOT NULL,
    "harga" DECIMAL(15,2) NOT NULL,
    "tanggal_berlaku" DATE NOT NULL,
    "tanggal_berakhir" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMP(0),
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "tarif_pkey" PRIMARY KEY ("id_tarif")
);

-- CreateTable
CREATE TABLE "tagihan" (
    "id_tagihan" SERIAL NOT NULL,
    "id_pasien" INTEGER NOT NULL,
    "id_rekap" INTEGER NOT NULL,
    "id_akun" INTEGER NOT NULL,
    "no_tagihan" VARCHAR(30) NOT NULL,
    "total_biaya" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Draft',
    "catatan_penyesuaian" TEXT,
    "alasan_pembatalan" TEXT,
    "tanggal_dibuat" TIMESTAMP(0) NOT NULL,
    "tanggal_diperbarui" TIMESTAMP(0),
    "tanggal_dibatalkan" TIMESTAMP(0),

    CONSTRAINT "tagihan_pkey" PRIMARY KEY ("id_tagihan")
);

-- CreateTable
CREATE TABLE "detail_tagihan" (
    "id_detail_tagihan" SERIAL NOT NULL,
    "id_tagihan" INTEGER NOT NULL,
    "id_detail_rekap" INTEGER NOT NULL,
    "id_tarif" INTEGER NOT NULL,
    "nama_tindakan" VARCHAR(100) NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "harga_satuan" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "detail_tagihan_pkey" PRIMARY KEY ("id_detail_tagihan")
);

-- CreateTable
CREATE TABLE "log_audit" (
    "id_log" SERIAL NOT NULL,
    "id_akun" INTEGER NOT NULL,
    "nama_tabel" VARCHAR(100) NOT NULL,
    "id_referensi" INTEGER NOT NULL,
    "aksi" VARCHAR(30) NOT NULL,
    "data_sebelum" TEXT,
    "data_sesudah" TEXT,
    "waktu_aksi" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_audit_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_akun_username" ON "akun"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pasien_no_rm" ON "pasien"("no_rm");

-- CreateIndex
CREATE UNIQUE INDEX "uq_bed_no_bed" ON "bed"("no_bed");

-- CreateIndex
CREATE INDEX "idx_rekam_alokasi_pasien" ON "rekam_alokasi"("id_pasien");

-- CreateIndex
CREATE INDEX "idx_rekam_alokasi_bed_status" ON "rekam_alokasi"("id_bed", "status_alokasi");

-- CreateIndex
CREATE INDEX "idx_rekam_alokasi_akun" ON "rekam_alokasi"("id_akun");

-- CreateIndex
CREATE INDEX "idx_daftar_tunggu_fifo" ON "daftar_tunggu"("status", "waktu_masuk", "id_antrean");

-- CreateIndex
CREATE INDEX "idx_daftar_tunggu_pasien" ON "daftar_tunggu"("id_pasien");

-- CreateIndex
CREATE INDEX "idx_daftar_tunggu_akun" ON "daftar_tunggu"("id_akun");

-- CreateIndex
CREATE UNIQUE INDEX "uq_daftar_tunggu_no_antrean" ON "daftar_tunggu"("no_antrean");

-- CreateIndex
CREATE INDEX "idx_surat_rujukan_pasien" ON "surat_rujukan"("id_pasien");

-- CreateIndex
CREATE INDEX "idx_surat_rujukan_rs" ON "surat_rujukan"("id_rs");

-- CreateIndex
CREATE INDEX "idx_surat_rujukan_akun" ON "surat_rujukan"("id_akun");

-- CreateIndex
CREATE UNIQUE INDEX "uq_surat_rujukan_no_rujukan" ON "surat_rujukan"("no_rujukan");

-- CreateIndex
CREATE INDEX "idx_riwayat_status_pasien" ON "riwayat_status_pasien"("id_pasien");

-- CreateIndex
CREATE INDEX "idx_riwayat_status_akun" ON "riwayat_status_pasien"("id_akun");

-- CreateIndex
CREATE INDEX "idx_rme_dummy_pasien" ON "rme_dummy"("id_pasien");

-- CreateIndex
CREATE INDEX "idx_rekap_tindakan_pasien" ON "rekap_tindakan"("id_pasien");

-- CreateIndex
CREATE INDEX "idx_rekap_tindakan_status_deleted" ON "rekap_tindakan"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_rekap_tindakan_akun" ON "rekap_tindakan"("id_akun");

-- CreateIndex
CREATE UNIQUE INDEX "uq_rekap_tindakan_kode_rekap" ON "rekap_tindakan"("kode_rekap");

-- CreateIndex
CREATE INDEX "idx_detail_rekap_tindakan_riwayat" ON "detail_rekap_tindakan"("id_riwayat");

-- CreateIndex
CREATE UNIQUE INDEX "uq_detail_rekap_tindakan_rekap_riwayat" ON "detail_rekap_tindakan"("id_rekap", "id_riwayat");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tarif_kode_tanggal_berlaku" ON "tarif"("kode_tindakan", "tanggal_berlaku");

-- CreateIndex
CREATE INDEX "idx_tagihan_pasien" ON "tagihan"("id_pasien");

-- CreateIndex
CREATE INDEX "idx_tagihan_rekap" ON "tagihan"("id_rekap");

-- CreateIndex
CREATE INDEX "idx_tagihan_akun" ON "tagihan"("id_akun");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tagihan_no_tagihan" ON "tagihan"("no_tagihan");

-- CreateIndex
CREATE INDEX "idx_detail_tagihan_tagihan" ON "detail_tagihan"("id_tagihan");

-- CreateIndex
CREATE INDEX "idx_detail_tagihan_detail_rekap" ON "detail_tagihan"("id_detail_rekap");

-- CreateIndex
CREATE INDEX "idx_detail_tagihan_tarif" ON "detail_tagihan"("id_tarif");

-- CreateIndex
CREATE INDEX "idx_log_audit_tabel_referensi" ON "log_audit"("nama_tabel", "id_referensi");

-- CreateIndex
CREATE INDEX "idx_log_audit_akun" ON "log_audit"("id_akun");

-- AddForeignKey
ALTER TABLE "rekam_alokasi" ADD CONSTRAINT "fk_rekam_alokasi_pasien" FOREIGN KEY ("id_pasien") REFERENCES "pasien"("id_pasien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekam_alokasi" ADD CONSTRAINT "fk_rekam_alokasi_bed" FOREIGN KEY ("id_bed") REFERENCES "bed"("id_bed") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekam_alokasi" ADD CONSTRAINT "fk_rekam_alokasi_akun" FOREIGN KEY ("id_akun") REFERENCES "akun"("id_akun") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daftar_tunggu" ADD CONSTRAINT "fk_daftar_tunggu_pasien" FOREIGN KEY ("id_pasien") REFERENCES "pasien"("id_pasien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daftar_tunggu" ADD CONSTRAINT "fk_daftar_tunggu_akun" FOREIGN KEY ("id_akun") REFERENCES "akun"("id_akun") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "surat_rujukan" ADD CONSTRAINT "fk_surat_rujukan_pasien" FOREIGN KEY ("id_pasien") REFERENCES "pasien"("id_pasien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "surat_rujukan" ADD CONSTRAINT "fk_surat_rujukan_rs" FOREIGN KEY ("id_rs") REFERENCES "rumah_sakit_rujukan"("id_rs") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "surat_rujukan" ADD CONSTRAINT "fk_surat_rujukan_akun" FOREIGN KEY ("id_akun") REFERENCES "akun"("id_akun") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "riwayat_status_pasien" ADD CONSTRAINT "fk_riwayat_status_pasien" FOREIGN KEY ("id_pasien") REFERENCES "pasien"("id_pasien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "riwayat_status_pasien" ADD CONSTRAINT "fk_riwayat_status_akun" FOREIGN KEY ("id_akun") REFERENCES "akun"("id_akun") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rme_dummy" ADD CONSTRAINT "fk_rme_dummy_pasien" FOREIGN KEY ("id_pasien") REFERENCES "pasien"("id_pasien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekap_tindakan" ADD CONSTRAINT "fk_rekap_tindakan_pasien" FOREIGN KEY ("id_pasien") REFERENCES "pasien"("id_pasien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rekap_tindakan" ADD CONSTRAINT "fk_rekap_tindakan_akun" FOREIGN KEY ("id_akun") REFERENCES "akun"("id_akun") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detail_rekap_tindakan" ADD CONSTRAINT "fk_detail_rekap_tindakan_rekap" FOREIGN KEY ("id_rekap") REFERENCES "rekap_tindakan"("id_rekap") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detail_rekap_tindakan" ADD CONSTRAINT "fk_detail_rekap_tindakan_riwayat" FOREIGN KEY ("id_riwayat") REFERENCES "rme_dummy"("id_riwayat") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "fk_tagihan_pasien" FOREIGN KEY ("id_pasien") REFERENCES "pasien"("id_pasien") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "fk_tagihan_rekap" FOREIGN KEY ("id_rekap") REFERENCES "rekap_tindakan"("id_rekap") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "fk_tagihan_akun" FOREIGN KEY ("id_akun") REFERENCES "akun"("id_akun") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detail_tagihan" ADD CONSTRAINT "fk_detail_tagihan_tagihan" FOREIGN KEY ("id_tagihan") REFERENCES "tagihan"("id_tagihan") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detail_tagihan" ADD CONSTRAINT "fk_detail_tagihan_detail_rekap" FOREIGN KEY ("id_detail_rekap") REFERENCES "detail_rekap_tindakan"("id_detail_rekap") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detail_tagihan" ADD CONSTRAINT "fk_detail_tagihan_tarif" FOREIGN KEY ("id_tarif") REFERENCES "tarif"("id_tarif") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "log_audit" ADD CONSTRAINT "fk_log_audit_akun" FOREIGN KEY ("id_akun") REFERENCES "akun"("id_akun") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Rules and documentation not represented by Prisma Schema.
COMMENT ON COLUMN "akun"."password" IS 'Password hash (bcrypt)';

COMMENT ON COLUMN "akun"."role" IS 'Petugas Administrasi / Petugas Bed Management';

COMMENT ON COLUMN "pasien"."jenis_kelamin" IS 'Laki-laki / Perempuan';

COMMENT ON COLUMN "pasien"."tanggal_masuk" IS 'Tanggal mulai rawat inap';

COMMENT ON COLUMN "pasien"."tanggal_keluar" IS 'NULL selama pasien masih dirawat';

COMMENT ON COLUMN "pasien"."status_penanganan" IS 'Terdaftar / Menunggu / Dirujuk / Rawat Inap; sepakati dengan ESBN';

COMMENT ON COLUMN "pasien"."kondisi_pasien" IS 'Stabil / Darurat';

COMMENT ON COLUMN "bed"."status" IS 'Tersedia / Terisi / Pembersihan / Pemeliharaan';

COMMENT ON COLUMN "rekam_alokasi"."id_akun" IS 'Petugas yang melakukan alokasi';

COMMENT ON COLUMN "rekam_alokasi"."waktu_selesai" IS 'Kosong jika alokasi masih aktif';

COMMENT ON COLUMN "rekam_alokasi"."status_alokasi" IS 'Aktif / Selesai / Batal';

COMMENT ON COLUMN "daftar_tunggu"."id_akun" IS 'Petugas pencatat antrean';

COMMENT ON COLUMN "daftar_tunggu"."status" IS 'Menunggu / Dialokasikan / Batal';

COMMENT ON COLUMN "rumah_sakit_rujukan"."status_ketersediaan" IS 'Tersedia / Tidak Tersedia';

COMMENT ON COLUMN "surat_rujukan"."id_akun" IS 'Petugas penerbit surat';

COMMENT ON COLUMN "surat_rujukan"."status" IS 'Dibuat / Dikirim / Diterima / Batal';

ALTER TABLE "rme_dummy" ADD CONSTRAINT "chk_rme_dummy_jumlah" CHECK ("jumlah" > 0);

COMMENT ON TABLE "rme_dummy" IS 'Simulasi data RME eksternal, bukan fitur CRUD utama Inpatient';

COMMENT ON COLUMN "rekap_tindakan"."kode_rekap" IS 'Contoh: RKP-20261015-001';

COMMENT ON COLUMN "rekap_tindakan"."id_akun" IS 'Petugas pembuat rekap. Pembaruan dicatat di log_audit';

COMMENT ON COLUMN "rekap_tindakan"."status" IS 'Draft / Proses Verifikasi / Siap Billing';

COMMENT ON COLUMN "rekap_tindakan"."deleted_at" IS 'Soft delete untuk menjaga histori';

ALTER TABLE "detail_rekap_tindakan" ADD CONSTRAINT "chk_detail_rekap_tindakan_jumlah" CHECK ("jumlah" > 0);

COMMENT ON COLUMN "detail_rekap_tindakan"."id_riwayat" IS 'Referensi sumber RME Dummy';

COMMENT ON TABLE "detail_rekap_tindakan" IS 'Snapshot tindakan dari RME saat rekap dibuat';

COMMENT ON TABLE "tarif" IS 'Tarif dapat berubah berdasarkan periode berlaku';

COMMENT ON COLUMN "tagihan"."id_akun" IS 'Petugas pembuat tagihan';

COMMENT ON COLUMN "tagihan"."status" IS 'Draft / Siap Diserahkan / Belum Dibayar / Lunas / Batal';

COMMENT ON TABLE "detail_tagihan" IS 'Snapshot rincian harga saat tagihan dihitung';

COMMENT ON COLUMN "log_audit"."id_referensi" IS 'Referensi longgar ke id baris di nama_tabel, bukan FK';

COMMENT ON COLUMN "log_audit"."aksi" IS 'CREATE / UPDATE / DELETE / CANCEL / STATUS_CHANGE';

COMMENT ON COLUMN "log_audit"."data_sebelum" IS 'NULL pada aksi CREATE';

COMMENT ON COLUMN "log_audit"."data_sesudah" IS 'NULL pada aksi DELETE';

COMMENT ON TABLE "rekap_tindakan" IS 'jumlah_layanan tidak disimpan; dihitung dari COUNT(detail_rekap_tindakan)';

COMMENT ON TABLE "log_audit" IS 'Riwayat perubahan penting; pengguna biasa tidak boleh mengedit atau menghapus';

COMMIT;
