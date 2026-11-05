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
    <title>Obrolan - Re - Campus Gunadarma</title>
    
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
            gap: 0;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            height: calc(100vh - 250px);
            margin-top: 32px;
            position: relative;
        }
        
        .chat-sidebar {
            border-right: 1px solid var(--color-border);
            background: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .chat-role-tabs {
            display: flex;
            border-bottom: 1px solid var(--color-border);
            background: var(--color-bg-body);
            flex-shrink: 0;
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
        
        .conversation-list { 
            flex: 1; 
            overflow-y: auto; 
        }
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
        .chat-window { 
            display: flex; 
            flex-direction: column; 
            background: #fff; 
            position: relative;
            overflow: hidden;
        }
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
        .message-list { 
            flex: 1; 
            overflow-y: auto; 
            padding: 24px; 
            background: var(--color-bg-body); 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
        }
        .msg-bubble { max-width: 75%; padding: 12px 16px; font-size: 14px; line-height: 1.5; border-radius: 16px; }
        .msg-bubble.sent { align-self: flex-end; background: var(--color-primary); color: #fff; border-bottom-right-radius: 4px; }
        .msg-bubble.received { align-self: flex-start; background: #fff; border: 1px solid var(--color-border); border-bottom-left-radius: 4px; }
        .msg-time { font-size: 10px; opacity: 0.7; margin-top: 4px; display: block; text-align: right; }
        
        .chat-input-area { 
            padding: 16px 24px; 
            border-top: 1px solid var(--color-border); 
            background: #fff; 
            display: flex; 
            gap: 12px; 
            flex-shrink: 0;
            z-index: 10;
        }
        .chat-input-area input { flex: 1; height: 44px; padding: 0 16px; border: 1px solid var(--color-border); border-radius: var(--radius-full); font-family: inherit; }
        .chat-input-area input:focus { outline: none; border-color: var(--color-primary); }
    </style>
</head>
<body>

    <?php include 'components/navbar.php'; ?>

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

    <!-- Include Footer -->
    <?php include 'components/footer.html'; ?>

    <!-- Load app.js -->
    <script src="js/app.js"></script>
<script>
// Chat state
const chatState = {
  conversations: [],
  activeConvId: null,
  currentRole: 'buying'
};

// Override initialize()
const originalInitialize = initialize;
initialize = async function() {
  try {
    await loadCategories();
    await refreshUser();
    await loadChatConversations();
    
    state.pollTimer = setInterval(() => {
      if (!state.user) return;
      loadChatConversations().catch(e => console.error('Poll error:', e));
    }, 4000);
    
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

initialize();

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
      <div class="conv-title"> ${escapeHtml(c.listing_title)}</div>
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
  
  // PENTING: Jangan pakai innerHTML untuk replace semua!
  // Kita cuma update bagian yang perlu di-update aja
  
  // 1. Buat header
  const header = document.createElement('div');
  header.className = 'chat-active-header';
  header.innerHTML = `
    <div>
      <strong style="font-size:15px;">${escapeHtml(conv.other_name)}</strong>
      <div style="font-size:12px; color:var(--color-text-muted);">Membahas: <b>${escapeHtml(conv.listing_title)}</b></div>
    </div>
    <div style="font-weight:800; color:var(--color-primary);">Rp${Number(conv.listing_price).toLocaleString('id-ID')}</div>
  `;
  
  // 2. Buat message list
  const msgList = document.createElement('div');
  msgList.className = 'message-list';
  msgList.id = 'msg-list';
  
  // 3. Buat input area
  const inputArea = document.createElement('div');
  inputArea.className = 'chat-input-area';
  inputArea.innerHTML = `
    <label for="chat-file-input" style="cursor: pointer; padding: 8px; color: var(--color-text-muted); display: flex; align-items: center;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
      </svg>
    </label>
    <input type="file" id="chat-file-input" accept="image/*,video/*" style="display: none;">
    <input type="text" id="msg-input" placeholder="Ketik pesan..." maxlength="2000" style="flex: 1; height: 44px; padding: 0 16px; border: 1px solid var(--color-border); border-radius: var(--radius-full); font-family: inherit;">
    <button class="btn btn-primary" id="send-btn" style="border-radius:var(--radius-full); padding:0 24px;">Kirim</button>
  `;
  
  // 4. Buat preview container (PENTING: Jangan sampe ke-replace!)
  const previewContainer = document.createElement('div');
  previewContainer.id = 'file-preview-container';
  previewContainer.style.cssText = 'display: none; position: absolute; bottom: 70px; left: 0; right: 0; background: rgba(0,0,0,0.85); padding: 16px; z-index: 50; border-top-left-radius: 16px; border-top-right-radius: 16px; backdrop-filter: blur(4px);';
  previewContainer.innerHTML = `
    <div style="position: relative; max-height: 300px; display: flex; justify-content: center; align-items: center; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 12px;">
      <img id="preview-img" src="" style="max-width: 100%; max-height: 300px; object-fit: contain; display: none;">
      <video id="preview-vid" src="" controls style="max-width: 100%; max-height: 300px; display: none;"></video>
      <button id="cancel-preview-btn" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;">&times;</button>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <input type="text" id="preview-caption" placeholder="Tambahkan keterangan..." style="flex: 1; padding: 12px 16px; border-radius: 24px; border: none; outline: none; font-size: 14px; background: rgba(255,255,255,0.1); color: white;">
      <button id="send-preview-btn" class="btn btn-primary" style="border-radius: 50%; width: 44px; height: 44px; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
  `;
  
  // 5. Bersihkan window dan tambah elemen-elemen baru
  win.innerHTML = '';
  win.appendChild(header);
  win.appendChild(msgList);
  win.appendChild(previewContainer);
  win.appendChild(inputArea);
  
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
      
      let content = '';
      
      if (m.attachment_type === 'image') {
        content += `<img src="${m.attachment_url}" style="max-width: 200px; border-radius: 8px; margin-bottom: 4px; cursor: pointer;" onclick="window.open('${m.attachment_url}', '_blank')">`;
      } else if (m.attachment_type === 'video') {
        content += `<video src="${m.attachment_url}" controls style="max-width: 200px; border-radius: 8px; margin-bottom: 4px;"></video>`;
      }
      
      if (m.body) {
        content += `<div>${escapeHtml(m.body)}</div>`;
      }
      
      if (!content) {
        content = '<div style="color: var(--color-text-muted); font-style: italic;">[Lampiran tidak tersedia]</div>';
      }
      
      return `<div class="msg-bubble ${isMine ? 'sent' : 'received'}">${content}<span class="msg-time">${time}</span></div>`;
    }).join('');
    
    list.scrollTop = list.scrollHeight;
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

// Fungsi aman untuk get element
function safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`️ Element #${id} not found!`);
    }
    return el;
}

// ============================================================
// WHATSAPP-STYLE PREVIEW & CAPTION LOGIC
// ============================================================

// 1. Saat user memilih file
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'chat-file-input') {
        const file = e.target.files[0];
        if (!file) return;

        const container = safeGetElement('file-preview-container');
        const previewImg = safeGetElement('preview-img');
        const previewVid = safeGetElement('preview-vid');
        const captionInput = safeGetElement('preview-caption');

        if (!container) {
            console.error('❌ Preview container tidak ditemukan!');
            return;
        }

        const url = URL.createObjectURL(file);
        
        if (previewImg) previewImg.style.display = 'none';
        if (previewVid) previewVid.style.display = 'none';

        if (file.type.startsWith('image/')) {
            if (previewImg) {
                previewImg.src = url;
                previewImg.style.display = 'block';
            }
        } else if (file.type.startsWith('video/')) {
            if (previewVid) {
                previewVid.src = url;
                previewVid.style.display = 'block';
            }
        }

        container.style.display = 'block';
        if (captionInput) {
            captionInput.value = ''; 
            setTimeout(() => captionInput.focus(), 100);
        }
    }
});

