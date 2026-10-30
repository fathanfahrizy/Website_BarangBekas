const conditionNames = {
  needs_repair: "Perlu perbaikan",
  fair: "Layak",
  good: "Bagus",
  like_new: "Seperti baru",
};
const state = { user: null, activeConversation: null, conversations: [], pollTimer: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : {};
  if (!response.ok) throw new Error(data.error || "Permintaan gagal. Silakan coba lagi.");
  return data;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("visible"), 3000);
}

function setError(element, message) {
  element.textContent = message;
  element.classList.toggle("hidden", !message);
}

function displayAuth(mode = "login") {
  setAuthMode(mode);
  $("#auth-dialog").showModal();
}

function setAuthMode(mode) {
  const register = mode === "register";
  $$(".auth-tab").forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
  $$(".register-only").forEach((wrapper) => wrapper.classList.toggle("hidden", !register));
  ["fullName", "phone"].forEach((name) => {
    $("#auth-form").elements[name].required = register;
  });
  $("#auth-form").elements.username.required = false;
  $("#auth-form").elements.password.autocomplete = register ? "new-password" : "current-password";
  $("#auth-title").textContent = register ? "Buat akun kampusmu" : "Selamat datang kembali";
  $("#auth-subtitle").textContent = register
    ? "Daftar dengan NPM Gunadarma untuk mulai jual beli."
    : "Masuk dengan NPM Gunadarma.";
  $("#auth-submit").textContent = register ? "Buat akun" : "Masuk";
  $("#auth-form").dataset.mode = mode;
  setError($("#auth-error"), "");
}

function avatarMarkup(url, name) {
  const initial = escapeHtml((name || "?").trim().charAt(0).toUpperCase());
  return url
    ? `<div style="width:24px; height:24px; border-radius:50%; overflow:hidden;"><img src="${escapeHtml(url)}" style="width:100%; height:100%; object-fit:cover;" alt=""></div>`
    : `<div style="width:24px; height:24px; border-radius:50%; background:var(--color-primary-subtle); color:var(--color-primary); display:grid; place-items:center; font-size:12px; font-weight:bold;">${initial}</div>`;
}

function formatPrice(value) {
  return `Rp${Number(value).toLocaleString("id-ID")}`;
}

function cardMarkup(item, own = false) {
  const sold = item.status === "sold";
  const image = item.image_url
    ? `<img src="${escapeHtml(item.image_url)}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s;" alt="${escapeHtml(item.title)}" loading="lazy">`
    : `<span style="font-size:40px; color:var(--color-text-light);" aria-hidden="true">📦</span>`;
  
  const locationBadge = item.meetup_location
    ? `<span style="position:absolute; bottom:8px; left:8px; background:rgba(217, 119, 6, 0.95); color:#fff; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px;">📍 ${escapeHtml(item.meetup_location.split('(')[0].trim())}</span>`
    : '';
  
  const conditionBadge = !sold && item.item_condition
    ? `<span style="position:absolute; top:8px; right:8px; background:rgba(92, 45, 145, 0.9); color:#fff; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px;">${escapeHtml(conditionNames[item.item_condition] || "")}</span>`
    : '';

  return `<article class="listing-card" style="background:#fff; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; cursor:pointer; display:flex; flex-direction:column; transition:transform 0.2s, box-shadow 0.2s;" data-listing-id="${escapeHtml(item.id)}" tabindex="0">
    <div style="position:relative; height:180px; background:var(--color-bg-body); overflow:hidden; display:grid; place-items:center;">
      ${image}
      ${sold ? '<span style="position:absolute; top:8px; left:8px; background:rgba(239, 68, 68, 0.9); color:#fff; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px;">TERJUAL</span>' : `${conditionBadge}${locationBadge}`}
    </div>
    <div style="padding:16px; display:flex; flex-direction:column; flex:1;">
      <div style="font-size:10px; font-weight:800; color:var(--color-primary); text-transform:uppercase; margin-bottom:4px;">${escapeHtml(item.category)}</div>
      <div style="font-size:14px; font-weight:600; color:var(--color-text-main); line-height:1.4; margin-bottom:8px; height:40px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
      <div style="font-size:18px; font-weight:800; color:var(--color-primary-dark); margin-bottom:12px;">${formatPrice(item.price)}</div>
      <div style="margin-top:auto; padding-top:12px; border-top:1px solid var(--color-border); display:flex; align-items:center; justify-content:space-between; font-size:11px; color:var(--color-text-muted);">
        <span style="display:flex; align-items:center; gap:8px; font-weight:600; max-width:65%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(item.seller_name)}">${avatarMarkup(item.seller_avatar, item.seller_name)}${escapeHtml(item.seller_name)}</span>
        ${own && !sold ? `<button class="btn-outline" style="padding:4px 8px; border-radius:var(--radius-sm); font-size:10px;" data-status-id="${escapeHtml(item.id)}" aria-label="Tandai terjual">Terjual</button>` : ""}
        ${own && sold ? `<button class="btn-outline" style="padding:4px 8px; border-radius:var(--radius-sm); font-size:10px;" data-reactivate-id="${escapeHtml(item.id)}" aria-label="Aktifkan kembali">Aktifkan</button>` : `<span style="font-weight:600;">${sold ? "Terjual" : "🤝 Siap COD"}</span>`}
      </div>
    </div>
  </article>`;
}

