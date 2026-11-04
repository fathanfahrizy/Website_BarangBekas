<?php
// api/midtrans-notification.php
require_once __DIR__ . '/helpers/midtrans.php';
$pdo = require __DIR__ . '/../config/database.php';

// Ambil raw data dari Midtrans
$payload = file_get_contents('php://input');
$notification = json_decode($payload);

if (!$notification) {
    http_response_code(400);
    exit('Invalid payload');
}

$orderNumber = $notification->order_id;
$transactionStatus = $notification->transaction_status;
$fraudStatus = $notification->fraud_status ?? null;

try {
    // Cari order di database
    $stmt = $pdo->prepare("SELECT id FROM orders WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch();

    if (!$order) {
        http_response_code(404);
        exit('Order not found');
    }

    $orderId = $order['id'];
    $newStatus = 'pending';

    // Logic Status Midtrans
    if ($transactionStatus == 'capture') {
        $newStatus = ($fraudStatus == 'accept') ? 'paid' : 'pending';
    } else if ($transactionStatus == 'settlement') {
        $newStatus = 'paid'; // Ini yang kejadian kalau VA/Bank Transfer berhasil
    } else if ($transactionStatus == 'cancel' || $transactionStatus == 'deny' || $transactionStatus == 'expire') {
        $newStatus = 'cancelled';
    } else if ($transactionStatus == 'refund') {
        $newStatus = 'refunded';
    }

    // Update DB
    $stmtUpdate = $pdo->prepare("UPDATE orders SET status = ?, paid_at = NOW() WHERE id = ? AND status = 'pending'");
    $stmtUpdate->execute([$newStatus, $orderId]);

    // Update Payment Table (Opsional tapi bagus buat record)
    $stmtPay = $pdo->prepare("INSERT INTO payments (order_id, transaction_id, payment_type, gross_amount, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?");
    $stmtPay->execute([
        $orderId, 
        $notification->transaction_id ?? null, 
        $notification->payment_type ?? null, 
        $notification->gross_amount ?? 0, 
        $newStatus,
        $newStatus
    ]);

    http_response_code(200);
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}