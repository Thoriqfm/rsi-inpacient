# Setup MySQL lokal

Konfigurasi default sementara memakai MySQL lokal sesuai keputusan 30 Oktober
2026. PostgreSQL/Supabase disimpan sebagai konfigurasi terpisah, tidak dihapus.
Tidak ada data Supabase yang dipindahkan atau diubah.

## 1. Jalankan server database

Gunakan MySQL 8.0.16 atau lebih baru agar CHECK jumlah > 0 ditegakkan. Layanan
berlabel MySQL pada XAMPP biasanya MariaDB; cek SELECT VERSION() dan gunakan
MariaDB 10.2.1 atau lebih baru. Migration belum diuji pada server hidup.

Melalui MySQL Workbench, CLI, atau tab SQL phpMyAdmin, buat database lokal kosong:

```sql
CREATE DATABASE inpatient_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Jangan impor SQL lama secara terpisah; Prisma yang akan membuat tabel.

## 2. Instal dependency dari root repository

```powershell
npm ci
```

Instalasi sekali di root mencakup backend dan frontend. Prisma CLI dan Client
terpasang versi 6.19.3; gunakan lockfile yang ada.

## 3. Isi backend/.env

Untuk clone baru saja, dari root:

```powershell
Copy-Item backend/.env.example backend/.env
```

Jika file sudah ada, edit tanpa menimpanya. Contoh akun root lokal tanpa password:

```dotenv
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://root:@127.0.0.1:3306/inpatient_db"
```

Sesuaikan username, password, dan port. Untuk akun dengan password:

```dotenv
DATABASE_URL="mysql://USERNAME:ENCODED_PASSWORD@127.0.0.1:3306/inpatient_db"
```

Percent-encode karakter khusus password. DIRECT_URL tidak dipakai MySQL. Pastikan
hanya satu DATABASE_URL aktif; simpan URL Supabase sebagai komentar. Jangan
commit .env atau menaruh kredensial database di frontend.

## 4. Buat tabel dan Prisma Client

Dari root repository:

```powershell
cd backend
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npx prisma migrate status
```

migrate deploy mengubah database lokal yang ditunjuk .env. Konfigurasi default
prisma.config.js memakai prisma/schema.prisma dan prisma/mysql/migrations.
Migration PostgreSQL tidak dijalankan. Hasil awal: 15 tabel aplikasi dan
_prisma_migrations, tanpa seed data atau akun login.

Jangan memakai db push: dua CHECK dan komentar SQL hanya ada dalam migration.
Jangan reset database berisi data penting. DDL MySQL tidak sepenuhnya
transaksional; jika gagal, periksa tabel parsial dan penyebab kegagalan sebelum
mengulang. Jangan langsung menandai migration gagal sebagai berhasil.

Untuk melihat tabel/data, dari backend:

```powershell
npx prisma studio
```

Pemeriksaan melalui klien SQL:

```sql
SELECT VERSION();
USE inpatient_db;
SHOW TABLES;
SHOW CREATE TABLE rme_dummy;
SHOW CREATE TABLE detail_rekap_tindakan;
```

Pastikan kedua tabel terakhir memiliki CHECK jumlah > 0.

### 4.1 Perubahan schema 31 Oktober 2026

Migration `20261031000000_bed_soft_delete_allocation_guard_queue_link` tersedia
di kedua folder migration dan dijalankan sesuai provider aktif:

- `bed.deleted_at` — soft delete bed; bed nonaktif tidak dihapus fisik.
- `rekam_alokasi.id_antrean` — nullable, unik, FK ke `daftar_tunggu`; satu entri
  antrean maksimal menghasilkan satu alokasi.
- Guard satu alokasi aktif per bed, berbeda per provider:
  - MySQL: generated column `id_bed_aktif` (STORED) + `uq_rekam_alokasi_bed_aktif`.
    InnoDB mengizinkan banyak NULL pada unique index, sehingga hanya baris
    berstatus `Aktif` yang unik per `id_bed`.
  - PostgreSQL: partial unique index `uq_rekam_alokasi_bed_aktif` pada `id_bed`
    dengan predicate `status_alokasi = 'Aktif'`.

`id_bed_aktif` tidak ada di `schema.prisma` karena Prisma tidak memodelkan
generated column; partial index juga tidak dimodelkan. Jangan memakai
`prisma db push`: perintah itu akan mencoba menghapus guard. Guard ini hanya
hidup di migration SQL dan harus disalin kembali jika migration di-squash.

Jumlah objek setelah perubahan: 23 foreign key (sebelumnya 22), 11 unique index
di MySQL (sebelumnya 9), dan 10 unique index + 1 partial unique index di
PostgreSQL (sebelumnya 9). Migration ini belum dijalankan ke database mana pun.

## 5. Jalankan aplikasi

Dua terminal pada root repository:

```powershell
npm run dev --workspace=backend
```

```powershell
npm run dev --workspace=frontend
```

Frontend: <http://localhost:3000>. Backend: <http://localhost:3001/api/health>.
Health API hanya memeriksa Express, bukan koneksi database. Fitur masih kerangka.

## Kembali ke PostgreSQL/Supabase

1. Hentikan backend dan Prisma Studio.
2. Comment URL MySQL di backend/.env, aktifkan DATABASE_URL PostgreSQL dan
   DIRECT_URL lama. Jangan mendefinisikan dua DATABASE_URL aktif.
3. Dari backend jalankan:

```powershell
npx prisma validate --config prisma.postgresql.config.js
npx prisma generate --config prisma.postgresql.config.js
npx prisma migrate status --config prisma.postgresql.config.js
```

4. Jalankan kembali backend. Prisma Client yang terakhir di-generate menentukan
   provider runtime. Generate ulang dengan konfigurasi default sebelum kembali
   memakai MySQL.

Snapshot PostgreSQL: prisma/postgresql/schema.prisma. Migration asli tetap di
prisma/migrations dan tidak diubah. Jika Supabase belum siap, tinjau target dan
migration sebelum menjalankan:

```powershell
npx prisma migrate deploy --config prisma.postgresql.config.js
```

Ini pergantian provider, bukan sinkronisasi/pemindahan data. Perubahan model
berikutnya perlu disesuaikan di kedua schema beserta migration masing-masing.
Collation MySQL utf8mb4_unicode_ci bisa berbeda dari PostgreSQL untuk kapitalisasi,
aksen, dan keunikan username. MySQL memakai DATETIME(0); PostgreSQL memakai
TIMESTAMP(0) tanpa zona. Nilai uang tetap DECIMAL(15,2).

Dokumentasi Supabase sebelumnya: [arsip PostgreSQL](postgresql/README.md).

## Verifikasi perubahan

Lulus tanpa mengakses database: prisma format, prisma validate (kedua konfigurasi),
prisma generate 6.19.3 untuk MySQL, import instance ESM dengan 15 delegate, dan
git diff --check. Pencocokan offline: 15 tabel, 15 PK, 22 FK, 9 unique index,
24 index biasa, 2 CHECK, dan 33 komentar. Snapshot schema dan migration PostgreSQL
dipastikan sama dengan versi sebelumnya. Koneksi, eksekusi migration, serta
penegakan constraint pada server MySQL/MariaDB belum diuji.

Referensi:
- [MySQL: CHECK mulai ditegakkan pada 8.0.16](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [Prisma 6: fitur database dan batasan schema](https://www.prisma.io/docs/orm/v6/reference/database-features)
