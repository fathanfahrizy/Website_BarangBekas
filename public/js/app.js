const conditionNames = {
  needs_repair: "Perlu perbaikan",
  fair: "Layak",
  good: "Bagus",
  like_new: "Seperti baru",
};
const state = { user: null, activeConversation: null, conversations: [], pollTimer: null, chatRole: "buying" };
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

  const sellerActions = own ? `
    <div style="display:flex; gap:6px; margin-top:10px; width:100%;">
      <button type="button" class="btn-outline" style="flex:1; padding:5px 8px; border-radius:var(--radius-sm); font-size:11px; font-weight:700;" data-edit-id="${escapeHtml(item.id)}">✏️ Edit</button>
      ${!sold 
        ? `<button type="button" class="btn-outline" style="padding:5px 8px; border-radius:var(--radius-sm); font-size:11px; font-weight:700;" data-status-id="${escapeHtml(item.id)}" title="Tandai terjual">Terjual</button>` 
        : `<button type="button" class="btn-outline" style="padding:5px 8px; border-radius:var(--radius-sm); font-size:11px; font-weight:700;" data-reactivate-id="${escapeHtml(item.id)}" title="Aktifkan kembali">Aktifkan</button>`
      }
      <button type="button" class="btn-outline" style="padding:5px 8px; border-radius:var(--radius-sm); font-size:11px; font-weight:700; color:#ef4444; border-color:#ef4444;" data-delete-item-id="${escapeHtml(item.id)}" title="Hapus barang dari etalase">🗑️</button>
    </div>
  ` : '';

  return `<article class="listing-card" style="background:#fff; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; cursor:pointer; display:flex; flex-direction:column; transition:transform 0.2s, box-shadow 0.2s;" data-listing-id="${escapeHtml(item.id)}" tabindex="0">
    <div style="position:relative; height:180px; background:var(--color-bg-body); overflow:hidden; display:grid; place-items:center;">
      ${image}
      ${sold ? '<span style="position:absolute; top:8px; left:8px; background:rgba(239, 68, 68, 0.9); color:#fff; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px;">TERJUAL</span>' : `${conditionBadge}${locationBadge}`}
    </div>
    <div style="padding:16px; display:flex; flex-direction:column; flex:1;">
      <div style="font-size:10px; font-weight:800; color:var(--color-primary); text-transform:uppercase; margin-bottom:4px;">${escapeHtml(item.category)}</div>
      <div style="font-size:14px; font-weight:600; color:var(--color-text-main); line-height:1.4; margin-bottom:8px; height:40px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
      <div style="font-size:18px; font-weight:800; color:var(--color-primary-dark); margin-bottom:12px;">${formatPrice(item.price)}</div>
      <div style="margin-top:auto; padding-top:12px; border-top:1px solid var(--color-border); display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:11px; color:var(--color-text-muted);">
          <span style="display:flex; align-items:center; gap:8px; font-weight:600; max-width:85%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(item.seller_name)}">${avatarMarkup(item.seller_avatar, item.seller_name)}${escapeHtml(item.seller_name)}</span>
          ${!own ? `<span style="font-weight:600;">${sold ? "Terjual" : "🤝 Siap COD"}</span>` : ""}
        </div>
        ${sellerActions}
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
      if (event.target.closest("[data-status-id], [data-reactivate-id], [data-edit-id], [data-delete-item-id]")) return;
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
  grid.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openEditListing(button.dataset.editId);
    });
  });
  grid.querySelectorAll("[data-delete-item-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteListing(button.dataset.deleteItemId);
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
    if ($("#category-filter")) $("#category-filter").insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
    if ($("#listing-form")) $("#listing-form").elements.categoryId.insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
    if ($("#edit-category")) $("#edit-category").insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
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
    if ($("#profile-form")) {
      $("#profile-form").elements.fullName.value = state.user.name;
      $("#profile-form").elements.username.value = state.user.username || "";
      $("#profile-form").elements.npm.value = state.user.npm;
      $("#profile-form").elements.phone.value = state.user.phone;
    }
    const profilePhoto = $("#profile-photo");
    if (profilePhoto) {
      profilePhoto.innerHTML = state.user.avatarUrl
        ? `<img src="${escapeHtml(state.user.avatarUrl)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Foto profil">`
        : escapeHtml((state.user.displayName || "?").charAt(0).toUpperCase());
    }
  } else {
    const pf = $("#profile-form");
    if (pf) pf.reset();
    const profilePhoto = $("#profile-photo");
    if (profilePhoto) profilePhoto.textContent = "?";
    const myGrid = $("#my-listing-grid");
    if (myGrid) myGrid.innerHTML = "";
    const convList = $("#conversation-list");
    if (convList) convList.innerHTML = "";
    const chatWin = $("#chat-window");
    if (chatWin) {
      chatWin.innerHTML = `
        <div class="chat-empty">
          <span>💬</span>
          <h3>Pilih Percakapan</h3>
          <p>Diskusikan detail barang dan tentukan lokasi meetup.</p>
        </div>`;
    }
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
    const images = listing.images || [];
    const mainImg = images[0]
      ? `<img id="detail-main-img" src="${escapeHtml(images[0])}" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);" alt="${escapeHtml(listing.title)}">`
      : `<div style="width:100%; height:100%; display:grid; place-items:center; background:var(--color-bg-body); font-size:48px;">📦</div>`;

    const thumbs = images.length > 1 ? `
      <div style="display:flex; gap:6px; margin-top:8px; overflow-x:auto;">
        ${images.map((url, idx) => `
          <img src="${escapeHtml(url)}" data-img-url="${escapeHtml(url)}" class="detail-gallery-thumb" style="width:52px; height:52px; object-fit:cover; border-radius:var(--radius-sm); cursor:pointer; border:2px solid ${idx === 0 ? 'var(--color-primary)' : 'var(--color-border)'};" alt="">
        `).join("")}
      </div>
    ` : '';
    
    const sellerAvatar = listing.seller_avatar
      ? `<div style="width:40px; height:40px; border-radius:50%; overflow:hidden;"><img src="${escapeHtml(listing.seller_avatar)}" style="width:100%; height:100%; object-fit:cover;" alt=""></div>`
      : `<div style="width:40px; height:40px; border-radius:50%; background:var(--color-primary-subtle); color:var(--color-primary); display:grid; place-items:center; font-weight:bold;">${escapeHtml(listing.seller_name.charAt(0).toUpperCase())}</div>`;

    const actionMarkup = isOwn ? `
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" style="flex:1;" id="detail-edit-btn" data-edit-id="${escapeHtml(listing.id)}">✏️ Edit Barang</button>
        <button class="btn btn-outline" style="color:#ef4444; border-color:#ef4444; padding:0 16px;" id="detail-delete-btn" data-delete-id="${escapeHtml(listing.id)}" title="Hapus Barang dari Etalase">🗑️ Hapus</button>
      </div>
    ` : sold ? `
      <button class="btn btn-outline w-full" disabled>Barang sudah terjual</button>
    ` : `
      <button class="btn btn-primary w-full" id="chat-seller">💬 Chat Penjual & Janji COD</button>
    `;

    $("#detail-content").innerHTML = `
      <div style="display:grid; grid-template-columns:300px 1fr; gap:32px;">
        <div>
          <div style="height:300px; background:var(--color-bg-body); border-radius:var(--radius-md); overflow:hidden;">${mainImg}</div>
          ${thumbs}
        </div>
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
            ${actionMarkup}
          </div>
        </div>
      </div>
    `;
    
    // Sesuaikan layout modal detail untuk mobile
    if (window.innerWidth < 768) {
      const detailGrid = $("#detail-content > div");
      if (detailGrid) detailGrid.style.gridTemplateColumns = "1fr";
    }

    // Gallery thumbnail switcher
    $("#detail-content").querySelectorAll(".detail-gallery-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const main = $("#detail-main-img");
        if (main) main.src = thumb.dataset.imgUrl;
        $("#detail-content").querySelectorAll(".detail-gallery-thumb").forEach(t => t.style.borderColor = "var(--color-border)");
        thumb.style.borderColor = "var(--color-primary)";
      });
    });

    const editBtn = $("#detail-edit-btn");
    if (editBtn) editBtn.addEventListener("click", () => openEditListing(editBtn.dataset.editId));

    const delBtn = $("#detail-delete-btn");
    if (delBtn) delBtn.addEventListener("click", () => deleteListing(delBtn.dataset.deleteId));

    $("#detail-dialog").showModal();
    const chatButton = $("#chat-seller");
    if (chatButton) chatButton.addEventListener("click", () => startConversation(listing.id));
  }).catch(showError);
}

