<?php
// ============================================================
// NAVBAR COMPONENT - PasarKampus Gunadarma
// ============================================================
if (session_status() === PHP_SESSION_NONE) session_start();

$userId = $_SESSION['userId'] ?? null;
$userName = $_SESSION['userName'] ?? 'User';
$userInitial = strtoupper(substr($userName, 0, 1));

// Fetch cart count
$cartCount = 0;
if ($userId) {
    try {
        $pdo = require __DIR__ . '/../../config/database.php';
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $cartCount = $result ? (int)$result['count'] : 0;
    } catch (Exception $e) {
        $cartCount = 0;
    }
}

$isLoggedIn = !empty($userId);
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
      <!-- Ikon Wishlist -->
<button class="action-icon signed-in-only hidden" id="wishlist-nav" title="Wishlist" style="position: relative; padding: 8px;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
  <span id="wishlist-count" class="counter hidden" style="position:absolute; top:2px; right:0; min-width:16px; height:16px; font-size:10px; background:#ef4444; color:#fff; border-radius:50%; text-align:center; line-height:16px; font-weight:700;">0</span>
</button>

      
      <!-- Ikon Keranjang dengan Badge Dinamis -->
      <button class="action-icon" id="cart-nav" title="Keranjang" style="position: relative; padding: 8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <?php if ($cartCount > 0): ?>
          <span class="counter" style="position:absolute; top:2px; right:0; min-width:16px; height:16px; font-size:10px; background:#ef4444; color:#fff; border-radius:50%; text-align:center; line-height:16px; font-weight:700;"><?= $cartCount ?></span>
        <?php endif; ?>
      </button>
      
      <!-- Avatar User (Hanya muncul kalau login) -->
      <?php if ($isLoggedIn): ?>
        <button class="action-icon" id="account-button" title="Profil" style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; background: var(--color-primary, #4361ee); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">
            <?= htmlspecialchars($userInitial) ?>
          </div>
        </button>
      <?php endif; ?>
      
      <!-- Tombol Login (Hanya muncul kalau belum login) -->
      <?php if (!$isLoggedIn): ?>
        <button class="btn" id="login-button">LOGIN</button>
      <?php endif; ?>
      
      <button class="btn btn-sell" id="sell-button">JUAL BARANG</button>
    </div>
  </div>
</header>

<!-- DROPDOWN FILTER HEADER -->
