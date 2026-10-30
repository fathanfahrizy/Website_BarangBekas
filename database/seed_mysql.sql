-- ============================================================
-- Data Dummy (Seeder) untuk Demo Presentasi Dosen
-- Password semua akun sample: password123
-- ============================================================

USE marketplace_gunadarma;

-- 1. Tambah Akun Mahasiswa Gunadarma Sample
INSERT INTO users (id, npm, full_name, username, phone, password_hash)
VALUES
    (1, '50422001', 'Arya Pratama', 'arya_fikti', '081234567801', '$2y$10$ih26Qf0fQ2LOY5Cmc.hUTuFvsLHcvy7WDTGutyjvHcXvg5QMKkRQS'),
    (2, '10221015', 'Siti Rahmawati', 'siti_fe', '081234567802', '$2y$10$ih26Qf0fQ2LOY5Cmc.hUTuFvsLHcvy7WDTGutyjvHcXvg5QMKkRQS'),
    (3, '20420042', 'Budi Santoso', 'budi_ftsp', '081234567803', '$2y$10$ih26Qf0fQ2LOY5Cmc.hUTuFvsLHcvy7WDTGutyjvHcXvg5QMKkRQS')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 2. Tambah Listing Barang Preloved Sample
INSERT INTO listings (id, seller_id, category_id, title, description, price, item_condition, meetup_location, status)
VALUES
    (1, 1, 1, 'Buku Algoritma & Struktur Data (C++)', 'Buku kuliah semester 2 & 3 Informatika. Kondisi halaman masih lengkap, ada sedikit catatan pensil materi dosen.', 45000, 'good', 'Kampus D Margonda (Depok)', 'active'),
    (2, 1, 2, 'Kalkulator Ilmiah Casio fx-991EX ClassWiz', 'Kalkulator scientific original Casio, sangat berguna untuk praktikum fisika, kalkulus, dan statistik. Layar jernih dan solar cell aktif.', 175000, 'like_new', 'Kampus E Kelapa Dua', 'active'),
    (3, 2, 4, 'Jas Praktikum / Laboratorium Ukuran L', 'Jas lab bersih warna putih, baru dipakai 1 semester saat praktikum kimia & elektronika dasar. Bebas noda bahan kimia.', 55000, 'like_new', 'Kampus G Lab Kelapa Dua', 'active'),
    (4, 2, 3, 'Kipas Angin Meja Mini USB', 'Kipas meja kosan, 3 kecepatan angin. Hemat listrik dan tidak berisik, cocok untuk belajar malam di kos.', 40000, 'good', 'Kampus D Margonda', 'active'),
    (5, 3, 1, 'Buku Pengantar Akuntansi Dasar Edisi Terbaru', 'Wajib untuk mahasiswa Manajemen & Akuntansi FE Gunadarma. Kondisi sangat mulus terawat disampul plastik.', 35000, 'like_new', 'Kampus E Kelapa Dua', 'active')
ON DUPLICATE KEY UPDATE title = VALUES(title);
