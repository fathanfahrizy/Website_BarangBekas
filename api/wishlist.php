<?php
// ============================================================
// API Wishlist PasarKampus Gunadarma
// ============================================================
require_once __DIR__ . '/../helpers/response.php';
$pdo = require __DIR__ . '/../config/database.php';

// Pastikan user sudah login
$userId = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

// 1. AMBIL DAFTAR WISHLIST USER (GET)
if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT 
            w.id AS wishlist_id, 
            w.created_at AS added_at,
            l.id, 
            l.title, 
            l.price, 
            l.description, 
            l.item_condition, 
            l.status AS listing_status,
            l.meetup_location,
            u.username, 
            u.full_name AS seller_name,
            -- Ambil gambar pertama dari listing (sesuaikan dengan struktur DB lu)
            (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY position ASC LIMIT 1) AS image_url,
            -- Atau kalau lu simpan di kolom image_url langsung, pake ini:
            -- l.image_url
            c.name AS category_name
        FROM wishlists w
        JOIN listings l ON w.listing_id = l.id
        JOIN users u ON l.seller_id = u.id
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
    ");
    $stmt->execute([$userId]);
    jsonResponse(['wishlists' => $stmt->fetchAll()]);
}

// 2. TAMBAH KE WISHLIST (POST)
if ($method === 'POST') {
    $input = getJsonInput();
    $listingId = (int)($input['listingId'] ?? 0);

    if (!$listingId) {
        jsonResponse(['error' => 'ID Barang tidak valid.'], 400);
    }

    // Cek apakah barang ada dan masih aktif
    $checkListing = $pdo->prepare("SELECT id, seller_id, status FROM listings WHERE id = ?");
    $checkListing->execute([$listingId]);
    $listing = $checkListing->fetch();

    if (!$listing) {
        jsonResponse(['error' => 'Barang tidak ditemukan.'], 404);
    }

    if ((int)$listing['seller_id'] === $userId) {
        jsonResponse(['error' => 'Tidak bisa menambahkan barang sendiri ke wishlist.'], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO wishlists (user_id, listing_id) VALUES (?, ?)");
        $stmt->execute([$userId, $listingId]);
        jsonResponse([
            'success' => true, 
            'message' => 'Berhasil ditambahkan ke wishlist',
            'listingId' => $listingId
        ], 201);
    } catch (PDOException $e) {
        // Error code 23000 = Duplicate entry (sudah ada di wishlist)
        if ($e->getCode() == 23000) {
            jsonResponse(['error' => 'Barang sudah ada di wishlist.'], 409);
        }
        jsonResponse(['error' => 'Gagal menambahkan ke wishlist: ' . $e->getMessage()], 500);
    }
}

// 3. HAPUS DARI WISHLIST (DELETE)
if ($method === 'DELETE') {
    $input = getJsonInput();
    $listingId = (int)($input['listingId'] ?? 0);

    if (!$listingId) {
        jsonResponse(['error' => 'ID Barang tidak valid.'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM wishlists WHERE user_id = ? AND listing_id = ?");
    $stmt->execute([$userId, $listingId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Item tidak ditemukan di wishlist.'], 404);
    }

    jsonResponse(['success' => true, 'message' => 'Berhasil dihapus dari wishlist']);
}

// 4. CEK STATUS WISHLIST (GET dengan query param ?check=LISTING_ID)
// Endpoint ini buat ngecek apakah barang tertentu udah di-wishlist atau belum
if ($method === 'GET' && isset($_GET['check'])) {
    $listingId = (int)$_GET['check'];
    
    $stmt = $pdo->prepare("SELECT id FROM wishlists WHERE user_id = ? AND listing_id = ?");
    $stmt->execute([$userId, $listingId]);
    
    jsonResponse(['isWishlisted' => (bool)$stmt->fetch()]);
}

// Route tidak dikenal
jsonResponse(['error' => 'Endpoint wishlist tidak valid.'], 404);