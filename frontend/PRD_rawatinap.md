# Product Requirements Document (PRD)

# Sistem Informasi Rawat Inap (Inpatient Care System) - Kelompok 5

---

## 1. Informasi Proyek & Konsep "Monorepo Satu Folder" (Unified Workspace)

### 1.1 Informasi Umum & Anggota Tim

- **Nama Sistem:** Inpatient Care Information System (SIMRS Rawat Inap)
- **Mata Kuliah:** Praktikum Rekayasa Sistem Informasi (RSI - C) — Universitas Brawijaya
- **Tim Pengembang (Kelompok 5):**
  1. **Nawira (N - 255150401111053):** UC-01 (_Login RBAC_) & UC-07 (_Rekap Riwayat Layanan & Tindakan_)
  2. **Muhamad Yusuf Zaki (MYZ - 255150400111064):** UC-02 (_Pengelolaan Data & Ketersediaan Bed_) & UC-03 (_Alokasi Kamar/Bed Pasien_)
  3. **Eugenius Satrio Bagus N. (ESBN - 255150400111021):** UC-04 (_Daftar Tunggu FIFO_), UC-05 (_Rujukan Pasien Darurat_), & UC-06 (_Pemantauan Status Penanganan_)
  4. **Thoriq Farrel Muhammad (TFM - 255150400111074):** UC-08 (_Perhitungan Biaya Pelayanan_) & UC-09 (_Pemeriksaan & Pengelolaan Tagihan/Billing_)

---

### 1.2 Maksud & Definisi "Backend dan Frontend dalam Satu Folder" (Monorepo Architecture)

Proyek ini menggunakan pendekatan **Monorepo / Unified Repository Workspace**. Maksud dari konsep ini adalah:

1. **Satu Repositori Git & Folder Induk Tunggal (`rsi-inpacient/`):**
   Seluruh aset proyek, baik _Frontend_ maupun _Backend_, disimpan dan dikelola bersama di dalam satu repositori yang sama. Tidak ada pemisahan repositori Git menjadi dua proyek independen yang terisolasi.
2. **Pemisahan Peran yang Tegas (_Clear Separation of Concerns_):**
   Meskipun berada dalam satu folder induk, proyek ini **bukan** merupakan aplikasi monolit Next.js di mana API Route Next.js menangani seluruh database. Sebaliknya, proyek memiliki dua folder kerja (_workspaces_) mandiri:
   - **`backend/`:** Layanan REST API berbasis **Node.js + Express.js**, terhubung ke database **MySQL** menggunakan **Prisma ORM 6.19.3**. Backend menerapkan arsitektur **Modular Monolith dengan Feature-Based MVC** (setiap fitur memiliki _controller_, _service_, _model_, dan _validation_ masing-masing).
   - **`frontend/inpatient-care/`:** Aplikasi antarmuka pengguna berbasis **Next.js 15+ (App Router)** dengan **React 19, TypeScript, dan Tailwind CSS**. Frontend bertindak sebagai _Client Consumer_ yang mengonsumsi endpoint REST API yang disediakan oleh Backend.
3. **Koordinasi Terpusat melalui `npm workspaces`:**
   Pada file `package.json` di _root folder_, terdapat konfigurasi workspace (`"workspaces": ["backend", "frontend/*"]`). Ini memungkinkan seluruh dependensi diinstal secara serentak melalui `npm install` dari root, serta memudahkan penulisan skrip otomasi untuk menjalankan frontend dan backend secara berdampingan.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   ROOT REPOSITORY: rsi-inpacient/                      │
│                                                                        │
│   ┌───────────────────────────┐      HTTP REST API     ┌────────────┐  │
│   │  frontend/inpatient-care/ │ ◄────────────────────► │  backend/  │  │
│   │    - Next.js (App Router) │    (Port 3000 -> 3001) │  - Express │  │
│   │    - React 19 + TypeScript│                        │  - Prisma  │  │
│   │    - Tailwind CSS         │                        │  - MySQL   │  │
│   │    (Boundary / Presentation)                       │  (Control  │  │
│   └───────────────────────────┘                        │   & Entity)│  │
│                                                        └────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1.3 Alasan & Keuntungan Pemilihan Arsitektur Monorepo

1. **Paralelisasi Pengerjaan Anggota Tim:**
   Setiap anggota kelompok bertanggung jawab atas fitur yang telah ditentukan secara _end-to-end_ (mulai dari UI frontend hingga logika bisnis dan tabel database backend). Dengan arsitektur satu folder:
   - Nawira dapat langsung menghubungkan halaman UI UC-01 & UC-07 dengan endpoint di `backend/src/modules/auth` dan `backend/src/modules/history`.
   - MYZ dapat menguji alokasi bed di UI UC-02 & UC-03 langsung terhadap transaksi ACID di `backend/src/modules/allocation`.
   - ESBN dan TFM dapat mengimplementasikan fitur masing-masing tanpa harus menunggu repositori lain dideploy.
2. **Sinkronisasi Kode & Kontrak Data (API Contract):**
   Perubahan tipe data, nama kolom database, atau struktur endpoint dapat langsung dikomit dalam satu _commit_ atau _Pull Request (PR)_ yang sama, mencegah terjadinya ketidakcocokan versi (_version mismatch_) antara frontend dan backend.
3. **Modularitas Standar Industri:**
   Backend Express.js memberikan keleluasaan penuh untuk manajemen transaksi database tingkat lanjut (`$transaction`, _Row-Level Lock_ `SELECT ... FOR UPDATE`), _custom middlewares_ autentikasi JWT, validasi schema Zod, dan pengujian unit berbasis `node --test` yang independen dari runtime Next.js.

---

### 1.4 Pemetaan Pola Desain Akademik BCE (_Boundary-Control-Entity_)

Untuk memenuhi kaidah rekayasa perangkat lunak praktikum RSI, pola desain **BCE** dipetakan secara terstruktur ke dalam folder monorepo:

- **Boundary (B) — Antarmuka Pengguna:**
  - **Lokasi:** `frontend/inpatient-care/src/app/` dan `frontend/inpatient-care/src/components/`
  - **Tanggung Jawab:** Menangani presentasi visual, form input, interaksi pengguna, modal dialog, feedback notifikasi (_toast_), dan breadcrumb. Boundary berkomunikasi dengan backend melalui panggilan HTTP (_fetch_ API client).
- **Control (C) — Logika Bisnis & Alur Proses:**
  - **Lokasi:** `backend/src/modules/<fitur>/<fitur>.controller.js` dan `<fitur>.service.js`
  - **Tanggung Jawab:** Mengorkestrasi aturan bisnis, memvalidasi input via Zod schema, menjalankan _Sequence Diagram_ (`SD-01` s.d. `SD-15`), mengeksekusi _Pseudo-Code_ (`PC-01` s.d. `PC-32`), menangani hak akses peran (_Role-Based Access Control_), dan mengelola transaksi ACID.
