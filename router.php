<?php
// ============================================================
// HYBRID Router: Support API + PHP Pages (navbar.php) + Static Assets
// Jalankan: php -S localhost:8000 router.php
// ============================================================

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = trim($uri, '/');

// 1. Handle API Requests (Arahkan ke api/index.php)
if (str_starts_with($uri, 'api/')) {
    require __DIR__ . '/api/index.php';
    exit;
}

// 2. Handle Uploads (Gambar produk/avatar)
if (str_starts_with($uri, 'uploads/')) {
    $filePath = __DIR__ . '/' . $uri;
    if (file_exists($filePath) && is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
        if (isset($mimes[$ext])) {
            header('Content-Type: ' . $mimes[$ext]);
            readfile($filePath);
            exit;
        }
    }
    http_response_code(404);
    exit;
}

// 3. Handle Folder Public (PHP Pages & Static Assets)
$publicFile = __DIR__ . '/public/' . $uri;

// Jika request root '/', default ke index.php (fallback ke index.html jika belum ada)
if ($uri === '') {
    if (file_exists(__DIR__ . '/public/index.php')) {
        require __DIR__ . '/public/index.php';
    } else {
        require __DIR__ . '/public/index.html';
    }
    exit;
}

// Jika file ada di folder public
if (file_exists($publicFile) && is_file($publicFile)) {
    $ext = strtolower(pathinfo($publicFile, PATHINFO_EXTENSION));
    
    // >>> INI KUNCINYA: JIKA FILE PHP, EKSEKUSI! <<<
    if ($ext === 'php') {
        // Ubah working directory ke public agar include 'components/navbar.php' bekerja dengan benar
        chdir(__DIR__ . '/public');
        require $publicFile;
        exit;
    }
    
    // Jika file statis (CSS, JS, dll), serve langsung
    $mimes = [
        'css'  => 'text/css; charset=utf-8',
        'js'   => 'application/javascript; charset=utf-8',
        'html' => 'text/html; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    readfile($publicFile);
    exit;
}

// 4. Fallback 404
http_response_code(404);
echo "404 - File tidak ditemukan: " . $uri;