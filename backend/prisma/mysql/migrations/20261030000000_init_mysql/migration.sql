-- Initial local MySQL schema. Requires enforced CHECK constraints.
-- CreateTable
CREATE TABLE `akun` (
    `id_akun` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL COMMENT 'Password hash (bcrypt)',
    `role` VARCHAR(30) NOT NULL COMMENT 'Petugas Administrasi / Petugas Bed Management',
    `nama_petugas` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_akun_username`(`username`),
    PRIMARY KEY (`id_akun`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pasien` (
    `id_pasien` INTEGER NOT NULL AUTO_INCREMENT,
    `no_rm` VARCHAR(20) NOT NULL,
    `nama_pasien` VARCHAR(100) NOT NULL,
    `jenis_kelamin` VARCHAR(10) NULL COMMENT 'Laki-laki / Perempuan',
    `tanggal_lahir` DATE NULL,
    `alamat` VARCHAR(255) NULL,
    `tanggal_masuk` DATE NULL COMMENT 'Tanggal mulai rawat inap',
    `tanggal_keluar` DATE NULL COMMENT 'NULL selama pasien masih dirawat',
    `status_penanganan` VARCHAR(50) NOT NULL DEFAULT 'Terdaftar' COMMENT 'Terdaftar / Menunggu / Dirujuk / Rawat Inap; sepakati dengan ESBN',
    `kondisi_pasien` VARCHAR(30) NULL COMMENT 'Stabil / Darurat',
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_pasien_no_rm`(`no_rm`),
    PRIMARY KEY (`id_pasien`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bed` (
    `id_bed` INTEGER NOT NULL AUTO_INCREMENT,
    `no_bed` VARCHAR(20) NOT NULL,
    `nama_bangsal` VARCHAR(100) NOT NULL,
    `kelas_perawatan` VARCHAR(50) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'Tersedia' COMMENT 'Tersedia / Terisi / Pembersihan / Pemeliharaan',
    `tipe_bed` VARCHAR(50) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_bed_no_bed`(`no_bed`),
    PRIMARY KEY (`id_bed`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rekam_alokasi` (
    `id_alokasi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pasien` INTEGER NOT NULL,
    `id_bed` INTEGER NOT NULL,
    `id_akun` INTEGER NOT NULL COMMENT 'Petugas yang melakukan alokasi',
    `waktu_alokasi` DATETIME(0) NOT NULL,
    `waktu_selesai` DATETIME(0) NULL COMMENT 'Kosong jika alokasi masih aktif',
    `status_alokasi` VARCHAR(30) NOT NULL DEFAULT 'Aktif' COMMENT 'Aktif / Selesai / Batal',
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `idx_rekam_alokasi_pasien`(`id_pasien`),
    INDEX `idx_rekam_alokasi_bed_status`(`id_bed`, `status_alokasi`),
    INDEX `idx_rekam_alokasi_akun`(`id_akun`),
    PRIMARY KEY (`id_alokasi`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daftar_tunggu` (
    `id_antrean` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pasien` INTEGER NOT NULL,
    `id_akun` INTEGER NOT NULL COMMENT 'Petugas pencatat antrean',
    `waktu_masuk` DATETIME(0) NOT NULL,
    `no_antrean` INTEGER NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'Menunggu' COMMENT 'Menunggu / Dialokasikan / Batal',
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `idx_daftar_tunggu_fifo`(`status`, `waktu_masuk`, `id_antrean`),
    INDEX `idx_daftar_tunggu_pasien`(`id_pasien`),
    INDEX `idx_daftar_tunggu_akun`(`id_akun`),
    UNIQUE INDEX `uq_daftar_tunggu_no_antrean`(`no_antrean`),
    PRIMARY KEY (`id_antrean`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rumah_sakit_rujukan` (
    `id_rs` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_rs` VARCHAR(100) NOT NULL,
    `alamat` VARCHAR(255) NULL,
    `kontak` VARCHAR(20) NULL,
    `status_ketersediaan` VARCHAR(30) NOT NULL COMMENT 'Tersedia / Tidak Tersedia',
    `terakhir_diperbarui` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id_rs`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surat_rujukan` (
    `id_surat` INTEGER NOT NULL AUTO_INCREMENT,
    `no_rujukan` VARCHAR(30) NOT NULL,
    `id_pasien` INTEGER NOT NULL,
    `id_rs` INTEGER NOT NULL,
    `id_akun` INTEGER NOT NULL COMMENT 'Petugas penerbit surat',
    `tanggal_rujukan` DATETIME(0) NOT NULL,
    `alasan_rujukan` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'Dibuat' COMMENT 'Dibuat / Dikirim / Diterima / Batal',
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `idx_surat_rujukan_pasien`(`id_pasien`),
    INDEX `idx_surat_rujukan_rs`(`id_rs`),
    INDEX `idx_surat_rujukan_akun`(`id_akun`),
    UNIQUE INDEX `uq_surat_rujukan_no_rujukan`(`no_rujukan`),
    PRIMARY KEY (`id_surat`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_status_pasien` (
    `id_riwayat_status` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pasien` INTEGER NOT NULL,
    `id_akun` INTEGER NOT NULL,
    `status_sebelumnya` VARCHAR(50) NULL,
    `status_baru` VARCHAR(50) NOT NULL,
    `keterangan` TEXT NULL,
    `waktu_perubahan` DATETIME(0) NOT NULL,

    INDEX `idx_riwayat_status_pasien`(`id_pasien`),
    INDEX `idx_riwayat_status_akun`(`id_akun`),
    PRIMARY KEY (`id_riwayat_status`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rme_dummy` (
    `id_riwayat` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pasien` INTEGER NOT NULL,
    `kode_tindakan` VARCHAR(20) NOT NULL,
    `nama_tindakan` VARCHAR(100) NOT NULL,
    `tanggal_tindakan` DATETIME(0) NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `keterangan` TEXT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_rme_dummy_pasien`(`id_pasien`),
    PRIMARY KEY (`id_riwayat`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rekap_tindakan` (
    `id_rekap` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_rekap` VARCHAR(30) NOT NULL COMMENT 'Contoh: RKP-20261015-001',
    `id_pasien` INTEGER NOT NULL,
    `id_akun` INTEGER NOT NULL COMMENT 'Petugas pembuat rekap. Pembaruan dicatat di log_audit',
    `status` VARCHAR(30) NOT NULL DEFAULT 'Draft' COMMENT 'Draft / Proses Verifikasi / Siap Billing',
    `catatan` TEXT NULL,
    `keterangan` TEXT NULL,
    `tanggal_dibuat` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tanggal_diperbarui` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL COMMENT 'Soft delete untuk menjaga histori',

    INDEX `idx_rekap_tindakan_pasien`(`id_pasien`),
    INDEX `idx_rekap_tindakan_status_deleted`(`status`, `deleted_at`),
    INDEX `idx_rekap_tindakan_akun`(`id_akun`),
    UNIQUE INDEX `uq_rekap_tindakan_kode_rekap`(`kode_rekap`),
    PRIMARY KEY (`id_rekap`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_rekap_tindakan` (
    `id_detail_rekap` INTEGER NOT NULL AUTO_INCREMENT,
    `id_rekap` INTEGER NOT NULL,
    `id_riwayat` INTEGER NOT NULL COMMENT 'Referensi sumber RME Dummy',
    `kode_tindakan` VARCHAR(20) NOT NULL,
    `nama_tindakan` VARCHAR(100) NOT NULL,
    `tanggal_tindakan` DATETIME(0) NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,

    INDEX `idx_detail_rekap_tindakan_riwayat`(`id_riwayat`),
    UNIQUE INDEX `uq_detail_rekap_tindakan_rekap_riwayat`(`id_rekap`, `id_riwayat`),
    PRIMARY KEY (`id_detail_rekap`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarif` (
    `id_tarif` INTEGER NOT NULL AUTO_INCREMENT,
    `kode_tindakan` VARCHAR(20) NOT NULL,
    `nama_tindakan` VARCHAR(100) NOT NULL,
    `harga` DECIMAL(15, 2) NOT NULL,
    `tanggal_berlaku` DATE NOT NULL,
    `tanggal_berakhir` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Aktif',
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_tarif_kode_tanggal_berlaku`(`kode_tindakan`, `tanggal_berlaku`),
    PRIMARY KEY (`id_tarif`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tagihan` (
    `id_tagihan` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pasien` INTEGER NOT NULL,
    `id_rekap` INTEGER NOT NULL,
    `id_akun` INTEGER NOT NULL COMMENT 'Petugas pembuat tagihan',
    `no_tagihan` VARCHAR(30) NOT NULL,
    `total_biaya` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'Draft' COMMENT 'Draft / Siap Diserahkan / Belum Dibayar / Lunas / Batal',
    `catatan_penyesuaian` TEXT NULL,
    `alasan_pembatalan` TEXT NULL,
    `tanggal_dibuat` DATETIME(0) NOT NULL,
    `tanggal_diperbarui` DATETIME(0) NULL,
    `tanggal_dibatalkan` DATETIME(0) NULL,

    INDEX `idx_tagihan_pasien`(`id_pasien`),
    INDEX `idx_tagihan_rekap`(`id_rekap`),
    INDEX `idx_tagihan_akun`(`id_akun`),
    UNIQUE INDEX `uq_tagihan_no_tagihan`(`no_tagihan`),
    PRIMARY KEY (`id_tagihan`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_tagihan` (
    `id_detail_tagihan` INTEGER NOT NULL AUTO_INCREMENT,
    `id_tagihan` INTEGER NOT NULL,
    `id_detail_rekap` INTEGER NOT NULL,
    `id_tarif` INTEGER NOT NULL,
    `nama_tindakan` VARCHAR(100) NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `harga_satuan` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,

    INDEX `idx_detail_tagihan_tagihan`(`id_tagihan`),
    INDEX `idx_detail_tagihan_detail_rekap`(`id_detail_rekap`),
    INDEX `idx_detail_tagihan_tarif`(`id_tarif`),
    PRIMARY KEY (`id_detail_tagihan`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_audit` (
    `id_log` INTEGER NOT NULL AUTO_INCREMENT,
    `id_akun` INTEGER NOT NULL,
    `nama_tabel` VARCHAR(100) NOT NULL,
    `id_referensi` INTEGER NOT NULL COMMENT 'Referensi longgar ke id baris di nama_tabel, bukan FK',
    `aksi` VARCHAR(30) NOT NULL COMMENT 'CREATE / UPDATE / DELETE / CANCEL / STATUS_CHANGE',
    `data_sebelum` TEXT NULL COMMENT 'NULL pada aksi CREATE',
    `data_sesudah` TEXT NULL COMMENT 'NULL pada aksi DELETE',
    `waktu_aksi` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_log_audit_tabel_referensi`(`nama_tabel`, `id_referensi`),
    INDEX `idx_log_audit_akun`(`id_akun`),
    PRIMARY KEY (`id_log`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rekam_alokasi` ADD CONSTRAINT `fk_rekam_alokasi_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien`(`id_pasien`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `rekam_alokasi` ADD CONSTRAINT `fk_rekam_alokasi_bed` FOREIGN KEY (`id_bed`) REFERENCES `bed`(`id_bed`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `rekam_alokasi` ADD CONSTRAINT `fk_rekam_alokasi_akun` FOREIGN KEY (`id_akun`) REFERENCES `akun`(`id_akun`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `daftar_tunggu` ADD CONSTRAINT `fk_daftar_tunggu_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien`(`id_pasien`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `daftar_tunggu` ADD CONSTRAINT `fk_daftar_tunggu_akun` FOREIGN KEY (`id_akun`) REFERENCES `akun`(`id_akun`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `surat_rujukan` ADD CONSTRAINT `fk_surat_rujukan_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien`(`id_pasien`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `surat_rujukan` ADD CONSTRAINT `fk_surat_rujukan_rs` FOREIGN KEY (`id_rs`) REFERENCES `rumah_sakit_rujukan`(`id_rs`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `surat_rujukan` ADD CONSTRAINT `fk_surat_rujukan_akun` FOREIGN KEY (`id_akun`) REFERENCES `akun`(`id_akun`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `riwayat_status_pasien` ADD CONSTRAINT `fk_riwayat_status_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien`(`id_pasien`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `riwayat_status_pasien` ADD CONSTRAINT `fk_riwayat_status_akun` FOREIGN KEY (`id_akun`) REFERENCES `akun`(`id_akun`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `rme_dummy` ADD CONSTRAINT `fk_rme_dummy_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien`(`id_pasien`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `rekap_tindakan` ADD CONSTRAINT `fk_rekap_tindakan_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien`(`id_pasien`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `rekap_tindakan` ADD CONSTRAINT `fk_rekap_tindakan_akun` FOREIGN KEY (`id_akun`) REFERENCES `akun`(`id_akun`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `detail_rekap_tindakan` ADD CONSTRAINT `fk_detail_rekap_tindakan_rekap` FOREIGN KEY (`id_rekap`) REFERENCES `rekap_tindakan`(`id_rekap`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `detail_rekap_tindakan` ADD CONSTRAINT `fk_detail_rekap_tindakan_riwayat` FOREIGN KEY (`id_riwayat`) REFERENCES `rme_dummy`(`id_riwayat`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `fk_tagihan_pasien` FOREIGN KEY (`id_pasien`) REFERENCES `pasien`(`id_pasien`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `fk_tagihan_rekap` FOREIGN KEY (`id_rekap`) REFERENCES `rekap_tindakan`(`id_rekap`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `fk_tagihan_akun` FOREIGN KEY (`id_akun`) REFERENCES `akun`(`id_akun`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `detail_tagihan` ADD CONSTRAINT `fk_detail_tagihan_tagihan` FOREIGN KEY (`id_tagihan`) REFERENCES `tagihan`(`id_tagihan`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `detail_tagihan` ADD CONSTRAINT `fk_detail_tagihan_detail_rekap` FOREIGN KEY (`id_detail_rekap`) REFERENCES `detail_rekap_tindakan`(`id_detail_rekap`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `detail_tagihan` ADD CONSTRAINT `fk_detail_tagihan_tarif` FOREIGN KEY (`id_tarif`) REFERENCES `tarif`(`id_tarif`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `log_audit` ADD CONSTRAINT `fk_log_audit_akun` FOREIGN KEY (`id_akun`) REFERENCES `akun`(`id_akun`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `rme_dummy` ADD CONSTRAINT `chk_rme_dummy_jumlah` CHECK (`jumlah` > 0);
ALTER TABLE `detail_rekap_tindakan` ADD CONSTRAINT `chk_detail_rekap_tindakan_jumlah` CHECK (`jumlah` > 0);
ALTER TABLE `rme_dummy` COMMENT = 'Simulasi data RME eksternal, bukan fitur CRUD utama Inpatient';
ALTER TABLE `detail_rekap_tindakan` COMMENT = 'Snapshot tindakan dari RME saat rekap dibuat';
ALTER TABLE `tarif` COMMENT = 'Tarif dapat berubah berdasarkan periode berlaku';
ALTER TABLE `detail_tagihan` COMMENT = 'Snapshot rincian harga saat tagihan dihitung';
ALTER TABLE `rekap_tindakan` COMMENT = 'jumlah_layanan tidak disimpan; dihitung dari COUNT(detail_rekap_tindakan)';
ALTER TABLE `log_audit` COMMENT = 'Riwayat perubahan penting; pengguna biasa tidak boleh mengedit atau menghapus';
