# DESIGN SYSTEM & UI/UX PRO MAX SPECIFICATION
## Inpatient Care Platform — Sistem Informasi Rawat Inap & Bed Management
**Referensi Visual Utama:** Screenshot Resmi Bed Management & Inpatient Care UI  
**Terintegrasi dengan Skill:** `ui-ux-pro-max` (Design Intelligence & Anti-AI Slop Guidelines)  
**Kepatuhan Figma:** Node `72:9621` (Rekap Layanan) & Node `221:3822` (Billing & Pembayaran)  
**Versi:** 3.1 — Canonical Visual Identity (Locked Color & Style System)

---

## 1. Identitas Visual Utama (Locked Visual Identity)

Berdasarkan screenshot acuan resmi sistem antarmuka **Inpatient Care SIMRS**, seluruh modul aplikasi mengunci bahasa visual yang seragam:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        VISUAL IDENTITY MATRIX                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Sidebar Navigasi   : Deep Hospital Forest Green (#0a2e28 / #0d332f) │
│ 2. Aksen Primer       : Medical Teal / Toska Cerah (#00b89f / #13c9b3) │
│ 3. Subheader Tagline  : Mint Green Uppercase (#0fa18f, tracking: 1px)  │
│ 4. Kanvas Halaman     : Clean Off-White Neutral (#f7f8f5 / #ffffff)    │
│ 5. Surface & Card     : Pure White (#ffffff) border halus (#e9ebf0)   │
│ 6. Status Pills       : Soft Tinted Capsules dengan indikator Bullet   │
│ 7. Geometri           : Cards (12px), Buttons/Inputs (8px), Modals(16) │
└────────────────────────────────────────────────────────────────────────┘
```

Prinsip ini menjaga identitas asli rumah sakit tetap utuh, tidak mengalami pergeseran warna yang drastis, namun merapikan seluruh detail visual, tipografi, jarak (*spacing*), dan ergonomi operasional.

---

## 2. Palet Warna & Token Semantik Presisi

### A. Core Platform Colors

| Nama Token | Hex Code | Tailwind Equivalent / Usage | Deskripsi Penggunaan |
| :--- | :--- | :--- | :--- |
| **Deep Forest Sidebar** | `#0a2e28` / `#0d332f` | `bg-[#0a2e28]` / `bg-[#0d332f]` | Background penuh Sidebar navigasi kiri & header kop invoice gelap |
| **Primary Accent Teal** | `#00b89f` | `bg-[#00b89f]` / `text-[#00b89f]` | Tombol utama (`+ Tambah Bed`, `Buat Tagihan`, tab aktif, icon highlight) |
| **Teal Hover State** | `#00a28c` | `hover:bg-[#00a28c]` | State hover instan untuk tombol primer toska |
| **Vibrant Mint Tagline** | `#0fa18f` | `text-[#0fa18f]` | Subheader uppercase di atas judul halaman (`MANAJEMEN INVENTARIS KAMAR`) |
| **Mint Soft Surface** | `#e7faf7` / `#e6f4ef` | `bg-[#e7faf7]` / `bg-[#e6f4ef]` | Background avatar inisial pasien, badge aktif, wadah icon KPI Tersedia |
| **Canvas Background** | `#f7f8f5` | `bg-[#f7f8f5]` | Latar belakang seluruh area kerja dashboard & modul |
| **Surface Card** | `#ffffff` | `bg-white border-[#e9ebf0]` | Kartu metrik, panel filter, tabel data, modal pop-up |
| **Border Neutral** | `#e9ebf0` / `#e2e8f0` | `border-[#e9ebf0]` | Border tipis 1px pemisah kartu dan kolom |
| **Text Title Dark** | `#1e1e1e` | `text-[#1e1e1e]` | Judul halaman `h1`, nama pasien, nominal biaya utama |
| **Text Body Gray** | `#4b5563` / `#666666` | `text-[#4b5563]` | Teks keterangan, nomor RM, nama bangsal, isi tabel |
| **Text Muted Gray** | `#8c8c8c` / `#9ca3af` | `text-[#8c8c8c]` | Placeholder input, tanggal, header kolom tabel |

---

### B. Status Semantik & Badge Capsules

Setiap status operasional disajikan dalam bentuk kapsul pill halus (`rounded-full`) dengan titik bullet berwarna di sisi kiri:

```text
┌─────────────────┬───────────┬───────────┬─────────────────────────────────────────┐
│ Status          │ Teks/Dot  │ Latar     │ Border & Format                         │
├─────────────────┼───────────┼───────────┼─────────────────────────────────────────┤
│ Tersedia /      │ #016b46   │ #e6f4ef   │ border-[#cbe7dd]                        │
│ Lunas / Siap    │ (#059669) │           │ • Tersedia (Siap ditempati / Lunas)     │
├─────────────────┼───────────┼───────────┼─────────────────────────────────────────┤
│ Terisi /        │ #dc2626   │ #fdf0f0   │ border-[#fecaca]                        │
│ Batal / Hapus   │ (#dc2626) │           │ • Terisi / Batal (Digunakan pasien)     │
├─────────────────┼───────────┼───────────┼─────────────────────────────────────────┤
│ Pembersihan /   │ #b45309   │ #fef3e9   │ border-[#fed7aa]                        │
│ Belum Dibayar   │ (#f59e0b) │           │ • Pembersihan (Proses sterilisasi)      │
├─────────────────┼───────────┼───────────┼─────────────────────────────────────────┤
│ Pemeliharaan /  │ #4b5563   │ #f3f4f6   │ border-[#e5e7eb]                        │
│ Nonaktif        │ (#6b7280) │           │ • Pemeliharaan (Perbaikan fasilitas)    │
├─────────────────┼───────────┼───────────┼─────────────────────────────────────────┤
│ Kelas VIP       │ #7e22ce   │ #f3e8ff   │ border-[#e9d5ff]                        │
│                 │           │           │ VIP (Pill ungu muda elegan)             │
└─────────────────┴───────────┴─────────────────────────────────────────────────────┘
```

---

## 3. Standardisasi Komponen Antarmuka (UI Components & Layout)

### 3.1 Sidebar Navigasi Kiri (260px)
- **Warna Latar:** Deep Forest Green `#0a2e28` / `#0d332f`.
- **Kop Branding:**
  - Ikon toska bulat kotak `rounded-[10px] bg-[#00b89f] text-white` berlogo `+`.
  - Judul: `Inpatient Care` (`text-white font-bold text-sm tracking-wide`).
  - Subjudul: `Sistem Informasi Rawat Inap` (`text-[10px] text-teal-200/60`).
- **Menu Labeling:**
  - Kategori uppercase kecil: `MENU UTAMA` dan `LAINNYA` (`text-[10px] font-bold text-teal-300/40 uppercase tracking-wider`).
  - Menu Aktif: Container dengan highlight toska halus, ikon toska `#00b89f`, teks putih `font-medium text-xs`.
- **Bottom User Profile:**
  - Avatar bulat toska muda inisial 2 huruf (contoh: `BS` / `RA`).
  - Nama petugas `text-xs font-semibold text-white` dan peran `text-[10px] text-teal-200/70`.

---

### 3.2 Header Halaman & Tombol Aksi
- **Tagline Section:** `text-[#0fa18f] text-[10px] font-semibold tracking-[1px] uppercase mb-1`.
- **Page Title:** `text-[#1e1e1e] text-[27px] font-medium leading-[35px] tracking-[-0.675px]`.
- **Subtitle:** `text-[#666] text-xs font-normal mt-0.5`.
- **Tombol Aksi Kanan:**
  - **Tombol Sekunder:** `px-4 py-2 rounded-[8px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#1e1e1e] text-xs font-medium flex items-center gap-2 shadow-xs`.
  - **Tombol Primer:** `px-4 py-2 rounded-[8px] bg-[#00b89f] hover:bg-[#00a28c] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition`.

---

### 3.3 Kartu Metrik 4 Kolom (KPI Stat Cards)
- **Container:** `bg-white rounded-[12px] border border-[#e9ebf0] p-4 flex items-center justify-between shadow-[0px_4px_8px_rgba(26,39,50,0.02)] hover:border-[#00b89f]/40 transition cursor-pointer`.
- **Wadah Ikon Bulat Kotak:** `w-10 h-10 rounded-[10px]` dengan background semantik lembut (Mint untuk Tersedia/Total, Merah untuk Terisi/Batal, Orange untuk Pembersihan/Antrean, Abu untuk Pemeliharaan).
- **Nilai Angka:** `text-lg font-semibold text-[#1e1e1e]` didampingi panah chevron kecil `ChevronRight text-[#bfbfbf]`.

---

### 3.4 Toolbar Pencarian, Dropdown Filter, & Tab Status
- **Search Box:** `w-full pl-9 pr-4 py-2 rounded-[8px] border border-[#e2e8f0] text-xs text-[#1e1e1e] placeholder-[#9ca3af] focus:outline-none focus:border-[#00b89f]`.
- **Filter Dropdowns:** Ketinggian serasi `py-2 px-3 rounded-[8px] border border-[#e2e8f0] bg-white text-xs text-[#4b5563]`.
- **Tab Bar Navigasi:**
  - Tab Aktif: `text-[#00b89f] font-semibold border-b-2 border-[#00b89f]` dengan badge counter toska `bg-[#e7faf7] text-[#00b89f]`.
  - Tab Inaktif: `text-[#6b7280] hover:text-[#1e1e1e]` dengan badge counter netral `bg-slate-100 text-slate-600`.

---

### 3.5 Tabel Operasional Data-Dense
- **Header Kolom:** `py-3 px-4 text-[10px] font-semibold text-[#8c8c8c] uppercase tracking-wider border-b border-[#f0f2f5] bg-white`.
- **Isi Baris:** `py-3.5 px-4 text-xs hover:bg-[#fafbfb] transition border-b border-[#f5f6f8]`.
- **Kolom Aksi:**
  - Tautan interaktif toska cerah: `text-[#00b89f] hover:text-[#00a28c] hover:underline font-medium text-xs`.
  - Ikon hapus: Ikon tempat sampah merah `Trash2 w-4 h-4 text-rose-500 hover:text-rose-700 cursor-pointer`.

---

## 4. Master Prompt Khusus UI/UX (Sesuai Gaya Acuan & Bebas AI Slop)

Gunakan prompt berikut saat menginstruksikan AI / Assistant untuk merancang atau memperbaiki kode frontend agar hasilnya **100% konsisten dengan gambar acuan**:

```markdown
### MASTER DESIGN PROMPT — INPATIENT CARE SIMRS (CANONICAL CLINICAL IDENTITY)

Bertindaklah sebagai Lead Healthcare UI/UX Designer & Senior Frontend Engineer. Tugasmu adalah mengimplementasikan antarmuka modul Inpatient Care SIMRS yang 100% selaras dengan acuan visual resmi dan standar kebersihan kode tanpa "AI slop".

Patuhi aturan desain berikut secara ketat:
1. WARNA & IDENTITAS VISUAL (KUNCI TIDAK BOLEH BERUBAH):
   - Sidebar Navigasi: Hijau tua sangat pekat #0a2e28 / #0d332f. Menu aktif ber-aksen toska dengan ikon toska terang.
   - Aksen Utama: Hijau toska medis #00b89f (Hover: #00a28c). Gunakan untuk tombol aksi primer (+ Tambah Bed, Buat Tagihan), tab aktif, dan icon highlight.
   - Tagline Subheader: Mint green uppercase #0fa18f, font-semibold text-[10px], letter-spacing tracking-[1px].
   - Kanvas Halaman: Off-white netral #f7f8f5 / #ffffff.
   - Surface Kartu: Putih bersih #ffffff dengan border tipis 1px #e9ebf0 dan bayangan sangat lembut [0px_4px_8px_rgba(26,39,50,0.02)].
   - JANGAN PERNAH mengubah warna dasar ini ke biru generik, ungu AI, atau gradasi kosmik. Pertahankan warna hijau toska klinis ini.

2. STATUS SEMANTIK & BADGE CAPSULES:
   - Tersedia / Lunas / Siap Billing: bg #e6f4ef, text #016b46, border #cbe7dd dengan titik dot hijau #059669.
   - Terisi / Batal / Darurat: bg #fdf0f0, text #dc2626, border #fecaca dengan titik dot merah #dc2626.
   - Pembersihan / Belum Dibayar / Antrean: bg #fef3e9, text #b45309, border #fed7aa dengan titik dot oranye #f59e0b.
   - Pemeliharaan: bg #f3f4f6, text #4b5563, border #e5e7eb dengan titik dot abu-abu #6b7280.
   - Kelas VIP: Kapsul ungu muda bg #f3e8ff, text #7e22ce, border #e9d5ff.

3. ERGONOMI, GEOMETRI, & TATA LETAK:
   - Border Radius: Kartu & Panel Utama (rounded-[12px]), Tombol Aksi & Input Field (rounded-[8px]), Modal Pop-up (rounded-[16px]), Badge Pill (rounded-full).
   - Baris Tabel Data: Data-density kompak py-3.5 px-4, teks utama text-[#1e1e1e] font-medium, teks sekunder text-[#4b5563] text-xs.
   - Angka & Finansial: Wajib terformat rapi (misal: "Rp 4.650.000", "01–28 Feb 2026", "RM-2026-00118").
   - 4 Kartu KPI Atas: Wadah putih rounded-[12px] p-4 flex items-center justify-between dengan ikon w-10 h-10 rounded-[10px] latar semantik lembut, nilai angka besar font-semibold text-[#1e1e1e], dan chevron right #bfbfbf.

4. ATURAN KERAPIAN BEBAS AI SLOP:
   - DILARANG menggunakan emoji. Seluruh ikon wajib menggunakan SVG murni dari 'lucide-react' berbobot stroke 1.5–2px.
   - DILARANG menampilkan kode use case teknis ("UC-01", "UC-07", "PC-17") di antarmuka pengguna. Gunakan nama operasional rumah sakit yang profesional.
   - Seluruh elemen klik wajib memiliki class 'cursor-pointer' dan transisi halus (transition-colors duration-150).
   - Pastikan teks memiliki kontras tinggi minimal 4.5:1 (WCAG 2.1 AA) di atas latar putih/terang.
```

---

## 5. Checklist Verifikasi Desain

- [x] Latar Sidebar tetap hijau hutan gelap pekat `#0a2e28` / `#0d332f`.
- [x] Tombol utama dan tab aktif menggunakan toska `#00b89f`.
- [x] Tagline uppercase hijau toska muda `#0fa18f` dengan tracking 1px.
- [x] 4 Kartu KPI status menggunakan rounded-[12px], ikon bulat kotak 10px, dan angka tebal.
- [x] Seluruh status operasional disajikan dalam kapsul pill dengan titik dot warna.
- [x] Tidak ada emoji dan tidak ada kode `UC-xx` pada UI.
- [x] Form input dan tombol aksi serasi dengan `rounded-[8px]`.