function renderListings(items, own = false) {
  const grid = $(own ? "#my-listing-grid" : "#listing-grid");
  const empty = $(own ? "#my-listing-empty" : "#market-empty");
  grid.innerHTML = items.map((item) => cardMarkup(item, own)).join("");
  empty.classList.toggle("hidden", items.length > 0);
  grid.classList.toggle("hidden", items.length === 0);
  grid.querySelectorAll(".listing-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-status-id], [data-reactivate-id]")) return;
      showListing(card.dataset.listingId);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showListing(card.dataset.listingId);
      }
    });
  });
  grid.querySelectorAll("[data-status-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      changeListingStatus(button.dataset.statusId, "sold");
    });
  });
  grid.querySelectorAll("[data-reactivate-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      changeListingStatus(button.dataset.reactivateId, "active");
    });
  });
}

async function loadListings(own = false) {
  const params = new URLSearchParams();
  if (own) params.set("mine", "true");
  else {
    const query = $("#search-input").value.trim();
    const category = $("#category-filter").value;
    if (query) params.set("q", query);
    if (category) params.set("category", category);
  }
  const data = await api(`/api/listings?${params}`);
  renderListings(data.listings, own);
}

async function loadCategories() {
  const { categories } = await api("/api/categories");
  categories.forEach((category) => {
    $("#category-filter").insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
    $("#listing-form").elements.categoryId.insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
  });
}

function updateUserUI() {
  $$(".signed-in-only").forEach((element) => element.classList.toggle("hidden", !state.user));
  $("#login-button").classList.toggle("hidden", !!state.user);
  $("#account-button").classList.toggle("hidden", !state.user);
  $("#messages-nav").classList.toggle("hidden", !state.user);
  
  const topNpm = $("#top-user-npm");
  if (topNpm) topNpm.textContent = state.user ? state.user.npm : "-";

  const heroName = $("#hero-user-name");
  if (heroName) heroName.textContent = state.user ? state.user.displayName : "Tamu Kampus";

  const heroAvatar = $("#hero-user-avatar");
  if (heroAvatar) {
    heroAvatar.innerHTML = state.user && state.user.avatarUrl
      ? `<img src="${escapeHtml(state.user.avatarUrl)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="">`
      : (state.user ? escapeHtml(state.user.displayName.charAt(0).toUpperCase()) : "🎓");
  }

  if (state.user) {
    $("#account-button").innerHTML = state.user.avatarUrl
      ? `<div class="avatar-sm" style="overflow:hidden;"><img src="${escapeHtml(state.user.avatarUrl)}" style="width:100%; height:100%; object-fit:cover;" alt=""></div>`
      : `<div class="avatar-sm">${escapeHtml((state.user.displayName || "?").charAt(0).toUpperCase())}</div>`;
    $("#account-button").title = state.user.displayName;
    $("#profile-form").elements.fullName.value = state.user.name;
    $("#profile-form").elements.username.value = state.user.username || "";
    $("#profile-form").elements.npm.value = state.user.npm;
    $("#profile-form").elements.phone.value = state.user.phone;
    $("#profile-photo").innerHTML = state.user.avatarUrl
      ? `<img src="${escapeHtml(state.user.avatarUrl)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Foto profil">`
      : escapeHtml((state.user.displayName || "?").charAt(0).toUpperCase());
  }
}

