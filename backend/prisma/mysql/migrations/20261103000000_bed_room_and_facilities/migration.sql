-- Ruangan spesifik dan ringkasan fasilitas untuk tampilan kartu/detail bed.
-- Keduanya nullable: bed lama tidak punya nilai dan tetap valid.

-- AlterTable
ALTER TABLE `bed`
    ADD COLUMN `nama_kamar` VARCHAR(50) NULL COMMENT 'Ruangan spesifik, mis. Kamar 101 / Suite 03',
    ADD COLUMN `fasilitas` VARCHAR(255) NULL COMMENT 'Ringkasan fasilitas dipisah koma, mis. AC, Kamar Mandi Dalam, Oksigen Central';
