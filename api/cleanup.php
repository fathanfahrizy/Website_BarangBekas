<?php
// ============================================================
// Service Pembersihan Iklan Terjual > 3 Hari (PHP + MySQL PDO)
// ============================================================

require_once __DIR__ . '/../helpers/response.php';
$pdo = require __DIR__ . '/../config/database.php';

try {
    // 1. Ambil foto barang yang sudah terjual lebih dari 3 hari
    $stmt = $pdo->query("
        SELECT li.url 
        FROM listing_images li
        JOIN listings l ON l.id = li.listing_id
        WHERE l.status = 'sold' AND l.sold_at <= NOW() - INTERVAL 3 DAY
    ");
    $images = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 2. Hapus listing dari database (CASCADE akan otomatis menghapus dari listing_images)
    $del = $pdo->query("
        DELETE FROM listings 
        WHERE status = 'sold' AND sold_at <= NOW() - INTERVAL 3 DAY
    ");

    // 3. Hapus file fisik gambar dari folder uploads/
    $uploadDir = __DIR__ . '/../uploads/';
    $deletedCount = 0;
    foreach ($images as $url) {
        $filename = basename($url);
        $filePath = $uploadDir . $filename;
        if (file_exists($filePath) && is_file($filePath)) {
            @unlink($filePath);
            $deletedCount++;
        }
    }

    jsonResponse(['ok' => true, 'cleaned_files' => $deletedCount]);
} catch (Exception $e) {
    jsonResponse(['error' => 'Gagal membersihkan barang: ' . $e->getMessage()], 500);
}
