<?php
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['userId'])) { header('Location: login.html'); exit; }
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wishlist Saya - PasarKampus</title>
    
    <!-- PAKAI SLASH (/) DI DEPAN: Browser akan selalu ambil dari http://localhost:8000/css/styles.css -->
    <link rel="stylesheet" href="/css/styles.css">
    
    <style>
        .wishlist-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 28px; 
            padding: 40px 0;
            min-height: calc(100vh - 250px); 
            align-content: center; 
        }
        .wishlist-card { 
            background: #fff; 
            border: 1px solid var(--color-border); 
            border-radius: var(--radius-lg); 
            overflow: hidden; 
            transition: transform 0.2s, box-shadow 0.2s; 
            display: flex;
            flex-direction: column;
        }
        .wishlist-card:hover { 
            transform: translateY(-4px); 
            box-shadow: 0 12px 24px rgba(0,0,0,0.08); 
        }
        .wishlist-body { 
            padding: 20px; 
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .wishlist-date { 
            font-size: 12px; 
            color: var(--color-text-muted); 
            margin-bottom: 8px; 
            display: flex; 
            align-items: center; 
            gap: 6px; 
        }
        .wishlist-title { 
            font-size: 16px; 
            font-weight: 700; 
            margin-bottom: 8px; 
            line-height: 1.4; 
        }
        .wishlist-price { 
            font-size: 18px; 
            font-weight: 800; 
            color: var(--color-primary); 
            margin-bottom: 12px; 
        }
        .wishlist-desc { 
            font-size: 13px; 
            color: var(--color-text-muted); 
            line-height: 1.5; 
            margin-bottom: 16px; 
            display: -webkit-box; 
            -webkit-line-clamp: 3; 
            -webkit-box-orient: vertical; 
            overflow: hidden;
            flex: 1;
        }
        .wishlist-seller { 
            font-size: 12px; 
            color: var(--color-text-muted); 
            margin-bottom: 16px; 
            padding-top: 12px; 
            border-top: 1px solid var(--color-border); 
        }
        .wishlist-actions { 
            display: flex; 
            gap: 8px; 
            margin-top: auto;
        }
        .btn-remove { 
            flex: 1; 
            padding: 10px; 
            background: #fef2f2; 
            color: #ef4444; 
            border: 1px solid #fecaca; 
            border-radius: var(--radius-md); 
            font-weight: 600; 
            cursor: pointer; 
            transition: all 0.2s; 
            font-size: 13px;
        }
        .btn-remove:hover { background: #fee2e2; }
        
        .btn-chat { 
            flex: 1; 
            padding: 10px; 
            background: var(--color-primary); 
            color: #fff; 
            border: none; 
            border-radius: var(--radius-md); 
            font-weight: 600; 
            cursor: pointer; 
            transition: all 0.2s; 
            font-size: 13px;
        }
        .btn-chat:hover { opacity: 0.9; }

        .empty-wishlist { 
            text-align: center; 
            padding: 40px 20px; 
            color: var(--color-text-muted); 
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
        }
        .empty-wishlist > div:first-child { font-size: 80px; margin-bottom: 20px; }
        .empty-wishlist h3 { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #1f2937; }
        .empty-wishlist p { font-size: 16px; margin-bottom: 24px; }
        .empty-wishlist .btn-primary {
            background: var(--color-primary);
            color: #fff;
            padding: 14px 32px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
        }
        .empty-wishlist .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <!-- PAKAI __DIR__: PHP akan mencari folder components DI DALAM folder yang sama dengan file ini (public/) -->
    <?php include 'components\navbar.php'; ?>

    <main class="container">
        <div id="wishlist-container" class="wishlist-grid">
            <div class="empty-wishlist">
                <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                <h3>Memuat wishlist...</h3>
            </div>
        </div>
    </main>

    <!-- PAKAI __DIR__ JUGA UNTUK FOOTER -->
    <?php include __DIR__ . '/components/footer.html'; ?>
    
    <!-- PAKAI SLASH (/) DI DEPAN: Browser akan ambil dari http://localhost:8000/js/... -->
    <script src="/js/components.js"></script>
    <script src="/js/app.js"></script>
    <script>
      async function loadWishlist() {
        try {
          const response = await fetch('/api/wishlist');
          const data = await response.json();
          const container = document.getElementById('wishlist-container');

          if (!data.wishlists || data.wishlists.length === 0) {
            container.innerHTML = `
              <div class="empty-wishlist">
                <div style="font-size: 80px; margin-bottom: 20px;">💔</div>
                <h3>Wishlist kamu masih kosong</h3>
                <p style="margin-top: 8px;">Yuk, cari barang bekas berkualitas dan tambahkan ke sini!</p>
                <a href="/" class="btn btn-primary" style="margin-top: 24px; display: inline-block; text-decoration: none;">Mulai Belanja</a>
              </div>
            `;
            return;
          }

          renderProductCards(data.wishlists, 'wishlist-container', {
            showWishlist: false,
            showSeller: true,
            showDate: true,
            dateLabel: 'Ditambahkan pada',
            showActions: true,
            variant: 'grid'
          });

        } catch (error) {
          console.error('Gagal memuat wishlist:', error);
          document.getElementById('wishlist-container').innerHTML = `
            <div class="empty-wishlist">
              <h3>⚠️ Gagal memuat data.</h3>
              <p>Silakan refresh halaman atau coba lagi nanti.</p>
            </div>`;
        }
      }

      document.addEventListener('DOMContentLoaded', loadWishlist);
    </script>
</body>
</html>