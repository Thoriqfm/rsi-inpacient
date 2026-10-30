-- Bed soft delete, allocation guard, and queue-to-allocation link.
-- PostgreSQL supports partial unique indexes, so the active-allocation guard
-- needs no generated column (unlike the MySQL migration).
-- The partial index is intentionally absent from postgresql/schema.prisma:
-- Prisma does not model partial indexes. Do not run `prisma db push`.

-- AlterTable
ALTER TABLE "bed" ADD COLUMN "deleted_at" TIMESTAMP(0);
COMMENT ON COLUMN "bed"."deleted_at" IS 'Soft delete; bed nonaktif tidak dihapus fisik';

-- AlterTable
ALTER TABLE "rekam_alokasi" ADD COLUMN "id_antrean" INTEGER;
COMMENT ON COLUMN "rekam_alokasi"."id_antrean" IS 'Asal antrean jika alokasi dibuat dari daftar tunggu';
CREATE UNIQUE INDEX "uq_rekam_alokasi_antrean" ON "rekam_alokasi"("id_antrean");

-- Allocation guard: at most one active allocation per bed
CREATE UNIQUE INDEX "uq_rekam_alokasi_bed_aktif" ON "rekam_alokasi"("id_bed") WHERE "status_alokasi" = 'Aktif';

-- AddForeignKey
ALTER TABLE "rekam_alokasi" ADD CONSTRAINT "fk_rekam_alokasi_antrean" FOREIGN KEY ("id_antrean") REFERENCES "daftar_tunggu"("id_antrean") ON DELETE NO ACTION ON UPDATE NO ACTION;
