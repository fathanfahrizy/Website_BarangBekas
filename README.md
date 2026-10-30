# PasarKampus Gunadarma (PHP & MySQL Edition) 🎓📦

Aplikasi marketplace jual beli barang bekas (*preloved*) lokal khusus mahasiswa **Universitas Gunadarma** yang dirancang sederhana, aman, dan mudah dipresentasikan untuk tugas kampus.

Menggunakan teknologi standar mata kuliah: **PHP (PDO)** + **MySQL (XAMPP / phpMyAdmin)** + **HTML/CSS/JS**.

---

## 📁 Struktur Folder Proyek (PHP + MySQL)

```text
marketplace_gunadarma-main/
├── database/
│   ├── schema_mysql.sql     # Skema tabel MySQL (InnoDB, FK, Charset utf8mb4)
│   ├── seed_mysql.sql       # Data mahasiswa & contoh barang preloved untuk demo
│   └── schema.sql           # Skema cadangan PostgreSQL
├── config/
│   ├── database.php         # Koneksi database MySQL dengan PDO (Prepared Statements)
│   └── constants.php        # Daftar prefix NPM Gunadarma, lokasi kampus, & label
├── helpers/
│   ├── validator.php        # Logic validasi 8 digit NPM Gunadarma
│   ├── response.php         # Helper JSON response, session login & profileShape
│   └── upload.php           # Upload foto barang & avatar (Maks 4 foto, JPG/PNG/WebP)
├── api/
│   ├── index.php            # Master API Router (/api/*)
│   ├── auth.php             # Registrasi NPM, Login password_verify, Logout, & Profil
│   ├── categories.php       # Kategori barang (Buku, Elektronik, Kos, Fashion, dll)
│   ├── listings.php         # Pasang barang, cari barang, filter kategori, status terjual
│   ├── conversations.php    # Chat real-time pembeli & penjual, kesepakatan COD
│   └── cleanup.php          # Pembersih otomatis barang terjual > 3 hari
├── public/                  # Tampilan Antarmuka Frontend (SPA)
│   ├── css/
│   │   └── styles.css       # Desain tema kampus Gunadarma
│   ├── js/
│   │   └── app.js           # Fetch API & interaksi halaman
│   └── index.html           # Single-page interface
├── uploads/                 # Folder lokal penyimpanan foto barang & profil
├── index.php                # Entry point utama PHP
├── router.php               # Router untuk PHP Built-in Server
├── .htaccess                # Konfigurasi rewrite Apache XAMPP
└── README.md                # Dokumentasi & panduan
```

---

## 👥 Pembagian Tugas Tim 4 Orang

| Peran | Anggota | File yang Dikerjakan | Tanggung Jawab |
| :--- | :--- | :--- | :--- |
| **1. Database & Autentikasi** | Mahasiswa 1 | `database/schema_mysql.sql`, `config/database.php`, `helpers/validator.php` | Mengelola skema MySQL, koneksi PDO, serta logic validasi 8 digit NPM Gunadarma. |
| **2. Frontend & Tampilan** | Mahasiswa 2 | `public/index.html`, `public/css/styles.css` | Merancang antarmuka yang responsif, tema warna Gunadarma, modal dialog & toast notifikasi. |
| **3. Iklan & Upload Produk** | Mahasiswa 3 | `api/listings.php`, `api/categories.php`, `helpers/upload.php` | Fitur pasang iklan, upload foto produk dengan PHP, pencarian barang & filter kategori. |
| **4. Chat, COD & QA / Laporan**| Mahasiswa 4 | `api/conversations.php`, `api/auth.php`, `api/cleanup.php` | Alur negosiasi chat, kesepakatan lokasi COD kampus, pengujian fungsi, & penyusunan laporan/slide. |

---

## 🚀 Panduan Menjalankan Aplikasi

### Langkah 1: Siapkan Database di XAMPP
1. Buka **XAMPP Control Panel**, klik **Start** pada modul **MySQL**.
2. Buka browser dan akses **`http://localhost/phpmyadmin`**.
3. Buat database baru bernama: `marketplace_gunadarma`.
4. Klik tab **Import**, lalu pilih file **`database/schema_mysql.sql`**, kemudian klik **Import**.
5. *(Sangat disarankan untuk demo)* Import juga file **`database/seed_mysql.sql`** agar langsung tersedia data contoh barang dan akun mahasiswa.

---

### Langkah 2: Jalankan Server (Pilih Salah Satu Cara)

#### 👉 Cara A: Menggunakan PHP Built-in Server (Paling Cepat & Praktis)
Cukup buka terminal / PowerShell di folder proyek ini:
```powershell
cd c:\marketplace_gunadarma-main
php -S localhost:8000 router.php
```
Buka browser di: **`http://localhost:8000`**

#### 👉 Cara B: Menggunakan Apache XAMPP
1. Pindahkan atau buat shortcut/junction folder ini ke folder `C:\xampp\htdocs\marketplace_gunadarma`.
2. Klik **Start** pada modul **Apache** di XAMPP Control Panel.
3. Buka browser di: **`http://localhost/marketplace_gunadarma`**.

---

## 🔑 Akun Demo (dari `seed_mysql.sql`)
Password semua akun sample adalah: **`password123`**
- **Mahasiswa Informatika (FIKTI)**: NPM `50422001` (Arya Pratama)
- **Mahasiswa Manajemen (FE)**: NPM `10221015` (Siti Rahmawati)
- **Mahasiswa Teknik Sipil (FTSP)**: NPM `20420042` (Budi Santoso)

---

## 🛡️ Logic Validasi NPM Gunadarma yang Diterapkan di PHP:
1. **Format Angka**: Wajib tepat 8 digit angka numerik.
2. **Kode Program Studi (Prefix 3 Digit)**: Diverifikasi apakah termasuk dalam 19 jurusan resmi Gunadarma (misal `504` Informatika, `101` Sistem Informasi, `102` Manajemen, `204` Teknik Sipil, dll).
3. **Tahun Masuk**: Dua digit ke-4 dan ke-5 (2000 + xx) diperiksa agar tidak melebihi tahun saat ini.
4. **Nomor Urut**: Tiga digit terakhir divalidasi tidak boleh bernilai `000`.
5. **Keamanan Password**: Menggunakan algoritma enkripsi native PHP `password_hash()` dan `password_verify()` (BCRYPT) serta PDO Prepared Statements untuk mencegah *SQL Injection*.
