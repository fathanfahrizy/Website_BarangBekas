// ============================================================
// REUSABLE PRODUCT CARD COMPONENT
// Bisa dipake di: Halaman Utama, Wishlist, Search Result, dll
// ============================================================

/**
 * Membuat kartu produk yang reusable
 * @param {Object} item - Data produk (id, title, price, image_url, dll)
 * @param {Object} options - Konfigurasi tampilan
 * @param {boolean} options.showWishlist - Tampilkan tombol wishlist (default: true)
 * @param {boolean} options.showSeller - Tampilkan info penjual (default: false)
 * @param {boolean} options.showDate - Tampilkan tanggal (default: false)
 * @param {string} options.dateLabel - Label tanggal (default: 'Ditambahkan pada')
 * @param {boolean} options.showActions - Tampilkan tombol aksi (default: false)
 * @param {string} options.variant - 'grid' atau 'list' (default: 'grid')
 * @returns {string} HTML string
 */

// ============================================================
// UTILITY FUNCTIONS (Self-contained biar gak error)
// ============================================================

// Cek apakah escapeHtml udah ada di global scope (dari app.js), kalau belum, definisikan
if (typeof escapeHtml === 'undefined') {
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }
}

// Cek apakah formatPrice udah ada, kalau belum, definisikan
if (typeof formatPrice === 'undefined') {
  function formatPrice(value) {
    return `Rp${Number(value).toLocaleString("id-ID")}`;
  }
}

// Cek apakah userWishlistIds udah ada (dari app.js), kalau belum, bikin baru
if (typeof userWishlistIds === 'undefined') {
  var userWishlistIds = new Set();
}

// Helper untuk toast (kalau belum ada)
if (typeof toast === 'undefined') {
  function toast(message) {
    alert(message);
  }
}

