> Arsip PostgreSQL, nonaktif sejak 30 Oktober 2026. Schema berada di `schema.prisma` dalam folder ini; migration lama tetap di `../migrations/`. Untuk perintah CLI di bawah, tambahkan `--config prisma.postgresql.config.js` dari folder backend, dan pulihkan URL PostgreSQL di `.env` terlebih dahulu. Panduan aktif: [MySQL lokal](../README.md).

# Prisma 6.19.3 dan Supabase PostgreSQL

Adaptasi seluruh 15 tabel dari `inpatient_kelompok5_v1_1.sql` (MySQL).
Migration awal disiapkan offline, belum diterapkan. Database tidak diakses selama
konfigurasi ini. File `.env` yang sudah ada tidak diubah.

## Mengisi koneksi Supabase

1. Buka proyek Supabase yang akan digunakan, lalu pilih **Connect**.
2. Untuk Express yang berjalan terus di jaringan IPv4, salin koneksi **Session
   pooler**, port **5432**, ke `DATABASE_URL` dan `DIRECT_URL` dalam `backend/.env`.
   Gunakan `backend/.env.example` sebagai acuan; pertahankan variabel lain yang ada.
3. Ganti password dengan password database, bukan anon key atau service-role key.
   Percent-encode karakter khusus password. Salin host dan username dari dashboard;
   jangan menebak host pooler dari nama region.
4. Tambahkan `sslmode=require&schema=public` pada parameter koneksi.
   `sslmode=require` mengenkripsi koneksi; verifikasi sertifikat yang lebih ketat
   dapat dikonfigurasi memakai sertifikat proyek sesuai lingkungan deployment.
5. Jika jaringan mendukung IPv6, `DIRECT_URL` bisa memakai endpoint langsung
   `db.<project-ref>.supabase.co:5432`, dengan username `postgres`.
   Koneksi pooler memakai username `postgres.<project-ref>`.
6. Jika kelak memakai deployment serverless, `DATABASE_URL` dapat menggunakan
   **Transaction pooler**, port **6543**, dengan `pgbouncer=true`. Tetap gunakan
   koneksi direct/session untuk `DIRECT_URL` dan migrasi.

URL di contoh hanyalah placeholder. Jangan memasukkan password database ke
frontend atau commit `.env`. Tidak diperlukan Supabase JavaScript SDK maupun
driver adapter tambahan untuk Prisma 6 dengan engine standar ini.

## Model dan hubungan

Semua model menggunakan `@@map` ke tabel SQL. Kolom tetap memakai snake_case
sehingga tidak memerlukan `@map`. Setiap FK diberi nama relation eksplisit dan
`map` sesuai nama constraint SQL. Semua hubungan di bawah adalah banyak-ke-satu;
model tujuan menyediakan daftar relasi balik.

| Model | Tabel | Referensi FK ke model |
| --- | --- | --- |
| Akun | akun | â€” |
| Pasien | pasien | â€” |
| Bed | bed | â€” |
| RekamAlokasi | rekam_alokasi | Pasien, Bed, Akun |
| DaftarTunggu | daftar_tunggu | Pasien, Akun |
| RumahSakitRujukan | rumah_sakit_rujukan | â€” |
| SuratRujukan | surat_rujukan | Pasien, RumahSakitRujukan, Akun |
| RiwayatStatusPasien | riwayat_status_pasien | Pasien, Akun |
| RmeDummy | rme_dummy | Pasien |
| RekapTindakan | rekap_tindakan | Pasien, Akun |
| DetailRekapTindakan | detail_rekap_tindakan | RekapTindakan, RmeDummy |
| Tarif | tarif | â€” |
| Tagihan | tagihan | Pasien, RekapTindakan, Akun |
| DetailTagihan | detail_tagihan | Tagihan, DetailRekapTindakan, Tarif |
| LogAudit | log_audit | Akun |

`Tagihan.id_rekap` tidak unique: satu rekap dapat memiliki banyak tagihan menurut
SQL asal. `LogAudit.id_referensi` tetap referensi longgar, bukan FK. Tidak ada FK
dari `kode_tindakan` ke `Tarif` dalam SQL asal, sehingga tidak ditambahkan.

