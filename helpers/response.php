<?php
// ============================================================
// Helper Respons JSON, Autentikasi Sesi & Format Data
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    // Pengaturan cookie sesi yang aman
    session_set_cookie_params([
        'lifetime' => 7 * 24 * 60 * 60, // 7 hari
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

/**
 * Mengirim respons JSON dan menghentikan eksekusi script
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Memastikan pengguna sudah login, jika belum kirim respons 401
 */
function requireAuth() {
    if (empty($_SESSION['userId'])) {
        jsonResponse(['error' => 'Silakan masuk terlebih dahulu.'], 401);
    }
    return (int)$_SESSION['userId'];
}

/**
 * Mengambil data body JSON dari request (untuk POST/PUT dengan content-type JSON)
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Memformat objek profil user agar aman dikirim ke client (tanpa hash password)
 */
function profileShape($row) {
    if (!$row) return null;
    return [
        'id'          => (int)$row['id'],
        'name'        => $row['full_name'],
        'username'    => $row['username'],
        'displayName' => !empty($row['username']) ? $row['username'] : $row['full_name'],
        'npm'         => $row['npm'],
        'phone'       => $row['phone'],
        'avatarUrl'   => $row['avatar_url'],
    ];
}

/**
 * Mengambil data user yang sedang login dari database
 */
function getCurrentUser($pdo) {
    if (empty($_SESSION['userId'])) {
        return null;
    }
    $stmt = $pdo->prepare("SELECT id, npm, full_name, username, phone, avatar_url FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['userId']]);
    $user = $stmt->fetch();
    if (!$user) {
        unset($_SESSION['userId']);
        return null;
    }
    return profileShape($user);
}
