<?php
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['userId'])) { header('Location: login.html'); exit; }
?>


<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Etalase Saya - PasarKampus Gunadarma</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <style>
        .etalase-header { background: var(--color-primary); color: #fff; padding: 32px 0; border-bottom: 1px solid var(--color-border); }
        .etalase-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
        .etalase-header p { font-size: 14px; opacity: 0.9; }
        .etalase-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 32px; }
        .stat-card { background: #fff; border: 1px solid var(--color-border); padding: 20px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 16px; }
        .stat-icon { font-size: 32px; }
        .stat-info h3 { font-size: 24px; font-weight: 800; color: var(--color-primary-dark); margin: 0; }
        .stat-info p { font-size: 12px; color: var(--color-text-muted); margin: 0; }
    </style>
</head>
<body>
    <?php include 'components/navbar.php'; ?>>


    <main class="container" style="padding-bottom: 80px;">
        <!-- Statistik Singkat -->
        <div class="etalase-stats">
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-info">
                    <h3 id="stat-active">0</h3>
                    <p>Barang Aktif</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                    <h3 id="stat-sold">0</h3>
                    <p>Terjual</p>
                </div>
            </div>
        </div>

        <!-- Grid Barang -->
        <div style="margin-top: 32px;">
            <div class="section-header flex-between">
                <h2 class="section-title">Daftar Iklan Saya</h2>
                <button class="btn btn-primary" id="btn-tambah-etalase">＋ Pasang Iklan Baru</button>
            </div>
            <div class="product-grid" id="my-listing-grid"></div>
            <div class="empty-state hidden" id="my-listing-empty" style="padding: 60px; text-align: center; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
                <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                <h3>Etalasemu Masih Kosong</h3>
                <p style="color: var(--color-text-muted); margin-bottom: 24px;">Yuk jual barang preloved kamu sekarang!</p>
            </div>
        </div>
    </main>

    <?php include 'components/footer.html'; ?>

    <!-- MODAL PASANG IKLAN -->
<dialog id="listing-dialog" class="modal-dialog">
  <div class="modal-content">
    <button class="modal-close" data-close="listing-dialog">×</button>
    <h2>Pasang Barang Preloved</h2>
    <form id="listing-form">
      <div class="form-group">
        <label>Nama Barang</label>
        <input name="title" class="form-input" required placeholder="Contoh: Buku Algoritma C++">
      </div>
      <div class="form-group">
        <label>Deskripsi</label>
        <textarea name="description" class="form-input" required rows="4"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Harga (Rp)</label>
          <input name="price" class="form-input" type="number" required>
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select name="categoryId" class="form-input" required></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Kondisi</label>
          <select name="itemCondition" class="form-input" required>
            <option value="">Pilih...</option>
            <option value="like_new">Seperti Baru</option>
            <option value="good">Bagus</option>
            <option value="fair">Layak</option>
            <option value="needs_repair">Perlu Perbaikan</option>
          </select>
        </div>
        <div class="form-group">
          <label>Lokasi COD</label>
          <input name="meetupLocation" class="form-input" placeholder="Kampus D">
        </div>
      </div>
      <div class="form-group">
        <label>Foto (Maks 4)</label>
        <input name="images" class="form-input" type="file" multiple accept="image/*">
      </div>
      <div id="listing-error" class="error-msg hidden"></div>
      <button type="submit" class="btn btn-primary w-full">Tayangkan Iklan 🚀</button>
    </form>
  </div>
</dialog>

<!-- MODAL EDIT BARANG (Tempel di etalase.php, di bawah modal listing-dialog) -->
<dialog id="edit-listing-dialog" class="modal-dialog" style="max-width: 600px; width: 90%; padding: 0; border: none; border-radius: 12px;">
    <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 20px; font-weight: 800; margin: 0;">Edit Barang Preloved</h2>
            <button type="button" onclick="document.getElementById('edit-listing-dialog').close()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        
        <form id="edit-listing-form">
            <input type="hidden" id="edit-listing-id" name="listingId">
            <input type="hidden" id="edit-thumbnail-id" name="thumbnailId">
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Nama Barang</label>
                <input name="title" id="edit-title" class="form-input" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Deskripsi</label>
                <textarea name="description" id="edit-description" class="form-input" required rows="3" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Harga (Rp)</label>
                    <input name="price" id="edit-price" class="form-input" type="number" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Kategori</label>
                    <select name="categoryId" id="edit-category" class="form-input" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Kondisi</label>
                    <select name="itemCondition" id="edit-condition" class="form-input" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="like_new">Seperti Baru</option>
                        <option value="good">Bagus</option>
                        <option value="fair">Layak</option>
                        <option value="needs_repair">Perlu Perbaikan</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Lokasi COD</label>
                    <input name="meetupLocation" id="edit-meetup" class="form-input" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
            </div>

            <!-- Area Foto (Dihandle oleh app.js) -->
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Foto Saat Ini</label>
                <div id="edit-existing-images" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 8px;"></div>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Tambah/Ganti Foto</label>
                <input name="images" id="edit-images" class="form-input" type="file" multiple accept="image/*" style="width: 100%;">
            </div>

            <div id="edit-listing-error" style="color: red; font-size: 12px; margin-bottom: 12px; display: none;"></div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; background: #5c2d91; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">Simpan Perubahan 💾</button>
        </form>
    </div>
</dialog>
    <!-- Load app.js untuk dapat utility functions -->
    <script src="js/app.js"></script>
    
    <script>
        // Tunggu app.js load, baru eksekusi
        window.addEventListener('load', () => {
            // Override initialize() dari app.js agar tidak load semua data
            window.initialize = function() { console.log('Etalase page initialized'); };
            
            async function loadMyListings() {
                try {
                    const res = await fetch('/api/listings?mine=true');
                    const data = await res.json();
                    const items = data.listings || [];
                    
                    // Update Stats
                    document.getElementById('stat-active').textContent = items.filter(i => i.status === 'active').length;
                    document.getElementById('stat-sold').textContent = items.filter(i => i.status === 'sold').length;

                    // Render Grid
                    const grid = document.getElementById('my-listing-grid');
                    const empty = document.getElementById('my-listing-empty');
                    
                    if (items.length === 0) {
                        grid.classList.add('hidden');
                        empty.classList.remove('hidden');
                    } else {
                        grid.classList.remove('hidden');
                        empty.classList.add('hidden');
                        // Pakai cardMarkup dari app.js yang sudah di-load
                        grid.innerHTML = items.map(item => cardMarkup(item, true)).join('');
                        
                        // Re-attach event listeners untuk tombol Edit/Terjual/Hapus
                        grid.querySelectorAll("[data-edit-id]").forEach((button) => {
                            button.addEventListener("click", (event) => {
                                event.stopPropagation();
                                openEditListing(button.dataset.editId);
                            });
                        });
                        grid.querySelectorAll("[data-status-id]").forEach((button) => {
                            button.addEventListener("click", (event) => {
                                event.stopPropagation();
                                changeListingStatus(button.dataset.statusId, "sold");
                            });
                        });
                        grid.querySelectorAll("[data-delete-item-id]").forEach((button) => {
                            button.addEventListener("click", (event) => {
                                event.stopPropagation();
                                deleteListing(button.dataset.deleteItemId);
                            });
                        });
                    }
                } catch (e) { console.error(e); }
            }

            // Tombol Tambah Iklan
            document.getElementById('btn-tambah-etalase').addEventListener('click', () => {
                const modal = document.getElementById('listing-dialog');
                if (modal) modal.showModal();
            });

            // Jalankan
            loadMyListings();
        });
    </script>
</body>
</html>