<?php
// ============================================================
// API Iklan Barang Preloved (PHP + MySQL PDO)
// ============================================================

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/upload.php';
require_once __DIR__ . '/../config/constants.php';
$pdo = require __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? '';

$listingSelect = "
    SELECT l.id, l.seller_id, l.category_id, c.name AS category,
           l.title, l.description, l.price, l.item_condition, l.meetup_location,
           l.status, l.created_at, l.sold_at,
           COALESCE(u.username, u.full_name) AS seller_name,
           u.avatar_url AS seller_avatar,
           (SELECT li.url FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.position ASC LIMIT 1) AS image_url
    FROM listings l
    JOIN users u ON u.id = l.seller_id
    JOIN categories c ON c.id = l.category_id
";

// 1. Ambil Detail Barang Berdasarkan ID
if ($method === 'GET' && $id) {
    $userId = !empty($_SESSION['userId']) ? (int)$_SESSION['userId'] : 0;
    $stmt = $pdo->prepare("
        {$listingSelect}
        WHERE l.id = ? AND (l.status <> 'sold' OR l.sold_at > NOW() - INTERVAL 3 DAY OR l.seller_id = ?)
    ");
    $stmt->execute([$id, $userId]);
    $item = $stmt->fetch();

    if (!$item) {
        jsonResponse(['error' => 'Barang tidak ditemukan.'], 404);
    }

    $imgStmt = $pdo->prepare("SELECT id, url, position FROM listing_images WHERE listing_id = ? ORDER BY position ASC, id ASC");
    $imgStmt->execute([$id]);
    $imageObjects = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

    $item['image_objects'] = $imageObjects;
    $item['images'] = array_column($imageObjects, 'url');
    jsonResponse(['listing' => $item]);
}

// 2. Ambil Daftar Barang (Jelajahi / Filter / Pencarian / Barang Saya)
if ($method === 'GET' && !$id) {
    $params = [];
    $filters = [];

    if (!empty($_GET['mine']) && $_GET['mine'] === 'true') {
        $userId = requireAuth();
        $params[] = $userId;
        $filters[] = "l.seller_id = ?";
    } else {
        $filters[] = "(l.status = 'active' OR (l.status = 'sold' AND l.sold_at > NOW() - INTERVAL 3 DAY))";
    }

    if (!empty($_GET['category'])) {
        $catId = (int)$_GET['category'];
        if ($catId > 0) {
            $params[] = $catId;
            $filters[] = "l.category_id = ?";
        }
    }

    if (!empty($_GET['q'])) {
        $keyword = '%' . trim(mb_substr($_GET['q'], 0, 100)) . '%';
        $params[] = $keyword;
        $params[] = $keyword;
        $filters[] = "(l.title LIKE ? OR l.description LIKE ?)";
    }

    $whereClause = !empty($filters) ? 'WHERE ' . implode(' AND ', $filters) : '';
    $query = "{$listingSelect} {$whereClause} ORDER BY l.created_at DESC LIMIT 100";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $listings = $stmt->fetchAll();

    jsonResponse(['listings' => $listings]);
}

// 3. Pasang Iklan Barang Baru
if ($method === 'POST' && !$id) {
    $userId = requireAuth();

    $title          = trim((string)($_POST['title'] ?? ''));
    $description    = trim((string)($_POST['description'] ?? ''));
    $categoryId     = (int)($_POST['categoryId'] ?? 0);
    $price          = (float)($_POST['price'] ?? -1);
    $itemCondition  = trim((string)($_POST['itemCondition'] ?? ''));
    $meetupLocation = !empty($_POST['meetupLocation']) ? trim((string)$_POST['meetupLocation']) : null;

    if (mb_strlen($title) < 3 || mb_strlen($title) > 150) {
        jsonResponse(['error' => 'Judul harus berisi 3–150 karakter.'], 400);
    }
    if (mb_strlen($description) < 1 || mb_strlen($description) > 5000) {
        jsonResponse(['error' => 'Deskripsi wajib diisi (maksimal 5000 karakter).'], 400);
    }
    if ($price < 0 || $price > 999999999999) {
        jsonResponse(['error' => 'Harga tidak valid.'], 400);
    }
    if (!array_key_exists($itemCondition, CONDITION_LABELS)) {
        jsonResponse(['error' => 'Pilih kondisi barang yang tersedia.'], 400);
    }
    if ($meetupLocation && mb_strlen($meetupLocation) > 150) {
        jsonResponse(['error' => 'Lokasi meetup maksimal 150 karakter.'], 400);
    }

    $checkCat = $pdo->prepare("SELECT id FROM categories WHERE id = ?");
    $checkCat->execute([$categoryId]);
    if (!$checkCat->fetch()) {
        jsonResponse(['error' => 'Kategori tidak valid.'], 400);
    }

    // Upload foto (maksimal 4)
    $uploadedImages = handleMultipleUploads('images');

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO listings (seller_id, category_id, title, description, price, item_condition, meetup_location)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $categoryId, $title, $description, $price, $itemCondition, $meetupLocation]);
        $listingId = (int)$pdo->lastInsertId();

        if (!empty($uploadedImages)) {
            $imgStmt = $pdo->prepare("
                INSERT INTO listing_images (listing_id, url, position)
                VALUES (?, ?, ?)
            ");
            foreach ($uploadedImages as $pos => $url) {
                $imgStmt->execute([$listingId, $url, $pos]);
            }
        }

        $pdo->commit();
        jsonResponse(['id' => $listingId], 201);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['error' => 'Gagal memasang iklan barang.'], 500);
    }
}