## Perbedaan dan kompatibilitas

| Aspek SQL MySQL | Adaptasi PostgreSQL / Prisma |
| --- | --- |
| Provider `mysql` | `postgresql` untuk Supabase |
| `INT AUTO_INCREMENT` | `Int @default(autoincrement())`, migration menghasilkan `SERIAL` dan sequence |
| PK bernama `PRIMARY` di setiap tabel | Nama PostgreSQL `<nama_tabel>_pkey`; kolom dan fungsi PK tetap sama |
| `DATETIME` tanpa pecahan detik | `DateTime @db.Timestamp(0)`, timestamp tanpa zona waktu |
| `DATE` | `DateTime @db.Date`; tetap tanggal tanpa waktu |
| `DECIMAL(15,2)` | `Decimal @db.Decimal(15, 2)`; tetap presisi desimal, gunakan `Prisma.Decimal` untuk kalkulasi uang |
| `VARCHAR(n)` | `String @db.VarChar(n)`; panjang dipertahankan |
| `TEXT` | `String @db.Text`; PostgreSQL tidak memiliki batas 65.535 byte yang dimiliki MySQL TEXT |
| Nullable, nilai default, 15 PK | Dipertahankan, termasuk timestamp nullable yang memiliki default |
| Seluruh FK, unique dan index | Nama, kolom, urutan kolom, dan hubungan dipertahankan |
| FK tanpa `ON DELETE` / `ON UPDATE` | `NoAction` eksplisit pada keduanya; tidak menambahkan cascade |
| `CHECK (jumlah > 0)` | Dua constraint bernama asli ditambahkan manual ke migration SQL |
| `COMMENT` kolom/tabel | `COMMENT ON COLUMN` / `COMMENT ON TABLE` dalam migration; bukan constraint validasi |
| InnoDB, `CHARSET=utf8mb4`, backtick | Sintaks khusus MySQL dihapus; PostgreSQL memakai encoding database dan identifier berpetik ganda |
| `utf8mb4_unicode_ci` | Tidak dipetakan otomatis. Collation PostgreSQL mengikuti database; perbandingan/unique teks dapat berbeda untuk kapitalisasi, aksen, dan spasi akhir |
| `CURRENT_TIMESTAMP` | `@default(now())`; di PostgreSQL nilainya mengacu awal transaksi, dan timestamp tanpa zona mengikuti zona sesi saat konversi |
| `CREATE DATABASE inpatient_db`, `USE` | Dihilangkan. Memakai database Supabase yang sudah ada, biasanya `postgres`, schema `public` |
| `updated_at` / `tanggal_diperbarui` biasa | Tidak diberi `@updatedAt`; aplikasi harus mengisinya seperti desain asal |
| Daftar nilai status dalam komentar | Tetap `String`, tidak diubah menjadi enum atau CHECK baru |

Collation adalah perbedaan perilaku, bukan sekadar sintaks. Contohnya `Admin` dan
`admin` dapat diterima sebagai dua username berbeda di PostgreSQL. Jika keunikan
tanpa membedakan huruf/aksen merupakan kebutuhan, tentukan kebijakannya lalu
buat migration khusus (misalnya collation ICU yang sesuai atau index ekspresi).
`citext` saja tidak menyamakan seluruh perilaku `utf8mb4_unicode_ci`.

Timestamp sengaja tidak diubah ke `timestamptz` karena SQL asal menyimpan waktu
tanpa zona. Tetapkan konvensi zona waktu aplikasi/sesi sebelum mengisi data;
jangan menganggap Supabase otomatis menyimpan waktu Asia/Jakarta.

Aturan yang belum ada di SQL juga tidak ditambahkan: satu alokasi aktif per
bed/pasien, larangan periode tarif tumpang tindih, kecocokan pasien antar tabel,
rumus subtotal/total, dan larangan edit/hapus audit. Komentar audit tidak
menegakkan izin; aturan tersebut perlu otorisasi backend atau SQL tambahan.

