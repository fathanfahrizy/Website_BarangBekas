<?php
// ============================================================
// Front Controller / Router API PasarKampus Gunadarma
// ============================================================

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Hilangkan subfolder jika dijalankan di htdocs XAMPP (misal /marketplace_gunadarma/api/...)
$pos = strpos($path, '/api');
if ($pos !== false) {
    $apiPath = substr($path, $pos);
} else {
    $apiPath = $path;
}

// 1. Rute Autentikasi Mahasiswa
if ($apiPath === '/api/me') {
    $_GET['action'] = 'me';
    require __DIR__ . '/auth.php';
    exit;
}
if ($apiPath === '/api/register') {
    $_GET['action'] = 'register';
    require __DIR__ . '/auth.php';
    exit;
}
if ($apiPath === '/api/login') {
    $_GET['action'] = 'login';
    require __DIR__ . '/auth.php';
    exit;
}
if ($apiPath === '/api/logout') {
    $_GET['action'] = 'logout';
    require __DIR__ . '/auth.php';
    exit;
}
if ($apiPath === '/api/profile') {
    $_GET['action'] = 'profile';
    require __DIR__ . '/auth.php';
    exit;
}

// 2. Rute Kategori
if ($apiPath === '/api/categories') {
    require __DIR__ . '/categories.php';
    exit;
}

// 3. Rute Listing Barang
if ($apiPath === '/api/listings') {
    require __DIR__ . '/listings.php';
    exit;
}
if (preg_match('#^/api/listings/(\d+)/status$#', $apiPath, $matches)) {
    $_GET['id'] = (int)$matches[1];
    $_GET['action'] = 'status';
    require __DIR__ . '/listings.php';
    exit;
}
if (preg_match('#^/api/listings/(\d+)$#', $apiPath, $matches)) {
    $_GET['id'] = (int)$matches[1];
    require __DIR__ . '/listings.php';
    exit;
}

// 4. Rute Percakapan & Chat
if ($apiPath === '/api/conversations') {
    require __DIR__ . '/conversations.php';
    exit;
}
if (preg_match('#^/api/conversations/(\d+)/messages$#', $apiPath, $matches)) {
    $_GET['id'] = (int)$matches[1];
    $_GET['action'] = 'messages';
    require __DIR__ . '/conversations.php';
    exit;
}

// 5. Rute Cleanup
if ($apiPath === '/api/cleanup') {
    require __DIR__ . '/cleanup.php';
    exit;
}

// Rute tidak dikenal
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => 'API endpoint tidak ditemukan: ' . $apiPath]);
