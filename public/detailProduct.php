<?php
// ============================================================
// Detail Product Page - Re - Campus Gunadarma
// ============================================================
if (session_status() === PHP_SESSION_NONE) session_start();
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Detail Barang - Re - Campus Gunadarma</title>
<link rel="stylesheet" href="css/styles.css">
<style>
.pd-wrap { display:grid; grid-template-columns: 1fr 1fr; gap:40px; background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:32px; margin-top:24px; }
.pd-gallery-main { height:450px; background:var(--color-bg-body); border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; display:grid; place-items:center; font-size:80px; }
.pd-gallery-main img { width:100%; height:100%; object-fit:cover; }
.pd-thumbs { display:flex; gap:8px; margin-top:12px; overflow-x:auto; }
.pd-thumb { width:70px; height:70px; object-fit:cover; border:2px solid var(--color-border); border-radius:var(--radius-sm); cursor:pointer; }
.pd-thumb.active { border-color:var(--color-primary); }
.pd-actions { display:flex; gap:12px; margin-top:24px; flex-wrap:wrap; }
.pd-actions .btn { height:48px; flex:1; min-width:150px; font-size:14px; font-weight:700; }
@media (max-width: 900px) { .pd-wrap { grid-template-columns:1fr; } .pd-gallery-main { height:320px; } }
</style>
</head>
<body>
<?php include 'components/navbar.php'; ?>

<main class="container" style="padding-bottom:100px;">
  <div style="margin-top:24px; font-size:13px; color:var(--color-text-muted);">
    <a href="/" style="color:var(--color-primary); font-weight:600;">Beranda</a>
    <span> / </span>
    <span id="pd-breadcrumb-cat">Memuat...</span>
  </div>
  <div class="pd-wrap" id="product-detail-container">
    <div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--color-text-muted);">⏳ Memuat detail barang...</div>
  </div>
</main>

<?php include 'public/components/footer.html'; ?>

<script src="js/app.js"></script>
<script>
// === LOGIC HALAMAN DETAIL PRODUCT ===
const listingId = new URLSearchParams(window.location.search).get('id');