- **Entity (E) — Akses & Integritas Data:**
  - **Lokasi:** `backend/prisma/schema.prisma` dan `backend/src/modules/<fitur>/<fitur>.model.js`
  - **Tanggung Jawab:** Memodelkan 15 tabel database MySQL, mendefinisikan relasi referensial (Foreign Key), indeks performa, aturan _unique_, _soft delete_, serta pencatatan jejak perubahan ke `log_audit`.

---

### 1.5 Alur Komunikasi Sistem (Client-Server Flow)

```text
[ Pengguna / Petugas Rumah Sakit ]
               │
               ▼
   [ Boundary (Frontend Next.js) ] ── (Port 3000)
               │
               │ HTTP JSON Request (GET / POST / PATCH / DELETE)
               ▼
    [ Routes (Express.js /api) ]   ── (Port 3001)
               │
               ▼
    [ Middlewares (Auth JWT, RBAC Role, Zod Validation) ]
               │
               ▼
   [ Control (Controller & Service) ] ── Mengeksekusi PC-01 s.d. PC-32
               │
               ▼
     [ Entity (Model & Prisma ORM) ] ── Eksekusi Transaksi & Query
               │
               ▼
    [ Database MySQL (15 Tabel) ]
```

---

## 2. Daftar Use Case & Hak Akses Aktor (RBAC)

Sistem memiliki 2 peran pengguna operasional utama ditambah 1 peran pengelola teknis:

1. **Petugas Bed Management** (Contoh: _Budi Santoso_ / username: `budi_bed`)
2. **Petugas Administrasi** (Contoh: _Rina Aprilianti_ / username: `rina_adm`)
3. **Super Admin** (Akses teknis untuk seeding data dan bypass otorisasi sistem)

| Kode UC   | Nama Use Case                                                                     | Aktor Utama                                  |   PIC    | Boundary (Next.js UI)                                                        | Control (Express Controller & Service)                                  | Entity (Prisma / Model)                                          |
| :-------- | :-------------------------------------------------------------------------------- | :------------------------------------------- | :------: | :--------------------------------------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **UC-01** | Melakukan login sesuai peran                                                      | Petugas Administrasi, Petugas Bed Management |  **N**   | `app/login/page.tsx` (`LoginUI`)                                             | `modules/auth/auth.controller.js` & `auth.service.js`                   | `Akun` (`model/auth.model.js`)                                   |
| **UC-02** | Mengelola Data dan Ketersediaan Bed                                               | Petugas Bed Management                       | **MYZ**  | `app/(dashboard)/bed-management/page.tsx` (`BedManagementUI`)                | `modules/bed/bed.controller.js` & `bed.service.js`                      | `Bed` (`model/bed.model.js`)                                     |
| **UC-03** | Mengalokasikan Kamar/Bed kepada Pasien                                            | Petugas Administrasi                         | **MYZ**  | `app/(dashboard)/bed-management/alokasi/page.tsx` (`AlokasiBedUI`)           | `modules/allocation/allocation.controller.js` & `allocation.service.js` | `Bed`, `RekamAlokasi`, `Pasien`, `DaftarTunggu`                  |
| **UC-04** | Memasukkan pasien stabil ke daftar tunggu rawat inap (FIFO) ketika kamar penuh    | Petugas Administrasi                         | **ESBN** | `app/(dashboard)/sistem-antrian/daftar-tunggu/page.tsx` (`DaftarTungguUI`)   | `modules/queue/queue.controller.js` & `queue.service.js`                | `Bed`, `Pasien`, `DaftarTunggu`                                  |
| **UC-05** | Merujuk pasien darurat ke rumah sakit rujukan yang tersedia beserta surat rujukan | Petugas Administrasi                         | **ESBN** | `app/(dashboard)/sistem-antrian/rujukan-pasien/page.tsx` (`RujukanUI`)       | `modules/referral/referral.controller.js` & `referral.service.js`       | `Pasien`, `RumahSakitRujukan`, `SuratRujukan`, `LogAudit`        |
| **UC-06** | Memantau status penanganan pasien yang menunggu atau telah dirujuk                | Petugas Administrasi                         | **ESBN** | `app/(dashboard)/sistem-antrian/pemantauan-status/page.tsx` (`PemantauanUI`) | `modules/monitoring/monitoring.controller.js` & `monitoring.service.js` | `Pasien`, `DaftarTunggu`, `SuratRujukan`, `RiwayatStatusPasien`  |
| **UC-07** | Mengelola rekap riwayat layanan dan tindakan pasien                               | Petugas Administrasi                         |  **N**   | `app/(dashboard)/rekap-layanan/...` (`RekapListUI`, `DetailRekapUI`, dll.)   | `modules/history/history.controller.js` & `history.service.js`          | `RekapTindakan`, `DetailRekapTindakan`, `Pasien`, `RmeDummy`     |
| **UC-08** | Mengetahui biaya pelayanan pasien berdasarkan riwayat tindakan rawat inap         | Petugas Administrasi                         | **TFM**  | `app/(dashboard)/pembayaran/buat/[idPasien]/page.tsx` (`BiayaUI`)            | `modules/billing/billing.controller.js` & `billing.service.js`          | `Pasien`, `RekapTindakan`, `DetailRekapTindakan`, `Tarif`        |
| **UC-09** | Memeriksa rincian dan total tagihan pasien sebelum diserahkan                     | Petugas Administrasi                         | **TFM**  | `app/(dashboard)/pembayaran/...` (`TagihanUI`, `PemeriksaanTagihanUI`)       | `modules/billing/billing.controller.js` & `billing.service.js`          | `Tagihan`, `DetailTagihan`, `RekapTindakan`, `Tarif`, `LogAudit` |

---

## 3. Tech Stack & Struktur Direktori Monorepo Satu Folder

### 3.1 Tech Stack Lengkap

#### A. Frontend Workspace (`frontend/inpatient-care`)

- **Framework:** Next.js 15+ / 16 (App Router Architecture).
- **Library UI:** React 19 dengan TypeScript standar penuh (`strict: true`).
- **Styling & Icons:** Tailwind CSS v4 + `lucide-react` (katalog ikon operasional medis).
- **Data Fetching:** Fetch API / HTTP Client modular dengan konfigurasi baseURL (`http://localhost:3001/api`).
- **State & Form:** React Hooks (`useState`, `useEffect`, `useCallback`) + Form State Validation.