async function refreshUser() {
  const { user } = await api("/api/me");
  state.user = user;
  updateUserUI();
  if (user) await refreshConversations();
}

function switchView(name) {
  if (["my-listings", "chats", "profile"].includes(name) && !state.user) {
    displayAuth();
    return;
  }
  $$(".view-section").forEach((panel) => panel.classList.toggle("hidden", panel.id !== `${name}-view`));
  $$(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === name));
  
  const heroBanner = $("#welcome-banner");
  if (heroBanner) heroBanner.classList.toggle("hidden", name !== "market");
  
  if (name === "my-listings") loadListings(true).catch(showError);
  if (name === "market") loadListings().catch(showError);
  if (name === "chats") refreshConversations().catch(showError);
}

function showError(error) {
  toast(error.message || "Terjadi kesalahan. Silakan coba lagi.");
}

function showListing(id) {
  api(`/api/listings/${encodeURIComponent(id)}`).then(({ listing }) => {
    const isOwn = state.user && String(state.user.id) === String(listing.seller_id);
    const sold = listing.status === "sold";
    const gallery = listing.images?.[0]
      ? `<img src="${escapeHtml(listing.images[0])}" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);" alt="${escapeHtml(listing.title)}">`
      : `<div style="width:100%; height:100%; display:grid; place-items:center; background:var(--color-bg-body); font-size:48px;">📦</div>`;
    
    const sellerAvatar = listing.seller_avatar
      ? `<div style="width:40px; height:40px; border-radius:50%; overflow:hidden;"><img src="${escapeHtml(listing.seller_avatar)}" style="width:100%; height:100%; object-fit:cover;" alt=""></div>`
      : `<div style="width:40px; height:40px; border-radius:50%; background:var(--color-primary-subtle); color:var(--color-primary); display:grid; place-items:center; font-weight:bold;">${escapeHtml(listing.seller_name.charAt(0).toUpperCase())}</div>`;
    
    $("#detail-content").innerHTML = `
      <div style="display:grid; grid-template-columns:300px 1fr; gap:32px;">
        <div style="height:300px; background:var(--color-bg-body); border-radius:var(--radius-md); overflow:hidden;">${gallery}</div>
        <div style="display:flex; flex-direction:column;">
          <span style="font-size:11px; font-weight:800; color:var(--color-primary); letter-spacing:1px; text-transform:uppercase;">${escapeHtml(listing.category)}${sold ? " · TERJUAL" : ""}</span>
          <h2 style="font-size:24px; font-weight:700; color:var(--color-text-main); line-height:1.3; margin:8px 0 12px;">${escapeHtml(listing.title)}</h2>
          <div style="font-size:28px; font-weight:800; color:var(--color-primary-dark); margin-bottom:16px;">${formatPrice(listing.price)}</div>
          
          <div style="background:var(--color-bg-body); padding:16px; border-radius:var(--radius-md); font-size:13px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">
            <div>Kondisi: <strong>${escapeHtml(conditionNames[listing.item_condition])}</strong></div>
            <div>Meetup COD: <strong>${escapeHtml(listing.meetup_location || "Disepakati lewat chat")}</strong></div>
          </div>
          
          <p style="font-size:14px; color:var(--color-text-muted); line-height:1.6; margin-bottom:24px; max-height:150px; overflow-y:auto;">${escapeHtml(listing.description).replace(/\n/g, '<br>')}</p>
          
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px; padding-top:16px; border-top:1px solid var(--color-border);">
            ${sellerAvatar}
            <div style="display:flex; flex-direction:column;">
              <strong style="font-size:14px;">${escapeHtml(listing.seller_name)}</strong>
              <span class="text-xs text-gray">Mahasiswa Gunadarma</span>
            </div>
          </div>
          
          <div style="margin-top:auto;">
            ${isOwn ? `<button class="btn btn-outline w-full" disabled>Ini barang yang kamu pasang</button>` : sold ? `<button class="btn btn-outline w-full" disabled>Barang sudah terjual</button>` : `<button class="btn btn-primary w-full" id="chat-seller">💬 Chat Penjual & Janji COD</button>`}
          </div>
        </div>
      </div>
    `;
    
    // Sesuaikan layout modal detail untuk mobile
    if (window.innerWidth < 768) {
      const detailGrid = $("#detail-content > div");
      if (detailGrid) detailGrid.style.gridTemplateColumns = "1fr";
    }

    $("#detail-dialog").showModal();
    const chatButton = $("#chat-seller");
    if (chatButton) chatButton.addEventListener("click", () => startConversation(listing.id));
  }).catch(showError);
}

