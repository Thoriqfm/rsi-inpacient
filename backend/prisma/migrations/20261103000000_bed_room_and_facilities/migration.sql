-- Ruangan spesifik dan ringkasan fasilitas untuk tampilan kartu/detail bed.
-- Keduanya nullable: bed lama tidak punya nilai dan tetap valid.

-- AlterTable
ALTER TABLE "bed" ADD COLUMN "nama_kamar" VARCHAR(50);
COMMENT ON COLUMN "bed"."nama_kamar" IS 'Ruangan spesifik, mis. Kamar 101 / Suite 03';

-- AlterTable
ALTER TABLE "bed" ADD COLUMN "fasilitas" VARCHAR(255);
COMMENT ON COLUMN "bed"."fasilitas" IS 'Ringkasan fasilitas dipisah koma, mis. AC, Kamar Mandi Dalam, Oksigen Central';