// 2. Saat user klik tombol Batal (X)
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'cancel-preview-btn') {
        const container = safeGetElement('file-preview-container');
        const fileInput = safeGetElement('chat-file-input');
        
        if (container) container.style.display = 'none';
        if (fileInput) fileInput.value = '';
    }
});

// 3. Fungsi Kirim Pesan
async function sendChatMessage() {
    const container = safeGetElement('file-preview-container');
    const isPreviewMode = container && container.style.display === 'block';
    
    let body = '';
    let file = null;

    if (isPreviewMode) {
        const captionInput = safeGetElement('preview-caption');
        const fileInput = safeGetElement('chat-file-input');
        body = captionInput ? captionInput.value.trim() : '';
        file = fileInput ? fileInput.files[0] : null;
    } else {
        const input = safeGetElement('msg-input');
        body = input ? input.value.trim() : '';
    }

    if (!body && !file) {
        alert('⚠️ Pesan atau lampiran harus diisi!');
        return;
    }

    const convId = chatState.activeConvId;
    if (!convId) {
        alert('⚠️ Pilih percakapan terlebih dahulu!');
        return;
    }

    const formData = new FormData();
    formData.append('body', body);
    if (file) formData.append('attachment', file);

    try {
        const response = await fetch(`/api/conversations/${convId}/messages`, {
            method: 'POST',
            body: formData 
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Gagal mengirim pesan');
        }
        
        if (isPreviewMode) {
            if (container) container.style.display = 'none';
            const fileInput = safeGetElement('chat-file-input');
            const captionInput = safeGetElement('preview-caption');
            if (fileInput) fileInput.value = '';
            if (captionInput) captionInput.value = '';
        } else {
            const input = safeGetElement('msg-input');
            if (input) input.value = '';
        }
        
        await loadChatMessages(convId);
        await loadChatConversations();
        
    } catch (error) {
        console.error('❌ ERROR DETAIL:', error);
        alert('Gagal: ' + error.message);
    }
}

// 4. Hubungkan tombol "Kirim" di preview
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'send-preview-btn') {
        sendChatMessage();
    }
});

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