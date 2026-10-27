# DOKUMENTASI ARSITEKTUR DAN WORKSPACE PENGEMBANGAN
## Inpatient System — Kelompok 5

**Proyek:** Sistem Informasi Rawat Inap Rumah Sakit  
**Mata Kuliah:** Praktikum Rekayasa Sistem Informasi  
**Tim:** Kelompok 5  
**Versi Dokumentasi:** 1.0

---

## 1. Gambaran Umum Proyek

Inpatient System merupakan aplikasi sistem informasi yang dirancang untuk membantu petugas rumah sakit mengelola kegiatan administrasi rawat inap, mulai dari ketersediaan kamar, alokasi bed, antrean pasien, rujukan, rekap riwayat layanan, hingga pengelolaan tagihan pasien.

Pengembangan sistem dilakukan oleh empat anggota kelompok. Setiap anggota bertanggung jawab atas fitur yang telah ditentukan berdasarkan *Use Case* (UC), termasuk pengerjaan frontend dan backend.

Dengan pembagian tersebut, setiap anggota dapat mengembangkan fitur masing-masing secara paralel. Meski demikian, seluruh fitur tetap berada dalam satu aplikasi dan menggunakan database yang sama.

### 1.1 Teknologi yang Digunakan

| Bagian | Teknologi | Keterangan |
|---|---|---|
| Frontend | Next.js (React) | Antarmuka pengguna |
| Bahasa Frontend | JavaScript / JSX | Tanpa TypeScript |
| Styling | Tailwind CSS | Pengaturan tampilan |
| Backend | Node.js + Express.js | REST API dan proses bisnis |
| Bahasa Backend | JavaScript (ES Modules) | Tanpa TypeScript |
| Database | MySQL | Penyimpanan data relasional |
| ORM | Prisma ORM 6.19.3 | Akses database dan migrasi |
| Package Manager | npm Workspaces | Pengelolaan monorepo |
| Version Control | Git + GitHub | Kolaborasi pengembangan |

**Status:** Struktur dasar frontend dan backend sudah disiapkan. Konfigurasi database serta implementasi fitur bisnis dikerjakan pada tahap berikutnya.

---

## 2. Arsitektur Sistem

### 2.1 Pendekatan Arsitektur

Proyek menggunakan pendekatan **Modular Monolith dengan Feature-Based MVC**.

Modular Monolith berarti seluruh fitur backend berjalan dalam satu aplikasi Express, tetapi kode setiap fitur dipisahkan sesuai tanggung jawabnya.

Sementara itu, Feature-Based MVC berarti controller dan model dikelompokkan berdasarkan fitur, bukan seluruh controller atau model digabungkan dalam satu folder besar.

Contohnya, kode khusus pengelolaan tagihan berada di modul `billing`, sedangkan kode pengelolaan bed berada di modul `bed`.

Kami menggunakan satu folder `routes/` agar seluruh endpoint backend memiliki tempat pengelolaan yang jelas.

### 2.2 Alur Komunikasi Sistem

```text
Pengguna
   |
   v
Frontend Next.js
   |
   | HTTP Request / REST API
   v
Backend Express.js
   |
   v
Routes
   |
   v
Middleware (jika diperlukan)
   |
   v
Controller
   |
   v
Model / Service
   |
   v
Prisma ORM
   |
   v
MySQL Database
```

Frontend bertanggung jawab atas tampilan dan pengambilan input pengguna. Backend bertanggung jawab atas validasi, otorisasi, logika proses bisnis, serta pengelolaan data.

Alur respons berjalan kembali dari backend menuju frontend dalam format JSON.

Service bersifat opsional dan dapat ditambahkan pada fitur yang memiliki logika bisnis lebih banyak, seperti perhitungan tagihan atau alokasi bed.

---

## 3. Struktur Workspace

Project menggunakan satu repository dengan pemisahan antara frontend dan backend.

