<?php
// ============================================================
// API Kategori Produk (PHP + MySQL PDO)
// ============================================================

require_once __DIR__ . '/../helpers/response.php';
$pdo = require __DIR__ . '/../config/database.php';

$stmt = $pdo->query("SELECT id, name, slug FROM categories ORDER BY id ASC");
jsonResponse(['categories' => $stmt->fetchAll()]);