async function startConversation(listingId) {
  if (!state.user) {
    $("#detail-dialog").close();
    displayAuth();
    return;
  }
  try {
    const { conversationId } = await api("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    $("#detail-dialog").close();
    await refreshConversations();
    switchView("chats");
    await openConversation(conversationId);
  } catch (error) {
    showError(error);
  }
}

async function changeListingStatus(id, status) {
  try {
    await api(`/api/listings/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(status === "sold" ? "Barang ditandai terjual." : "Barang aktif kembali.");
    await loadListings(true);
    await loadListings();
  } catch (error) {
    showError(error);
  }
}

async function refreshConversations() {
  if (!state.user) return;
  const { conversations } = await api("/api/conversations");
  state.conversations = conversations;
  const list = $("#conversation-list");
  
  if (list) {
    list.style.background = "#fff";
    list.style.borderRight = "1px solid var(--color-border)";
    list.style.overflowY = "auto";
    
    list.innerHTML = conversations.length ? conversations.map((conversation) => `
      <button class="conversation-entry" data-conversation-id="${escapeHtml(conversation.id)}" style="display:flex; flex-direction:column; width:100%; padding:16px; text-align:left; border-bottom:1px solid var(--color-border); background:${String(state.activeConversation) === String(conversation.id) ? 'var(--color-bg-body)' : '#fff'}; border-left:${String(state.activeConversation) === String(conversation.id) ? '4px solid var(--color-primary)' : '4px solid transparent'}; transition:background 0.2s;">
        <strong style="font-size:14px; color:var(--color-text-main); margin-bottom:4px;">${escapeHtml(conversation.other_name)}</strong>
        <span style="font-size:13px; color:var(--color-primary); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(conversation.listing_title)}</span>
        <small class="text-gray" style="font-size:12px; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(conversation.last_message || "Mulai percakapan")}</small>
      </button>`).join("") : `<div style="padding:32px 16px; text-align:center; color:var(--color-text-muted); font-size:13px;"><div style="font-size:32px; margin-bottom:12px;">💬</div>Belum ada percakapan.<br>Mulai chat dari halaman barang.</div>`;
    
    list.querySelectorAll("[data-conversation-id]").forEach((button) => {
      button.addEventListener("click", () => openConversation(button.dataset.conversationId));
    });
  }

  const chatCount = $("#chat-count");
  if (chatCount) {
    chatCount.textContent = conversations.length;
    chatCount.classList.toggle("hidden", !conversations.length);
  }
  
  const messageDot = $("#message-dot");
  if (messageDot) {
    messageDot.classList.toggle("hidden", !conversations.length);
  }

  if (state.activeConversation && $("#chats-view") && $("#chats-view").classList.contains("hidden") === false) {
    const exists = conversations.some((item) => String(item.id) === String(state.activeConversation));
    if (!exists) state.activeConversation = null;
  }
}

async function openConversation(id) {
  state.activeConversation = id;
  await refreshConversations();
  const conversation = state.conversations.find((item) => String(item.id) === String(id));
  if (!conversation) return;
  const windowElement = $("#chat-window");
  
  if (windowElement) {
    windowElement.style.display = "flex";
    windowElement.style.flexDirection = "column";
    windowElement.style.height = "500px"; // Fixed height untuk area chat
    
    windowElement.innerHTML = `
      <div style="padding:16px 24px; border-bottom:1px solid var(--color-border); background:#fff; display:flex; align-items:center; gap:16px;">
        <div class="avatar-sm">✉</div>
        <div style="display:flex; flex-direction:column;">
          <strong style="font-size:15px; color:var(--color-text-main);">${escapeHtml(conversation.other_name)}</strong>
          <small class="text-gray" style="font-size:12px;">Membahas: ${escapeHtml(conversation.listing_title)}${conversation.listing_status === "sold" ? " <b style='color:var(--color-danger);'>· (Terjual)</b>" : ""}</small>
        </div>
      </div>
      
      <div id="message-list" style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px; background:var(--color-bg-body);"></div>
      
      <div style="display:flex; gap:8px; padding:12px 24px; background:#fff; border-top:1px solid var(--color-border); overflow-x:auto;">
        <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Barang masih ready?</button>
        <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD di Margonda?</button>
        <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD Kelapa Dua?</button>
      </div>
      
      <form id="message-form" style="display:flex; gap:12px; padding:16px 24px; background:#fff; border-top:1px solid var(--color-border);">
        <input name="body" class="form-input" style="flex:1; border-radius:var(--radius-full);" maxlength="2000" placeholder="Tulis pesan atau tawaran..." autocomplete="off" required>
        <button class="btn btn-primary" style="border-radius:var(--radius-full); padding:0 24px;" type="submit" aria-label="Kirim pesan">Kirim</button>
      </form>`;
    
    windowElement.querySelectorAll(".quick-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const input = $("#message-form").elements.body;
        input.value = chip.textContent;
        input.focus();
      });
    });

    $("#message-form").addEventListener("submit", sendMessage);
    await loadMessages(id);
  }
}

async function loadMessages(id) {
  const { messages } = await api(`/api/conversations/${encodeURIComponent(id)}/messages`);
  if (String(state.activeConversation) !== String(id)) return;
  const list = $("#message-list");
  
  if (list) {
    const previousHeight = list.scrollHeight;
    list.innerHTML = messages.map((message) => {
      const mine = String(message.sender_id) === String(state.user.id);
      const time = new Date(message.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      
      return `
        <div style="max-width:75%; padding:12px 16px; font-size:14px; align-self:${mine ? 'flex-end' : 'flex-start'}; background:${mine ? 'var(--color-primary)' : '#fff'}; color:${mine ? '#fff' : 'var(--color-text-main)'}; border-radius:${mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px'}; box-shadow:var(--shadow-sm); line-height:1.5;">
          ${escapeHtml(message.body)}
          <time style="display:block; font-size:10px; margin-top:6px; opacity:0.8; text-align:${mine ? 'right' : 'left'};">${time}</time>
        </div>`;
    }).join("");
    
    if (list.scrollHeight !== previousHeight || list.scrollTop + list.clientHeight >= previousHeight - 30) {
      list.scrollTop = list.scrollHeight;
    }
  }
}

async function sendMessage(event) {
  event.preventDefault();
  const input = event.currentTarget.elements.body;
  const body = input.value.trim();
  if (!body || !state.activeConversation) return;
  input.disabled = true;
  try {
    await api(`/api/conversations/${encodeURIComponent(state.activeConversation)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    input.value = "";
    await Promise.all([loadMessages(state.activeConversation), refreshConversations()]);
  } catch (error) {
    showError(error);
  } finally {
    input.disabled = false;
    input.focus();
  }
}

$$(".nav-tab").forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));

// Search input & button
const searchInput = $("#search-input");
if (searchInput) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") loadListings().catch(showError);
  });
}
const searchBtn = $("#search-button");
if (searchBtn) searchBtn.addEventListener("click", () => loadListings().catch(showError));