```text
inpatient-system/
│
├── frontend/                # Next.js
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── next.config.mjs
│
├── backend/                 # Express.js
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── modules/
│   │   ├── app.js
│   │   └── server.js
│   ├── prisma/
│   ├── .env
│   └── package.json
│
├── docs/                    # Dokumentasi bersama
├── package.json
└── package-lock.json
```

Struktur di atas merupakan **target pengorganisasian kode**. Folder yang belum tersedia dapat dibuat ketika tahap implementasi dimulai.

### 3.1 Root Project

Folder utama `inpatient-system/` menjadi tempat pengelolaan repository.

File `package.json` pada root digunakan untuk mengatur npm workspaces, sedangkan `package-lock.json` menyimpan versi dependensi yang terpasang.

Folder `node_modules/` dapat muncul di root, frontend, maupun backend. Hal tersebut normal pada npm workspaces dan tidak berarti ada kesalahan struktur.

Setiap anggota sebaiknya menjalankan instalasi dependensi melalui npm workspaces supaya pengelolaan package tetap konsisten.

---

## 4. Workspace Frontend

Frontend menggunakan Next.js dengan App Router.

Struktur yang direncanakan:

```text
frontend/src/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── login/
│   │   └── page.jsx
│   └── dashboard/
│       ├── layout.jsx
│       ├── beds/
│       │   └── page.jsx
│       ├── allocation/
│       │   └── page.jsx
│       ├── queue/
│       │   └── page.jsx
│       ├── referral/
│       │   └── page.jsx
│       ├── monitoring/
│       │   └── page.jsx
│       ├── history/
│       │   └── page.jsx
│       └── billing/
│           └── page.jsx
│
├── features/
│   ├── auth/
│   ├── bed/
│   ├── allocation/
│   ├── queue/
│   ├── referral/
│   ├── monitoring/
│   ├── history/
│   └── billing/
│
├── components/
└── lib/
```

### 4.1 Fungsi Folder Frontend

| Folder | Fungsi |
|---|---|
| `app/` | Mengatur halaman dan routing Next.js |
| `features/` | Menyimpan kode frontend berdasarkan fitur |
| `components/` | Menyimpan komponen UI yang dipakai bersama |
| `lib/` | Menyimpan konfigurasi dan utility bersama |
| `public/` | Menyimpan aset statis |

### 4.2 Perbedaan app dan features

Folder `app/` digunakan untuk menentukan halaman yang dapat diakses pengguna melalui URL.

Folder `features/` berisi implementasi dari fitur tersebut, termasuk komponen UI, fungsi API, dan custom hooks.

Contoh modul Billing:

```text
src/
├── app/
│   └── dashboard/
│       └── billing/
│           └── page.jsx
│
└── features/
    └── billing/
        ├── components/
        │   ├── BillingTable.jsx
        │   └── BillingForm.jsx
        ├── api/
        │   └── billing.api.js
        └── hooks/
            └── useBilling.js
```

File `page.jsx` menjadi halaman yang diakses pengguna, sedangkan kode khusus fitur Billing diletakkan di `features/billing/`.

Untuk komponen yang memerlukan event handler, state interaktif, atau browser API, gunakan Client Component (`'use client'`) sesuai kebutuhan Next.js.

Komponen yang digunakan oleh beberapa fitur, misalnya sidebar, tombol, tabel dasar, dan dialog umum, diletakkan dalam folder `components/`.

---

## 5. Workspace Backend

Backend menggunakan Express.js dengan pola MVC sederhana.

```text
backend/src/
├── config/
├── middlewares/
├── routes/
│   ├── index.js
│   ├── auth.routes.js
│   ├── bed.routes.js
│   ├── allocation.routes.js
│   ├── queue.routes.js
│   ├── referral.routes.js
│   ├── monitoring.routes.js
│   ├── history.routes.js
│   └── billing.routes.js
│
├── modules/
│   ├── auth/
│   ├── bed/
│   ├── allocation/
│   ├── queue/
│   ├── referral/
│   ├── monitoring/
│   ├── history/
│   └── billing/
│
├── app.js
└── server.js
```