#### B. Backend Workspace (`backend`)

- **Runtime & Framework:** Node.js (ES Modules, `"type": "module"`) + Express.js 5.
- **ORM & Database Client:** Prisma ORM 6.19.3 (`@prisma/client`).
- **Skema & Validasi:** Zod 4+ untuk runtime input validation pada body, param, dan query.
- **Keamanan & Middleware:**
  - `helmet` (keamanan header HTTP)
  - `cors` (pengaturan _Cross-Origin Resource Sharing_ untuk origin `http://localhost:3000`)
  - `jsonwebtoken` + `bcryptjs` (autentikasi stateless JWT & hash password)
  - `express-session` (opsional untuk session tracking)
  - `morgan` (pencatatan log aktivitas HTTP dev)
- **Testing:** Node.js native test runner (`node --test`).

#### C. Database Layer

- **RDBMS:** MySQL 8.0+ (atau MariaDB 10.2+) dengan engine InnoDB (mendukung ACID, _Foreign Keys_, _Row-Level Lock_ `FOR UPDATE`, dan _CHECK Constraints_).
- **Port Layanan:** Port default `3306`.
- **Karakter & Kolasi:** `utf8mb4` / `utf8mb4_unicode_ci`.

---

### 3.2 Struktur Folder Monorepo Aktual (`rsi-inpacient/`)

```text
rsi-inpacient/                                   # ROOT REPOSITORY / FOLDER UTAMA
├── ARCHITECRUE.md                               # Dokumentasi Arsitektur Sistem
├── package.json                                 # Konfigurasi npm workspaces root
├── package-lock.json                            # Lockfile dependensi gabungan
├── .gitignore                                   # Ignore global (node_modules, .env, .next)
│
├── backend/                                     # WORKSPACE 1: BACKEND REST API (EXPRESS + PRISMA)
│   ├── .env.example                             # Template environment (DATABASE_URL, PORT, JWT_SECRET)
│   ├── .gitignore
│   ├── package.json                             # Dependensi Backend (Express, Prisma, Zod, JWT)
│   ├── prisma.config.js                         # Konfigurasi Prisma MySQL default
│   ├── prisma.postgresql.config.js              # Snapshot opsi database PostgreSQL
│   ├── prisma/
│   │   ├── README.md                            # Panduan setup & migrasi MySQL lokal
│   │   ├── schema.prisma                        # Prisma Schema MySQL (15 model tabel aktif)
│   │   ├── migrations/                          # Riwayat migrasi SQL resmi
│   │   ├── mysql/                               # Direktori migrasi spesifik MySQL
│   │   └── postgresql/                          # Snapshot migrasi PostgreSQL
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js                        # Singleton PrismaClient instance
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js               # Validasi Bearer JWT token
│   │   │   ├── role.middleware.js               # Otorisasi role (requireRole)
│   │   │   ├── validate.middleware.js           # Middleware validator Zod (body, query, params)
│   │   │   └── error.middleware.js              # Global error handler & 404 handler
│   │   ├── routes/
│   │   │   ├── index.js                         # Router induk pendaftaran /api/*
│   │   │   ├── auth.routes.js                   # Route endpoint /api/auth
│   │   │   ├── bed.routes.js                    # Route endpoint /api/beds
│   │   │   ├── allocation.routes.js             # Route endpoint /api/allocations
│   │   │   ├── queue.routes.js                  # Route endpoint /api/queues
│   │   │   ├── referral.routes.js               # Route endpoint /api/referrals
│   │   │   ├── monitoring.routes.js             # Route endpoint /api/monitoring
│   │   │   ├── history.routes.js                # Route endpoint /api/histories
│   │   │   └── billing.routes.js                # Route endpoint /api/billing
│   │   ├── modules/                             # FEATURE-BASED MVC (MODULAR MONOLITH)
│   │   │   ├── auth/                            # UC-01 [Nawira]
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── auth.model.js
│   │   │   │   └── auth.validation.js
│   │   │   ├── bed/                             # UC-02 [MYZ]
│   │   │   │   ├── bed.controller.js
│   │   │   │   ├── bed.service.js
│   │   │   │   ├── bed.model.js
│   │   │   │   └── bed.validation.js
│   │   │   ├── allocation/                      # UC-03 [MYZ]
│   │   │   │   ├── allocation.controller.js
│   │   │   │   ├── allocation.service.js
│   │   │   │   ├── allocation.model.js
│   │   │   │   └── allocation.validation.js
│   │   │   ├── queue/                           # UC-04 [ESBN]
│   │   │   ├── referral/                        # UC-05 [ESBN]
│   │   │   ├── monitoring/                      # UC-06 [ESBN]
│   │   │   ├── history/                         # UC-07 [Nawira]
│   │   │   └── billing/                         # UC-08 & UC-09 [TFM]
│   │   ├── shared/
│   │   │   ├── constants/                       # ROLES, BED_STATUS, ALLOCATION_STATUS
│   │   │   ├── errors/                          # HttpError class
│   │   │   └── utils/                           # parseId, formatting helpers
│   │   ├── app.js                               # Inisialisasi Express & middleware pipeline
│   │   └── server.js                            # HTTP Listener (port 3001)
│   └── test/
│       └── bed-allocation.test.js               # Unit/integration test
│
└── frontend/inpatient-care/                     # WORKSPACE 2: FRONTEND NEXT.JS (APP ROUTER)
    ├── package.json                             # Dependensi Frontend (Next 15+, React 19, Tailwind)
    ├── next.config.ts                           # Konfigurasi Next.js & Turbopack
    ├── tsconfig.json                            # Konfigurasi TypeScript (strict mode)
    ├── PRD_rawatinap.md                         # Dokumen Spesifikasi Kebutuhan Produk (file ini)
    ├── public/                                  # Aset statis & logo rumah sakit
    └── src/
        ├── app/                                 # BOUNDARY LAYER (App Router Halaman Web)
        │   ├── layout.tsx                       # Root Layout
        │   ├── page.tsx                         # Landing / Redirect halaman utama
        │   ├── globals.css                      # Konfigurasi Tailwind CSS
        │   ├── login/
        │   │   └── page.tsx                     # UI-01: Halaman Login (UC-01) [N]
        │   └── (dashboard)/                     # Layout grup terotentikasi (Sidebar + Topbar)
        │       ├── layout.tsx
        │       ├── bed-management/
        │       │   ├── page.tsx                 # UI-06: Manajemen Bed (UC-02) [MYZ]
        │       │   └── alokasi/
        │       │       └── page.tsx             # UI-07: Alokasi Bed Pasien (UC-03) [MYZ]
        │       ├── sistem-antrian/
        │       │   ├── daftar-tunggu/
        │       │   │   └── page.tsx             # Daftar Tunggu FIFO (UC-04) [ESBN]
        │       │   ├── rujukan-pasien/
        │       │   │   └── page.tsx             # Rujukan Pasien Darurat (UC-05) [ESBN]
        │       │   └── pemantauan-status/
        │       │       └── page.tsx             # Pemantauan Status (UC-06) [ESBN]
        │       ├── rekap-layanan/
        │       │   ├── page.tsx                 # Rekap Riwayat Layanan (UC-07) [N]
        │       │   ├── pasien/[idPasien]/
        │       │   │   ├── page.tsx             # Data Pasien & Riwayat RME [N]
        │       │   │   └── buat/
        │       │   │       └── page.tsx         # Buat Rekap Baru [N]
        │       │   └── [idRekap]/
        │       │       ├── page.tsx             # Detail Rekap Tindakan [N]
        │       │       └── edit/
        │       │           └── page.tsx         # Edit Status Rekap [N]
        │       └── pembayaran/
        │           ├── page.tsx                 # Dashboard Tagihan (UC-09) [TFM]
        │           ├── buat/
        │           │   ├── page.tsx             # Pilih Pasien Siap Billing (UC-08) [TFM]
        │           │   └── [idPasien]/
        │           │       ├── page.tsx         # Rincian Biaya Pelayanan (UC-08) [TFM]
        │           │       ├── pemeriksaan/
        │           │       │   └── page.tsx     # Pemeriksaan & Penyesuaian Tagihan [TFM]
        │           │       └── penerbitan/
        │           │           └── page.tsx     # Penerbitan Invoice Resmi [TFM]
        │           └── [idTagihan]/
        │               └── page.tsx             # Detail & Pelunasan Tagihan [TFM]
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx                  # Sidebar tema hijau tua (#0D3430)
        │   │   └── Topbar.tsx                   # Topbar breadcrumb & profil
        │   └── ui/                              # Komponen UI umum (Badge, Modal, Button)
        ├── features/                            # FRONTEND FEATURE LOGIC (API CALLS & HOOKS)
        │   ├── auth/                            # Hook login & session client
        │   ├── bed/                             # API caller beds & modal state
        │   ├── allocation/                      # API caller alokasi kamar
        │   ├── queue/                           # API caller daftar tunggu FIFO
        │   ├── referral/                        # API caller rujukan RS
        │   ├── monitoring/                      # API caller pemantauan status
        │   ├── history/                         # API caller rekap tindakan
        │   └── billing/                         # API caller biaya & tagihan
        ├── lib/
        │   ├── api-client.ts                    # Wrapper HTTP fetch ke Backend Express
        │   └── mock-fallback.ts                 # In-Memory fallback data saat offline
        └── types/                               # TypeScript Interfaces (15 model tabel)
```

