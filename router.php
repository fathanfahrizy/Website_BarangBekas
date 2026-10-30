<?php
// ============================================================
// Built-in PHP Development Server Router
// Jalankan: php -S localhost:8000 router.php
// ============================================================

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. Arahkan semua request /api/* ke api/index.php
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    exit;
}

// 2. Layani file foto di /uploads/*
if (str_starts_with($uri, '/uploads/')) {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimes = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
        ];
        if (isset($mimes[$ext])) {
            header('Content-Type: ' . $mimes[$ext]);
            header('Cache-Control: public, max-age=86400');
            readfile($filePath);
            exit;
        }
    }
    http_response_code(404);
    echo "File upload tidak ditemukan.";
    exit;
}

// 3. Layani aset statis di /public (CSS, JS, gambar)
$publicFile = __DIR__ . '/public' . $uri;
if ($uri !== '/' && file_exists($publicFile) && is_file($publicFile)) {
    $ext = strtolower(pathinfo($publicFile, PATHINFO_EXTENSION));
    $mimes = [
        'css'  => 'text/css; charset=utf-8',
        'js'   => 'application/javascript; charset=utf-8',
        'html' => 'text/html; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    readfile($publicFile);
    exit;
}

// 4. Default: Tampilkan halaman frontend utama
require __DIR__ . '/public/index.html';