### 5.1 Fungsi Setiap Bagian

| Folder / File | Tanggung Jawab |
|---|---|
| `config/` | Konfigurasi bersama, termasuk koneksi database |
| `middlewares/` | Pemeriksaan autentikasi, hak akses, dan error |
| `routes/` | Pendaftaran endpoint REST API |
| `routes/index.js` | Menggabungkan seluruh router fitur |
| `modules/` | Menyimpan controller, model, dan logika khusus fitur |
| `app.js` | Menyiapkan Express, middleware global, dan router |
| `server.js` | Menjalankan HTTP server |
| `prisma/` | Menyimpan Prisma Schema dan migrasi database |

### 5.2 Pola MVC pada Backend

Setiap modul minimal mempunyai controller dan model.

Contoh:

```text
modules/billing/
├── billing.controller.js
└── billing.model.js
```

**Controller** menerima request dari route, memproses input, memanggil fungsi yang diperlukan, lalu mengirim response.

**Model** bertanggung jawab atas operasi data, seperti mengambil daftar invoice atau menyimpan tagihan menggunakan Prisma.

Jika sebuah fitur memiliki proses bisnis yang cukup panjang, anggota boleh menambahkan `service`.

Contoh:

```text
modules/billing/
├── billing.controller.js
├── billing.service.js
└── billing.model.js
```

Pada pendekatan ini, service menangani perhitungan dan aturan bisnis, sedangkan model menangani akses data.

Kami tidak mewajibkan repository layer pada setiap fitur agar struktur project tetap sederhana.

### 5.3 Pengelolaan Routes

Semua file route disimpan dalam `src/routes/`.

Contoh:

```text
routes/
├── index.js
├── bed.routes.js
├── queue.routes.js
└── billing.routes.js
```

File `routes/index.js` berfungsi sebagai tempat pendaftaran router, bukan tempat menulis seluruh endpoint secara langsung.

Contoh:

```javascript
import { Router } from 'express';
import bedRoutes from './bed.routes.js';
import billingRoutes from './billing.routes.js';

const router = Router();

router.use('/beds', bedRoutes);
router.use('/billing', billingRoutes);

export default router;
```

Kemudian, `app.js` mendaftarkannya melalui:

```javascript
app.use('/api', routes);
```

Dengan demikian, semua endpoint berada di bawah prefix `/api`.

---

## 6. Pembagian Workspace Anggota

Pembagian tugas mengikuti use case yang telah ditetapkan pada dokumen praktikum.

| Anggota | Use Case | Frontend | Backend |
|---|---|---|---|
| Nawira | UC-01, UC-07 | Auth, History | Auth, History |
| MYZ | UC-02, UC-03 | Bed, Allocation | Bed, Allocation |
| ESBN | UC-04, UC-05, UC-06 | Queue, Referral, Monitoring | Queue, Referral, Monitoring |
| TFM | UC-08, UC-09 | Billing | Billing |

### 6.1 Nawira — Authentication dan History

**UC-01:** Login pengguna berdasarkan peran Petugas Administrasi atau Petugas Bed Management.

**UC-07:** Pengelolaan rekap riwayat layanan dan tindakan pasien sebagai dasar proses Billing.

Workspace utama:

```text
frontend/src/features/auth/
frontend/src/features/history/

backend/src/modules/auth/
backend/src/modules/history/

backend/src/routes/auth.routes.js
backend/src/routes/history.routes.js
```

Modul Authentication juga berkaitan dengan middleware autentikasi dan authorization yang digunakan seluruh fitur. Perubahan pada bagian tersebut perlu dikoordinasikan dengan anggota lain.

### 6.2 MYZ — Bed Management dan Allocation

**UC-02:** Mengelola data serta status ketersediaan bed.

**UC-03:** Mengalokasikan bed kepada pasien sesuai kebutuhan dan ketersediaannya.

Workspace utama:

```text
frontend/src/features/bed/
frontend/src/features/allocation/

backend/src/modules/bed/
backend/src/modules/allocation/

backend/src/routes/bed.routes.js
backend/src/routes/allocation.routes.js
```

