# SiRAGI - Sistem Pendataan RAB Gizi (Database-per-User)

Aplikasi SaaS berbasis **Next.js (App Router)**, **Tailwind CSS**, dan **NextAuth.js** untuk sistem pendataan Rencana Anggaran Biaya (RAB) Gizi.

Aplikasi ini menggunakan konsep **"Database-per-User"**, di mana data pengguna tidak disimpan di server database terpusat, melainkan langsung di **Google Sheets** yang berada di dalam akun **Google Drive** masing-masing pengguna.

---

## ✨ Fitur Utama

1. **Autentikasi & Auto-Provisioning Database**:
   - Integrasi NextAuth.js dengan Google OAuth Provider.
   - Meminta scope `drive.file` dan `spreadsheets`.
   - Otomatis membuat file spreadsheet internal `Master_DB_RAB_Gizi` di Google Drive pengguna saat pertama kali login jika belum ada.
2. **Struktur Master Sheet Terstandar**:
   - Tab internal `Tab_Input_Harian` tanpa cell merging:
     `ID`, `Tanggal`, `Lokasi SPPG`, `Nama Menu`, `Uraian Bahan`, `Kuantitas_Angka`, `Satuan`, `Keterangan`.
3. **Formulir Interaktif Dinamis (SPA)**:
   - Header Form: Tanggal pelaksanaan (Date picker) dan Lokasi SPPG.
   - Dynamic Repeater: Tambah Menu dan Tambah Bahan di dalam setiap menu.
   - Dropdown satuan standar: `kg`, `liter`, `pcs`, `pouch`, `kotak`, `ball`.
   - Fitur 1-klik muat contoh menu gizi untuk pengujian instan.
4. **Export Laporan Siap Cetak (Formatted Cells)**:
   - Tombol **Generate Laporan RAB** berdasarkan tanggal yang dipilih.
   - Menggunakan Google Sheets API `batchUpdate` untuk membuat file Spreadsheet baru di Drive pengguna: `Laporan RAB [Tanggal]`.
   - Layout formal cetak manual: Cell merging, background warna biru korporat untuk header, dan border tabel.
   - Tautan langsung untuk membuka file hasil generate di tab baru.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Autentikasi**: [NextAuth.js](https://next-auth.js.org/)
- **Google API**: [googleapis](https://github.com/googleapis/google-api-nodejs-client) (Drive API v3, Sheets API v4)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Panduan Memulai

### 1. Clone & Instalasi

```bash
git clone https://github.com/iqbalhikam/SiRAGI.git
cd SiRAGI
npm install
```

### 2. Konfigurasi Environment Variables

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi kredensial berikut:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=rahasia_acak_minimal_32_karakter
```

> **Catatan Pengaturan Google Cloud Console**:
> 1. Aktifkan **Google Drive API** dan **Google Sheets API** di menu **APIs & Services > Library**. (Krusial: API harus di-enable terlebih dahulu agar scope di bawah dikenali).
> 2. Di menu **OAuth consent screen > Scopes > Add or remove scopes**, masukkan URL lengkap (bukan singkatan):
>    - `https://www.googleapis.com/auth/drive.file`
>    - `https://www.googleapis.com/auth/spreadsheets`
> 3. Di menu **Credentials > Create Credentials > OAuth client ID** (Web application):
>    - Authorized JavaScript origins: `http://localhost:3000`
>    - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### 3. Menjalankan Server Pengembangan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📄 Lisensi

Distributed under the MIT License.

<!-- CHECKPOINT id="ckpt_munq3fuk_5m0pjx" time="2026-09-30T06:27:12.764Z" note="auto" fixes=0 questions=0 highlights=0 sections="" -->

<!-- CHECKPOINT id="ckpt_munqgasx_gdz1k7" time="2026-09-30T06:37:12.753Z" note="auto" fixes=0 questions=0 highlights=0 sections="" -->

<!-- CHECKPOINT id="ckpt_munqt5rq_zdflpj" time="2026-09-30T06:47:12.758Z" note="auto" fixes=0 questions=0 highlights=0 sections="" -->