---

### 3.3 Standar Kontrak REST API

Semua endpoint backend beroperasi di bawah awalan `/api` pada port `3001`.

#### Format Response Sukses:

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "total_pages": 5
  }
}
```

#### Format Response Error:

```json
{
  "error": {
    "code": "BED_ALREADY_OCCUPIED",
    "message": "Bed sedang digunakan oleh pasien aktif dan tidak dapat dialokasikan.",
    "details": null
  }
}
```

---

## 4. Skema Database Relasional (15 Tabel MySQL Terintegrasi)

Berikut adalah struktur DDL 15 tabel yang tersinkronisasi penuh dengan model `backend/prisma/schema.prisma` dan migrasi terkini (termasuk _soft-delete_, _active-bed guard_, relasi antrean, dan _check constraint_):

```sql
CREATE DATABASE IF NOT EXISTS inpatient_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inpatient_db;

-- 1. DATA PENGGUNA DAN AUTENTIKASI (UC-01)
CREATE TABLE akun (
  id_akun INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'Password hash (bcrypt)',
  role VARCHAR(30) NOT NULL COMMENT 'Petugas Administrasi / Petugas Bed Management / Super Admin',
  nama_petugas VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_akun_username UNIQUE (username)
) ENGINE=InnoDB;

-- 2. MASTER DATA PASIEN
CREATE TABLE pasien (
  id_pasien INT AUTO_INCREMENT PRIMARY KEY,
  no_rm VARCHAR(20) NOT NULL,
  nama_pasien VARCHAR(100) NOT NULL,
  jenis_kelamin VARCHAR(10) NULL COMMENT 'Laki-laki / Perempuan',
  tanggal_lahir DATE NULL,
  alamat VARCHAR(255) NULL,
  tanggal_masuk DATE NULL COMMENT 'Tanggal mulai rawat inap',
  tanggal_keluar DATE NULL COMMENT 'NULL selama pasien masih dirawat',
  status_penanganan VARCHAR(50) NOT NULL DEFAULT 'Terdaftar' COMMENT 'Terdaftar / Menunggu / Dirujuk / Rawat Inap / Selesai Perawatan',
  kondisi_pasien VARCHAR(30) NULL COMMENT 'Stabil / Darurat',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_pasien_no_rm UNIQUE (no_rm)
) ENGINE=InnoDB;

-- 3. INVENTARIS TEMPAT TIDUR / BED (UC-02)
CREATE TABLE bed (
  id_bed INT AUTO_INCREMENT PRIMARY KEY,
  no_bed VARCHAR(20) NOT NULL,
  nama_bangsal VARCHAR(100) NOT NULL,
  kelas_perawatan VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Tersedia' COMMENT 'Tersedia / Terisi / Pembersihan / Pemeliharaan',
  tipe_bed VARCHAR(50) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL COMMENT 'Soft delete; bed nonaktif tidak dihapus fisik',
  CONSTRAINT uq_bed_no_bed UNIQUE (no_bed)
) ENGINE=InnoDB;

-- 4. DAFTAR TUNGGU ANTREAN FIFO (UC-04)
CREATE TABLE daftar_tunggu (
  id_antrean INT AUTO_INCREMENT PRIMARY KEY,
  id_pasien INT NOT NULL,
  id_akun INT NOT NULL COMMENT 'Petugas pencatat antrean',
  waktu_masuk DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  no_antrean INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Menunggu' COMMENT 'Menunggu / Dialokasikan / Batal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_daftar_tunggu_no_antrean UNIQUE (no_antrean),
  INDEX idx_daftar_tunggu_fifo (status, waktu_masuk, id_antrean),
  INDEX idx_daftar_tunggu_pasien (id_pasien),
  INDEX idx_daftar_tunggu_akun (id_akun),
  CONSTRAINT fk_daftar_tunggu_pasien FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  CONSTRAINT fk_daftar_tunggu_akun FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
) ENGINE=InnoDB;

