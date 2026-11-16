# Billing kamar otomatis dari alokasi rekap

Migration ini menambahkan nullable FK `rekap_tindakan.id_alokasi` ke `rekam_alokasi` beserta index. Data dan invoice lama tidak diubah secara massal. Terapkan migration sebelum deploy kode backend baru; schema PostgreSQL aktif mengikuti `backend/prisma.config.js`. Versi MySQL legacy disiapkan terpisah.

- Rekap baru menyimpan source alokasi otomatis saat dibuat. Preview legacy mencari kecocokan tanggal yang jelas tanpa menulis database; FK disimpan saat transaksi pembuatan invoice berhasil.
- Kandidat harus non-Batal, sudah dimulai sebelum rekap dibuat, serta mencakup semua tanggal tindakan. Jika tanpa tindakan, gunakan waktu dibuat rekap. Tidak ada kecocokan/lebih dari satu di antara riwayat yang relevan menghasilkan error; sistem tidak memilih alokasi terakhir atau menagih seluruh riwayat pasien. Pasien tanpa alokasi sebelum waktu rekap tetap bisa ditagih tindakan.
- Payload billing cukup `{id_rekap}` dan catatan opsional. Field pemilihan lama hanya dapat mengonfirmasi source otomatis, tidak menghilangkan/mengganti biaya kamar. UI tidak lagi menyediakan checkbox alokasi.
- Harga, kelas dan awal durasi tetap berasal dari snapshot alokasi. Snapshot lama yang kosong membutuhkan rekonsiliasi Super Admin sekali; kemudian preview langsung memuat biaya tanpa pilihan manual.
- Preview alokasi Aktif adalah estimasi. Invoice baru yang memasukkan kamar menunggu alokasi Selesai. Label tombol dan pesan di dekatnya menjelaskan kondisi tersebut.
- Invoice non-Batal yang sudah ada ditampilkan dari snapshot tersimpan. Hitung ulang tidak menambah kamar ke invoice tindakan lama; cancel dan klaim satu invoice per alokasi tetap berlaku.
- Tidak membutuhkan dependency baru dan tidak mengubah tabel pasien/kelas atau struktur TarifKamar yang sudah tersedia.

## Verifikasi

Gunakan database test terisolasi dan client sesuai provider. Test API menggunakan TEST_DATABASE_URL eksplisit; suite backend dijalankan dengan `node --test --test-concurrency=1 "test/*.test.js"`. Jangan memakai koneksi production/shared untuk integration test.

Validasi provider dan deployment Supabase tetap menjadi langkah terpisah dari perubahan file migration. Migration ini belum dijalankan terhadap production dari sesi agent.

Verifikasi slice billing otomatis (16 November 2026): seluruh 79 test backend lulus tanpa skip pada MySQL 8.0.45 lokal terisolasi. Migration baru berhasil diterapkan pada database test. Lint source frontend, build Next.js production, validasi kedua schema Prisma 6.19.3 dan git diff --check lulus. Termasuk FK otomatis saat pembuatan rekap, preview legacy read-only, sumber kunjungan lama yang cocok tanggal, penolakan kunjungan campuran/ambigu, penolakan penghilangan kamar via payload, dan perlindungan invoice tindakan lama. Prisma Client dipulihkan ke PostgreSQL dan server test dihentikan. Migration PostgreSQL belum diuji pada server PostgreSQL atau diterapkan ke Supabase/production dalam sesi ini; perlu ikut deployment backend/frontend.
