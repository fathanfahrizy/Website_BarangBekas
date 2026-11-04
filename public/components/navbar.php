<?php
// Ambil data user & cart count untuk navbar
if (session_status() === PHP_SESSION_NONE) session_start();
$userId = $_SESSION['userId'] ?? null;
$userName = $_SESSION['userName'] ?? 'User';
$userInitial = strtoupper(substr($userName, 0, 1));

// Fetch cart count (kalau user login)
$cartCount = 0;
if ($userId) {
    try {
        $pdo = require __DIR__ . '/../../config/database.php';
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cartCount = $stmt->fetch()['count'];
    } catch (Exception $e) {
        $cartCount = 0;
    }
}
?>

<!-- 1. TOP UTILITY BAR -->
<div class="top-bar">
  <div class="container top-bar-inner">
    <div class="top-bar-left">
      <span class="badge-campus">Portal Resmi Jual Beli Mahasiswa Gunadarma</span>
      <span class="divider">|</span>
      <span class="location-picker">📍 Wilayah COD: <strong>Kampus D, E, J, H</strong></span>
    </div>
    <div class="top-bar-right">
      <span>🛡️ 100% Bebas Biaya Admin</span>
      <span class="divider">|</span>
      <a href="#buyer-protection" class="link-hover">Panduan COD Aman</a>
      <span class="divider">|</span>
      <span class="signed-in-only hidden top-npm" id="top-npm-badge">NPM: <strong id="top-user-npm">-</strong></span>
    </div>
  </div>
</div>

<!-- 2. MAIN HEADER -->
<header class="navbar-main">
  <div class="container navbar-inner">
    <a class="brand" href="/" aria-label="PasarKampus Gunadarma">
      <div class="brand-icon">UG</div>
      <div class="brand-text">
        <span class="brand-name">pasar<strong>kampus</strong></span>
      </div>
    </a>

    <div class="search-wrapper">
      <div class="search-box">
        <input id="search-input" class="search-input" type="search" placeholder="Cari buku, jas lab, kalkulator, kipas kos..." aria-label="Cari barang">
        <button class="search-btn" id="search-button" aria-label="Cari">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
      <div class="search-keywords" id="trending-keywords">
        <span>Populer:</span>
        <button class="keyword-tag" data-query="buku">Buku</button>
        <button class="keyword-tag" data-query="kalkulator">Kalkulator</button>
        <button class="keyword-tag" data-query="jas lab">Jas Lab</button>
        <button class="keyword-tag" data-query="kipas">Kipas</button>
      </div>
    </div>

    <div class="user-actions">
      <button class="action-icon signed-in-only hidden" id="messages-nav" title="Pesan" style="position: relative; padding: 8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span id="message-dot" class="hidden" style="position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; border: 2px solid #fff;"></span>
      </button>
      <button class="action-icon signed-in-only hidden" id="etalase-nav" title="Etalase Saya" style="position: relative; padding: 8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span id="etalase-dot" class="hidden" style="position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background-color: #f59e0b; border-radius: 50%; border: 2px solid #fff;"></span>
      </button>
      <!-- Ikon Keranjang -->
<button class="action-icon" id="cart-nav" title="Keranjang" style="position: relative; padding: 8px;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
  <span id="cart-count" class="counter <?= $cartCount > 0 ? '' : 'hidden' ?>" style="position:absolute; top:2px; right:0; min-width:16px; height:16px; font-size:10px; background:#ef4444; color:#fff; border-radius:50%; text-align:center; line-height:16px; font-weight:700;"><?= $cartCount ?></span>
</button>
      <button class="action-icon signed-in-only hidden" id="account-button" title="Profil" style="display: flex; align-items: center; gap: 8px;">
  <!-- Avatar Bulat dengan Initial Nama -->
  <div style="width: 32px; height: 32px; background: var(--color-primary, #4361ee); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">
    <?= $userInitial ?>
  </div>
</button>
      
      <button class="btn signed-out-only" id="login-button">LOGIN</button>
      <button class="btn btn-sell" id="sell-button">JUAL BARANG</button>
    </div>
  </div>
</header>

<!-- DROPDOWN FILTER HEADER (muncul di bawah tombol filter header) -->
<div id="header-filter-dropdown" class="hidden" style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; min-width: 320px; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  <div style="display: grid; gap: 12px;">
    <div class="form-group" style="margin:0;">
      <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">Kategori</label>
      <select id="header-category-filter" class="form-input" style="height: 36px; width: 100%;">
        <option value="">Semua Kategori</option>
      </select>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div class="form-group" style="margin:0;">
        <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">Harga Min</label>
        <input type="number" id="header-min-price" class="form-input" placeholder="0" style="height: 36px;">
      </div>
      <div class="form-group" style="margin:0;">
        <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">Harga Max</label>
        <input type="number" id="header-max-price" class="form-input" placeholder="Max" style="height: 36px;">
      </div>
    </div>
    <div class="form-group" style="margin:0;">
      <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">Kondisi</label>
      <select id="header-condition" class="form-input" style="height: 36px; width: 100%;">
        <option value="">Semua Kondisi</option>
        <option value="like_new">Seperti Baru</option>
        <option value="good">Bagus</option>
        <option value="fair">Layak</option>
        <option value="needs_repair">Perlu Perbaikan</option>
      </select>
    </div>
    <div class="form-group" style="margin:0;">
      <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">Lokasi COD</label>
      <select id="header-location" class="form-input" style="height: 36px; width: 100%;">
        <option value="">Semua Kampus</option>
        <option value="Kampus D">Kampus D (Margonda)</option>
        <option value="Kampus E">Kampus E (Kelapa Dua)</option>
        <option value="Kampus G">Kampus G (Lab)</option>
        <option value="Kampus H">Kampus H (Simatupang)</option>
        <option value="Kampus J">Kampus J (Kalimalang)</option>
      </select>
    </div>
    <div class="form-group" style="margin:0;">
      <label style="font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;">Urutkan</label>
      <select id="header-sort" class="form-input" style="height: 36px; width: 100%;">
        <option value="newest">Terbaru</option>
        <option value="price_asc">Harga Terendah</option>
        <option value="price_desc">Harga Tertinggi</option>
      </select>
    </div>
    <div style="display: flex; gap: 8px; margin-top: 8px;">
      <button id="header-apply-filters" class="btn btn-primary" style="flex: 1; height: 36px; font-weight: 600;">Terapkan</button>
      <button id="header-reset-filters" class="btn btn-outline" style="height: 36px; font-weight: 600;">Reset</button>
    </div>
  </div>
</div>