-- 5. REKAM ALOKASI KAMAR / BED (UC-03)
CREATE TABLE rekam_alokasi (
  id_alokasi INT AUTO_INCREMENT PRIMARY KEY,
  id_pasien INT NOT NULL,
  id_bed INT NOT NULL,
  id_akun INT NOT NULL COMMENT 'Petugas yang mengalokasikan',
  waktu_alokasi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  waktu_selesai DATETIME NULL COMMENT 'Kosong jika alokasi masih aktif',
  status_alokasi VARCHAR(30) NOT NULL DEFAULT 'Aktif' COMMENT 'Aktif / Selesai / Batal',
  id_antrean INT NULL COMMENT 'Referensi antrean asal (jika ada)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  -- Guard MySQL: Mencegah alokasi aktif ganda pada bed yang sama
  id_bed_aktif INT GENERATED ALWAYS AS (IF(status_alokasi = 'Aktif', id_bed, NULL)) STORED,
  CONSTRAINT uq_rekam_alokasi_bed_aktif UNIQUE (id_bed_aktif),
  CONSTRAINT uq_rekam_alokasi_antrean UNIQUE (id_antrean),
  INDEX idx_rekam_alokasi_pasien (id_pasien),
  INDEX idx_rekam_alokasi_bed_status (id_bed, status_alokasi),
  INDEX idx_rekam_alokasi_akun (id_akun),
  CONSTRAINT fk_rekam_alokasi_pasien FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  CONSTRAINT fk_rekam_alokasi_bed FOREIGN KEY (id_bed) REFERENCES bed(id_bed),
  CONSTRAINT fk_rekam_alokasi_akun FOREIGN KEY (id_akun) REFERENCES akun(id_akun),
  CONSTRAINT fk_rekam_alokasi_antrean FOREIGN KEY (id_antrean) REFERENCES daftar_tunggu(id_antrean)
) ENGINE=InnoDB;

-- 6. RUMAH SAKIT RUJUKAN (UC-05)
CREATE TABLE rumah_sakit_rujukan (
  id_rs INT AUTO_INCREMENT PRIMARY KEY,
  nama_rs VARCHAR(100) NOT NULL,
  alamat VARCHAR(255) NULL,
  kontak VARCHAR(20) NULL,
  status_ketersediaan VARCHAR(30) NOT NULL DEFAULT 'Tersedia' COMMENT 'Tersedia / Tidak Tersedia',
  terakhir_diperbarui DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. SURAT RUJUKAN PASIEN (UC-05)
CREATE TABLE surat_rujukan (
  id_surat INT AUTO_INCREMENT PRIMARY KEY,
  no_rujukan VARCHAR(30) NOT NULL,
  id_pasien INT NOT NULL,
  id_rs INT NOT NULL,
  id_akun INT NOT NULL COMMENT 'Petugas penerbit surat rujukan',
  tanggal_rujukan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  alasan_rujukan TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Dibuat' COMMENT 'Dibuat / Dikirim / Diterima / Batal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_surat_rujukan_no_rujukan UNIQUE (no_rujukan),
  INDEX idx_surat_rujukan_pasien (id_pasien),
  INDEX idx_surat_rujukan_rs (id_rs),
  INDEX idx_surat_rujukan_akun (id_akun),
  CONSTRAINT fk_surat_rujukan_pasien FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  CONSTRAINT fk_surat_rujukan_rs FOREIGN KEY (id_rs) REFERENCES rumah_sakit_rujukan(id_rs),
  CONSTRAINT fk_surat_rujukan_akun FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
) ENGINE=InnoDB;

-- 8. RIWAYAT PERUBAHAN STATUS PASIEN (UC-06)
CREATE TABLE riwayat_status_pasien (
  id_riwayat_status INT AUTO_INCREMENT PRIMARY KEY,
  id_pasien INT NOT NULL,
  id_akun INT NOT NULL,
  status_sebelumnya VARCHAR(50) NULL,
  status_baru VARCHAR(50) NOT NULL,
  keterangan TEXT NULL,
  waktu_perubahan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_riwayat_status_pasien (id_pasien),
  INDEX idx_riwayat_status_akun (id_akun),
  CONSTRAINT fk_riwayat_status_pasien FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  CONSTRAINT fk_riwayat_status_akun FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
) ENGINE=InnoDB;

-- 9. SUMBER DATA REKAM MEDIS ELEKTRONIK SIMULASI (RME DUMMY - SHARED)
CREATE TABLE rme_dummy (
  id_riwayat INT AUTO_INCREMENT PRIMARY KEY,
  id_pasien INT NOT NULL,
  kode_tindakan VARCHAR(20) NOT NULL,
  nama_tindakan VARCHAR(100) NOT NULL,
  tanggal_tindakan DATETIME NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  keterangan TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rme_dummy_jumlah CHECK (jumlah > 0),
  INDEX idx_rme_dummy_pasien (id_pasien),
  CONSTRAINT fk_rme_dummy_pasien FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien)
) ENGINE=InnoDB;

-- 10. REKAP RIWAYAT TINDAKAN (UC-07)
CREATE TABLE rekap_tindakan (
  id_rekap INT AUTO_INCREMENT PRIMARY KEY,
  kode_rekap VARCHAR(30) NOT NULL COMMENT 'Contoh: RKP-20261015-001',
  id_pasien INT NOT NULL,
  id_akun INT NOT NULL COMMENT 'Petugas pembuat rekap',
  status VARCHAR(30) NOT NULL DEFAULT 'Draft' COMMENT 'Draft / Proses Verifikasi / Siap Billing',
  catatan TEXT NULL,
  keterangan TEXT NULL,
  tanggal_dibuat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_diperbarui DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL COMMENT 'Soft delete',
  CONSTRAINT uq_rekap_tindakan_kode_rekap UNIQUE (kode_rekap),
  INDEX idx_rekap_tindakan_pasien (id_pasien),
  INDEX idx_rekap_tindakan_status_deleted (status, deleted_at),
  INDEX idx_rekap_tindakan_akun (id_akun),
  CONSTRAINT fk_rekap_tindakan_pasien FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  CONSTRAINT fk_rekap_tindakan_akun FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
) ENGINE=InnoDB;