// Trending keywords 
$$(".keyword-tag").forEach((tag) => {
  tag.addEventListener("click", () => {
    if ($("#search-input")) $("#search-input").value = tag.dataset.query;
    loadListings().catch(showError);
  });
});

// Category Filter change & sync pills
function syncCategoryPills(catId) {
  $$(".pill-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.catId === String(catId || "")));
}

const catFilter = $("#category-filter");
if (catFilter) {
  catFilter.addEventListener("change", (e) => {
    syncCategoryPills(e.target.value);
    loadListings().catch(showError);
  });
}

$$(".pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const catId = btn.dataset.catId;
    if ($("#category-filter")) $("#category-filter").value = catId;
    syncCategoryPills(catId);
    loadListings().catch(showError);
  });
});

// Category Sidebar Menu 
$$(".sidebar-item").forEach((item) => {
  item.addEventListener("click", () => {
    const catId = item.dataset.category;
    if ($("#category-filter")) $("#category-filter").value = catId;
    syncCategoryPills(catId);
    loadListings().catch(showError);
    const market = $("#market-view");
    if (market) market.scrollIntoView({ behavior: "smooth" });
  });
});

// Sell buttons
["#sell-button", "#welcome-sell", "#empty-sell", "#my-sell", "#hero-action-sell", "#dock-sell", "#footer-sell-link"].forEach((selector) => {
  const el = $(selector);
  if (el) {
    el.addEventListener("click", () => {
      if (!state.user) displayAuth("register");
      else $("#listing-dialog").showModal();
    });
  }
});

