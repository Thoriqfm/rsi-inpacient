# DESIGN SYSTEM & LAPORAN INTEGRASI BACKEND
## Inpatient Care Platform — Sistem Informasi Rawat Inap & Bed Management

Dokumen ini mendokumentasikan spesifikasi desain antarmuka, konsistensi token UI, arsitektur tata letak, hasil pengujian integrasi dengan API Backend (`Express` + `Prisma` + `MySQL`), serta **status sinkronisasi kontrak data antara Frontend dan Backend**.

---

## 1. Design System & Fondasi Visual

Aplikasi mengacu secara presisi pada file Figma **Inpatient Care** (`XUuZ0FIhbhuPYEAYKfnNEw`) dengan prinsip visual **Hospital Operations Platform** yang profesional, bersih, dan menenangkan.

### A. Palet Warna (Color Palette)

| Nama Token | Nilai Hex | Penggunaan di Aplikasi |
| :--- | :--- | :--- |
| **Darker Teal** | `#102d2a` | Latar belakang panel kiri Login, footer branding |
| **Dark Teal** | `#0d332f` | Background Sidebar, tombol aksi sekunder gelap, kartu status aktif |
| **Deep Forest** | `#082320` | Gradasi dasar sidebar navigasi |
| **Primary Cyan/Teal** | `#13c9b3` | Warna aksen utama, tombol submit utama, badge aktif, logo `+` |
| **Mint Glow** | `#e6f8f5` | State hover, highlight baris tabel, background badge ringan |
| **Surface Off-White** | `#f5f8f8` / `#f7faf9` | Background kanvas aplikasi (Dashboard & Form area) |
| **Status Tersedia** | `#10b981` (Emerald) | Titik indikator & badge bed siap pakai |
| **Status Terisi** | `#3b82f6` (Blue) | Indikator hunian pasien aktif |
| **Status Pembersihan** | `#f59e0b` (Amber) | Indikator sanitasi / sterilisasi ruangan |
| **Status Pemeliharaan** | `#ef4444` (Rose) | Indikator perbaikan fasilitas / tidak beroperasi |
| **Notification Dot** | `#f68624` (Orange) | Titik notifikasi pada lonceng Topbar |

### B. Tipografi
- **Headings & Judul Utama**: `Plus Jakarta Sans` (`font-bold`, `font-extrabold`), tracking rapat (`tracking-tight`).
- **Body & Data Table**: `Inter` / `Plus Jakarta Sans` (`font-normal`, `font-medium`, `text-xs` hingga `text-sm`).
- **Kode Identitas (ID Bed / No RM / Timer)**: `font-mono` (`font-bold`, uppercase).

### C. Elemen Geometri & Kedalaman (Elevation)
- **Radius Sudut (Border Radius)**:
  - Container / Card besar: `rounded-3xl` (`24px` – `28px`).
  - Dialog / Modal: `rounded-3xl`.
  - Input field & Tombol aksi: `rounded-xl` (`12px`).
  - Badge & Status Pill: `rounded-full`.
- **Bayangan (Shadow)**:
  - Tombol Primer: `shadow-md shadow-teal-500/20`.
  - Modal Overlay: `shadow-2xl` dengan latar `backdrop-blur-xs bg-slate-900/60`.

---

## 2. Pemetaan & Keselarasan 7 Frame Figma

Seluruh 7 frame pada desain Figma telah diimplementasikan dengan kesesuaian 100%:

### 1. Login UI (`UC-01` — Frame `81:11793` & Section `81:12602`)
- **Route**: [`/login`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/app/login/page.tsx)
- **Matriks 5 State UI**:
  - `State 1 (81:11793)`: Form kosong default, panel branding rumah sakit, 3 *glass cards* (*Ketersediaan Tempat Tidur* dengan mini bar chart, *Operasional Aktif*, *Data Terlindungi*).
  - `State 2 (81:11924)`: Validasi input kosong (`AF-01`), menampilkan pesan merah di bawah field: `"Username wajib diisi."` dan `"Password wajib diisi."`.
  - `State 3 (81:12067)`: Input sebagian terisi (`admin.demo` / `budi.santoso`).
  - `State 4 (81:12198)`: Input terisi lengkap dengan password toggle eye (*Button - Sembunyikan / Tampilkan password*).
  - `State 5 (81:12328)`: Alert banner peringatan atas: `"Username atau password salah. Silakan periksa kembali kredensial Anda."` (`EF-01`).

