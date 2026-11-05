<?php
// ============================================================
// Cart Page - Re - Campus Gunadarma
// ============================================================
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['userId'])) {
    header('Location: login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Keranjang Saya - Re - Campus Gunadarma</title>
<link rel="stylesheet" href="css/styles.css">
<style>
.cart-page-header { background: var(--color-primary); color: #fff; padding: 32px 0; border-bottom: 1px solid var(--color-border); }
.cart-page-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.cart-page-header p { font-size: 14px; opacity: 0.9; }
.cart-list { display: flex; flex-direction: column; gap: 8px; margin-top: 32px; }
.cart-row { 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  background: #fff; 
  border: 1px solid var(--color-border); 
  border-radius: var(--radius-md); 
  padding: 12px 16px;
  transition: border-color 0.15s;
}
.cart-row:hover { border-color: var(--color-primary); }
.cart-row-img { 
  width: 64px; 
  height: 64px; 
  flex-shrink: 0; 
  background: var(--color-bg-body); 
  border-radius: var(--radius-sm); 
  overflow: hidden; 
  display: grid; 
  place-items: center; 
  font-size: 24px; 
}
.cart-row-img img { width: 100%; height: 100%; object-fit: cover; }
.cart-row-info { flex: 1; min-width: 0; }
.cart-row-title { 
  font-size: 14px; 
  font-weight: 600; 
  margin-bottom: 2px; 
  display: -webkit-box; 
  -webkit-line-clamp: 1; 
  -webkit-box-orient: vertical; 
  overflow: hidden; 
  color: var(--color-text-main);
}
.cart-row-meta { 
  font-size: 11px; 
  color: var(--color-text-muted); 
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cart-row-price { 
  font-size: 15px; 
  font-weight: 800; 
  color: var(--color-primary-dark); 
  margin-bottom: 4px;
}
.cart-row-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  background: #fef3c7;
  color: #d97706;
}
.cart-row-unavailable { 
  font-size: 10px; 
  font-weight: 700; 
  color: var(--color-danger); 
  margin-left: 8px;
}
.cart-summary { 
  position: sticky; 
  bottom: 0; 
  background: #fff; 
  border-top: 1px solid var(--color-border); 
  padding: 12px 0; 
  margin-top: 24px; 
  z-index: 40;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}
.cart-summary-inner { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 16px; 
  flex-wrap: wrap; 
}
@media (max-width: 768px) {
  .cart-row { flex-wrap: wrap; padding: 10px 12px; }
  .cart-row-img { width: 56px; height: 56px; }
  .cart-row-title { font-size: 13px; }
}
</style>
</head>
<body>
<?php include 'components/navbar.php'; ?>

<main class="container" style="padding-bottom: 120px;">
  <div class="cart-list" id="cart-page-list">
    <div style="padding:40px; text-align:center; color:var(--color-text-muted);">Memuat keranjang...</div>
  </div>

  <div class="empty-state hidden" id="cart-page-empty" style="margin-top:32px;">
    <div class="empty-icon">🛒</div>
    <h3>Keranjangmu masih kosong</h3>
    <p>Yuk jelajahi barang preloved kampus!</p>
    <a href="/" class="btn btn-primary mt-4">Jelajahi Barang</a>
  </div>

  <!-- Bar subtotal nempel di bawah ala Shopee -->
  <div class="cart-summary" id="cart-page-summary">
    <div class="container cart-summary-inner">
      <div>
        <span style="font-size:13px; color:var(--color-text-muted);">Subtotal (<span id="cart-page-count">0</span> barang):</span>
        <strong id="cart-page-subtotal" style="font-size:22px; color:var(--color-primary-dark); margin-left:8px;">Rp0</strong>
      </div>
      <div style="display:flex; gap:12px;">
        <button class="btn btn-outline" id="cart-page-clear" type="button">Kosongkan</button>
        <button class="btn btn-primary" id="cart-page-checkout" type="button">Checkout →</button>
      </div>
    </div>
  </div>
</main>

<?php include 'public/components/footer.html'; ?>

<!-- Modal Konfirmasi Kosongkan Keranjang -->
<div id="clear-cart-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
  <div style="background: #fff; padding: 24px; border-radius: 12px; width: 90%; max-width: 380px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
    <div style="font-size: 48px; margin-bottom: 12px;">🗑️</div>
    <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; color: var(--color-text-main);">Kosongkan Keranjang?</h3>
    <p style="font-size: 14px; color: var(--color-text-muted); margin-bottom: 24px; line-height: 1.5;">Semua barang di keranjang akan dihapus permanen dan tidak bisa dikembalikan.</p>
    <div style="display: flex; gap: 12px;">
      <button id="cancel-clear-cart" class="btn btn-outline" style="flex: 1; height: 42px; font-weight: 700;">Batal</button>
      <button id="confirm-clear-cart" style="flex: 1; height: 42px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px;">Ya, Kosongkan</button>
    </div>
  </div>
</div>

<!-- MODAL 1: Konfirmasi Kosongkan Keranjang -->
<div id="clear-cart-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
  <div style="background:#fff; padding:24px; border-radius:12px; width:90%; max-width:380px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.15);">
    <div style="font-size:48px; margin-bottom:12px;">🗑️</div>
    <h3 style="font-size:18px; font-weight:800; margin-bottom:8px;">Kosongkan Keranjang?</h3>
    <p style="font-size:14px; color:var(--color-text-muted); margin-bottom:24px;">Semua barang akan dihapus permanen.</p>
    <div style="display:flex; gap:12px;">
      <button id="cancel-clear-cart" class="btn btn-outline" style="flex:1; height:42px; font-weight:700;">Batal</button>
      <button id="confirm-clear-cart" style="flex:1; height:42px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-weight:700; cursor:pointer;">Ya, Kosongkan</button>
    </div>
  </div>
</div>

<!-- MODAL 2: Firewall Pilih COD atau Online -->
<div id="firewall-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
  <div style="background:#fff; padding:32px; border-radius:12px; width:90%; max-width:400px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.15);">
    <h3 style="font-size:20px; font-weight:800; margin-bottom:8px;">Pilih Metode Pembelian</h3>
    <p style="font-size:14px; color:var(--color-text-muted); margin-bottom:24px;">Mau COD (Meetup) atau Beli Online?</p>
    <div style="display:flex; flex-direction:column; gap:12px;">
      <button id="btn-cod-method" class="btn btn-outline" style="height:48px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
        💬 COD / Chat Penjual
      </button>
      <button id="btn-online-method" class="btn btn-primary" style="height:48px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
        💳 Beli Online (Checkout)
      </button>
      <button id="btn-cancel-firewall" style="background:transparent; border:none; color:var(--color-text-muted); font-size:13px; cursor:pointer; padding:8px;">Batal</button>
    </div>
  </div>
</div>

<script src="js/app.js"></script>

<?php include 'public/components/footer.html'; ?>

<script>
// Variable memory buat nyimpen data cart
let currentCartData = [];

async function loadCartPage() {
  const list = $('#cart-page-list');
  const empty = $('#cart-page-empty');
  const summary = $('#cart-page-summary');
  
  try {
    const { cart, subtotal, count } = await api('/api/cart');
    currentCartData = cart;
    
    if (!cart.length) {
      if(list) list.innerHTML = '';
      if(empty) empty.classList.remove('hidden');
      if(summary) summary.classList.add('hidden');
      return;
    }
    
    if(empty) empty.classList.add('hidden');
    if(summary) summary.classList.remove('hidden');
    
    // Render Card Ceper + Checkbox
    if (list) {
      list.innerHTML = `
        <div style="display:flex; align-items:center; padding:12px 16px; background:var(--color-bg-body); border-radius:var(--radius-md); margin-bottom:12px; gap:12px; border:1px solid var(--color-border);">
          <input type="checkbox" id="select-all-cart" style="width:18px; height:18px; cursor:pointer; accent-color: var(--color-primary);">
          <label for="select-all-cart" style="font-size:13px; font-weight:700; cursor:pointer; user-select:none;">Pilih Semua (${count} barang)</label>
        </div>
      ` + cart.map(item => `
        <div class="cart-row">
          <input type="checkbox" class="cart-checkbox" data-cart-id="${item.cart_id}" data-price="${item.price}" ${item.is_available ? '' : 'disabled'} style="width:18px; height:18px; cursor:pointer; flex-shrink:0; accent-color: var(--color-primary);">
          <div class="cart-row-img">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="">` : '📦'}</div>
          <div class="cart-row-info">
            <div class="cart-row-title">${escapeHtml(item.title)}</div>
            <div class="cart-row-meta">Penjual: ${escapeHtml(item.seller_name)} · ${escapeHtml(item.meetup_location || 'COD via chat')}</div>
            <div style="margin-top:4px; display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; background:#fef3c7; color:#d97706;">⏳ PENDING</span>
              ${item.is_available ? '' : '<span class="cart-row-unavailable">⚠️ Tidak tersedia</span>'}
            </div>
          </div>
          <div style="text-align:right;">
            <div class="cart-row-price">${formatPrice(item.price)}</div>
            <button type="button" class="btn btn-outline btn-sm" style="margin-top:8px; color:#ef4444; border-color:#ef4444;" data-cart-remove="${item.cart_id}">🗑️ Hapus</button>
          </div>
        </div>
      `).join('');
    }

    // Wiring tombol hapus (AMAN)
    if (list) {
      list.querySelectorAll('[data-cart-remove]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api('/api/cart/remove', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cartId: Number(btn.dataset.cartRemove) })
            });
            toast('Barang dihapus dari keranjang.');
            await loadCartPage();
            await refreshCartCount();
          } catch (e) { toast(e.message); }
        });
      });
    }

    // Wiring Checkbox Logic (AMAN)
    const selectAll = $('#select-all-cart');
    const checkboxes = $$('.cart-checkbox');

    if (selectAll) {
      selectAll.addEventListener('change', () => {
        checkboxes.forEach(cb => { if (!cb.disabled) cb.checked = selectAll.checked; });
        updateCartSummary();
      });
    }

    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const activeCheckboxes = checkboxes.filter(c => !c.disabled);
        const allChecked = activeCheckboxes.every(c => c.checked);
        const someChecked = activeCheckboxes.some(c => c.checked);
        
        if (selectAll) {
          selectAll.checked = allChecked;
          selectAll.indeterminate = someChecked && !allChecked;
        }
        updateCartSummary();
      });
    });

    updateCartSummary();

  } catch (e) {
    if (list) list.innerHTML = `<div style="padding:40px; text-align:center; color:var(--color-danger);">❌ ${escapeHtml(e.message)}</div>`;
  }
}

function updateCartSummary() {
  const checkedBoxes = $$('.cart-checkbox:checked');
  let selectedCount = 0;
  let selectedSubtotal = 0;

  checkedBoxes.forEach(cb => {
    const item = currentCartData.find(i => i.cart_id == cb.dataset.cartId);
    if (item && item.is_available) {
      selectedCount++;
      selectedSubtotal += parseFloat(item.price);
    }
  });

  const countEl = $('#cart-page-count');
  const subtotalEl = $('#cart-page-subtotal');
  if (countEl) countEl.textContent = selectedCount;
  if (subtotalEl) subtotalEl.textContent = formatPrice(selectedSubtotal);

  const checkoutBtn = $('#cart-page-checkout');
  if (checkoutBtn) {
    checkoutBtn.disabled = selectedCount === 0;
    checkoutBtn.style.opacity = selectedCount === 0 ? '0.5' : '1';
    checkoutBtn.style.cursor = selectedCount === 0 ? 'not-allowed' : 'pointer';
  }
}

// ==========================================
// LOGIC MODAL & FIREWALL (DENGAN PENGAMAN 'IF')
// ==========================================

// 1. Modal Kosongkan
const clearModal = $('#clear-cart-modal');
const cancelClearBtn = $('#cancel-clear-cart');
const confirmClearBtn = $('#confirm-clear-cart');
const btnClearPage = $('#cart-page-clear');

if (btnClearPage) {
  btnClearPage.addEventListener('click', () => { if(clearModal) clearModal.style.display = 'flex'; });
}
if (cancelClearBtn) {
  cancelClearBtn.addEventListener('click', () => { if(clearModal) clearModal.style.display = 'none'; });
}
if (confirmClearBtn) {
  confirmClearBtn.addEventListener('click', async () => {
    if(clearModal) clearModal.style.display = 'none';
    try {
      await api('/api/cart/clear', { method: 'DELETE' });
      toast('Keranjang berhasil dikosongkan.');
      await Promise.all([loadCartPage(), refreshCartCount()]);
    } catch (e) { toast(e.message); }
  });
}
if (clearModal) {
  clearModal.addEventListener('click', (e) => {
    if (e.target === clearModal) clearModal.style.display = 'none';
  });
}

// 2. Modal Firewall (COD vs Online)
const firewallModal = $('#firewall-modal');
const btnCod = $('#btn-cod-method');
const btnOnline = $('#btn-online-method');
const btnCancelFirewall = $('#btn-cancel-firewall');
const btnCheckoutPage = $('#cart-page-checkout');

// Buka Firewall pas klik Checkout
if (btnCheckoutPage) {
  btnCheckoutPage.addEventListener('click', () => {
    const checked = $$('.cart-checkbox:checked');
    if (checked.length === 0) { toast('Pilih minimal 1 barang!'); return; }
    if (firewallModal) firewallModal.style.display = 'flex';
  });
}

// Tutup Firewall
if (btnCancelFirewall) btnCancelFirewall.addEventListener('click', () => { if(firewallModal) firewallModal.style.display = 'none'; });
if (firewallModal) {
  firewallModal.addEventListener('click', (e) => { if (e.target === firewallModal) firewallModal.style.display = 'none'; });
}

// Opsi COD: Arahin ke Chat (Support Multiple Penjual)
if (btnCod) {
  btnCod.addEventListener('click', async () => {
    if (firewallModal) firewallModal.style.display = 'none';
    const checkedBoxes = $$('.cart-checkbox:checked');
    
    const uniqueListings = [...new Set(checkedBoxes.map(cb => {
      const item = currentCartData.find(i => i.cart_id == cb.dataset.cartId);
      return item ? item.listing_id : null;
    }).filter(Boolean))];

    if (uniqueListings.length === 0) { toast('Tidak ada barang valid untuk di-COD.'); return; }

    toast('Membuka obrolan dengan penjual...');
    const convIds = [];

    for (const listingId of uniqueListings) {
      try {
        const { conversationId } = await api('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId })
        });
        convIds.push(conversationId);
      } catch (e) { console.error('Gagal buat chat', e); }
    }

    if (convIds.length > 0) {
      window.location.href = 'chat.php?convs=' + convIds.join(',');
    } else {
      toast('Gagal membuka obrolan.');
    }
  });
}

// Opsi Online: Arahin ke Checkout.php
if (btnOnline) {
  btnOnline.addEventListener('click', () => {
    if (firewallModal) firewallModal.style.display = 'none';
    const checkedBoxes = $$('.cart-checkbox:checked');
    const selectedIds = [...checkedBoxes].map(cb => cb.dataset.cartId).join(',');
    window.location.href = 'checkout.php?cart_ids=' + selectedIds;
  });
}


// Jalankan pas halaman load
loadCartPage();
</script>