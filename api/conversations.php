<?php
// ============================================================
// API Percakapan & Chat Antar Mahasiswa (PHP + MySQL PDO)
// ============================================================

require_once __DIR__ . '/../helpers/response.php';
$pdo = require __DIR__ . '/../config/database.php';

$userId = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? '';

// Helper cek peserta percakapan
function isConversationParticipant($pdo, $convId, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)");
    $stmt->execute([$convId, $userId, $userId]);
    return (bool)$stmt->fetch();
}

// 1. Ambil Daftar Percakapan Mahasiswa
if ($method === 'GET' && !$id) {
    $stmt = $pdo->prepare("
        SELECT co.id, co.listing_id, l.title AS listing_title, l.status AS listing_status,
               CASE WHEN co.buyer_id = ? THEN COALESCE(s.username, s.full_name)
                    ELSE COALESCE(b.username, b.full_name) END AS other_name,
               (SELECT body FROM messages m WHERE m.conversation_id = co.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
               (SELECT created_at FROM messages m WHERE m.conversation_id = co.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
        FROM conversations co
        JOIN listings l ON l.id = co.listing_id
        JOIN users b ON b.id = co.buyer_id
        JOIN users s ON s.id = co.seller_id
        WHERE co.buyer_id = ? OR co.seller_id = ?
        ORDER BY COALESCE(
            (SELECT created_at FROM messages m WHERE m.conversation_id = co.id ORDER BY m.created_at DESC LIMIT 1),
            co.created_at
        ) DESC
    ");
    $stmt->execute([$userId, $userId, $userId]);
    jsonResponse(['conversations' => $stmt->fetchAll()]);
}

// 2. Ambil Pesan-Pesan di Percakapan Tertentu
if ($method === 'GET' && $id && $action === 'messages') {
    if (!isConversationParticipant($pdo, $id, $userId)) {
        jsonResponse(['error' => 'Percakapan tidak ditemukan.'], 404);
    }

    $stmt = $pdo->prepare("
        SELECT m.id, m.body, m.created_at, m.sender_id,
               COALESCE(u.username, u.full_name) AS sender_name
        FROM messages m 
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ? 
        ORDER BY m.created_at ASC 
        LIMIT 500
    ");
    $stmt->execute([$id]);
    jsonResponse(['messages' => $stmt->fetchAll()]);
}

// 3. Mulai Percakapan Baru untuk Barang Tertentu
if ($method === 'POST' && !$id) {
    $input = array_merge($_POST, getJsonInput());
    $listingId = (int)($input['listingId'] ?? 0);

    $stmt = $pdo->prepare("SELECT id, seller_id, status FROM listings WHERE id = ?");
    $stmt->execute([$listingId]);
    $listing = $stmt->fetch();

    if (!$listing || $listing['status'] !== 'active') {
        jsonResponse(['error' => 'Barang sudah tidak tersedia.'], 404);
    }

    if ((int)$listing['seller_id'] === $userId) {
        jsonResponse(['error' => 'Anda tidak dapat memulai chat dengan diri sendiri.'], 400);
    }

    // Cari atau buat percakapan
    $findConv = $pdo->prepare("
        SELECT id FROM conversations 
        WHERE listing_id = ? AND buyer_id = ? AND seller_id = ?
    ");
    $findConv->execute([$listingId, $userId, $listing['seller_id']]);
    $existing = $findConv->fetch();

    if ($existing) {
        jsonResponse(['conversationId' => (int)$existing['id']], 201);
    }

    $insert = $pdo->prepare("
        INSERT INTO conversations (listing_id, buyer_id, seller_id)
        VALUES (?, ?, ?)
    ");
    $insert->execute([$listingId, $userId, $listing['seller_id']]);
    jsonResponse(['conversationId' => (int)$pdo->lastInsertId()], 201);
}

// 4. Kirim Pesan Chat Baru
if ($method === 'POST' && $id && $action === 'messages') {
    $input = array_merge($_POST, getJsonInput());
    $body = trim((string)($input['body'] ?? ''));

    if (mb_strlen($body) < 1 || mb_strlen($body) > 2000) {
        jsonResponse(['error' => 'Pesan harus berisi 1–2000 karakter.'], 400);
    }

    if (!isConversationParticipant($pdo, $id, $userId)) {
        jsonResponse(['error' => 'Percakapan tidak ditemukan.'], 404);
    }

    $stmt = $pdo->prepare("
        INSERT INTO messages (conversation_id, sender_id, body)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$id, $userId, $body]);
    $msgId = (int)$pdo->lastInsertId();

    $getMsg = $pdo->prepare("
        SELECT id, body, created_at, sender_id 
        FROM messages 
        WHERE id = ?
    ");
    $getMsg->execute([$msgId]);
    jsonResponse(['message' => $getMsg->fetch()], 201);
}

jsonResponse(['error' => 'Endpoint chat tidak valid.'], 404);