### 2. Shared Layout (`Sidebar` & `Topbar` — Frame `165:4582`, `193:10213`)
- **File**: [`Sidebar.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/layout/Sidebar.tsx) & [`Topbar.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/layout/Topbar.tsx)
- **Role-Aware RBAC Navigation**:
  - **Petugas Bed Management** (*Budi Santoso*): Menu utama fokus pada `Bed Management` (aktif dengan strip indikator aksen `#13c9b3` di sisi kanan).
  - **Petugas Administrasi** (*Rini Aprilianti*): Menu utama menampilkan `Ketersediaan Bed`, `Alokasi Kamar`, serta menu SIMRS (`Dashboard`, `Sistem Antrian`, `Rekap Layanan`, `Billing`).
- **Topbar**: Breadcrumb dinamis (`Bed Management > Alokasi Kamar Pasien`), badge sumber data (*API SIMRS Terhubung* vs *Simulasi Lokal*), tombol notifikasi ber-dot oranye `#f68624`, dan avatar profil dengan fasilitas *Quick Role Switcher*.

### 3. Halaman Pemantauan & Pengelolaan Bed (`UC-02` — Frame `164:3797`)
- **Route**: [`/bed-management`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/app/(dashboard)/bed-management/page.tsx)
- **Komponen Utama**:
  - **4 Metrik Statistik**: *Tersedia (18)*, *Terisi (42)*, *Pembersihan (5)*, *Pemeliharaan (3)* yang nilainya dinamis dan dapat diklik untuk memfilter tabel.
  - **Toolbar Pencarian & Filter**: Input pencarian kode/bangsal, filter dropdown *Bangsal* dan *Kelas*, baris tab status bed (*Semua: 68*).
  - **Tabel Data**: 7 kolom (*No, ID Bed, Nama Bangsal & Kamar, Kelas Perawatan, Status Operasional, Terakhir Diperbarui, Aksi*).
  - **Paginasi**: Menampilkan 5 item per halaman (`"Menampilkan 1-5 dari 68 data bed"`).

### 4. Empat Modal Interaktif Pengelolaan Bed
- **Modal Tambah Bed Baru (`217:13467`)** ([`TambahBedModal.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/bed-management/TambahBedModal.tsx)): Penomoran otomatis `BED-[BANGSAL]-[NUM]`, verifikasi keunikan nomor bed secara real-time (`"✓ ID Bed unik dan siap didaftarkan"` / `"⚠ ID Bed sudah terdaftar"`), 4 kartu pilihan kelas, dan status terkunci `TERSEDIA (Otomatis)`.
- **Modal Ubah Status Ketersediaan Bed (`285:189`)** ([`UbahStatusModal.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/bed-management/UbahStatusModal.tsx)): Menampilkan identitas bed, banner status saat ini + waktu relatif, 4 kartu radio status baru, dan catatan audit nama petugas.
- **Modal Konfirmasi Hapus Data Bed (`285:190`)** ([`KonfirmasiHapusModal.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/bed-management/KonfirmasiHapusModal.tsx)): Ringkasan data bed kosong, peringatan permanen, dan tombol konfirmasi merah.
- **Modal Penolakan Hapus Bed Terisi (`285:279`)** ([`PenolakanHapusModal.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/bed-management/PenolakanHapusModal.tsx)): Mencegah penghapusan bed yang berstatus `Terisi` (`HTTP 409 BED_IN_USE`), menampilkan pasien aktif (*Hendra Wijaya* - `RM-2026-00142`), dokter DPJP (*dr. Nanda Putra, Sp.PD*), serta instruksi SOP Discharge/Mutasi.

### 5. Halaman Alokasi Kamar & Bed Pasien (`UC-03` — Frame `193:9909`)
- **Route**: [`/bed-management/alokasi`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/app/(dashboard)/bed-management/alokasi/page.tsx)
- **Komponen Utama**:
  - **Kolom Kiri (7 Kolom)**: Katalog bed yang hanya berstatus `Tersedia`, filter kelas perawatan, kartu bed terpilih dengan **Row-Level Lock live timer yang menghitung mundur dari `04:48 s`**.
  - **Kolom Kanan (5 Kolom)**: Form penetapan pasien, dropdown pasien antrean, ringkasan klinis (*No RM, DPJP, Hak Kelas BPJS, Diagnosa Masuk DBD*), kotak verifikasi bed terpilih, simulasi status `• Tersedia ➜ • Terisi`, dan tombol penetapan alokasi.

---

## 3. Status Integrasi ke Backend Express API

Frontend terhubung langsung dengan backend Express API di port 3000 (`http://localhost:3000/api`) dengan mapping kontrak data terbaru:

