<?php
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/midtrans.php'; // Load Midtrans Config
$pdo = require __DIR__ . '/../config/database.php';

$userId = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getJsonInput();
$cartIds = $input['cartIds'] ?? [];
$listingId = $input['listingId'] ?? null;
$paymentMethod = $input['paymentMethod'] ?? 'midtrans'; // Default midtrans
$recipientName = $input['recipientName'] ?? '';
$phone = $input['phone'] ?? '';
$address = $input['fullAddress'] ?? '';
$notes = $input['notes'] ?? '';

// 1. Validasi Input Dasar
if (!$recipientName || !$phone || !$address) {
    jsonResponse(['error' => 'Data alamat penerima tidak lengkap.'], 400);
}

// 2. Ambil Data Barang (Cart atau Langsung)
$itemsToProcess = [];
$totalAmount = 0;

try {
    if (!empty($cartIds)) {
        $placeholders = str_repeat('?,', count($cartIds) - 1) . '?';
        $stmt = $pdo->prepare("SELECT c.id as cart_id, l.id as listing_id, l.price, l.status, l.seller_id, l.title FROM carts c JOIN listings l ON c.listing_id = l.id WHERE c.user_id = ? AND c.id IN ($placeholders)");
        $stmt->execute([$userId, ...$cartIds]);
        $itemsToProcess = $stmt->fetchAll();
    } elseif ($listingId) {
        $stmt = $pdo->prepare("SELECT id as listing_id, price, status, seller_id, title FROM listings WHERE id = ?");
        $stmt->execute([$listingId]);
        $item = $stmt->fetch();
        if ($item) $itemsToProcess = [$item];
    }

    if (empty($itemsToProcess)) throw new Exception("Barang tidak valid.");

    foreach ($itemsToProcess as $item) {
        if ($item['status'] !== 'active') throw new Exception("Barang '{$item['title']}' sudah tidak tersedia.");
        $totalAmount += (float)$item['price'];
    }
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 400);
}

// 3. Generate Order Number & Simpan ke DB (Status: Pending)
$orderNumber = 'RC-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 6));

$pdo->beginTransaction();
try {
    // Insert Order
    $stmtOrder = $pdo->prepare("INSERT INTO orders (order_number, buyer_id, subtotal, total_amount, status, payment_method, notes, created_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, NOW())");
    $stmtOrder->execute([$orderNumber, $userId, $totalAmount, $totalAmount, $paymentMethod, $notes]);
    $orderId = $pdo->lastInsertId();

    // Insert Items & Update Listing Status
    $stmtItem = $pdo->prepare("INSERT INTO order_items (order_id, listing_id, seller_id, price_at_purchase, quantity, item_status) VALUES (?, ?, ?, ?, 1, 'pending')");
    $stmtSold = $pdo->prepare("UPDATE listings SET status = 'sold', sold_at = NOW() WHERE id = ?");
    $stmtDelCart = $pdo->prepare("DELETE FROM carts WHERE id = ? AND user_id = ?");

    foreach ($itemsToProcess as $item) {
        $stmtItem->execute([$orderId, $item['listing_id'], $item['seller_id'], $item['price']]);
        $stmtSold->execute([$item['listing_id']]);
        if (!empty($cartIds) && isset($item['cart_id'])) {
            $stmtDelCart->execute([$item['cart_id'], $userId]);
        }
    }

    $pdo->commit();

    // 4. Request Payment Link ke Midtrans
    $params = [
        'transaction_details' => [
            'order_id' => $orderNumber,
            'gross_amount' => (int)$totalAmount, // Midtrans butuh integer (tanpa desimal)
        ],
        'customer_details' => [
            'first_name' => $recipientName,
            'phone' => $phone,
        ],
        'item_details' => array_map(function($item) {
            return [
                'id' => $item['listing_id'],
                'price' => (int)$item['price'],
                'quantity' => 1,
                'name' => substr($item['title'], 0, 50), // Max 50 char
            ];
        }, $itemsToProcess),
    ];

    // Panggil API Midtrans
    $snapToken = \Midtrans\Snap::getSnapToken($params);
    $paymentUrl = \Midtrans\Snap::getSnapUrl($params); // URL buat redirect user

    jsonResponse([
        'success' => true,
        'orderNumber' => $orderNumber,
        'snapToken' => $snapToken,
        'paymentUrl' => $paymentUrl,
        'totalAmount' => $totalAmount
    ], 201);

} catch (Exception $e) {
    $pdo->rollBack();
    jsonResponse(['error' => 'Gagal memproses pesanan: ' . $e->getMessage()], 500);
}