Modul ini perlu menjaga agar satu bed tidak dialokasikan kepada lebih dari satu pasien aktif pada waktu yang sama.

### 6.3 ESBN — Queue, Referral, dan Monitoring

**UC-04:** Mencatat antrean pasien stabil berdasarkan FIFO ketika bed tidak tersedia.

**UC-05:** Mengelola rujukan pasien darurat dan dokumen rujukannya.

**UC-06:** Memantau status penanganan pasien yang sedang menunggu atau telah dirujuk.

Workspace utama:

```text
frontend/src/features/queue/
frontend/src/features/referral/
frontend/src/features/monitoring/

backend/src/modules/queue/
backend/src/modules/referral/
backend/src/modules/monitoring/

backend/src/routes/queue.routes.js
backend/src/routes/referral.routes.js
backend/src/routes/monitoring.routes.js
```

Modul antrean harus berkoordinasi dengan Bed Management dan Allocation karena perubahan ketersediaan bed berpengaruh terhadap penanganan pasien yang menunggu.

### 6.4 TFM — Billing

**UC-08:** Menghitung biaya pelayanan pasien berdasarkan riwayat layanan dan tarif.

**UC-09:** Memeriksa rincian serta total tagihan pasien sebelum diterbitkan atau diserahkan.

Workspace utama:

```text
frontend/src/features/billing/

backend/src/modules/billing/

backend/src/routes/billing.routes.js
```

Billing membutuhkan data rekap dari modul History. Rekap yang telah berstatus `Siap Billing` menjadi dasar perhitungan tagihan.

Perhitungan total, pemeriksaan data, penerbitan invoice, dan pembaruan status tagihan ditangani oleh modul Billing.

---

## 7. Aturan Pengembangan Bersama

### 7.1 Kepemilikan Kode

Setiap anggota memiliki tanggung jawab utama atas folder fiturnya sendiri.

Anggota boleh membaca atau menggunakan fungsi dari modul lain, tetapi perubahan pada logika milik anggota lain harus dikoordinasikan terlebih dahulu.

File bersama seperti `app.js`, `routes/index.js`, middleware global, Prisma Schema, serta komponen UI umum perlu diperiksa bersama sebelum perubahan digabungkan.

### 7.2 Integrasi Antarfitur

Beberapa fitur memiliki hubungan data yang perlu disepakati sejak awal.

| Modul | Membutuhkan | Tujuan |
|---|---|---|
| Allocation | Bed | Memeriksa ketersediaan bed |
| Queue | Bed / Allocation | Mengetahui ketersediaan dan tindak lanjut pasien antrean |
| Monitoring | Queue / Referral | Membaca status penanganan pasien |
| Billing | History | Mengambil rekap tindakan yang siap ditagihkan |
| Semua modul | Auth | Memeriksa identitas dan hak akses pengguna |

Jika membutuhkan data modul lain, gunakan fungsi atau kontrak yang disepakati. Hindari membuat ulang aturan bisnis yang sudah menjadi tanggung jawab modul lain.

### 7.3 Standar REST API

Endpoint menggunakan prefix `/api` dan HTTP method sesuai operasinya.

Contoh rancangan endpoint:

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/beds` | Daftar bed |
| POST | `/api/allocations` | Alokasi bed |
| GET | `/api/queues` | Daftar antrean |
| POST | `/api/referrals` | Membuat rujukan |
| GET | `/api/monitoring` | Status penanganan |
| GET | `/api/histories` | Rekap riwayat |
| GET | `/api/billing` | Daftar tagihan |

Daftar tersebut merupakan rancangan awal dan dapat disesuaikan ketika API contract disepakati.

Format response dasar yang disarankan:

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": []
}
```

Untuk error:

```json
{
  "success": false,
  "message": "Data tidak ditemukan"
}
```

Gunakan HTTP status code yang sesuai dan pastikan semua endpoint memerlukan otorisasi ketika mengakses data pasien atau transaksi.