-- 11. DETAIL REKAP RIWAYAT TINDAKAN (UC-07)
CREATE TABLE detail_rekap_tindakan (
  id_detail_rekap INT AUTO_INCREMENT PRIMARY KEY,
  id_rekap INT NOT NULL,
  id_riwayat INT NOT NULL COMMENT 'Snapshot dari rme_dummy',
  kode_tindakan VARCHAR(20) NOT NULL,
  nama_tindakan VARCHAR(100) NOT NULL,
  tanggal_tindakan DATETIME NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  CONSTRAINT chk_detail_rekap_jumlah CHECK (jumlah > 0),
  CONSTRAINT uq_detail_rekap_tindakan_rekap_riwayat UNIQUE (id_rekap, id_riwayat),
  INDEX idx_detail_rekap_tindakan_riwayat (id_riwayat),
  CONSTRAINT fk_detail_rekap_tindakan_rekap FOREIGN KEY (id_rekap) REFERENCES rekap_tindakan(id_rekap),
  CONSTRAINT fk_detail_rekap_tindakan_riwayat FOREIGN KEY (id_riwayat) REFERENCES rme_dummy(id_riwayat)
) ENGINE=InnoDB;

-- 12. MASTER DATA TARIF PELAYANAN (UC-08)
CREATE TABLE tarif (
  id_tarif INT AUTO_INCREMENT PRIMARY KEY,
  kode_tindakan VARCHAR(20) NOT NULL,
  nama_tindakan VARCHAR(100) NOT NULL,
  harga DECIMAL(15,2) NOT NULL,
  tanggal_berlaku DATE NOT NULL,
  tanggal_berakhir DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Aktif',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_tarif_kode_tanggal_berlaku UNIQUE (kode_tindakan, tanggal_berlaku)
) ENGINE=InnoDB;

-- 13. TAGIHAN / BILLING PASIEN (UC-09)
CREATE TABLE tagihan (
  id_tagihan INT AUTO_INCREMENT PRIMARY KEY,
  id_pasien INT NOT NULL,
  id_rekap INT NOT NULL,
  id_akun INT NOT NULL COMMENT 'Petugas pembuat tagihan',
  no_tagihan VARCHAR(30) NOT NULL COMMENT 'Contoh: INV-2026-0021',
  total_biaya DECIMAL(15,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Draft' COMMENT 'Draft / Siap Diserahkan / Belum Dibayar / Lunas / Batal',
  catatan_penyesuaian TEXT NULL,
  alasan_pembatalan TEXT NULL,
  tanggal_dibuat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_diperbarui DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  tanggal_dibatalkan DATETIME NULL,
  CONSTRAINT uq_tagihan_no_tagihan UNIQUE (no_tagihan),
  INDEX idx_tagihan_pasien (id_pasien),
  INDEX idx_tagihan_rekap (id_rekap),
  INDEX idx_tagihan_akun (id_akun),
  CONSTRAINT fk_tagihan_pasien FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien),
  CONSTRAINT fk_tagihan_rekap FOREIGN KEY (id_rekap) REFERENCES rekap_tindakan(id_rekap),
  CONSTRAINT fk_tagihan_akun FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
) ENGINE=InnoDB;

-- 14. DETAIL RINCIAN TAGIHAN (UC-09)
CREATE TABLE detail_tagihan (
  id_detail_tagihan INT AUTO_INCREMENT PRIMARY KEY,
  id_tagihan INT NOT NULL,
  id_detail_rekap INT NOT NULL,
  id_tarif INT NOT NULL,
  nama_tindakan VARCHAR(100) NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  harga_satuan DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  INDEX idx_detail_tagihan_tagihan (id_tagihan),
  INDEX idx_detail_tagihan_detail_rekap (id_detail_rekap),
  INDEX idx_detail_tagihan_tarif (id_tarif),
  CONSTRAINT fk_detail_tagihan_tagihan FOREIGN KEY (id_tagihan) REFERENCES tagihan(id_tagihan),
  CONSTRAINT fk_detail_tagihan_detail_rekap FOREIGN KEY (id_detail_rekap) REFERENCES detail_rekap_tindakan(id_detail_rekap),
  CONSTRAINT fk_detail_tagihan_tarif FOREIGN KEY (id_tarif) REFERENCES tarif(id_tarif)
) ENGINE=InnoDB;

