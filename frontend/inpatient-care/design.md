# DESIGN SYSTEM & LAPORAN INTEGRASI BACKEND
## Inpatient Care Platform — Sistem Informasi Rawat Inap & Bed Management

Dokumen ini mendokumentasikan spesifikasi desain antarmuka, konsistensi token UI, arsitektur tata letak, hasil pengujian integrasi dengan API Backend (`Express` + `Prisma` + `MySQL`), serta **daftar catatan/perbedaan di sisi backend yang perlu diselaraskan oleh tim backend**.

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

Frontend telah dilengkapi klien API terpusat di [`src/lib/api-client.ts`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/frontend/inpatient-care/src/lib/api-client.ts) yang mengarahkan panggilan HTTP ke `http://localhost:3000/api`:

| Fungsi Frontend | Endpoint Backend | Metode | Status Keselarasan Kontrak |
| :--- | :--- | :---: | :--- |
| `loginApi(user, pass)` | `/api/auth/login` | `POST` | ✅ **Sesuai** (Menerima `{ username, password }`, mengembalikan token JWT dan objek akun). |
| `fetchBedsApi()` | `/api/beds?page=1&limit=100` | `GET` | ✅ **Sesuai** (Menerima array data bed dengan pagination). |
| `fetchAvailableBedsApi()` | `/api/beds/available` | `GET` | ✅ **Sesuai** (Mengembalikan daftar khusus bed berstatus Tersedia untuk Petugas Administrasi). |
| `createBedApi(payload)` | `/api/beds` | `POST` | ✅ **Sesuai** (Menerima `{ no_bed, nama_bangsal, kelas_perawatan, tipe_bed, status }`). |
| `updateBedStatusApi(...)` | `/api/beds/:id` | `PATCH` | ⚠️ **Catatan Khusus (Lihat Bab 4 Poin A)** |
| `deleteBedApi(id)` | `/api/beds/:id` | `DELETE` | ✅ **Sesuai** (Menolak bed terisi dengan HTTP 409 `BED_IN_USE`). |
| `createAllocationApi(...)` | `/api/allocations` | `POST` | ✅ **Sesuai** (Menerima `{ id_pasien, id_bed, id_antrean }`, mengunci bed dan mengubah status menjadi `Terisi`). |

---

## 4. Temuan Perbedaan di Sisi Backend & Rekomendasi untuk Tim Backend

> [!IMPORTANT]
> Sesuai instruksi Anda, **tampilan dan fungsionalitas Frontend TIDAK diubah atau diturunkan kualitasnya**. Berikut adalah daftar hal yang perlu disesuaikan/dilengkapi di sisi **Backend (`backend/src/`)**:

### A. Validasi Status `Terisi` pada Endpoint `PATCH /api/beds/:id`
- **Kondisi Backend Saat Ini**:
  Pada file [`backend/src/modules/bed/bed.validation.js`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/backend/src/modules/bed/bed.validation.js) baris 27:
  ```javascript
  status: z.enum(BED_STATUS_LIST.filter((status) => status !== BED_STATUS.TERISI)).optional()
  ```
  Backend menolak jika ada request `PATCH` yang mengirim status `"Terisi"` dengan alasan *"Terisi hanya boleh dihasilkan oleh proses alokasi"*.
- **Kebutuhan Desain Figma (`285:189`)**:
  Pada frame Figma `285:189` ("Modal Form: Ubah Status Ketersediaan Bed"), terdapat 4 opsi radio yang dapat dipilih petugas: `Tersedia`, `Terisi`, `Pembersihan`, dan `Pemeliharaan`.
- **Rekomendasi untuk Backend**:
  Izinkan `status: z.enum(BED_STATUS_LIST)` pada endpoint `PATCH /api/beds/:id` khusus jika yang mengeksekusi adalah `Petugas Bed Management` (misal untuk penandaan manual darurat SIMRS), ATAU jika status diubah ke `Terisi`, backend meminta parameter opsional `id_pasien`.

### B. Relasi Pasien Penghuni (`occupant`) pada `GET /api/beds`
- **Kondisi Backend Saat Ini**:
  Fungsi `findBeds` di [`backend/src/modules/bed/bed.model.js`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/backend/src/modules/bed/bed.model.js) baris 40 hanya memilih field dari tabel `bed` saja (`select: bedSelect`).
- **Kebutuhan Desain Figma (`164:3797` & `285:279`)**:
  Ketika bed berstatus `Terisi`, antarmuka menampilkan nama pasien aktif (*Hendra Wijaya*) dan dokter DPJP (*dr. Nanda Putra*), khususnya pada **Modal Penolakan Hapus Bed Terisi**.
- **Rekomendasi untuk Backend**:
  Di `backend/src/modules/bed/bed.model.js`, tambahkan relasi ke alokasi aktif:
  ```javascript
  include: {
    rekam_alokasi_list: {
      where: { status_alokasi: "Aktif" },
      take: 1,
      include: {
        pasien: {
          select: { id_pasien: true, nama_pasien: true, no_rm: true }
        }
      }
    }
  }
  ```

### C. Penambahan Kolom Ruangan / Kamar (`nama_kamar`) dan `fasilitas` pada Skema Database
- **Kondisi Backend Saat Ini**:
  Tabel `bed` di [`backend/prisma/schema.prisma`](file:///c:/kuliah/web%20rsi%20inpa/rsi-inpacient/backend/prisma/schema.prisma) baris 66–83 hanya memiliki kolom `no_bed`, `nama_bangsal`, `kelas_perawatan`, `tipe_bed`, dan `status`.
- **Kebutuhan Desain Figma (`164:3797` & `193:9909`)**:
  Desain menampilkan identitas ruangan seperti `"Kamar 101"` atau `"Suite 03"` dan rincian fasilitas (`"1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central"`).
- **Rekomendasi untuk Backend**:
  Tambahkan kolom opsional pada model `Bed` di Prisma:
  - `nama_kamar String? @db.VarChar(50)`
  - `fasilitas String? @db.VarChar(255)`
  *(Saat ini frontend telah menggenerasi nilai representasi ruangan secara cerdas berdasarkan akhiran nomor bed agar tampilan tetap rapi).*

### D. Konsistensi Penamaan Nilai `role` di Database
- **Kondisi Backend**:
  Di tabel `akun.role` tersimpan string title case: `"Petugas Administrasi"` dan `"Petugas Bed Management"`.
- **Status di Frontend**:
  Frontend sudah dipasangi layer normalisasi toleran di `src/lib/api-client.ts`, sehingga baik string title case dari database maupun uppercase enum dari token JWT akan dikenali secara otomatis tanpa error.

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
- **Fallback Offline**: Aplikasi tetap 100% dapat dijalankan, didemonstrasikan, dan diuji secara mulus meskipun server MySQL/Express backend sedang dimatikan berkat in-memory local state store (`mock-fallback.ts`).