`prisma.config.ts` diganti menjadi `prisma.config.js` (ESM) agar konfigurasi juga
JavaScript. URL runtime dan `directUrl` tetap diletakkan di datasource schema,
sesuai Prisma 6. Generator `prisma-client` diganti menjadi `prisma-client-js`,
sehingga backend dapat mengimpor `@prisma/client` tanpa kompilasi TypeScript.
CLI dan client yang terpasang sama-sama **6.19.3**. Range versi dalam package.json
tetap seperti sebelumnya; gunakan lockfile saat instalasi agar hasil konsisten.

## CHECK dan migration pertama

File `migrations/20261027000000_init_postgresql/migration.sql` memuat seluruh DDL,
dua CHECK, serta komentar SQL asal. Migration dibungkus transaksi. File tersebut
dibuat dengan `migrate diff --from-empty --to-schema-datamodel`, tanpa mengakses
database dan tanpa shadow database. Jangan menggantinya dengan output diff baru
tanpa menyalin kembali CHECK dan komentar yang tidak disimpan oleh schema Prisma.

Sebelum deploy ke Supabase, nonaktifkan Data API jika hanya Express yang akan
mengakses database, atau aktifkan RLS dan atur grant/policy yang sesuai pada
seluruh tabel di schema yang diekspos. Tabel yang dibuat lewat SQL/Prisma tidak
otomatis dilindungi RLS. Migration ini mempertahankan SQL asal dan belum menambah
RLS/policy. Kredensial owner database untuk pengembangan tidak boleh diberikan
ke pengguna; sebelum produksi gunakan role backend dengan hak minimum.

Sesudah mengisi `.env`, jalankan pemeriksaan dari folder backend:

```powershell
Set-Location D:\Coding\RSI\inpatient-system\backend
npx prisma format
npx prisma validate
npx prisma generate
```

Setelah meninjau migration dan memastikan tidak ada tabel aplikasi bernama sama
pada target, jalankan sendiri perintah berikut. Perintah ini **mengubah database**:

```powershell
npx prisma migrate deploy
```

`migrate deploy` menggunakan migration yang sudah disiapkan, tanpa membuat
database/shadow database. Prisma akan membuat tabel metadata `_prisma_migrations`
di samping 15 tabel aplikasi. Jangan menjalankan file SQL MySQL asli di Supabase
atau menjalankan DDL ini secara terpisah sebelum Prisma Migrate.

## Penggunaan dalam backend JavaScript

Instance bersama ada di `src/config/prisma.js`. Contoh dari file feature yang
berada dua tingkat di bawah `src` (sesuaikan path import dengan lokasinya):

```js
import prisma from "../../config/prisma.js";

const pasien = await prisma.pasien.findUnique({
  where: { no_rm: "RM-001" },
  include: { rekam_alokasi_list: true },
});
```

Instance ini belum dipasang ke route/service yang masih berupa kerangka.
Jangan membuat `PrismaClient` baru setiap request.

## Referensi resmi

Pemeriksaan offline yang telah lulus: `prisma format`, `prisma validate`,
`prisma generate` 6.19.3, import ESM instance bersama dan seluruh 15 delegate
model. Pencocokan SQL sumber, metadata Prisma Client, dan migration juga lulus
untuk 131 kolom (tipe, nullable, default), 15 PK, 22 FK, 9 unique index,
24 index biasa, 2 CHECK, dan 33 komentar. Belum dilakukan uji koneksi atau
eksekusi migration pada PostgreSQL. Generate memakai binary engine lokal yang
sudah terpasang karena unduhan engine dibatasi oleh jaringan lingkungan ini.

- [Prisma config dan dukungan JavaScript](https://www.prisma.io/docs/orm/v6/reference/prisma-config-reference)
- [Koneksi Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma 6 dengan Supabase](https://www.prisma.io/docs/orm/v6/overview/databases/supabase)
- [Fitur SQL di luar Prisma Schema](https://www.prisma.io/docs/orm/v6/prisma-schema/data-model/unsupported-database-features)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