-- 15. AUDIT AKTIVITAS OPERASIONAL (SHARED AUDIT LOG)
CREATE TABLE log_audit (
  id_log INT AUTO_INCREMENT PRIMARY KEY,
  id_akun INT NOT NULL,
  nama_tabel VARCHAR(100) NOT NULL,
  id_referensi INT NOT NULL COMMENT 'ID baris pada tabel target',
  aksi VARCHAR(30) NOT NULL COMMENT 'CREATE / UPDATE / DELETE / CANCEL / STATUS_CHANGE',
  data_sebelum TEXT NULL,
  data_sesudah TEXT NULL,
  waktu_aksi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_audit_tabel_referensi (nama_tabel, id_referensi),
  INDEX idx_log_audit_akun (id_akun),
  CONSTRAINT fk_log_audit_akun FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
) ENGINE=InnoDB;
```

---

## 5. Spesifikasi Logika Bisnis, Kelas OOP, & Pseudo-Code Seluruh Modul

Setiap Use Case diimplementasikan dengan koordinasi antara **Frontend Component/Hook** dan **Backend Controller/Service/Model**.

### 5.1 Modul 1: Login & Role-Based Access Control (UC-01 — PIC: Nawira)

#### Alur Komunikasi:

`frontend/src/app/login/page.tsx` $\rightarrow$ `POST /api/auth/login` $\rightarrow$ `backend/src/modules/auth/auth.controller.js` $\rightarrow$ `auth.service.js` $\rightarrow$ `auth.model.js` (`Akun`).

- **Pseudo-Code PC-01 (`requestLogin`):**
  1. Validasi format `username` dan `password` menggunakan Zod schema `loginSchema`.
  2. Cari akun via `Akun.cariByUsername(username)`. Jika tidak ditemukan, kembalikan HTTP 401: `"Username atau password salah. Silakan periksa kembali."`.
  3. Lakukan verifikasi hash password menggunakan `bcrypt.compare(password, akun.password)`. Jika tidak cocok, kembalikan HTTP 401.
  4. Periksa kecocokan role (**PC-02**): Pastikan role adalah `"Petugas Administrasi"`, `"Petugas Bed Management"`, atau `"Super Admin"`.
  5. Buat token JWT (**PC-03**) berisi payload `{ id_akun, username, role, nama_petugas }` dengan masa berlaku 8 jam.
  6. Kembalikan data profil petugas dan token ke Frontend untuk disimpan di secure cookie / client session.
  7. Frontend mengarahkan navigasi (_redirect_):
     - `Petugas Bed Management` $\rightarrow$ `/bed-management`
     - `Petugas Administrasi` $\rightarrow$ `/bed-management/alokasi` atau `/sistem-antrian/daftar-tunggu`.

---

### 5.2 Modul 2: Pengelolaan Data & Alokasi Bed (UC-02 & UC-03 — PIC: MYZ)

#### A. Pengelolaan Data dan Ketersediaan Bed (UC-02)

- **Endpoint:**
  - `GET /api/beds` (Menampilkan daftar bed dengan filter status, bangsal, pagination, dan ringkasan kuota).
  - `POST /api/beds` (Menambah bed baru berstatus awal `'Tersedia'`).
  - `PATCH /api/beds/:id` (Memperbarui status bed: `Tersedia`, `Pembersihan`, `Pemeliharaan`).
  - `DELETE /api/beds/:id` (Menghapus bed).
- **Aturan Bisnis & Integritas Data (PC-05):**
  - Saat menghapus bed (`removeBed`), periksa status bed. **Jika status adalah `'Terisi'`**, sistem **wajib menolak penghapusan** dengan melempar HTTP 409 (`BED_CURRENTLY_OCCUPIED`).
  - Backend mengembalikan data pasien yang sedang menempati bed tersebut beserta dokter penanggung jawab (DPJP) untuk ditampilkan pada modal penolakan di frontend.
  - Penghapusan bed dilakukan secara _soft delete_ (`deleted_at = NOW()`) agar riwayat alokasi masa lalu tidak kehilangan referensi.

#### B. Alokasi Kamar/Bed kepada Pasien (UC-03)

- **Endpoint:** `POST /api/allocations`
- **Transaksi ACID & Row-Level Locking (PC-06):**
  1. Mulai transaksi database (`prisma.$transaction`).
  2. Kunci baris bed yang dipilih:
     ```sql
     SELECT status FROM bed WHERE id_bed = ? FOR UPDATE;
     ```
  3. Validasi status: Jika status bukan `'Tersedia'`, batalkan transaksi (_rollback_) dan lempar pesan: `"Alokasi gagal: Kamar/bed telah terisi atau sedang tidak tersedia"`.
  4. Jika alokasi berasal dari daftar tunggu antrean (`id_antrean` disertakan):
     - Validasi bahwa antrean tersebut berstatus `'Menunggu'` dan milik pasien bersangkutan.
     - Ubah status antrean menjadi `'Dialokasikan'`.
  5. Buat baris baru di tabel `rekam_alokasi` (`status_alokasi = 'Aktif'`).
  6. Ubah status bed menjadi `'Terisi'` di tabel `bed`.
  7. Perbarui tabel `pasien`: ubah `status_penanganan = 'Rawat Inap'` dan set `tanggal_masuk = CURDATE()`.
  8. Catat aksi alokasi ke tabel `log_audit`.
  9. Lakukan _commit_ transaksi dan kembalikan response sukses HTTP 201 ke Frontend.

---

### 5.3 Modul 3: Antrean FIFO, Rujukan Darurat, & Pemantauan (UC-04, UC-05, UC-06 — PIC: ESBN)

#### A. Daftar Tunggu Rawat Inap secara FIFO (UC-04)

- **Logika Antrean FIFO (PC-19 s.d. PC-24):**
  - Pasien hanya dapat dimasukkan ke daftar tunggu jika kamar perawatan yang sesuai sedang **penuh**.
  - Validasi kondisi pasien: Hanya pasien berkondisi **"Stabil"** yang boleh masuk daftar tunggu. Jika pasien berkondisi **"Darurat"**, sistem secara otomatis mengalihkan alur kerja ke menu **Rujukan Pasien (UC-05)**.
  - Nomor antrean dihitung secara berurutan dan diproses dengan prinsip _First-In, First-Out_ berdasarkan `waktu_masuk ASC`.

#### B. Rujukan Pasien Darurat (UC-05)

- **Logika Rujukan (PC-25 s.d. PC-28):**
  - Mengambil daftar rumah sakit rujukan rekanan yang memiliki status `'Tersedia'` dari tabel `rumah_sakit_rujukan`.
  - Membuat surat rujukan dengan nomor unik berformat `RJK-YYYYMM-XXXX`.
  - Memperbarui status penanganan pasien menjadi `'Dirujuk'`.
  - Mencatat perubahan ke tabel `surat_rujukan`, `riwayat_status_pasien`, dan `log_audit`.

#### C. Pemantauan Status Penanganan Pasien (UC-06)

- **Aturan Transisi Status (State Machine Validation - PC-32):**
  - Status `'Menunggu'` $\rightarrow$ hanya boleh beralih ke `'Dialokasikan'` atau `'Batal'`.
  - Status `'Dibuat'` (Rujukan) $\rightarrow$ hanya boleh beralih ke `'Dikirim'` atau `'Batal'`.
  - Status `'Dikirim'` $\rightarrow$ hanya boleh beralih ke `'Diterima'` atau `'Batal'`.
  - Status `'Batal'` dan `'Selesai Perawatan'` bersifat terminal/final dan tidak dapat diubah kembali.

---

### 5.4 Modul 4: Rekap Riwayat Layanan & Tindakan Pasien (UC-07 — PIC: Nawira)

- **Alur Pengambilan Snapshot RME ke Rekap Tindakan (PD-07 s.d. PD-16):**
  1. Petugas mencari pasien berdasarkan `no_rm` atau `nama_pasien`.
  2. Sistem membaca data riwayat tindakan medis dari sumber data RME simulasi (`rme_dummy`).
  3. Saat rekap baru dibuat (`POST /api/histories`):
     - Rekap diberi kode unik (contoh: `RKP-20261015-001`) dengan status awal `'Draft'`.
     - Seluruh item tindakan aktif dari `rme_dummy` disalin ke tabel `detail_rekap_tindakan` sebagai _snapshot immutable_.
  4. Perubahan status rekap mengikuti alur: `'Draft'` $\rightarrow$ `'Proses Verifikasi'` $\rightarrow$ `'Siap Billing'`.
  5. Hanya rekap dengan status `'Siap Billing'` yang dapat ditarik oleh modul Keuangan/Billing (UC-08).

---

### 5.5 Modul 5: Perhitungan Biaya & Pengelolaan Tagihan/Billing (UC-08 & UC-09 — PIC: TFM)

#### A. Perhitungan Biaya Pelayanan (UC-08)

- **Kalkulasi Otomatis (PC-17):**
  - Mengambil data rekap tindakan pasien yang telah berstatus `'Siap Billing'`.
  - Untuk setiap rincian tindakan pada `detail_rekap_tindakan`, sistem mencocokkan `kode_tindakan` ke tabel `tarif` yang aktif (`tanggal_berlaku <= tanggal_tindakan`).
  - Menghitung subtotal per tindakan:
    $$\text{Subtotal} = \text{Jumlah Tindakan} \times \text{Harga Satuan Tarif}$$
  - Menghitung total keseluruhan biaya rawat inap:
    $$\text{Total Biaya} = \sum \text{Subtotal}$$

#### B. Pemeriksaan & Pengelolaan Tagihan (UC-09)

- **Pemeriksaan & Terbit Invoice (PC-18):**
  - Petugas Administrasi memeriksa rincian draf tagihan.
  - Fitur **Catatan Penyesuaian & Hitung Ulang**: Petugas dapat memberikan catatan penyesuaian administratif yang akan memperbarui nominal dan tercatat pada riwayat audit.
  - Saat dikonfirmasi, sistem menerbitkan nomor invoice resmi (misal: `INV-2026-0021`) dengan status `'Siap Diserahkan'` atau `'Belum Dibayar'`.
  - Pengelolaan pelunasan tagihan: Perubahan status menjadi `'Lunas'` saat pembayaran diterima, atau `'Batal'` dengan mencantumkan alasan pembatalan resmi.

---

## 6. Sistem Desain Visual & Spesifikasi Antarmuka Figma

Seluruh implementasi antarmuka pada Frontend Next.js wajib mengikuti token dan rancangan desain Figma Kelompok 5:

### 6.1 Token Warna & Tipografi

- **Warna Latar Sidebar:** Hijau Tua Medis / Forest Slate (`#0D3430`), lebar `260px`.
- **Warna Aksen Utama (Primary):** Emerald / Teal (`#10B981` / `#14B8A6`).
- **Warna Latar Halaman:** Neutral Gray Light (`#F8FAFC`).
- **Warna Kartu / Surface:** Putih Bersih (`#FFFFFF`) dengan border halus (`#E2E8F0`).
- **Sistem Warna Badge Status:**
  - **Hijau (`bg-emerald-100 text-emerald-800`):** `Tersedia`, `Siap Billing`, `Lunas`, `Stabil`, `Dialokasikan`, `Diterima`.
  - **Merah (`bg-rose-100 text-rose-800`):** `Terisi`, `Darurat`, `Batal`, `Tidak Tersedia`.
  - **Kuning / Amber (`bg-amber-100 text-amber-800`):** `Pembersihan`, `Menunggu`, `Belum Dibayar`, `Proses Verifikasi`.
  - **Biru / Sky (`bg-sky-100 text-sky-800`):** `Draft`, `Dibuat`, `Dikirim`.
  - **Abu-abu (`bg-slate-100 text-slate-800`):** `Pemeliharaan`, `Selesai Perawatan`.