---

## 8. Aturan Git dan GitHub

Pengembangan menggunakan satu repository dengan feature branch untuk setiap anggota.

```text
main
└── develop
    ├── feature/n-auth-history
    ├── feature/myz-bed-allocation
    ├── feature/esbn-queue-referral
    └── feature/tfm-billing
```

`main` digunakan sebagai branch versi stabil, sedangkan `develop` menjadi tempat penggabungan fitur sebelum pengujian akhir.

Setiap anggota membuat branch dari `develop`, mengerjakan fitur, kemudian mengajukan Pull Request.

Contoh:

```bash
git checkout develop
git pull origin develop

git checkout -b feature/tfm-billing
```

Setelah perubahan selesai:

```bash
git add .
git commit -m "feat(billing): add billing dashboard"
git push -u origin feature/tfm-billing
```

Sebelum Pull Request digabungkan, pastikan kode dapat dijalankan, tidak merusak modul lain, dan tidak membawa file `.env`, `node_modules`, atau hasil build.

Gunakan pesan commit yang menjelaskan perubahan, misalnya `feat(bed): add bed list`, `fix(queue): correct FIFO order`, atau `refactor(billing): separate calculation logic`.

---

## 9. Menjalankan Project

Seluruh perintah berikut dijalankan dari root repository `inpatient-system/`.

### Instalasi Dependensi

```bash
npm install
```

Perintah tersebut digunakan untuk memasang dependensi yang dideklarasikan dalam npm workspaces.

### Menjalankan Frontend

```bash
npm run dev -w frontend
```

Frontend Next.js direncanakan berjalan pada:

```text
http://localhost:3000
```

### Menjalankan Backend

```bash
npm run dev -w backend
```

Backend Express direncanakan berjalan pada:

```text
http://localhost:3001
```

Untuk menjalankan keduanya sekaligus, gunakan `npm run dev` dari root jika script `concurrently` sudah dikonfigurasi.

Nomor port harus disesuaikan dengan `.env` dan konfigurasi aktual yang digunakan seluruh anggota.

---

## 10. Ketentuan Sebelum Implementasi Fitur

Sebelum masing-masing anggota mulai mengembangkan use case, kelompok perlu menyepakati hal-hal berikut:

1. **Struktur folder final**, supaya tidak terjadi perbedaan pola antaranggota.
2. **Kontrak API**, meliputi endpoint, HTTP method, request, response, dan error.
3. **Struktur database**, berdasarkan ERD bersama dan satu Prisma Schema.
4. **Komponen UI bersama**, seperti dashboard layout, sidebar, tabel dasar, dan form.
5. **Aturan autentikasi dan hak akses**, sesuai peran Petugas Administrasi dan Petugas Bed Management.
6. **Alur integrasi fitur**, khususnya Bed–Allocation–Queue dan History–Billing.

Selama database belum selesai dikonfigurasi, masing-masing anggota dapat menggunakan data dummy. Namun, struktur data dummy sebaiknya mengikuti format API yang sudah disepakati agar penggantian ke database asli tidak memerlukan perubahan besar.

---

## 11. Penutup

Struktur workspace ini dirancang supaya setiap anggota Kelompok 5 dapat mengembangkan frontend dan backend berdasarkan use case masing-masing tanpa harus memisahkan project menjadi beberapa aplikasi independen.

Frontend menggunakan Next.js dan backend menggunakan Express.js dalam satu monorepo. Kode backend disusun dengan pola Feature-Based MVC, sedangkan seluruh file routing ditempatkan dalam folder `routes/` agar pengelolaan endpoint tetap terpusat.

Setiap anggota bertanggung jawab atas implementasi fitur miliknya, sementara konfigurasi global, database, antarmuka bersama, dan integrasi antarmodul menjadi tanggung jawab kelompok.

Dokumentasi ini menjadi acuan awal pengembangan dan dapat diperbarui apabila terdapat perubahan kebutuhan atau keputusan teknis yang telah disepakati bersama.