let editDeletedImages = [];

async function deleteListing(id) {
  if (!confirm("Yakin ingin menghapus barang ini dari etalase? Iklan dan obrolan terkait barang ini akan dihapus.")) return;
  try {
    await api(`/api/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
    if ($("#detail-dialog")) $("#detail-dialog").close();
    toast("Barang berhasil dihapus dari etalase.");
    await loadListings(true);
    await loadListings();
  } catch (error) {
    showError(error);
  }
}

async function openEditListing(id) {
  try {
    const { listing } = await api(`/api/listings/${encodeURIComponent(id)}`);
    if ($("#detail-dialog")) $("#detail-dialog").close();

    editDeletedImages = [];
    const form = $("#edit-listing-form");
    if (!form) return;

    form.reset();
    setError($("#edit-listing-error"), "");

    $("#edit-listing-id").value = listing.id;
    $("#edit-title").value = listing.title;
    $("#edit-description").value = listing.description;
    $("#edit-price").value = listing.price;
    $("#edit-category").value = listing.category_id;
    $("#edit-condition").value = listing.item_condition;
    $("#edit-meetup").value = listing.meetup_location || "";
    $("#edit-thumbnail-id").value = "";

    renderEditImages(listing.image_objects || []);

    $("#edit-listing-dialog").showModal();
  } catch (error) {
    showError(error);
  }
}

function renderEditImages(images) {
  const container = $("#edit-existing-images");
  if (!container) return;

  if (!images.length) {
    container.innerHTML = `<span class="text-xs text-gray" style="grid-column:1/-1;">Belum ada foto. Kamu bisa pilih foto baru di bawah.</span>`;
    return;
  }

  let currentThumb = $("#edit-thumbnail-id").value;
  if (!currentThumb && images.length) {
    const thumbImg = images.find(img => img.position === 0) || images[0];
    currentThumb = String(thumbImg.id);
    $("#edit-thumbnail-id").value = currentThumb;
  }

  container.innerHTML = images.map((img) => {
    const isDeleted = editDeletedImages.includes(Number(img.id));
    const isThumb = String(img.id) === String($("#edit-thumbnail-id").value);

    return `
      <div class="edit-img-card" style="border:1px solid ${isDeleted ? '#ef4444' : isThumb ? 'var(--color-primary)' : 'var(--color-border)'}; border-radius:var(--radius-sm); overflow:hidden; background:#fff; display:flex; flex-direction:column; position:relative; ${isDeleted ? 'opacity:0.4;' : ''}">
        <div style="height:80px; background:var(--color-bg-body); overflow:hidden; position:relative;">
          <img src="${escapeHtml(img.url)}" style="width:100%; height:100%; object-fit:cover;" alt="">
          ${isThumb && !isDeleted ? `<span style="position:absolute; top:4px; left:4px; background:var(--color-primary); color:#fff; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:3px;">⭐ SAMPUL</span>` : ''}
          ${isDeleted ? `<span style="position:absolute; top:4px; left:4px; background:#ef4444; color:#fff; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:3px;">DIHAPUS</span>` : ''}
        </div>
        <div style="padding:6px; display:flex; flex-direction:column; gap:4px; background:#fff;">
          ${!isDeleted ? `
            <button type="button" class="btn-set-thumb" data-img-id="${escapeHtml(img.id)}" style="font-size:10px; font-weight:600; padding:4px 6px; border:1px solid ${isThumb ? 'var(--color-primary)' : 'var(--color-border)'}; background:${isThumb ? 'var(--color-primary-subtle)' : '#fff'}; color:${isThumb ? 'var(--color-primary)' : 'var(--color-text-main)'}; border-radius:3px; cursor:pointer;">
              ${isThumb ? '✓ Sampul' : 'Jadikan Sampul'}
            </button>
            <button type="button" class="btn-del-img" data-img-id="${escapeHtml(img.id)}" style="font-size:10px; font-weight:600; padding:4px 6px; border:1px solid #ef4444; background:#fff; color:#ef4444; border-radius:3px; cursor:pointer;">
              🗑️ Hapus
            </button>
          ` : `
            <button type="button" class="btn-restore-img" data-img-id="${escapeHtml(img.id)}" style="font-size:10px; font-weight:600; padding:4px 6px; border:1px solid var(--color-border); background:#fff; color:var(--color-primary); border-radius:3px; cursor:pointer;">
              ↩ Batal Hapus
            </button>
          `}
        </div>
      </div>`;
  }).join("");

  container.querySelectorAll(".btn-set-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("#edit-thumbnail-id").value = btn.dataset.imgId;
      renderEditImages(images);
    });
  });

  container.querySelectorAll(".btn-del-img").forEach((btn) => {
    btn.addEventListener("click", () => {
      const imgId = Number(btn.dataset.imgId);
      if (!editDeletedImages.includes(imgId)) editDeletedImages.push(imgId);
      if (String($("#edit-thumbnail-id").value) === String(imgId)) {
        const remaining = images.find(img => !editDeletedImages.includes(Number(img.id)));
        $("#edit-thumbnail-id").value = remaining ? String(remaining.id) : "";
      }
      renderEditImages(images);
    });
  });

  container.querySelectorAll(".btn-restore-img").forEach((btn) => {
    btn.addEventListener("click", () => {
      const imgId = Number(btn.dataset.imgId);
      editDeletedImages = editDeletedImages.filter(id => id !== imgId);
      if (!$("#edit-thumbnail-id").value) {
        $("#edit-thumbnail-id").value = String(imgId);
      }
      renderEditImages(images);
    });
  });
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
    state.chatRole = "buying";
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

async function deleteConversation(id) {
  if (!confirm("Hapus obrolan ini? Semua riwayat pesan di dalamnya akan dihapus.")) return;
  try {
    await api(`/api/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
    toast("Obrolan berhasil dihapus.");
    if (String(state.activeConversation) === String(id)) {
      state.activeConversation = null;
      const windowElement = $("#chat-window");
      if (windowElement) {
        windowElement.innerHTML = `
          <div class="chat-empty">
            <span>💬</span>
            <h3>Pilih Percakapan</h3>
            <p>Diskusikan detail barang dan tentukan lokasi meetup.</p>
          </div>`;
      }
    }
    await refreshConversations();
  } catch (error) {
    showError(error);
  }
}

async function refreshConversations() {
  if (!state.user) return;
  const { conversations } = await api("/api/conversations");
  state.conversations = conversations;

  const buyingConvs = conversations.filter((c) => c.role === "buying");
  const sellingConvs = conversations.filter((c) => c.role === "selling");

  const buyingCountEl = $("#count-role-buying");
  if (buyingCountEl) buyingCountEl.textContent = buyingConvs.length;

  const sellingCountEl = $("#count-role-selling");
  if (sellingCountEl) sellingCountEl.textContent = sellingConvs.length;

  // Update tabs appearance
  $$(".chat-role-tab").forEach((tab) => {
    const isActive = tab.dataset.chatRole === state.chatRole;
    tab.classList.toggle("active", isActive);
    tab.style.background = isActive ? "var(--color-primary)" : "transparent";
    tab.style.color = isActive ? "#fff" : "var(--color-text-muted)";
    const counter = tab.querySelector(".counter");
    if (counter) {
      counter.style.background = isActive ? "rgba(255,255,255,0.25)" : "var(--color-border)";
      counter.style.color = isActive ? "#fff" : "var(--color-text-main)";
    }
  });

  const filtered = state.chatRole === "selling" ? sellingConvs : buyingConvs;
  const list = $("#conversation-list");
  
  if (list) {
    list.style.background = "#fff";
    list.style.overflowY = "auto";
    
    if (filtered.length) {
      list.innerHTML = filtered.map((conversation) => {
        const isSelected = String(state.activeConversation) === String(conversation.id);
        const isBuying = conversation.role === "buying";
        const roleBadge = isBuying
          ? `<span style="display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; background:#eff6ff; color:#2563eb; width:fit-content;">🛒 Penjual: ${escapeHtml(conversation.other_name)}</span>`
          : `<span style="display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; background:#fef3c7; color:#d97706; width:fit-content;">🏷️ Calon Pembeli: ${escapeHtml(conversation.other_name)}</span>`;
        
        return `
          <button class="conversation-entry" data-conversation-id="${escapeHtml(conversation.id)}" style="display:flex; flex-direction:column; width:100%; padding:14px 16px; text-align:left; border-bottom:1px solid var(--color-border); background:${isSelected ? 'var(--color-bg-body)' : '#fff'}; border-left:${isSelected ? '4px solid var(--color-primary)' : '4px solid transparent'}; transition:background 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:4px;">
              ${roleBadge}
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; font-weight:700; color:var(--color-primary-dark); font-family:var(--font-mono);">${conversation.listing_price ? formatPrice(conversation.listing_price) : ''}</span>
                <span class="btn-del-conv" data-delete-id="${escapeHtml(conversation.id)}" style="color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; border-radius:4px; opacity:0.75;" title="Hapus obrolan">🗑️</span>
              </div>
            </div>
            <strong style="font-size:13px; color:var(--color-text-main); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📦 ${escapeHtml(conversation.listing_title)}</strong>
            <small class="text-gray" style="font-size:12px; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(conversation.last_message || "Mulai percakapan")}</small>
          </button>`;
      }).join("");
    } else {
      const emptyText = state.chatRole === "selling"
        ? "Belum ada calon pembeli.<br>Barangmu belum ada yang menanyakan lewat chat."
        : "Belum ada chat pembelian.<br>Kamu belum menghubungi penjual manapun.";
      list.innerHTML = `<div style="padding:32px 16px; text-align:center; color:var(--color-text-muted); font-size:13px;"><div style="font-size:32px; margin-bottom:12px;">💬</div>${emptyText}</div>`;
    }
    
    list.querySelectorAll("[data-conversation-id]").forEach((button) => {
      button.addEventListener("click", () => openConversation(button.dataset.conversationId));
    });

    list.querySelectorAll(".btn-del-conv").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteConversation(btn.dataset.deleteId);
      });
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
  const targetConv = state.conversations.find((item) => String(item.id) === String(id));
  if (targetConv && targetConv.role && targetConv.role !== state.chatRole) {
    state.chatRole = targetConv.role;
  }
  await refreshConversations();
  const conversation = state.conversations.find((item) => String(item.id) === String(id));
  if (!conversation) return;
  const windowElement = $("#chat-window");
  
  if (windowElement) {
    const isBuying = conversation.role === "buying";
    windowElement.style.display = "flex";
    windowElement.style.flexDirection = "column";
    windowElement.style.height = "500px"; // Fixed height untuk area chat
    
    const quickChips = isBuying ? `
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Halo kak, barang masih ready?</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD di Margonda?</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD di Kelapa Dua?</button>
    ` : `
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Halo, barang masih ready ya!</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD di Kampus D hari apa?</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Boleh, langsung atur jam meetup ya.</button>
    `;

    windowElement.innerHTML = `
      <div style="padding:16px 24px; border-bottom:1px solid var(--color-border); background:#fff; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="avatar-sm" style="font-size:18px; display:grid; place-items:center;">${isBuying ? '🛒' : '🏷️'}</div>
          <div style="display:flex; flex-direction:column;">
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="font-size:15px; color:var(--color-text-main);">${escapeHtml(conversation.other_name)}</strong>
              <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; ${isBuying ? 'background:#eff6ff; color:#2563eb;' : 'background:#fef3c7; color:#d97706;'}">
                ${isBuying ? 'Posisi: Anda Membeli' : 'Posisi: Anda Menjual'}
              </span>
            </div>
            <small class="text-gray" style="font-size:12px;">
              ${isBuying ? 'Membahas barang penjual:' : 'Membahas barang jualan Anda:'} 
              <b>${escapeHtml(conversation.listing_title)}</b>${conversation.listing_status === "sold" ? " <b style='color:var(--color-danger);'>· (Terjual)</b>" : ""}
            </small>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          ${conversation.listing_price ? `<div style="font-size:16px; font-weight:800; color:var(--color-primary-dark); font-family:var(--font-mono);">${formatPrice(conversation.listing_price)}</div>` : ''}
          <button type="button" class="btn-delete-active-chat" data-delete-id="${escapeHtml(conversation.id)}" style="background:transparent; border:1px solid #ef4444; color:#ef4444; border-radius:var(--radius-sm); font-size:12px; font-weight:600; padding:6px 12px; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;" title="Hapus seluruh obrolan ini">
            🗑️ Hapus Chat
          </button>
        </div>
      </div>
      
      <div id="message-list" style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px; background:var(--color-bg-body);"></div>
      
      <div style="display:flex; gap:8px; padding:12px 24px; background:#fff; border-top:1px solid var(--color-border); overflow-x:auto;">
        ${quickChips}
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

    const delActiveBtn = windowElement.querySelector(".btn-delete-active-chat");
    if (delActiveBtn) {
      delActiveBtn.addEventListener("click", () => {
        deleteConversation(delActiveBtn.dataset.deleteId);
      });
    }

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

// Chat Role Tabs (Saya Membeli vs Saya Menjual)
$$(".chat-role-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.chatRole = btn.dataset.chatRole;
    refreshConversations();
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
      state.activeConversation = null;
      state.chatRole = "buying";
      updateUserUI();
      if ($("#auth-dialog")) $("#auth-dialog").close();
      await refreshConversations();
      await loadListings();
      const myView = $("#my-listings-view");
      if (myView && !myView.classList.contains("hidden")) {
        await loadListings(true);
      }
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

const editListingForm = $("#edit-listing-form");
if (editListingForm) {
  editListingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError($("#edit-listing-error"), "");
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const listingId = $("#edit-listing-id").value;
    const formData = new FormData(form);
    editDeletedImages.forEach((imgId) => {
      formData.append("deleteImageIds[]", imgId);
    });

    try {
      await api(`/api/listings/${encodeURIComponent(listingId)}`, {
        method: "POST",
        body: formData,
      });
      if ($("#edit-listing-dialog")) $("#edit-listing-dialog").close();
      await loadListings(true);
      await loadListings();
      toast("Barang etalase berhasil diperbarui!");
    } catch (error) {
      setError($("#edit-listing-error"), error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
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