### 6.2 Ringkasan 8 Antarmuka Halaman Figma (Bab 3.7 Laporan)

1. **`LoginUI` (`/login`):** Tampilan split 2-kolom. Sisi kiri hijau tua menampilkan branding SIMRS dan kartu info operasional. Sisi kanan kartu putih form login dengan pemilih instan akun demo untuk pengujian.
2. **`BedManagementUI` (`/bed-management`):** Ringkasan 4 kartu kuota, filter kelas/bangsal, dan tabel master bed dengan 4 modal interaktif (Tambah Bed, Ubah Status, Konfirmasi Hapus, dan Modal Penolakan Hapus Bed Terisi).
3. **`AlokasiBedUI` (`/bed-management/alokasi`):** Antarmuka penetapan bed ke pasien dengan banner penguncian sementara (_Row-Level Lock countdown_).
4. **`DaftarTungguUI` (`/sistem-antrian/daftar-tunggu`):** Banner kapasitas penuh, ringkasan antrean, dan tabel antrean urut FIFO.
5. **`RujukanUI` (`/sistem-antrian/rujukan-pasien`):** Panel pemilihan pasien darurat, daftar RS rujukan tersedia, dan generator surat rujukan resmi.
6. **`PemantauanUI` (`/sistem-antrian/pemantauan-status`):** Tabel pemantauan terintegrasi dengan modal transisi status pasien dan histori audit.
7. **`RekapLayananUI` (`/rekap-layanan/...`):** Halaman rekap riwayat tindakan dengan tab status, pembacaan riwayat RME read-only, form buat/edit rekap, dan tombol alihkan ke billing.
8. **`TagihanUI` (`/pembayaran/...`):** Dashboard tagihan, halaman rincian kalkulasi biaya, modal pemeriksaan & penyesuaian, cetak invoice, dan pelunasan.

---

## 7. Panduan Operasional & Alur Kerja Pengembangan (Workflow)

### 7.1 Setup Awal Proyek dari Root

Jalankan perintah berikut pada root folder repositori `rsi-inpacient/`:

```powershell
# 1. Install seluruh dependensi backend dan frontend secara serentak
npm install

# 2. Siapkan file konfigurasi environment backend
Copy-Item backend/.env.example backend/.env
```

Pastikan konfigurasi `DATABASE_URL` pada `backend/.env` telah mengarah ke server MySQL lokal:

```dotenv
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://root:@127.0.0.1:3306/inpatient_db"
JWT_SECRET="rahasia_jwt_kelompok_5_inpatient_care"
FRONTEND_ORIGIN="http://localhost:3000"
```

### 7.2 Eksekusi Migrasi Database & Prisma Client

Dari folder `backend`:

```powershell
cd backend
npx prisma migrate deploy
npx prisma generate
cd ..
```

### 7.3 Menjalankan Aplikasi secara Berdampingan

Buka dua terminal PowerShell pada root `rsi-inpacient/`:

- **Terminal 1 — Backend Express REST API:**

  ```powershell
  npm run dev --workspace=backend
  # Berjalan pada http://localhost:3001
  # Health check: http://localhost:3001/api/health
  ```

- **Terminal 2 — Frontend Next.js Web App:**
  ```powershell
  npm run dev --prefix frontend/inpatient-care
  # Berjalan pada http://localhost:3000
  ```

---

### 7.4 Mekanisme Mock Data / In-Memory Fallback

Untuk menjamin kelancaran presentasi, demonstrasi pengujian, atau jika database MySQL belum aktif pada komputer anggota penguji:

- Frontend menyediakan modul `frontend/inpatient-care/src/lib/mock-fallback.ts`.
- Jika API client mendeteksi kegagalan koneksi jaringan ke backend (`http://localhost:3001`), antarmuka secara transparan beralih ke stateful mock storage yang berisi data awal seluruh skenario (Bed terisi, pasien rujukan, antrean FIFO, rekap tindakan, dan tagihan).
- Hal ini memastikan bahwa antarmuka pengguna dapat diuji dan didemonstrasikan kapan pun tanpa mengalami _crash_.