async function loadProductPage() {
  const container = $('#product-detail-container');
  if (!listingId) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px;"><h2>❌ ID barang tidak ditemukan.</h2><a class="btn btn-primary mt-4" href="/">Kembali ke Beranda</a></div>`;
    return;
  }
  try {
    const { listing } = await api(`/api/listings/${encodeURIComponent(listingId)}`);
    $('#pd-breadcrumb-cat').textContent = listing.category || 'Detail Barang';
    document.title = listing.title + ' - Re - Campus Gunadarma';

    const isOwn = state.user && String(state.user.id) === String(listing.seller_id);
    const sold = listing.status === 'sold';
    const images = listing.images || [];

    const mainImg = images[0]
      ? `<img src="${escapeHtml(images[0])}" id="pd-main-img" alt="${escapeHtml(listing.title)}">`
      : '📦';
    const thumbs = images.length > 1 ? `
      <div class="pd-thumbs">
        ${images.map((url, idx) => `<img src="${escapeHtml(url)}" data-src="${escapeHtml(url)}" class="pd-thumb ${idx === 0 ? 'active' : ''}" alt="">`).join('')}
      </div>` : '';

    const sellerAvatar = listing.seller_avatar
      ? `<img src="${escapeHtml(listing.seller_avatar)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;" alt="">`
      : `<div style="width:48px; height:48px; border-radius:50%; background:var(--color-primary-subtle); color:var(--color-primary); display:grid; place-items:center; font-weight:bold; font-size:20px;">${escapeHtml(listing.seller_name.charAt(0).toUpperCase())}</div>`;

    const actionMarkup = isOwn ? `
      <button class="btn btn-primary" id="pd-edit-btn">✏️ Edit Barang</button>
      <button class="btn btn-danger-outline" id="pd-delete-btn">🗑️ Hapus</button>
    ` : sold ? `
      <button class="btn btn-outline" disabled>Barang sudah terjual</button>
    ` : `
      <button class="btn btn-outline" id="pd-add-cart">🛒 Masukkan Keranjang</button>
      <button class="btn btn-sell" id="pd-buy-now">⚡ Beli Sekarang</button>
      <button class="btn btn-primary" id="pd-cod-chat">💬 COD / Chat Penjual</button>
    `;

    container.innerHTML = `
      <div>
        <div class="pd-gallery-main">${mainImg}</div>
        ${thumbs}
      </div>
      <div style="display:flex; flex-direction:column;">
        <span style="font-size:11px; font-weight:700; color:var(--color-primary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
          ${escapeHtml(listing.category)} ${sold ? '· <span style="color:var(--color-danger);">TERJUAL</span>' : ''}
        </span>
        <h1 style="font-size:30px; font-weight:800; line-height:1.2; margin-bottom:16px;">${escapeHtml(listing.title)}</h1>
        <div style="font-size:34px; font-weight:900; color:var(--color-primary-dark); margin-bottom:24px;">${formatPrice(listing.price)}</div>
        <div style="background:var(--color-bg-body); padding:16px; border:1px solid var(--color-border); border-radius:var(--radius-md); margin-bottom:24px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; font-size:14px;"><span style="color:var(--color-text-muted); font-size:12px;">Kondisi</span> <strong>${escapeHtml(conditionNames[listing.item_condition] || '-')}</strong></div>
          <div style="display:flex; justify-content:space-between; font-size:14px;"><span style="color:var(--color-text-muted); font-size:12px;">Lokasi COD</span> <strong>${escapeHtml(listing.meetup_location || 'Disepakati lewat chat')}</strong></div>
        </div>
        <h3 style="font-size:18px; margin-bottom:12px;">Deskripsi Barang</h3>
        <p style="font-size:15px; line-height:1.7; margin-bottom:32px; max-height:220px; overflow-y:auto;">${escapeHtml(listing.description).replace(/\n/g, '<br>')}</p>
        <div style="display:flex; align-items:center; gap:16px; padding:16px; background:var(--color-bg-body); border:1px solid var(--color-border); border-radius:var(--radius-md);">
          ${sellerAvatar}
          <div>
            <strong style="font-size:16px;">${escapeHtml(listing.seller_name)}</strong>
            <div style="font-size:12px; color:var(--color-text-muted);">Mahasiswa Gunadarma</div>
          </div>
        </div>
        <div class="pd-actions" style="margin-top:auto;">${actionMarkup}</div>
      </div>
    `;

    // Thumbnail switcher
    container.querySelectorAll('.pd-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const main = $('#pd-main-img');
        if (main) main.src = thumb.dataset.src;
        container.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    // Wiring tombol aksi (pakai fungsi yang udah ada di app.js)
    const editBtn = $('#pd-edit-btn'); if (editBtn) editBtn.addEventListener('click', () => openEditListing(listing.id));
    const delBtn = $('#pd-delete-btn'); if (delBtn) delBtn.addEventListener('click', () => deleteListing(listing.id));
    const addCart = $('#pd-add-cart'); if (addCart) addCart.addEventListener('click', () => addToCart(listing.id));
    const buyBtn = $('#pd-buy-now'); 
    if (buyBtn) buyBtn.addEventListener('click', () => {
  // Langsung ke checkout dengan parameter listing
      window.location.href = 'checkout.php?listing=' + listingId;
    });
    const codBtn = $('#pd-cod-chat'); if (codBtn) codBtn.addEventListener('click', () => codToChat(listing.id));
  } catch (e) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px;"><h2 style="color:var(--color-danger);">❌ ${escapeHtml(e.message)}</h2><a class="btn btn-primary mt-4" href="/">Kembali ke Beranda</a></div>`;
  }
}

// Pastikan state.user siap (buat nentuin own/sold + guard login tombol), baru render
(async function () {
  try {
    const { user } = await api('/api/me');
    if (!state.user) state.user = user;
  } catch (e) { /* guest */ }
  await loadProductPage();
})();
</script>

<!-- Modal Pilihan Metode Pembelian -->
<div id="buy-method-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
  <div style="background: #fff; padding: 24px; border-radius: 12px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
    <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px;">Pilih Metode Pembelian</h3>
    <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 24px;">Mau COD (Meetup) atau Langsung Checkout?</p>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button id="btn-modal-cod" class="btn btn-outline" style="height: 48px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
        💬 COD / Chat Penjual (Negosiasi Meetup)
      </button>
      <button id="btn-modal-buy-now" class="btn btn-primary" style="height: 48px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
        ⚡ Beli Langsung (Checkout Sekarang)
      </button>
      <button id="btn-modal-cancel" class="btn btn-outline" style="height: 40px; font-size: 13px; color: var(--color-text-muted); border: none;">Batal</button>
    </div>
  </div>
</div>

</body>
</html>