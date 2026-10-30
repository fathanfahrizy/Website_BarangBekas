<?php
// ============================================================
// Helper Upload Foto Barang & Avatar
// ============================================================

$uploadDir = __DIR__ . '/../uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

/**
 * Memproses upload foto tunggal (misal avatar profil)
 */
function handleSingleUpload($file) {
    if (!isset($file) || empty($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        jsonResponse(['error' => 'Ukuran foto maksimal 5 MB.'], 400);
    }

    $allowedMimes = [
        'image/jpeg' => '.jpg',
        'image/png'  => '.png',
        'image/webp' => '.webp'
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!array_key_exists($mime, $allowedMimes)) {
        jsonResponse(['error' => 'Foto harus berformat JPG, PNG, atau WebP.'], 400);
    }

    $ext = $allowedMimes[$mime];
    $filename = bin2hex(random_bytes(16)) . $ext;
    $targetPath = __DIR__ . '/../uploads/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        jsonResponse(['error' => 'Gagal menyimpan foto upload.'], 500);
    }

    return '/uploads/' . $filename;
}

/**
 * Memproses upload multi-foto barang (maksimal 4 foto, masing-masing maks 5MB)
 */
function handleMultipleUploads($filesKey = 'images') {
    if (empty($_FILES[$filesKey]['name'])) {
        return [];
    }

    $names = $_FILES[$filesKey]['name'];
    if (!is_array($names)) {
        $names = [$names];
    }

    if (count($names) > 4) {
        jsonResponse(['error' => 'Jumlah foto maksimal 4.'], 400);
    }

    $uploadedUrls = [];
    $allowedMimes = [
        'image/jpeg' => '.jpg',
        'image/png'  => '.png',
        'image/webp' => '.webp'
    ];

    for ($i = 0; $i < count($names); $i++) {
        $error = is_array($_FILES[$filesKey]['error']) ? $_FILES[$filesKey]['error'][$i] : $_FILES[$filesKey]['error'];
        if ($error === UPLOAD_ERR_NO_FILE) continue;
        if ($error !== UPLOAD_ERR_OK) {
            jsonResponse(['error' => 'Gagal mengupload salah satu foto.'], 400);
        }

        $size = is_array($_FILES[$filesKey]['size']) ? $_FILES[$filesKey]['size'][$i] : $_FILES[$filesKey]['size'];
        if ($size > 5 * 1024 * 1024) {
            jsonResponse(['error' => 'Ukuran foto maksimal 5 MB.'], 400);
        }

        $tmpName = is_array($_FILES[$filesKey]['tmp_name']) ? $_FILES[$filesKey]['tmp_name'][$i] : $_FILES[$filesKey]['tmp_name'];
        if (empty($tmpName)) continue;

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        if (!array_key_exists($mime, $allowedMimes)) {
            jsonResponse(['error' => 'Foto harus berformat JPG, PNG, atau WebP.'], 400);
        }

        $ext = $allowedMimes[$mime];
        $filename = bin2hex(random_bytes(16)) . $ext;
        $targetPath = __DIR__ . '/../uploads/' . $filename;

        if (move_uploaded_file($tmpName, $targetPath)) {
            $uploadedUrls[] = '/uploads/' . $filename;
        }
    }

    return $uploadedUrls;
}
