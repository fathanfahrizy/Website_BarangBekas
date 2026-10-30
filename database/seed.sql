-- Seed data untuk demo tugas kampus PasarKampus Gunadarma
-- Password semua akun sample adalah: password123

-- 1. Tambah Akun Mahasiswa Sample
INSERT INTO users (npm, full_name, username, phone, password_hash)
VALUES
    ('50422001', 'Arya Pratama', 'arya_fikti', '081234567801', '$2a$10$U5NBceT93tXQPGvams.w3.wmjESS/Y.fyekHfPG/Bgj61Qdh2zQ4i'),
    ('10221015', 'Siti Rahmawati', 'siti_fe', '081234567802', '$2a$10$U5NBceT93tXQPGvams.w3.wmjESS/Y.fyekHfPG/Bgj61Qdh2zQ4i'),
    ('20420042', 'Budi Santoso', 'budi_ftsp', '081234567803', '$2a$10$U5NBceT93tXQPGvams.w3.wmjESS/Y.fyekHfPG/Bgj61Qdh2zQ4i')
ON CONFLICT (npm) DO NOTHING;

-- 2. Tambah Listing Barang Preloved Sample
INSERT INTO listings (seller_id, category_id, title, description, price, item_condition, meetup_location, status)
SELECT 
    u.id,
    1, -- Buku & Alat Tulis
    'Buku Algoritma & Struktur Data (C++)',
    'Buku kuliah semester 2 & 3 Informatika. Kondisi halaman masih lengkap, ada sedikit coretan pensil catatan dosen.',
    45000,
    'good',
    'Kampus D Margonda (Depok)',
    'active'
FROM users u WHERE u.npm = '50422001'
AND NOT EXISTS (SELECT 1 FROM listings WHERE title = 'Buku Algoritma & Struktur Data (C++)');

INSERT INTO listings (seller_id, category_id, title, description, price, item_condition, meetup_location, status)
SELECT 
    u.id,
    2, -- Elektronik
    'Kalkulator Ilmiah Casio fx-991EX ClassWiz',
    'Kalkulator scientific original Casio, sangat berguna untuk praktikum fisika, matematika diskrit, dan statistik. Layar jernih, tombol empuk, solar cell aktif.',
    175000,
    'like_new',
    'Kampus E Kelapa Dua',
    'active'
FROM users u WHERE u.npm = '50422001'
AND NOT EXISTS (SELECT 1 FROM listings WHERE title = 'Kalkulator Ilmiah Casio fx-991EX ClassWiz');

INSERT INTO listings (seller_id, category_id, title, description, price, item_condition, meetup_location, status)
SELECT 
    u.id,
    4, -- Fashion / Atribut
    'Jas Praktikum / Laboratorium Ukuran L',
    'Jas lab bersih, baru dipakai 1 semester saat praktikum kimia dasar & elektronika. Tidak ada sobekan atau noda kimia.',
    55000,
    'like_new',
    'Kampus G Laboratorium Kelapa Dua',
    'active'
FROM users u WHERE u.npm = '10221015'
AND NOT EXISTS (SELECT 1 FROM listings WHERE title = 'Jas Praktikum / Laboratorium Ukuran L');

INSERT INTO listings (seller_id, category_id, title, description, price, item_condition, meetup_location, status)
SELECT 
    u.id,
    3, -- Perlengkapan Kos
    'Kipas Angin Meja Mini USB',
    'Kipas meja kosan, 3 mode kecepatan angin. Cocok untuk teman belajar malam di kos. Kabel micro USB sudah termasuk.',
    40000,
    'good',
    'Kampus D Margonda',
    'active'
FROM users u WHERE u.npm = '10221015'
AND NOT EXISTS (SELECT 1 FROM listings WHERE title = 'Kipas Angin Meja Mini USB');

INSERT INTO listings (seller_id, category_id, title, description, price, item_condition, meetup_location, status)
SELECT 
    u.id,
    1, -- Buku & Alat Tulis
    'Buku Pengantar Akuntansi Dasar Edisi Terbaru',
    'Wajib untuk mahasiswa Manajemen & Akuntansi FE Gunadarma. Kondisi sangat mulus terawat disampul plastik.',
    35000,
    'like_new',
    'Kampus E Kelapa Dua',
    'active'
FROM users u WHERE u.npm = '20420042'
AND NOT EXISTS (SELECT 1 FROM listings WHERE title = 'Buku Pengantar Akuntansi Dasar Edisi Terbaru');