// Hero action login / profile
const heroLogin = $("#hero-action-login");
if (heroLogin) {
  heroLogin.addEventListener("click", () => {
    if (state.user) switchView("profile");
    else displayAuth("login");
  });
}

// Floating dock buttons
const dockChats = $("#dock-chats");
if (dockChats) dockChats.addEventListener("click", () => switchView("chats"));

const dockMy = $("#dock-my");
if (dockMy) dockMy.addEventListener("click", () => switchView("my-listings"));

const dockTop = $("#dock-top");
if (dockTop) dockTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Footer links
$$("[data-footer-cat]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const catId = link.dataset.footerCat;
    if ($("#category-filter")) $("#category-filter").value = catId;
    syncCategoryPills(catId);
    loadListings().catch(showError);
    const market = $("#market-view");
    if (market) market.scrollIntoView({ behavior: "smooth" });
  });
});

const footerLogin = $("#footer-login-link");
if (footerLogin) {
  footerLogin.addEventListener("click", (e) => {
    e.preventDefault();
    if (state.user) switchView("profile");
    else displayAuth("register");
  });
}

if ($("#login-button")) $("#login-button").addEventListener("click", () => displayAuth());
if ($("#account-button")) $("#account-button").addEventListener("click", () => switchView("profile"));
if ($("#messages-nav")) $("#messages-nav").addEventListener("click", () => switchView("chats"));

const logoutBtn = $("#logout-button");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST" });
      state.user = null;
      state.activeConversation = null;
      updateUserUI();
      switchView("market");
      toast("Kamu sudah keluar.");
    } catch (error) {
      showError(error);
    }
  });
}

$$("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
$$("[data-close]").forEach((button) => button.addEventListener("click", () => {
  const dialog = $(`#${button.dataset.close}`);
  if (dialog) dialog.close();
}));

$$("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
}));

const authForm = $("#auth-form");
if (authForm) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const mode = form.dataset.mode;
    const payload = Object.fromEntries(new FormData(form));
    setError($("#auth-error"), "");
    
    const submitBtn = $("#auth-submit");
    if (submitBtn) submitBtn.disabled = true;
    
    try {
      const { user } = await api(`/api/${mode === "register" ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      state.user = user;
      updateUserUI();
      if ($("#auth-dialog")) $("#auth-dialog").close();
      await refreshConversations();
      toast(mode === "register" ? "Akun berhasil dibuat. Selamat datang!" : "Berhasil masuk. Selamat datang kembali!");
    } catch (error) {
      setError($("#auth-error"), error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

const listingForm = $("#listing-form");
if (listingForm) {
  listingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError($("#listing-error"), "");
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      await api("/api/listings", { method: "POST", body: new FormData(form) });
      form.reset();
      if ($("#listing-dialog")) $("#listing-dialog").close();
      await loadListings();
      toast("Barang berhasil dipasang di marketplace!");
    } catch (error) {
      setError($("#listing-error"), error.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

const profileForm = $("#profile-form");
if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const { user } = await api("/api/profile", { method: "PUT", body: new FormData(event.currentTarget) });
      state.user = user;
      updateUserUI();
      toast("Profil berhasil disimpan.");
    } catch (error) {
      showError(error);
    }
  });
}

const profileAvatar = $("#profile-avatar");
if (profileAvatar) {
  profileAvatar.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      toast("Ukuran foto maksimal 5 MB.");
      return;
    }
    const photoContainer = $("#profile-photo");
    if (photoContainer) photoContainer.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Pratinjau foto profil">`;
  });
}

async function initialize() {
  try {
    await loadCategories();
    await refreshUser();
    await loadListings();
    state.pollTimer = setInterval(() => {
      if (!state.user) return;
      refreshConversations().catch(showError);
      if (state.activeConversation && $("#chats-view") && !$("#chats-view").classList.contains("hidden")) {
        loadMessages(state.activeConversation).catch(showError);
      }
    }, 4000);
  } catch (error) {
    toast(error.message);
  }
}

initialize();