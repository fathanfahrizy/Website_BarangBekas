<?php
// 1. INI PALING ATAS (SERVER SIDE LOGIC)
if (session_status() === PHP_SESSION_NONE) session_start();

$userId = $_SESSION['userId'] ?? null;
$userName = $_SESSION['userName'] ?? 'User';
$userInitial = strtoupper(substr($userName, 0, 1));

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
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Obrolan - PasarKampus Gunadarma</title>
    
    <!-- CSS Utama -->
    <link rel="stylesheet" href="css/styles.css">

    <!-- CSS Khusus Halaman Chat -->
    <style>
        .chat-page-header {
            background: var(--color-primary);
            color: #fff;
            padding: 32px 0;
            border-bottom: 1px solid var(--color-border);
        }
        .chat-page-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
        .chat-page-header p { font-size: 14px; opacity: 0.9; }
        
        .chat-layout-wrapper {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 24px;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            height: 650px;
            margin-top: 32px;
        }
        
        /* Sidebar Kiri */
        .chat-sidebar {
            border-right: 1px solid var(--color-border);
            background: #fff;
            display: flex;
            flex-direction: column;
        }
        .chat-role-tabs {
            display: flex;
            border-bottom: 1px solid var(--color-border);
            background: var(--color-bg-body);
        }
        .chat-role-btn {
            flex: 1;
            padding: 14px;
            font-size: 12px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            background: transparent;
            color: var(--color-text-muted);
            transition: all 0.2s;
        }
        .chat-role-btn.active { background: var(--color-primary); color: #fff; }
        .chat-role-btn:first-child { border-right: 1px solid var(--color-border); }
        
        .conversation-list { flex: 1; overflow-y: auto; }
        .conv-item {
            padding: 16px;
            border-bottom: 1px solid var(--color-border);
            cursor: pointer;
            transition: background 0.15s;
        }
        .conv-item:hover { background: var(--color-primary-subtle); }
        .conv-item.active { background: var(--color-bg-body); border-left: 3px solid var(--color-primary); }
        .conv-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-last-msg { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* Area Chat Kanan */
        .chat-window { display: flex; flex-direction: column; background: #fff; }
        .chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-muted); }
        .chat-empty span { font-size: 48px; margin-bottom: 16px; }
        
        .chat-active-header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--color-border);
            background: var(--color-bg-body);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .message-list { flex: 1; overflow-y: auto; padding: 24px; background: var(--color-bg-body); display: flex; flex-direction: column; gap: 12px; }
        .msg-bubble { max-width: 75%; padding: 12px 16px; font-size: 14px; line-height: 1.5; border-radius: 16px; }
        .msg-bubble.sent { align-self: flex-end; background: var(--color-primary); color: #fff; border-bottom-right-radius: 4px; }
        .msg-bubble.received { align-self: flex-start; background: #fff; border: 1px solid var(--color-border); border-bottom-left-radius: 4px; }
        .msg-time { font-size: 10px; opacity: 0.7; margin-top: 4px; display: block; text-align: right; }
        
        .chat-input-area { padding: 16px 24px; border-top: 1px solid var(--color-border); background: #fff; display: flex; gap: 12px; }
        .chat-input-area input { flex: 1; height: 44px; padding: 0 16px; border: 1px solid var(--color-border); border-radius: var(--radius-full); font-family: inherit; }
        .chat-input-area input:focus { outline: none; border-color: var(--color-primary); }
    </style>
</head>
<body>

    <?php include 'public/components/navbar.php'; ?>

    <!-- Konten Utama Chat -->
    <main class="container" style="padding-bottom: 80px;">
        <div class="chat-layout-wrapper">
            <!-- Sidebar Daftar Chat -->
            <aside class="chat-sidebar">
                <div class="chat-role-tabs">
                    <button class="chat-role-btn active" data-role="buying">🛒 Saya Membeli</button>
                    <button class="chat-role-btn" data-role="selling">🏷️ Saya Menjual</button>
                </div>
                <div class="conversation-list" id="conv-list">
                    <div style="padding: 40px; text-align: center; color: var(--color-text-muted);">Memuat obrolan...</div>
                </div>
            </aside>

            <!-- Area Pesan -->
            <div class="chat-window" id="chat-window">
                <div class="chat-empty">
                    <span>💬</span>
                    <h3>Pilih Percakapan</h3>
                    <p>Klik salah satu obrolan di sebelah kiri untuk mulai chat.</p>
                </div>
            </div>
        </div>
    </main>

    <!-- Include Footer (SAMA dengan index.php - ada modal-modal) -->
    <?php include 'components/footer.html'; ?>

    <!-- Load app.js (supaya semua tombol di header berfungsi) -->
    <script src="js/app.js"></script>
<script>
// Chat state
const chatState = {
  conversations: [],
  activeConvId: null,
  currentRole: 'buying'
};

// Override initialize() - skip loadListings() tapi tetap load user & conversations
const originalInitialize = initialize;
initialize = async function() {
  try {
    await loadCategories();
    await refreshUser();
    
    // Load conversations untuk chat page
    await loadChatConversations();
    
    // Polling setiap 4 detik
    state.pollTimer = setInterval(() => {
      if (!state.user) return;
      loadChatConversations().catch(e => console.error('Poll error:', e));
    }, 4000);
    
    // Handle ?conv=ID dari URL
    const urlConv = new URLSearchParams(window.location.search).get('conv');
    if (urlConv) {
      setTimeout(() => {
        const target = chatState.conversations.find(c => String(c.id) === String(urlConv));
        if (target) openChat(urlConv, target);
      }, 500);
    }
  } catch (error) {
    console.error('Init error:', error);
    toast(error.message);
  }
};

// Panggil initialize yang udah di-override
initialize();

// Chat-specific functions
async function loadChatConversations() {
  console.log('🔄 Loading conversations...');
  try {
    const { conversations } = await api('/api/conversations');
    console.log('✅ Conversations loaded:', conversations);
    chatState.conversations = conversations;
    renderChatConversations();
  } catch (error) {
    console.error('❌ Failed to load conversations:', error);
    $('#conv-list').innerHTML = `<div style="padding:20px; text-align:center; color:red;">Error: ${error.message}</div>`;
  }
}

function renderChatConversations() {
  const list = $('#conv-list');
  const filtered = chatState.conversations.filter(c => c.role === chatState.currentRole);
  
  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:40px; text-align:center; color:var(--color-text-muted);">Belum ada obrolan.</div>`;
    return;
  }
  
  list.innerHTML = filtered.map(c => `
    <div class="conv-item ${chatState.activeConvId == c.id ? 'active' : ''}" data-id="${c.id}">
      <div class="conv-title">📦 ${escapeHtml(c.listing_title)}</div>
      <div class="conv-last-msg">${escapeHtml(c.last_message || 'Belum ada pesan')}</div>
    </div>
  `).join('');
  
  $$('.conv-item').forEach(el => el.addEventListener('click', () => {
    const conv = filtered.find(c => c.id == el.dataset.id);
    openChat(el.dataset.id, conv);
  }));
}

async function openChat(id, conv) {
  chatState.activeConvId = id;
  renderChatConversations();
  
  const win = $('#chat-window');
  win.innerHTML = `
    <div class="chat-active-header">
      <div>
        <strong style="font-size:15px;">${escapeHtml(conv.other_name)}</strong>
        <div style="font-size:12px; color:var(--color-text-muted);">Membahas: <b>${escapeHtml(conv.listing_title)}</b></div>
      </div>
      <div style="font-weight:800; color:var(--color-primary);">Rp${Number(conv.listing_price).toLocaleString('id-ID')}</div>
    </div>
    <div class="message-list" id="msg-list"></div>
    <div class="chat-input-area">
      <input type="text" id="msg-input" placeholder="Ketik pesan..." maxlength="2000">
      <button class="btn btn-primary" id="send-btn" style="border-radius:var(--radius-full); padding:0 24px;">Kirim</button>
    </div>
  `;
  
  await loadChatMessages(id);
  
  $('#send-btn').addEventListener('click', sendChatMessage);
  $('#msg-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
}

async function loadChatMessages(id) {
  try {
    const { messages } = await api(`/api/conversations/${id}/messages`);
    const list = $('#msg-list');
    if (!list) return;
    
    list.innerHTML = messages.map(m => {
      const isMine = m.sender_id == state.user.id;
      const time = new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `<div class="msg-bubble ${isMine ? 'sent' : 'received'}">${escapeHtml(m.body)}<span class="msg-time">${time}</span></div>`;
    }).join('');
    list.scrollTop = list.scrollHeight;
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

async function sendChatMessage() {
  const input = $('#msg-input');
  const body = input.value.trim();
  if (!body || !chatState.activeConvId) return;
  
  try {
    await api(`/api/conversations/${chatState.activeConvId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
    input.value = '';
    await loadChatMessages(chatState.activeConvId);
    await loadChatConversations();
  } catch (error) {
    toast('Gagal kirim pesan');
  }
}

// Role switcher
$$('.chat-role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.chat-role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chatState.currentRole = btn.dataset.role;
    chatState.activeConvId = null;
    renderChatConversations();
    $('#chat-window').innerHTML = `<div class="chat-empty"><span>💬</span><h3>Pilih Percakapan</h3><p>Klik salah satu obrolan di sebelah kiri untuk mulai chat.</p></div>`;
  });
});
</script>
</body>
</html>