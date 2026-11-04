<?php
require_once __DIR__ . '/../vendor/autoload.php';

// Ambil konfigurasi dari file secrets.php
$secrets = require __DIR__ . '/../config/secrets.php';

\Midtrans\Config::$serverKey = $secrets['midtrans_server_key'];
\Midtrans\Config::$isProduction = false;
\Midtrans\Config::$isSanitized = true;
\Midtrans\Config::$is3ds = true;