// 4. Ubah Status Barang (active / sold / hidden)
if (($method === 'PATCH' || $method === 'POST') && $id && $action === 'status') {
    $userId = requireAuth();
    $input = array_merge($_POST, getJsonInput());
    $status = trim((string)($input['status'] ?? ''));

    if (!in_array($status, ['active', 'sold', 'hidden'])) {
        jsonResponse(['error' => 'Status barang tidak valid.'], 400);
    }

    $stmt = $pdo->prepare("
        UPDATE listings 
        SET status = ?, 
            sold_at = CASE WHEN ? = 'sold' THEN COALESCE(sold_at, NOW()) ELSE NULL END 
        WHERE id = ? AND seller_id = ?
    ");
    $stmt->execute([$status, $status, $id, $userId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Barang tidak ditemukan atau bukan milik Anda.'], 404);
    }

    $getListing = $pdo->prepare("SELECT id, status, sold_at FROM listings WHERE id = ?");
    $getListing->execute([$id]);
    jsonResponse(['listing' => $getListing->fetch()]);
}

// 5. Hapus Barang dari Etalase
if (($method === 'DELETE' && $id) || ($method === 'POST' && $id && $action === 'delete')) {
    $userId = requireAuth();
    $stmt = $pdo->prepare("SELECT id, seller_id FROM listings WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch();

    if (!$item || (int)$item['seller_id'] !== $userId) {
        jsonResponse(['error' => 'Barang tidak ditemukan atau bukan milik Anda.'], 404);
    }

    // Ambil foto untuk dihapus dari disk
    $imgStmt = $pdo->prepare("SELECT url FROM listing_images WHERE listing_id = ?");
    $imgStmt->execute([$id]);
    $images = $imgStmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($images as $url) {
        if (str_starts_with($url, '/uploads/')) {
            $filePath = __DIR__ . '/..' . $url;
            if (file_exists($filePath)) @unlink($filePath);
        }
    }

    $pdo->prepare("DELETE FROM listings WHERE id = ? AND seller_id = ?")->execute([$id, $userId]);
    jsonResponse(['success' => true, 'message' => 'Barang berhasil dihapus dari etalase.']);
}

// 6. Edit / Perbarui Barang (Judul, Harga, Deskripsi, Foto & Thumbnail)
if (($method === 'POST' || $method === 'PUT') && $id && ($action === '' || $action === 'edit')) {
    $userId = requireAuth();
    $stmt = $pdo->prepare("SELECT id, seller_id FROM listings WHERE id = ?");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();

    if (!$existing || (int)$existing['seller_id'] !== $userId) {
        jsonResponse(['error' => 'Barang tidak ditemukan atau bukan milik Anda.'], 404);
    }

    $title          = trim((string)($_POST['title'] ?? ''));
    $description    = trim((string)($_POST['description'] ?? ''));
    $categoryId     = (int)($_POST['categoryId'] ?? 0);
    $price          = (float)($_POST['price'] ?? -1);
    $itemCondition  = trim((string)($_POST['itemCondition'] ?? ''));
    $meetupLocation = !empty($_POST['meetupLocation']) ? trim((string)$_POST['meetupLocation']) : null;
    $thumbnailId    = !empty($_POST['thumbnailId']) ? (int)$_POST['thumbnailId'] : null;

    $deleteImageIds = $_POST['deleteImageIds'] ?? [];
    if (!is_array($deleteImageIds)) {
        $deleteImageIds = array_filter(explode(',', (string)$deleteImageIds));
    }
    $deleteImageIds = array_map('intval', $deleteImageIds);

    if (mb_strlen($title) < 3 || mb_strlen($title) > 150) {
        jsonResponse(['error' => 'Judul harus berisi 3–150 karakter.'], 400);
    }
    if (mb_strlen($description) < 1 || mb_strlen($description) > 5000) {
        jsonResponse(['error' => 'Deskripsi wajib diisi (maksimal 5000 karakter).'], 400);
    }
    if ($price < 0 || $price > 999999999999) {
        jsonResponse(['error' => 'Harga tidak valid.'], 400);
    }
    if (!array_key_exists($itemCondition, CONDITION_LABELS)) {
        jsonResponse(['error' => 'Pilih kondisi barang yang tersedia.'], 400);
    }
    if ($meetupLocation && mb_strlen($meetupLocation) > 150) {
        jsonResponse(['error' => 'Lokasi meetup maksimal 150 karakter.'], 400);
    }

    $checkCat = $pdo->prepare("SELECT id FROM categories WHERE id = ?");
    $checkCat->execute([$categoryId]);
    if (!$checkCat->fetch()) {
        jsonResponse(['error' => 'Kategori tidak valid.'], 400);
    }

    // Ambil foto saat ini
    $curImgs = $pdo->prepare("SELECT id, url, position FROM listing_images WHERE listing_id = ? ORDER BY position ASC, id ASC");
    $curImgs->execute([$id]);
    $currentImages = $curImgs->fetchAll(PDO::FETCH_ASSOC);

    // Upload foto baru jika ada
    $newImages = handleMultipleUploads('images');

    $remainingImagesCount = count($currentImages) - count($deleteImageIds);
    if ($remainingImagesCount + count($newImages) > 4) {
        jsonResponse(['error' => 'Total foto barang tidak boleh melebihi 4.'], 400);
    }

    try {
        $pdo->beginTransaction();

        // 1. Update data pokok barang
        $upd = $pdo->prepare("
            UPDATE listings 
            SET title = ?, description = ?, category_id = ?, price = ?, item_condition = ?, meetup_location = ?
            WHERE id = ? AND seller_id = ?
        ");
        $upd->execute([$title, $description, $categoryId, $price, $itemCondition, $meetupLocation, $id, $userId]);

        // 2. Hapus foto yang ditandai hapus
        if (!empty($deleteImageIds)) {
            $inClause = implode(',', array_fill(0, count($deleteImageIds), '?'));
            $selDel = $pdo->prepare("SELECT url FROM listing_images WHERE listing_id = ? AND id IN ($inClause)");
            $selDel->execute(array_merge([$id], $deleteImageIds));
            $urlsToUnlink = $selDel->fetchAll(PDO::FETCH_COLUMN);
            foreach ($urlsToUnlink as $u) {
                if (str_starts_with($u, '/uploads/')) {
                    $fPath = __DIR__ . '/..' . $u;
                    if (file_exists($fPath)) @unlink($fPath);
                }
            }

            $delImgs = $pdo->prepare("DELETE FROM listing_images WHERE listing_id = ? AND id IN ($inClause)");
            $delImgs->execute(array_merge([$id], $deleteImageIds));
        }

        // 3. Masukkan foto baru
        if (!empty($newImages)) {
            $posStmt = $pdo->prepare("SELECT COALESCE(MAX(position), -1) FROM listing_images WHERE listing_id = ?");
            $posStmt->execute([$id]);
            $maxPos = (int)$posStmt->fetchColumn();

            $insImg = $pdo->prepare("INSERT INTO listing_images (listing_id, url, position) VALUES (?, ?, ?)");
            foreach ($newImages as $idx => $url) {
                $insImg->execute([$id, $url, $maxPos + 1 + $idx]);
            }
        }

        // 4. Update thumbnail jika dipilih
        if ($thumbnailId && !in_array($thumbnailId, $deleteImageIds)) {
            $pdo->prepare("UPDATE listing_images SET position = 999 WHERE listing_id = ?")->execute([$id]);
            $pdo->prepare("UPDATE listing_images SET position = 0 WHERE listing_id = ? AND id = ?")->execute([$id, $thumbnailId]);
        }

        // Rapikan urutan position (0, 1, 2, ...)
        $allImgs = $pdo->prepare("SELECT id FROM listing_images WHERE listing_id = ? ORDER BY (position = 0) DESC, position ASC, id ASC");
        $allImgs->execute([$id]);
        $allIds = $allImgs->fetchAll(PDO::FETCH_COLUMN);
        $updPos = $pdo->prepare("UPDATE listing_images SET position = ? WHERE id = ?");
        foreach ($allIds as $idx => $imgId) {
            $updPos->execute([$idx, $imgId]);
        }

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => 'Barang etalase berhasil diperbarui!']);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['error' => 'Gagal memperbarui barang: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['error' => 'Endpoint listing tidak valid.'], 404);
