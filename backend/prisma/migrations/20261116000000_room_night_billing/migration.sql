-- Additive room-night billing. No backfill or invented prices for existing allocations.
CREATE TABLE "tarif_kamar" (
 "id_tarif_kamar" SERIAL PRIMARY KEY,
 "kelas_perawatan" VARCHAR(50) NOT NULL,
 "harga_per_malam" DECIMAL(15,2) NOT NULL,
 "tanggal_berlaku" DATE NOT NULL,
 "tanggal_berakhir" DATE NULL,
 "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMP(0) NULL,
 CONSTRAINT "ck_tarif_kamar_harga" CHECK ("harga_per_malam" > 0),
 CONSTRAINT "ck_tarif_kamar_periode" CHECK ("tanggal_berakhir" IS NULL OR "tanggal_berakhir" > "tanggal_berlaku"),
 CONSTRAINT "ck_tarif_kamar_kelas" CHECK ("kelas_perawatan" IN ('VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3')),
 CONSTRAINT "uq_tarif_kamar_kelas_tanggal" UNIQUE ("kelas_perawatan", "tanggal_berlaku")
);
ALTER TABLE "rekam_alokasi"
 ADD COLUMN "id_tarif_kamar" INTEGER NULL,
 ADD COLUMN "kelas_perawatan_snapshot" VARCHAR(50) NULL,
 ADD COLUMN "harga_per_malam_snapshot" DECIMAL(15,2) NULL,
 ADD COLUMN "id_tagihan_kamar" INTEGER NULL,
 ADD CONSTRAINT "rekam_alokasi_id_tarif_kamar_fkey" FOREIGN KEY ("id_tarif_kamar") REFERENCES "tarif_kamar" ("id_tarif_kamar") ON DELETE NO ACTION ON UPDATE NO ACTION,
 ADD CONSTRAINT "rekam_alokasi_id_tagihan_kamar_fkey" FOREIGN KEY ("id_tagihan_kamar") REFERENCES "tagihan" ("id_tagihan") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "detail_tagihan"
 ALTER COLUMN "id_detail_rekap" DROP NOT NULL,
 ALTER COLUMN "id_tarif" DROP NOT NULL,
 ADD COLUMN "jenis_item" VARCHAR(10) NOT NULL DEFAULT 'TINDAKAN',
 ADD COLUMN "id_alokasi" INTEGER NULL,
 ADD COLUMN "id_tarif_kamar" INTEGER NULL,
 ADD COLUMN "kelas_perawatan_snapshot" VARCHAR(50) NULL,
 ADD COLUMN "waktu_mulai" TIMESTAMP(0) NULL,
 ADD COLUMN "waktu_selesai" TIMESTAMP(0) NULL,
 ADD CONSTRAINT "detail_tagihan_id_alokasi_fkey" FOREIGN KEY ("id_alokasi") REFERENCES "rekam_alokasi" ("id_alokasi") ON DELETE NO ACTION ON UPDATE NO ACTION,
 ADD CONSTRAINT "detail_tagihan_id_tarif_kamar_fkey" FOREIGN KEY ("id_tarif_kamar") REFERENCES "tarif_kamar" ("id_tarif_kamar") ON DELETE NO ACTION ON UPDATE NO ACTION,
 ADD CONSTRAINT "uq_tagihan_alokasi_kamar" UNIQUE ("id_tagihan", "id_alokasi"),
 ADD CONSTRAINT "ck_detail_tagihan_sumber" CHECK (
  ("jenis_item" = 'TINDAKAN' AND "id_detail_rekap" IS NOT NULL AND "id_tarif" IS NOT NULL AND "id_alokasi" IS NULL AND "id_tarif_kamar" IS NULL)
  OR ("jenis_item" = 'KAMAR' AND "id_detail_rekap" IS NULL AND "id_tarif" IS NULL AND "id_alokasi" IS NOT NULL AND "id_tarif_kamar" IS NOT NULL
   AND "kelas_perawatan_snapshot" IS NOT NULL AND "waktu_mulai" IS NOT NULL AND "waktu_selesai" IS NOT NULL AND "waktu_selesai" >= "waktu_mulai" AND "jumlah" > 0)
 );
-- Overlap writes are serialized by the service: PostgreSQL per-class transaction
-- advisory lock, legacy MySQL account-row transaction lock. Do not bypass the API.
