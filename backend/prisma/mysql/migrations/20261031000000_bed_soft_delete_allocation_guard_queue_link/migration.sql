-- Bed soft delete, allocation guard, and queue-to-allocation link.
-- MySQL has no partial unique index. The active-allocation guard uses a stored
-- generated column that is NULL unless status_alokasi = 'Aktif', because InnoDB
-- allows multiple NULL values in a unique index.
-- id_bed_aktif is intentionally absent from schema.prisma: Prisma does not model
-- generated columns. Do not run `prisma db push`; it would try to drop this guard.

-- AlterTable
ALTER TABLE `bed`
    ADD COLUMN `deleted_at` DATETIME(0) NULL COMMENT 'Soft delete; bed nonaktif tidak dihapus fisik';

-- AlterTable
ALTER TABLE `rekam_alokasi`
    ADD COLUMN `id_antrean` INTEGER NULL COMMENT 'Asal antrean jika alokasi dibuat dari daftar tunggu',
    ADD UNIQUE INDEX `uq_rekam_alokasi_antrean`(`id_antrean`);

-- AlterTable
ALTER TABLE `rekam_alokasi`
    ADD COLUMN `id_bed_aktif` INTEGER
        GENERATED ALWAYS AS (CASE WHEN `status_alokasi` = 'Aktif' THEN `id_bed` ELSE NULL END) STORED,
    ADD UNIQUE INDEX `uq_rekam_alokasi_bed_aktif`(`id_bed_aktif`);

-- AddForeignKey
ALTER TABLE `rekam_alokasi` ADD CONSTRAINT `fk_rekam_alokasi_antrean` FOREIGN KEY (`id_antrean`) REFERENCES `daftar_tunggu`(`id_antrean`) ON DELETE NO ACTION ON UPDATE NO ACTION;
