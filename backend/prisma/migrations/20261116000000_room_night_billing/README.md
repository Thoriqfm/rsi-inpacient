# Aktivasi tarif kamar per malam

Kode memakai tabel `tarif_kamar`, snapshot pada `rekam_alokasi`, dan item KAMAR pada `detail_tagihan`.
Per malam = 24 jam sejak alokasi, dibulatkan ke atas, minimal satu malam. Tarif tindakan tetap terpisah.

## Urutan rollout

1. TFM memeriksa dan menyetujui migration untuk database tujuan. Backup database dan uji di staging PostgreSQL terlebih dahulu.
2. Audit kelas lama dengan `SELECT kelas_perawatan, COUNT(*) FROM bed GROUP BY kelas_perawatan;`. Kelas penulisan baru dibatasi VIP, Kelas 1, Kelas 2, Kelas 3. Jangan mengganti data historis secara otomatis.
3. Terapkan migration dari folder `backend/` menggunakan Prisma 6.19.3 dan konfigurasi aktif `prisma.config.js` (PostgreSQL). Jangan memakai konfigurasi MySQL untuk Supabase. Hindari `db push` karena ada constraint SQL yang tidak dimodelkan Prisma.
4. Generate Prisma Client untuk provider PostgreSQL, lalu deploy backend dan frontend bersama dalam maintenance window. Aplikasi lama belum memahami item KAMAR; jangan melakukan rollback aplikasi lama setelah invoice kamar tercipta tanpa pemeriksaan kompatibilitas.
5. Super Admin membuka **Pembayaran → Tarif Kamar** dan mengisi tarif nyata per kelas sebelum alokasi baru dibuka. Migration tidak mengisi harga default. Tanpa tarif berlaku, alokasi baru ditolak dan transaksi rollback.
6. Pada rincian biaya pasien, pilih alokasi yang sesuai perawatan. Alokasi Aktif hanya estimasi. Selesaikan alokasi sebelum membuat draf yang mencakup kamar. Alokasi Batal tidak ditagih.
7. Alokasi sebelum migration tidak memiliki snapshot dan memerlukan rekonsiliasi terpisah oleh Backend Lead; tidak diberi harga retroaktif otomatis. Billing tindakan lama tetap tersedia tanpa pilihan alokasi.

## API tambahan

- GET `/api/billing/room-tariffs`: Petugas Administrasi atau Super Admin.
- POST `/api/billing/room-tariffs`: Super Admin; body `kelas_perawatan`, `harga_per_malam` (string decimal), `tanggal_berlaku` (YYYY-MM-DD), `tanggal_berakhir?` (eksklusif), `id_tarif_sebelumnya?`.
- `id_tarif_sebelumnya` menutup periode terbuka pada tanggal awal baru dan membuat harga baru dalam satu transaksi. Harga historis tidak ditimpa. Penggantian tidak boleh berlaku sebelum hari ini menurut Asia/Jakarta.
- POST preview/invoice: field opsional `id_alokasi_list`, maksimal 100 ID unik. Harga dan jumlah malam tidak diterima dari client.
- Item invoice `jenis_item=KAMAR` memiliki `id_alokasi`, `id_tarif_kamar`, snapshot kelas, waktu mulai/selesai, jumlah, harga satuan, subtotal; `id_detail_rekap` dan `id_tarif` null. Item TINDAKAN tetap memakai kedua referensi lama.
- Satu alokasi hanya bisa diklaim satu invoice non-Batal. Cancel melepaskan klaim tanpa menghapus detail historis. Hitung ulang hanya Draft, memakai alokasi dan snapshot harga yang sama.

## Verifikasi 16 November 2026

- Prisma 6.19.3; build frontend dan ESLint pada `frontend/src` lulus.
- Seluruh 67 test backend lulus, tanpa skip, pada MySQL 8.0.45 terisolasi di loopback. Empat migration MySQL berhasil diterapkan pada database test kosong; test menyiapkan/membersihkan data sintetisnya sendiri.
- Jalankan integration test dengan `TEST_DATABASE_URL` dan `DATABASE_URL` menunjuk database test yang sama, JWT_SECRET test, Prisma Client sesuai provider, dan `node --test --test-concurrency=1 "test/*.test.js"` dari `backend/`. Jangan memakai `.env` production sebagai target test.
- Validasi schema untuk kedua provider dilakukan terpisah. Prisma Client workspace dikembalikan ke PostgreSQL setelah pengujian MySQL.
- Migration dan advisory lock PostgreSQL belum diuji pada server PostgreSQL dalam sesi ini. Tidak ada migration/seed/test penulis data yang dijalankan terhadap Supabase/shared/production.
- Perintah lint umum turut memindai `.next` dalam folder frontend lama; lint source dijalankan terpisah dan lulus. Tidak mengubah konfigurasi lint di luar scope.
- Dokumentasi lengkap dan plan ada di `docs/`; folder itu sudah diabaikan `.gitignore` repository. Runbook ini disimpan bersama migration agar ikut terbawa di Git.
