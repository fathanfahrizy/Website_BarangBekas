<?php
// ============================================================
// API Autentikasi Mahasiswa Gunadarma (PHP + MySQL PDO)
// ============================================================

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/validator.php';
require_once __DIR__ . '/../helpers/upload.php';
$pdo = require __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// 1. Ambil Data Sesi Pengguna yang Sedang Login
if ($action === 'me' && $method === 'GET') {
    jsonResponse(['user' => getCurrentUser($pdo)]);
}

// 2. Registrasi Akun Mahasiswa Baru
if ($action === 'register' && $method === 'POST') {
    $input = array_merge($_POST, getJsonInput());

    $npm           = trim((string)($input['npm'] ?? ''));
    $fullName      = trim((string)($input['fullName'] ?? ''));
    $phone         = preg_replace('/[\s-]/', '', (string)($input['phone'] ?? ''));
    $password      = (string)($input['password'] ?? '');
    $usernameInput = trim((string)($input['username'] ?? ''));
    $username      = !empty($usernameInput) ? preg_replace('/\s+/', ' ', $usernameInput) : null;

    // Validasi aturan NPM Gunadarma
    $npmError = validateNpm($npm);
    if ($npmError) {
        jsonResponse(['error' => $npmError], 400);
    }

    if (mb_strlen($fullName) < 2 || mb_strlen($fullName) > 100) {
        jsonResponse(['error' => 'Nama harus berisi 2–100 karakter.'], 400);
    }

    if ($username && (mb_strlen($username) < 3 || mb_strlen($username) > 30 || !preg_match('/^[\p{L}\p{N} _.-]{3,30}$/u', $username))) {
        jsonResponse(['error' => 'Username harus 3–30 karakter (huruf, angka, spasi, titik, strip, atau garis bawah).'], 400);
    }

    if (!preg_match('/^08\d{8,11}$/', $phone)) {
        jsonResponse(['error' => 'Nomor telepon harus berupa nomor Indonesia, misalnya 081234567890.'], 400);
    }

    if (strlen($password) < 8 || strlen($password) > 72) {
        jsonResponse(['error' => 'Kata sandi harus berisi 8–72 karakter.'], 400);
    }

    // Pastikan kode program studi terdaftar di database
    $prefix = substr($npm, 0, 3);
    $checkProg = $pdo->prepare("SELECT prefix FROM study_programs WHERE prefix = ?");
    $checkProg->execute([$prefix]);
    if (!$checkProg->fetch()) {
        jsonResponse(['error' => 'Kode program pada NPM tidak terdaftar di Gunadarma.'], 400);
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO users (npm, full_name, username, phone, password_hash)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$npm, $fullName, $username, $phone, $passwordHash]);
        $newUserId = (int)$pdo->lastInsertId();

        // Buat sesi login
        session_regenerate_id(true);
        $_SESSION['userId'] = $newUserId;

        $getUser = $pdo->prepare("SELECT id, npm, full_name, username, phone, avatar_url FROM users WHERE id = ?");
        $getUser->execute([$newUserId]);
        $userRow = $getUser->fetch();

        jsonResponse(['user' => profileShape($userRow)], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
            jsonResponse(['error' => 'NPM, username, atau nomor telepon sudah digunakan.'], 409);
        }
        jsonResponse(['error' => 'Gagal mendaftarkan akun. Silakan coba lagi.'], 500);
    }
}

// 3. Login Mahasiswa (NPM + Password)
if ($action === 'login' && $method === 'POST') {
    $input = array_merge($_POST, getJsonInput());

    $npm      = trim((string)($input['npm'] ?? ''));
    $password = (string)($input['password'] ?? '');

    $npmError = validateNpm($npm);
    if ($npmError) {
        jsonResponse(['error' => $npmError], 400);
    }

    $stmt = $pdo->prepare("
        SELECT id, npm, full_name, username, phone, avatar_url, password_hash 
        FROM users 
        WHERE npm = ?
    ");
    $stmt->execute([$npm]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'NPM atau kata sandi salah.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['userId'] = (int)$user['id'];

    jsonResponse(['user' => profileShape($user)]);
}

// 4. Logout Mahasiswa
if ($action === 'logout' && $method === 'POST') {
    requireAuth();
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    jsonResponse(['ok' => true]);
}

// 5. Update Profil Mahasiswa
if ($action === 'profile' && ($method === 'PUT' || $method === 'POST')) {
    $userId = requireAuth();
    $input  = array_merge($_POST, getJsonInput());

    $fullName      = trim((string)($input['fullName'] ?? ''));
    $usernameInput = trim((string)($input['username'] ?? ''));
    $username      = !empty($usernameInput) ? preg_replace('/\s+/', ' ', $usernameInput) : null;
    $phone         = preg_replace('/[\s-]/', '', (string)($input['phone'] ?? ''));

    if (mb_strlen($fullName) < 2 || mb_strlen($fullName) > 100) {
        jsonResponse(['error' => 'Nama harus berisi 2–100 karakter.'], 400);
    }

    if ($username && (mb_strlen($username) < 3 || mb_strlen($username) > 30 || !preg_match('/^[\p{L}\p{N} _.-]{3,30}$/u', $username))) {
        jsonResponse(['error' => 'Username harus 3–30 karakter (huruf, angka, spasi, titik, strip, atau garis bawah).'], 400);
    }

    if (!preg_match('/^08\d{8,11}$/', $phone)) {
        jsonResponse(['error' => 'Nomor telepon harus berupa nomor Indonesia, misalnya 081234567890.'], 400);
    }

    $newAvatarUrl = !empty($_FILES['avatar']) ? handleSingleUpload($_FILES['avatar']) : null;

    try {
        if ($newAvatarUrl) {
            $stmt = $pdo->prepare("
                UPDATE users 
                SET full_name = ?, username = ?, phone = ?, avatar_url = ? 
                WHERE id = ?
            ");
            $stmt->execute([$fullName, $username, $phone, $newAvatarUrl, $userId]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE users 
                SET full_name = ?, username = ?, phone = ? 
                WHERE id = ?
            ");
            $stmt->execute([$fullName, $username, $phone, $userId]);
        }

        $getUser = $pdo->prepare("SELECT id, npm, full_name, username, phone, avatar_url FROM users WHERE id = ?");
        $getUser->execute([$userId]);
        jsonResponse(['user' => profileShape($getUser->fetch())]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
            jsonResponse(['error' => 'Username atau nomor telepon sudah digunakan.'], 409);
        }
        jsonResponse(['error' => 'Gagal memperbarui profil.'], 500);
    }
}

jsonResponse(['error' => 'Aksi auth tidak ditemukan.'], 404);
