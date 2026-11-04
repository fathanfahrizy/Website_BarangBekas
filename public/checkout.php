<?php
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['userId'])) { header('Location: login.html'); exit; }

$cartIdsParam = $_GET['cart_ids'] ?? '';
$listingParam = $_GET['listing'] ?? '';
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Checkout - PasarKampus Gunadarma</title>
<link rel="stylesheet" href="css/styles.css">
<style>
  .checkout-wrap { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 32px; padding-bottom: 120px; }
  .checkout-section { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; margin-bottom: 16px; }
  .checkout-section h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; gap: 8px; }
  .item-row { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--color-bg-body); }
  .item-row:last-child { border-bottom: none; }
  .item-img { width: 60px; height: 60px; background: var(--color-bg-body); border-radius: 6px; overflow: hidden; flex-shrink: 0; }
  .item-img img { width: 100%; height: 100%; object-fit: cover; }
  .sticky-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid var(--color-border); padding: 16px 0; z-index: 100; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); }
  .form-input { width: 100%; height: 42px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 6px; margin-bottom: 12px; font-family: inherit; box-sizing: border-box; }
  .form-input:focus { outline: none; border-color: var(--color-primary); }
  textarea.form-input { height: 80px; padding: 12px; resize: none; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .payment-method { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
  .payment-option { flex: 1; min-width: 120px; padding: 12px; border: 2px solid var(--color-border); border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; }
  .payment-option:hover { border-color: var(--color-primary); }
  .payment-option.selected { border-color: var(--color-primary); background: var(--color-primary-subtle); }
  .payment-option input { display: none; }
  .payment-option label { cursor: pointer; font-size: 13px; font-weight: 600; display: block; }
  @media (max-width: 768px) { .checkout-wrap { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<?php include 'public/components/header.html'; ?>

<main class="container">
  <div style="margin-top: 24px; font-size: 20px; font-weight: 800;">🛍️ Checkout Pesanan</div>
  
  <div class="checkout-wrap">
    <div>
      <!-- 1. Alamat Pengiriman -->
      <div class="checkout-section">
        <h3>📍 Alamat Pengiriman</h3>
        <div class="form-row">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">Nama Penerima *</label>
            <input type="text" id="co-recipient" class="form-input" placeholder="Nama lengkap penerima">
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">Nomor Telepon *</label>
            <input type="tel" id="co-phone" class="form-input" placeholder="08xxxxxxxxxx">
          </div>
        </div>
        <div class="form-row">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">Provinsi *</label>
            <input type="text" id="co-province" class="form-input" placeholder="JAWA BARAT">
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">Kota/Kabupaten *</label>
            <input type="text" id="co-city" class="form-input" placeholder="DEPOK">
          </div>
        </div>
        <div class="form-row">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">Kecamatan *</label>
            <input type="text" id="co-district" class="form-input" placeholder="Bojongsari">
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">Kode Pos *</label>
            <input type="text" id="co-postal" class="form-input" placeholder="16516">
          </div>
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">Alamat Lengkap *</label>
          <textarea id="co-address" class="form-input" placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, patokan..."></textarea>
        </div>
      </div>

      <!-- 2. Produk yang Dibeli -->
      <div class="checkout-section">
        <h3>📦 Produk Dipesan (<span id="co-item-count">0</span>)</h3>
        <div id="co-items-list">
          <div style="text-align: center; padding: 20px; color: var(--color-text-muted);">Memuat data...</div>
        </div>
      </div>

      <!-- 3. Pesan untuk Penjual -->
      <div class="checkout-section">
        <h3>💬 Pesan untuk Penjual (Opsional)</h3>
        <textarea id="co-notes" class="form-input" placeholder="Contoh: Tolong dikemas dengan bubble wrap ya kak..."></textarea>
      </div>

      <!-- 4. Metode Pembayaran -->
      <div class="checkout-section">
        <h3>💳 Metode Pembayaran</h3>
        <div class="payment-method">
          <div class="payment-option" data-method="bank_transfer">
            <input type="radio" name="payment" id="pay-bank" value="bank_transfer">
            <label for="pay-bank">🏦 Transfer Bank</label>
          </div>
          <div class="payment-option" data-method="ewallet">
            <input type="radio" name="payment" id="pay-ewallet" value="ewallet">
            <label for="pay-ewallet">📱 E-Wallet</label>
          </div>
          <div class="payment-option" data-method="cod">
            <input type="radio" name="payment" id="pay-cod" value="cod">
            <label for="pay-cod">🤝 COD</label>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Rincian Pembayaran (Sticky Sidebar) -->
    <div>
      <div class="checkout-section" style="position: sticky; top: 24px;">
        <h3>💰 Rincian Pembayaran</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span>Total Harga (<span id="co-qty">0</span> barang)</span>
          <span id="co-subtotal">Rp0</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span>Ongkos Kirim</span>
          <span id="co-shipping">Rp0</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px;">
          <span>Biaya Admin</span>
          <span style="color: var(--color-primary); font-weight: 700;">GRATIS</span>
        </div>
        <div style="border-top: 1px dashed var(--color-border); padding-top: 12px; display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: var(--color-primary-dark);">
          <span>Total Bayar</span>
          <span id="co-total">Rp0</span>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Sticky Bottom Bar -->
<div class="sticky-bar">
  <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-size: 12px; color: var(--color-text-muted);">Total Pembayaran</div>
      <div style="font-size: 22px; font-weight: 800; color: var(--color-primary-dark);" id="co-sticky-total">Rp0</div>
    </div>
    <button id="btn-place-order" class="btn btn-primary" style="height: 48px; padding: 0 32px; font-weight: 700; font-size: 16px;">Buat Pesanan</button>
  </div>
</div>

<?php include 'public/components/footer.html'; ?>
<script src="js/app.js"></script>
<script>
// 1. DEFINISIKAN urlParams DULU BARU DI-GET!
const urlParams = new URLSearchParams(window.location.search);
const cartIdsParam = urlParams.get('cart_ids');
const listingParam = urlParams.get('listing');

// Auto-fill nama & telepon dari profile user
async function loadUserProfile() {
  try {
    const { user } = await api('/api/me');
    if (user) {
      const recipientEl = $('#co-recipient');
      const phoneEl = $('#co-phone');
      if (recipientEl) recipientEl.value = user.name || '';
      if (phoneEl) phoneEl.value = user.phone || '';
    }
  } catch (e) { console.error('Failed to load profile:', e); }
}

async function loadCheckout() {
  const listContainer = $('#co-items-list');
  let items = [];
  let total = 0;
  let html = '';

  try {
    if (cartIdsParam) {
      const idsArray = cartIdsParam.split(',').map(Number);
      const { cart } = await api('/api/cart');
      items = cart.filter(item => idsArray.includes(item.cart_id));
    } else if (listingParam) {
      const { listing } = await api(`/api/listings/${listingParam}`);
      if (listing.status !== 'active') throw new Error('Barang sudah tidak tersedia.');
      
      items = [{
        cart_id: null,
        listing_id: listing.id,
        title: listing.title,
        price: listing.price,
        seller_name: listing.seller_name,
        image_url: listing.images && listing.images[0] ? listing.images[0] : null,
        is_available: true
      }];
    } else {
      throw new Error('Tidak ada barang yang dipilih untuk checkout.');
    }

    if (items.length === 0) throw new Error('Barang tidak ditemukan.');

    document.getElementById('co-item-count').textContent = items.length;
    document.getElementById('co-qty').textContent = items.length;

    items.forEach(item => {
      total += parseFloat(item.price);
      html += `
        <div class="item-row">
          <div class="item-img">${item.image_url ? `<img src="${item.image_url}">` : '📦'}</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px;">${escapeHtml(item.title)}</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Penjual: ${escapeHtml(item.seller_name)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; color: var(--color-primary-dark);">${formatPrice(item.price)}</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">Qty: 1</div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
    document.getElementById('co-subtotal').textContent = formatPrice(total);
    document.getElementById('co-total').textContent = formatPrice(total);
    document.getElementById('co-sticky-total').textContent = formatPrice(total);

  } catch (e) {
    listContainer.innerHTML = `<div style="color:red; text-align:center; padding:20px;">❌ ${e.message}<br><br><a href="cart.php" class="btn btn-outline">Kembali ke Keranjang</a></div>`;
    const btn = document.getElementById('btn-place-order');
    if (btn) btn.disabled = true;
  }
}

// Payment method selection
$$('.payment-option').forEach(option => {
  option.addEventListener('click', () => {
    $$('.payment-option').forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
    const radio = option.querySelector('input');
    if (radio) radio.checked = true;
  });
});

document.getElementById('btn-place-order').addEventListener('click', async () => {
  console.log('🔵 [CHECKOUT] Tombol diklik!');
  
  const recipient = $('#co-recipient').value.trim();
  const phone = $('#co-phone').value.trim();
  const province = $('#co-province').value.trim();
  const city = $('#co-city').value.trim();
  const district = $('#co-district').value.trim();
  const postal = $('#co-postal').value.trim();
  const address = $('#co-address').value.trim();
  const notes = $('#co-notes').value.trim();
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
  
  console.log('📝 [CHECKOUT] Form data:', { recipient, phone, address, paymentMethod });
  
  // Validasi
  if (!recipient) { toast('Nama penerima wajib diisi!'); return; }
  if (!phone) { toast('Nomor telepon wajib diisi!'); return; }
  if (!province || !city || !district || !postal) { toast('Alamat lengkap wajib diisi!'); return; }
  if (!address) { toast('Alamat detail wajib diisi!'); return; }
  if (!paymentMethod) { toast('Pilih metode pembayaran!'); return; }
  
  console.log('✅ [CHECKOUT] Validasi lolos, mengirim ke API...');
  
  const btn = $('#btn-place-order');
  btn.disabled = true;
  btn.textContent = 'Memproses...';
  
  try {
    const payload = {
      recipientName: recipient,
      phone: phone,
      province: province,
      city: city,
      district: district,
      postalCode: postal,
      fullAddress: address,
      paymentMethod: paymentMethod,
      notes: notes
    };

    if (cartIdsParam) payload.cartIds = cartIdsParam.split(',').map(Number);
    if (listingParam) payload.listingId = Number(listingParam);
    
    console.log('📤 [CHECKOUT] Payload:', payload);

    const res = await api('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('📥 [CHECKOUT] Response:', res);

    if (res.paymentUrl && paymentMethod !== 'cod') {
      toast('Pesanan dibuat! Mengalihkan ke pembayaran...');
      setTimeout(() => {
        window.location.href = res.paymentUrl;
      }, 1000);
    } else {
      toast(`🎉 SUKSES! Pesanan ${res.orderNumber} berhasil dibuat.`);
      setTimeout(() => {
        window.location.href = 'index.php';
      }, 1500);
    }

  } catch (e) {
    console.error('❌ [CHECKOUT] Error:', e);
    toast('Gagal checkout: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Buat Pesanan';
  }
});

// Load data saat halaman siap
loadUserProfile();
loadCheckout();
</script>
</body>
</html>