function createProductCard(item, options = {}) {
  const {
    showWishlist = true,
    showSeller = false,
    showDate = false,
    dateLabel = 'Ditambahkan pada',
    showActions = false,
    variant = 'grid',
    isOwnProduct = false
  } = options;

  const sold = item.status === 'sold';
  const addedDate = item.added_at 
    ? new Date(item.added_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Handle gambar (bisa dari image_url string atau array)
  let imageUrl = '';
  if (item.image_url) {
    if (Array.isArray(item.image_url)) {
      imageUrl = item.image_url[0] || '';
    } else if (typeof item.image_url === 'string') {
      imageUrl = item.image_url.split(',')[0].trim();
    }
  }

  const imageHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" style="width:100%; height:100%; object-fit:cover;" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">`
    : `<div style="width:100%; height:100%; display:grid; place-items:center; background:var(--color-bg-body); font-size:40px;">📦</div>`;

  // Badge TERJUAL
  const soldBadge = sold
    ? `<span style="position:absolute; top:8px; left:8px; background:rgba(239,68,68,0.9); color:#fff; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px; z-index:2;">TERJUAL</span>`
    : '';

  // Tombol Wishlist (hanya jika bukan barang sendiri)
  const wishlistBtn = (showWishlist && !isOwnProduct)
    ? `<button class="btn-wishlist-card ${userWishlistIds.has(item.id) ? 'active' : ''}" data-listing-id="${item.id}" aria-label="Tambah ke Wishlist">
        <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>`
    : '';

  // Info Penjual
  const sellerHtml = showSeller && item.seller_name
    ? `<div style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px; padding-top:12px; border-top:1px solid var(--color-border);">
         👤 Penjual: <strong>${escapeHtml(item.seller_name)}</strong>
       </div>`
    : '';

  // Tanggal
  const dateHtml = showDate && addedDate
    ? `<div style="font-size:11px; color:var(--color-text-muted); margin-bottom:8px; display:flex; align-items:center; gap:6px;">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
         ${dateLabel} ${addedDate}
       </div>`
    : '';

  // Tombol Aksi (untuk wishlist page)
  const actionsHtml = showActions
    ? `<div style="display:flex; gap:8px; margin-top:auto;">
         <button class="btn-remove-wishlist" data-listing-id="${item.id}" style="flex:1; padding:10px; background:#fef2f2; color:#ef4444; border:1px solid #fecaca; border-radius:var(--radius-md); font-weight:600; cursor:pointer; font-size:13px;">
           🗑️ Hapus
         </button>
       </div>`
    : '';

  // Layout Grid atau List
  const isGrid = variant === 'grid';

  return `
    <article class="product-card-reusable" data-listing-id="${item.id}" style="
      background:#fff; 
      border:1px solid var(--color-border); 
      border-radius:var(--radius-lg); 
      overflow:hidden; 
      cursor:pointer; 
      display:flex; 
      flex-direction:column; 
      position:relative;
      transition: transform 0.2s, box-shadow 0.2s;
      ${isGrid ? '' : 'flex-direction:row;'}
    ">
      <div style="position:relative; ${isGrid ? 'height:200px;' : 'width:200px; height:200px; flex-shrink:0;'} background:var(--color-bg-body); overflow:hidden;">
        ${imageHtml}
        ${soldBadge}
        ${wishlistBtn}
      </div>
      <div style="padding:16px; display:flex; flex-direction:column; flex:1;">
        ${dateHtml}
        <div style="font-size:10px; font-weight:800; color:var(--color-primary); text-transform:uppercase; margin-bottom:4px;">
          ${escapeHtml(item.category_name || item.category || 'LAINNYA')}
        </div>
        <h3 style="font-size:16px; font-weight:700; color:var(--color-text-main); line-height:1.4; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${escapeHtml(item.title)}
        </h3>
        <div style="font-size:20px; font-weight:800; color:var(--color-primary-dark); margin-bottom:12px;">
          ${formatPrice(item.price)}
        </div>
        ${item.description ? `<p style="font-size:13px; color:var(--color-text-muted); line-height:1.5; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(item.description)}</p>` : ''}
        ${sellerHtml}
        ${actionsHtml}
      </div>
    </article>
  `;
}

/**
 * Render daftar produk ke dalam container
 * @param {Array} items - Array data produk
 * @param {string} containerId - ID container HTML
 * @param {Object} options - Options untuk createProductCard
 */
function renderProductCards(items, containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:60px 20px; color:var(--color-text-muted);">
        <div style="font-size:64px; margin-bottom:16px;">📦</div>
        <h3>Tidak ada produk</h3>
        <p>Coba ubah filter atau kata kunci pencarian.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => createProductCard(item, options)).join('');

  // Attach event listeners
  attachProductCardEvents(container);
}

/**
 * Attach event listeners ke semua product card dalam container
 */
function attachProductCardEvents(container) {
  // Klik card -> ke detail
  container.querySelectorAll('.product-card-reusable').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-wishlist-card, .btn-remove-wishlist, .btn-chat-seller')) return;
      const listingId = card.dataset.listingId;
      window.location.href = `detailProduct.php?id=${encodeURIComponent(listingId)}`;
    });
  });

  // Tombol wishlist
  container.querySelectorAll('.btn-wishlist-card').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleWishlistClick(btn);
    });
  });

  // Tombol hapus dari wishlist
  container.querySelectorAll('.btn-remove-wishlist').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleRemoveFromWishlist(btn);
    });
  });

  // Tombol chat penjual
  container.querySelectorAll('.btn-chat-seller').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const listingId = btn.dataset.listingId;
      await startConversation(listingId);
    });
  });
}

/**
 * Handle klik tombol wishlist (reusable)
 */
async function handleWishlistClick(btn) {
  if (!state || !state.user) {
    if (typeof toast === 'function') toast('Silakan login dulu untuk menyimpan favorit!');
    window.location.href = 'login.html';
    return;
  }

  const listingId = Number(btn.dataset.listingId);
  const isCurrentlyWishlisted = state.wishlistIds.has(listingId);

  // 1. Optimistic Update: Langsung ubah UI & State tanpa nunggu server
  if (isCurrentlyWishlisted) {
    state.wishlistIds.delete(listingId);
  } else {
    state.wishlistIds.add(listingId);
  }
  
  // Panggil fungsi sinkronisasi dari app.js
  if (typeof syncPersistentUI === 'function') syncPersistentUI();

  // 2. Tembak API ke Database
  try {
    const res = await fetch('/api/wishlist', {
      method: isCurrentlyWishlisted ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: listingId })
    });

    if (!res.ok) throw new Error('Gagal memperbarui database');
    
    if (typeof toast === 'function') {
      toast(isCurrentlyWishlisted ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist ❤️');
    }

  } catch (error) {
    console.error('Wishlist error:', error);
    // 3. Revert/Kembalikan state jika API gagal
    if (isCurrentlyWishlisted) state.wishlistIds.add(listingId);
    else state.wishlistIds.delete(listingId);
    
    if (typeof syncPersistentUI === 'function') syncPersistentUI();
    if (typeof toast === 'function') toast('Gagal menyimpan. Terjadi kesalahan jaringan.');
  }
}

/**
 * Handle hapus dari wishlist (reusable)
 */
async function handleRemoveFromWishlist(btn) {
  if (!confirm('Yakin ingin menghapus barang ini dari wishlist?')) return;

  const listingId = btn.dataset.listingId;
  btn.disabled = true;
  btn.innerHTML = '⏳ Menghapus...';

  try {
    const res = await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: parseInt(listingId) })
    });

    if (res.ok) {
      const card = btn.closest('.product-card-reusable');
      card.style.transition = 'all 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        card.remove();
        if (document.querySelectorAll('.product-card-reusable').length === 0) {
          location.reload(); // Reload buat nampilin empty state
        }
      }, 300);
      
      if (typeof toast === 'function') toast('Berhasil dihapus dari wishlist');
    } else {
      throw new Error('Gagal menghapus');
    }
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = '🗑️ Hapus';
    if (typeof toast === 'function') toast(error.message);
  }
}