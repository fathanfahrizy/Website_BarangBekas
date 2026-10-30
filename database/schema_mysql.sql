-- ============================================================
-- Skema Database MySQL / MariaDB (XAMPP / phpMyAdmin)
-- PasarKampus Gunadarma - Marketplace Barang Bekas Kampus
-- ============================================================

CREATE DATABASE IF NOT EXISTS marketplace_gunadarma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE marketplace_gunadarma;

-- 1. Tabel Fakultas
CREATE TABLE IF NOT EXISTS faculties (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO faculties (code, name) VALUES
    ('FIKTI', 'Fakultas Ilmu Komputer & Teknologi Informasi (FIKTI)'),
    ('FE', 'Fakultas Ekonomi (FE)'),
    ('FTI', 'Fakultas Teknologi Industri (FTI)'),
    ('FTSP', 'Fakultas Teknik Sipil & Perencanaan (FTSP)'),
    ('FPS', 'Fakultas Psikologi & Fakultas Sastra'),
    ('FIKES', 'Fakultas Ilmu Kesehatan & Farmasi / Agroteknologi')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Tabel Program Studi (dengan prefix NPM 3 digit)
CREATE TABLE IF NOT EXISTS study_programs (
    prefix VARCHAR(3) PRIMARY KEY,
    faculty_code VARCHAR(10) NOT NULL,
    program_code VARCHAR(2) NOT NULL,
    degree VARCHAR(10) NOT NULL,
    name VARCHAR(150) NOT NULL,
    FOREIGN KEY (faculty_code) REFERENCES faculties(code) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO study_programs (prefix, faculty_code, program_code, degree, name) VALUES
    ('101', 'FIKTI', '01', 'S1', 'Sistem Informasi'),
    ('504', 'FIKTI', '04', 'S1', 'Informatika / Teknik Informatika'),
    ('111', 'FIKTI', '11', 'D3', 'Manajemen Informatika'),
    ('102', 'FE', '02', 'S1', 'Manajemen'),
    ('202', 'FE', '02', 'S1', 'Akuntansi'),
    ('206', 'FE', '06', 'S1', 'Ekonomi Syariah'),
    ('112', 'FE', '12', 'D3', 'Manajemen Pemasaran'),
    ('212', 'FE', '12', 'D3', 'Akuntansi'),
    ('514', 'FTI', '14', 'S1', 'Teknik Elektro'),
    ('524', 'FTI', '24', 'S1', 'Teknik Mesin'),
    ('304', 'FTI', '04', 'S1', 'Teknik Industri'),
    ('501', 'FTI', '01', 'D3', 'Teknik Komputer'),
    ('204', 'FTSP', '04', 'S1', 'Teknik Sipil'),
    ('214', 'FTSP', '14', 'S1', 'Arsitektur'),
    ('105', 'FPS', '05', 'S1', 'Psikologi'),
    ('108', 'FPS', '08', 'S1', 'Ilmu Komunikasi / Sastra Inggris'),
    ('702', 'FIKES', '02', 'S1', 'Farmasi'),
    ('404', 'FIKES', '04', 'S1', 'Agroteknologi'),
    ('712', 'FIKES', '12', 'S1', 'Kedokteran')
ON DUPLICATE KEY UPDATE 
    faculty_code = VALUES(faculty_code),
    program_code = VALUES(program_code),
    degree = VALUES(degree),
    name = VALUES(name);

-- 3. Tabel Users (Mahasiswa Gunadarma)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    npm VARCHAR(8) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(30) UNIQUE DEFAULT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Kategori Barang Preloved
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categories (id, name, slug) VALUES
    (1, 'Buku & Alat Tulis', 'buku-alat-tulis'),
    (2, 'Elektronik', 'elektronik'),
    (3, 'Perlengkapan Kos', 'perlengkapan-kos'),
    (4, 'Fashion', 'fashion'),
    (5, 'Kendaraan', 'kendaraan'),
    (6, 'Lainnya', 'lainnya')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 5. Tabel Iklan Barang (Listings)
CREATE TABLE IF NOT EXISTS listings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 0) NOT NULL DEFAULT 0,
    item_condition VARCHAR(20) NOT NULL,
    meetup_location VARCHAR(150) DEFAULT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Gambar Listing
CREATE TABLE IF NOT EXISTS listing_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    url VARCHAR(255) NOT NULL,
    position SMALLINT NOT NULL DEFAULT 0,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Percakapan (Conversations)
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_conversation (listing_id, buyer_id, seller_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Pesan Chat (Messages)
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