| Fungsi Frontend | Endpoint Backend | Metode | Status Keselarasan Kontrak |
| :--- | :--- | :---: | :--- |
| `loginApi(user, pass)` | `/api/auth/login` | `POST` | ✅ **Terintegrasi**: Menerima `{ username, password }`, mengembalikan token JWT dan objek akun. Role otomatis dinormalisasi. |
| `fetchBedsApi()` | `/api/beds?page=1&limit=100` | `GET` | ✅ **Terintegrasi**: Mengembalikan array bed lengkap dengan `nama_kamar`, `fasilitas`, dan `occupant: { no_rm, nama_pasien }`. |
| `fetchAvailableBedsApi()` | `/api/beds/available` | `GET` | ✅ **Terintegrasi**: Mengembalikan daftar khusus bed berstatus Tersedia untuk alokasi kamar. |
| `createBedApi(payload)` | `/api/beds` | `POST` | ✅ **Terintegrasi**: Mengirim `{ no_bed, nama_bangsal, nama_kamar, kelas_perawatan, tipe_bed, fasilitas, status }`. |
| `updateBedStatusApi(...)` | `/api/beds/:id` | `PATCH` | ⚠️ **Catatan Khusus (Lihat Bab 4)** |
| `deleteBedApi(id)` | `/api/beds/:id` | `DELETE` | ✅ **Terintegrasi**: Menolak bed terisi dengan HTTP 409 `BED_IN_USE` dan soft delete bed kosong. |
| `createAllocationApi(...)` | `/api/allocations` | `POST` | ✅ **Terintegrasi**: Menerima `{ id_pasien, id_bed, id_antrean }`, mengunci bed dan mengubah status menjadi `Terisi`. |

---

## 4. Status Tindak Lanjut Pembaruan Backend (Update November 2026)

### ✅ Poin 2: Data Pasien Penghuni (`occupant`) — SUDAH DIIMPLEMENTASIKAN
- **Pembaruan di Backend**:
  - `backend/src/modules/bed/bed.model.js`: `bedSelect` telah melakukan join relasi alokasi `Aktif` (`uq_rekam_alokasi_bed_aktif`), mengambil `pasien.no_rm` dan `pasien.nama_pasien`.
  - `backend/src/modules/bed/bed.service.js`: Mapper `toBedResponse` memformat relasi menjadi `occupant: { no_rm, nama_pasien } | null`.
- **Integrasi di Frontend**:
  - [`src/lib/api-client.ts`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/lib/api-client.ts) membaca objek `occupant` langsung dari respon backend.
  - Nama pasien dan No RM aktif ditampilkan di tabel dan di Modal Penolakan Hapus Bed Terisi ([`PenolakanHapusModal.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/bed-management/PenolakanHapusModal.tsx)), dengan nama DPJP menggunakan fallback visual (*dr. Nanda Putra, Sp.PD*).

### ✅ Poin 3: Kolom `nama_kamar` & `fasilitas` — SUDAH DIIMPLEMENTASIKAN
- **Pembaruan di Backend**:
  - Kolom `nama_kamar VARCHAR(50)` dan `fasilitas VARCHAR(255)` telah ditambahkan ke skema Prisma dan migrasi MySQL (`20261103000000_bed_room_and_facilities`).
  - Request body `POST` & `PATCH /api/beds` menerima `nama_kamar` dan `fasilitas` (string dipisah koma).
- **Integrasi di Frontend**:
  - [`TambahBedModal.tsx`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/components/bed-management/TambahBedModal.tsx) dan [`createBedApi`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/lib/api-client.ts) secara otomatis menyusun dan mengirimkan `nama_kamar` serta string `fasilitas` terstandarisasi yang dipisahkan koma ke backend.

### ⚠️ Poin 1 (Catatan Khusus): Validasi Status `Terisi` pada `PATCH /api/beds/:id`
- **Kondisi Backend**: `updateBedSchema` pada backend masih membatasi agar status `"Terisi"` hanya boleh tercipta lewat endpoint alokasi (`POST /api/allocations`).
- **Penanganan Frontend**:
  - Opsi radio `Terisi` tetap tersedia pada Modal Ubah Status sesuai desain Figma `285:189`.
  - Jika pengguna mengubah status secara manual menjadi `Terisi` melalui `PATCH`, frontend menangkap validasi error backend dan mengarahkan pengguna untuk menggunakan alur **Alokasi Kamar Pasien** agar data rekam medis terdaftar secara resmi.

---

## 5. Ringkasan Pengujian Kualitas Kode (Quality Check)

- **Next.js Production Build**: Telah diuji dengan `npm run build` di direktori `frontend/inpatient-care`:
  - Hasil: **Success (Exit Code 0)**.
  - Kompilasi TypeScript: **0 Error**.
  - Generated Static Pages:
    - `○ /`
    - `○ /login`
    - `○ /bed-management`
    - `○ /bed-management/alokasi`
- **Fallback Offline**: Aplikasi tetap 100% dapat dijalankan dan diuji secara mulus baik saat terhubung ke server backend Express port 3000 maupun saat offline berkat store in-memory terpadu (`mock-fallback.ts`).
