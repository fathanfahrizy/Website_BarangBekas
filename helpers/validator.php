<?php
require_once __DIR__ . '/../config/constants.php';

/**
 * Validasi Nomor Pokok Mahasiswa (NPM) Universitas Gunadarma
 * 
 * Aturan:
 * 1. Tepat 8 digit angka numerik.
 * 2. 3 digit pertama terdaftar di ALLOWED_NPM_PREFIXES (contoh: 504 Informatika, 101 SI, dll).
 * 3. 2 digit berikutnya adalah tahun angkatan (2000 + xx), tidak boleh di masa depan.
 * 4. 3 digit terakhir adalah nomor urut mahasiswa, tidak boleh '000'.
 * 
 * @param string|int $npm
 * @return string|null Mengembalikan pesan error jika tidak valid, atau null jika valid.
 */
function validateNpm($npm) {
    $cleanNpm = trim((string)$npm);

    if (!preg_match('/^\d{8}$/', $cleanNpm)) {
        return "NPM harus terdiri dari tepat 8 digit angka.";
    }

    $prefix = substr($cleanNpm, 0, 3);
    if (!array_key_exists($prefix, ALLOWED_NPM_PREFIXES)) {
        return "Kode program studi pada NPM tidak terdaftar di Universitas Gunadarma.";
    }

    $year = 2000 + (int)substr($cleanNpm, 3, 2);
    $currentYear = (int)date('Y');
    if ($year > $currentYear) {
        return "Tahun masuk pada NPM tidak valid (melebihi tahun berjalan).";
    }

    $sequence = (int)substr($cleanNpm, 5, 3);
    if ($sequence === 0) {
        return "Tiga digit terakhir NPM tidak boleh 000.";
    }

    return null;
}
