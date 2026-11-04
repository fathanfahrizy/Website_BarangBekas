<?php
// ============================================================
// API Keranjang Belanja (PHP + MySQL PDO)
//   POST   /api/cart/add    -> tambah barang ke keranjang
//   GET    /api/cart        -> list keranjang user login
//   DELETE /api/cart/remove -> hapus 1 barang (cartId / listingId)
//   DELETE /api/cart/clear  -> kosongkan keranjang
// ============================================================
require_once __DIR__ . '/../helpers/response.php';
$pdo = require __DIR__ . '/../config/database.php';

// SEMUA endpoint keranjang wajib login
$userId = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ------------------------------------------------------------
// 1. POST /api/cart/add
// ------------------------------------------------------------
if ($action === 'add' && $method === 'POST') {
    $input     = array_merge($_POST, getJsonInput());
    $listingId = (int)($input['listingId'] ?? 0);

    if ($listingId <= 0) {
        jsonResponse(['error' => 'ID barang tidak valid.'], 400);
    }

    // Validasi stok & keberadaan barang
    $stmt = $pdo->prepare("SELECT id, seller_id, status FROM listings WHERE id = ?");
    $stmt->execute([$listingId]);
    $listing = $stmt->fetch();

    if (!$listing) {
        jsonResponse(['error' => 'Barang tidak ditemukan.'], 404);
    }
    if ($listing['status'] !== 'active') {
        jsonResponse(['error' => 'Barang sudah terjual / tidak tersedia.'], 409);
    }
    if ((int)$listing['seller_id'] === $userId) {
        jsonResponse(['error' => 'Tidak bisa memasukkan barang jualan sendiri ke keranjang.'], 400);
    }

    // Cek duplikat: barang preloved itu unik, qty selalu 1
    $check = $pdo->prepare("SELECT id FROM carts WHERE user_id = ? AND listing_id = ?");
    $check->execute([$userId, $listingId]);
    if ($check->fetch()) {
        jsonResponse(['error' => 'Barang sudah ada di keranjang Anda.'], 409);
    }

    try {
        $insert = $pdo->prepare("INSERT INTO carts (user_id, listing_id, quantity) VALUES (?, ?, 1)");
        $insert->execute([$userId, $listingId]);
        jsonResponse([
            'success' => true,
            'message' => 'Barang berhasil masuk keranjang.',
            'cartId'  => (int)$pdo->lastInsertId(),
        ], 201);
    } catch (PDOException $e) {
        // Jaga race condition lewat UNIQUE KEY (user_id, listing_id)
        if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
            jsonResponse(['error' => 'Barang sudah ada di keranjang Anda.'], 409);
        }
        jsonResponse(['error' => 'Gagal menambahkan ke keranjang.'], 500);
    }
}

// ------------------------------------------------------------
// 2. GET /api/cart
// ------------------------------------------------------------
if ($method === 'GET' && $action === '') {
    $stmt = $pdo->prepare("
        SELECT
            c.id AS cart_id,
            c.listing_id,
            c.quantity,
            c.created_at,
            l.title,
            l.price,
            l.status AS listing_status,
            l.item_condition,
            l.meetup_location,
            COALESCE(u.username, u.full_name) AS seller_name,
            u.avatar_url AS seller_avatar,
            (SELECT li.url FROM listing_images li
             WHERE li.listing_id = l.id ORDER BY li.position ASC LIMIT 1) AS image_url
        FROM carts c
        JOIN listings l ON l.id = c.listing_id
        JOIN users u ON u.id = l.seller_id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    ");
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();

    $subtotal = 0.0;
    foreach ($items as &$item) {
        // Tandai barang yang udah terjual/hidden biar frontend bisa disable
        $item['is_available'] = ($item['listing_status'] === 'active');
        if ($item['is_available']) {
            $subtotal += (float)$item['price'] * (int)$item['quantity'];
        }
    }
    unset($item);

    jsonResponse([
        'cart'     => $items,
        'count'    => count($items),
        'subtotal' => $subtotal,
    ]);
}

// ------------------------------------------------------------
// 3. DELETE /api/cart/remove (fallback: POST)
// ------------------------------------------------------------
if ($action === 'remove' && ($method === 'DELETE' || $method === 'POST')) {
    $input     = getJsonInput();
    $cartId    = (int)($input['cartId']    ?? $_GET['cartId']    ?? 0);
    $listingId = (int)($input['listingId'] ?? $_GET['listingId'] ?? 0);

    if ($cartId <= 0 && $listingId <= 0) {
        jsonResponse(['error' => 'cartId atau listingId wajib diisi.'], 400);
    }

    // user_id WAJIB ikut -> user cuma bisa hapus isi keranjangnya sendiri
    $sql    = "DELETE FROM carts WHERE user_id = ?";
    $params = [$userId];
    if ($cartId > 0) {
        $sql .= " AND id = ?";
        $params[] = $cartId;
    } else {
        $sql .= " AND listing_id = ?";
        $params[] = $listingId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Barang tidak ditemukan di keranjang Anda.'], 404);
    }
    jsonResponse(['success' => true, 'message' => 'Barang dihapus dari keranjang.']);
}

// ------------------------------------------------------------
// 4. DELETE /api/cart/clear (fallback: POST)
// ------------------------------------------------------------
if ($action === 'clear' && ($method === 'DELETE' || $method === 'POST')) {
    $stmt = $pdo->prepare("DELETE FROM carts WHERE user_id = ?");
    $stmt->execute([$userId]);
    jsonResponse([
        'success' => true,
        'message' => 'Keranjang berhasil dikosongkan.',
        'deleted' => $stmt->rowCount(),
    ]);
}

jsonResponse(['error' => 'Endpoint keranjang tidak valid.'], 404);