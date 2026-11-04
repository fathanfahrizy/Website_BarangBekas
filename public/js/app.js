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
  if (!element) return;
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("visible"), 3000);
}

function setError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("hidden", !message);
}

function displayAuth(mode = "login") {
  window.location.href = `login.html?mode=${mode}`;
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
    ? `<img src="${escapeHtml(item.image_url)}" style="width:100%; height:100%; object-fit:cover;" alt="${escapeHtml(item.title)}" loading="lazy">`
    : `<span style="font-size:40px; color:var(--color-text-light);" aria-hidden="true">📦</span>`;
  const soldBadge = sold
    ? `<span style="position:absolute; top:8px; left:8px; background:rgba(239,68,68,0.9); color:#fff; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:4px;">TERJUAL</span>`
    : '';
  const location = item.meetup_location
    ? escapeHtml(item.meetup_location.split('(')[0].trim())
    : 'Disepakati via chat';
  const sellerActions = own ? `
    <div style="display:flex; gap:6px; margin-top:10px; width:100%;">
      <button type="button" class="btn-outline" style="flex:1; padding:5px 8px; font-size:11px; font-weight:700;" data-edit-id="${escapeHtml(item.id)}">✏️ Edit</button>
      ${!sold
        ? `<button type="button" class="btn-outline" style="padding:5px 8px; font-size:11px; font-weight:700;" data-status-id="${escapeHtml(item.id)}" title="Tandai terjual">Terjual</button>`
        : `<button type="button" class="btn-outline" style="padding:5px 8px; font-size:11px; font-weight:700;" data-reactivate-id="${escapeHtml(item.id)}" title="Aktifkan kembali">Aktifkan</button>`}
      <button type="button" class="btn-outline" style="padding:5px 8px; font-size:11px; font-weight:700; color:#ef4444; border-color:#ef4444;" data-delete-item-id="${escapeHtml(item.id)}" title="Hapus barang dari etalase">🗑️</button>
    </div>` : '';
  return `
  <article class="listing-card" style="background:#fff; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; cursor:pointer; display:flex; flex-direction:column;" data-listing-id="${escapeHtml(item.id)}" tabindex="0">
    <div style="position:relative; height:180px; background:var(--color-bg-body); overflow:hidden; display:grid; place-items:center;">
      ${image}
      ${soldBadge}
    </div>
    <div style="padding:12px 14px 14px; display:flex; flex-direction:column; flex:1;">
      <div style="font-size:10px; font-weight:800; color:var(--color-primary); text-transform:uppercase; margin-bottom:4px;">${escapeHtml(item.category)}</div>
      <div style="font-size:14px; font-weight:600; color:var(--color-text-main); line-height:1.4; margin-bottom:6px; height:40px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
      <div style="font-size:18px; font-weight:800; color:var(--color-primary-dark); margin-bottom:8px;">${formatPrice(item.price)}</div>
      <div style="margin-top:auto; padding-top:8px; border-top:1px solid var(--color-border); font-size:11px; color:var(--color-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📍 ${location}</div>
      ${sellerActions}
    </div>
  </article>`;
}

function renderListings(items, own = false) {
  const grid = $(own ? "#my-listing-grid" : "#listing-grid");
  const empty = $(own ? "#my-listing-empty" : "#market-empty");
  if (!grid) return;
  
  grid.innerHTML = items.map((item) => cardMarkup(item, own)).join("");
  if (empty) empty.classList.toggle("hidden", items.length > 0);
  grid.classList.toggle("hidden", items.length === 0);
  
    grid.querySelectorAll(".listing-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-status-id], [data-reactivate-id], [data-edit-id], [data-delete-item-id]")) return;
      window.location.href = "detailProduct.php?id=" + encodeURIComponent(card.dataset.listingId);
    });
  });
  grid.querySelectorAll("[data-status-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); changeListingStatus(button.dataset.statusId, "sold"); });
  });
  grid.querySelectorAll("[data-reactivate-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); changeListingStatus(button.dataset.reactivateId, "active"); });
  });
  grid.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); openEditListing(button.dataset.editId); });
  });
  grid.querySelectorAll("[data-delete-item-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); deleteListing(button.dataset.deleteItemId); });
  });
    grid.querySelectorAll("[data-cod-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); startConversation(button.dataset.codId); });
  });
  grid.querySelectorAll("[data-cart-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); addToCart(button.dataset.cartId); });
  });
  grid.querySelectorAll("[data-buy-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); buyNow(button.dataset.buyId); });
  });
  grid.querySelectorAll("[data-view-id]").forEach((button) => {
    button.addEventListener("click", (event) => { event.stopPropagation(); showListing(button.dataset.viewId); });
  });
}

async function loadListings(own = false) {
  const params = new URLSearchParams();
  if (own) params.set("mine", "true");
  else {
    const query = $("#search-input")?.value.trim();
    if (query) params.set("q", query);

    const cat = $("#category-filter")?.value;
    if (cat) params.set("category", cat);

    const minP = $("#filter-min-price")?.value;
    if (minP) params.set("min_price", minP);

    const maxP = $("#filter-max-price")?.value;
    if (maxP) params.set("max_price", maxP);

    const cond = $("#filter-condition")?.value;
    if (cond) params.set("condition", cond);

    const loc = $("#filter-location")?.value;
    if (loc) params.set("location", loc);

    const sort = $("#filter-sort")?.value;
    if (sort && sort !== 'newest') params.set("sort", sort);
  }
  
  try {
    const data = await api(`/api/listings?${params}`);
    renderListings(data.listings, own);

    if (own) {
        const etalaseDot = $("#etalase-dot");
        if (etalaseDot) {
            etalaseDot.classList.toggle("hidden", data.listings.length === 0);
        }
    }
  } catch (error) {
    toast(error.message || "Gagal memuat data.");
  }
}

async function loadCategories() {
  const { categories } = await api("/api/categories");
  categories.forEach((category) => {
    if ($("#category-filter")) $("#category-filter").insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
    if ($("#listing-form")) $("#listing-form").elements.categoryId.insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
    if ($("#edit-category")) $("#edit-category").insertAdjacentHTML("beforeend", `<option value="${category.id}">${escapeHtml(category.name)}</option>`);
  });
  
  // Sinkronisasi opsi kategori ke header
  const bottomCat = $("#category-filter");
  const headerCat = $("#header-category-filter");
  if (bottomCat && headerCat) {
    headerCat.innerHTML = bottomCat.innerHTML;
  }
  syncBottomToHeader();
}

function updateUserUI() {
  $$(".signed-in-only").forEach((element) => element.classList.toggle("hidden", !state.user));
  $("#login-button")?.classList.toggle("hidden", !!state.user);
  $("#account-button")?.classList.toggle("hidden", !state.user);
  $("#messages-nav")?.classList.toggle("hidden", !state.user);

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
    const accountBtn = $("#account-button");
    if (accountBtn) {
      accountBtn.innerHTML = state.user.avatarUrl
        ? `<div class="avatar-sm" style="overflow:hidden;"><img src="${escapeHtml(state.user.avatarUrl)}" style="width:100%; height:100%; object-fit:cover;" alt=""></div>`
        : `<div class="avatar-sm">${escapeHtml((state.user.displayName || "?").charAt(0).toUpperCase())}</div>`;
      accountBtn.title = state.user.displayName;
    }

    const profileForm = $("#profile-form");
    if (profileForm) {
      profileForm.elements.fullName.value = state.user.name;
      profileForm.elements.username.value = state.user.username || "";
      profileForm.elements.npm.value = state.user.npm;
      profileForm.elements.phone.value = state.user.phone;
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
      chatWin.innerHTML = `<div class="chat-empty"><span>💬</span><h3>Pilih Percakapan</h3><p>Diskusikan detail barang dan tentukan lokasi meetup.</p></div>`;
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
    window.location.href = "login.html";
    return;
  }
  $$(".view-section").forEach((panel) => panel.classList.toggle("hidden", panel.id !== `${name}-view`));
  $$(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === name));
  
  const heroBanner = $("#welcome-banner");
  if (heroBanner) heroBanner.classList.toggle("hidden", name !== "market");
  
  if (name === "my-listings") loadListings(true).catch((e) => toast(e.message));
  if (name === "market") loadListings().catch((e) => toast(e.message));
  if (name === "chats") refreshConversations().catch((e) => toast(e.message));
}

function triggerSearch() {
  $$(".view-section").forEach((panel) => panel.classList.toggle("hidden", panel.id !== "market-view"));
  $$(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === "market"));
  const heroBanner = $("#welcome-banner");
  if (heroBanner) heroBanner.classList.add("hidden");
  loadListings().catch((e) => toast(e.message));
}

async function showListing(id) {
  switchView('product');
  const container = $("#product-detail-container");
  if (container) container.innerHTML = `<div style="text-align: center; padding: 60px;">⏳ Memuat...</div>`;

  try {
    const { listing } = await api(`/api/listings/${encodeURIComponent(id)}`);
    const breadcrumb = $("#product-breadcrumb-cat");
    if (breadcrumb) breadcrumb.textContent = listing.category || "Detail Barang";

    const isOwn = state.user && String(state.user.id) === String(listing.seller_id);
    const sold = listing.status === "sold";
    const images = listing.images || [];

    const mainImg = images[0]
      ? `<img src="${escapeHtml(images[0])}" id="p-main-img" style="width:100%; height:100%; object-fit:cover;" alt="${escapeHtml(listing.title)}">`
      : `<div style="width:100%; height:100%; display:grid; place-items:center; background:var(--color-bg-body); font-size:80px;">📦</div>`;

    const thumbs = images.length > 1 ? `
      <div style="display:flex; gap:8px; margin-top:12px; overflow-x:auto;">
        ${images.map((url, idx) => `<img src="${escapeHtml(url)}" data-src="${escapeHtml(url)}" class="p-thumb" style="width:70px; height:70px; object-fit:cover; border:2px solid ${idx===0?'var(--color-primary)':'var(--color-border)'}; cursor:pointer;">`).join("")}
      </div>` : '';

    const sellerAvatar = listing.seller_avatar
      ? `<img src="${escapeHtml(listing.seller_avatar)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;" alt="">`
      : `<div style="width:48px; height:48px; border-radius:50%; background:var(--color-primary-subtle); color:var(--color-primary); display:grid; place-items:center; font-weight:bold; font-size:20px;">${escapeHtml(listing.seller_name.charAt(0).toUpperCase())}</div>`;

    const actionMarkup = isOwn ? `
      <div style="display:flex; gap:12px;">
        <button class="btn btn-primary" style="flex:1; height:48px;" id="p-edit-btn">✏️ Edit Barang</button>
        <button class="btn btn-danger-outline" style="height:48px;" id="p-delete-btn">🗑️ Hapus</button>
      </div>
    ` : sold ? `<button class="btn btn-outline w-full" disabled style="height:48px;">Barang sudah terjual</button>` 
    : `<button class="btn btn-primary w-full" style="height:48px;" id="p-chat-seller">💬 Chat Penjual & Janji COD</button>`;

    if (container) {
      container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 40px; background:var(--color-bg-card); border:1px solid var(--color-border); padding:32px;">
          <div>
            <div style="height:450px; background:var(--color-bg-body); border:1px solid var(--color-border); overflow:hidden;">${mainImg}</div>
            ${thumbs}
          </div>
          <div style="display:flex; flex-direction:column;">
            <span style="font-size:11px; font-weight:700; color:var(--color-primary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
              ${escapeHtml(listing.category)} ${sold ? '· <span style="color:var(--color-danger);">TERJUAL</span>' : ''}
            </span>
            <h1 style="font-size:32px; font-weight:800; color:var(--color-text-main); line-height:1.2; margin-bottom:16px;">${escapeHtml(listing.title)}</h1>
            <div style="font-size:36px; font-weight:900; color:var(--color-primary-dark); margin-bottom:24px;">${formatPrice(listing.price)}</div>
            <div style="background:var(--color-bg-body); padding:16px; border:1px solid var(--color-border); margin-bottom:24px; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; font-size:14px;"><span style="color:var(--color-text-muted); font-size:12px;">Kondisi</span> <strong>${escapeHtml(conditionNames[listing.item_condition])}</strong></div>
              <div style="display:flex; justify-content:space-between; font-size:14px;"><span style="color:var(--color-text-muted); font-size:12px;">Lokasi COD</span> <strong>${escapeHtml(listing.meetup_location || "Disepakati lewat chat")}</strong></div>
            </div>
            <h3 style="font-size:18px; margin-bottom:12px;">Deskripsi Barang</h3>
            <p style="font-size:15px; line-height:1.7; color:var(--color-text-main); margin-bottom:32px; max-height:200px; overflow-y:auto;">${escapeHtml(listing.description).replace(/\n/g, '<br>')}</p>
            <div style="display:flex; align-items:center; gap:16px; margin-bottom:32px; padding:16px; background:var(--color-bg-body); border:1px solid var(--color-border);">
              ${sellerAvatar}
              <div>
                <strong style="font-size:16px;">${escapeHtml(listing.seller_name)}</strong>
                <div style="font-size:12px; color:var(--color-text-muted);">Mahasiswa Gunadarma</div>
              </div>
            </div>
            <div style="margin-top:auto;">${actionMarkup}</div>
          </div>
        </div>
      `;
      container.querySelectorAll('.p-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          document.getElementById('p-main-img').src = thumb.dataset.src;
          container.querySelectorAll('.p-thumb').forEach(t => t.style.borderColor = 'var(--color-border)');
          thumb.style.borderColor = 'var(--color-primary)';
        });
      });
      const editBtn = $("#p-edit-btn"); if (editBtn) editBtn.addEventListener("click", () => openEditListing(listing.id));
      const delBtn = $("#p-delete-btn"); if (delBtn) delBtn.addEventListener("click", () => deleteListing(listing.id));
      const chatBtn = $("#p-chat-seller"); if (chatBtn) chatBtn.addEventListener("click", () => startConversation(listing.id));
    }
  } catch (error) {
    if (container) container.innerHTML = `<div style="text-align:center; padding:60px;"><h2 style="color:var(--color-danger);">❌ ${escapeHtml(error.message)}</h2><button class="btn btn-primary mt-4" onclick="window.location.href='/'">Kembali ke Beranda</button></div>`;
  }
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
  } catch (error) { toast(error.message); }
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
  } catch (error) { toast(error.message); }
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
            <button type="button" class="btn-set-thumb" data-img-id="${escapeHtml(img.id)}" style="font-size:10px; font-weight:600; padding:4px 6px; border:1px solid ${isThumb ? 'var(--color-primary)' : 'var(--color-border)'}; background:${isThumb ? 'var(--color-primary-subtle)' : '#fff'}; color:${isThumb ? 'var(--color-primary)' : 'var(--color-text-main)'}; border-radius:3px; cursor:pointer;">${isThumb ? '✓ Sampul' : 'Jadikan Sampul'}</button>
            <button type="button" class="btn-del-img" data-img-id="${escapeHtml(img.id)}" style="font-size:10px; font-weight:600; padding:4px 6px; border:1px solid #ef4444; background:#fff; color:#ef4444; border-radius:3px; cursor:pointer;">🗑️ Hapus</button>
          ` : `
            <button type="button" class="btn-restore-img" data-img-id="${escapeHtml(img.id)}" style="font-size:10px; font-weight:600; padding:4px 6px; border:1px solid var(--color-border); background:#fff; color:var(--color-primary); border-radius:3px; cursor:pointer;">↩ Batal Hapus</button>
          `}
        </div>
      </div>`;
  }).join("");
  container.querySelectorAll(".btn-set-thumb").forEach((btn) => { btn.addEventListener("click", () => { $("#edit-thumbnail-id").value = btn.dataset.imgId; renderEditImages(images); }); });
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
      if (!$("#edit-thumbnail-id").value) $("#edit-thumbnail-id").value = String(imgId);
      renderEditImages(images);
    });
  });
}

async function startConversation(listingId) {
  if (!state.user) {
    window.location.href = "login.html";
    return;
  }
  try {
    const { conversationId } = await api("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    $("#detail-dialog")?.close();
    state.chatRole = "buying";
    await refreshConversations();
    switchView("chats");
    await openConversation(conversationId);
  } catch (error) { toast(error.message); }
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
  } catch (error) { toast(error.message); }
}

async function deleteConversation(id) {
  if (!confirm("Hapus obrolan ini? Semua riwayat pesan di dalamnya akan dihapus.")) return;
  try {
    await api(`/api/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
    toast("Obrolan berhasil dihapus.");
    if (String(state.activeConversation) === String(id)) {
      state.activeConversation = null;
      const windowElement = $("#chat-window");
      if (windowElement) windowElement.innerHTML = `<div class="chat-empty"><span>💬</span><h3>Pilih Percakapan</h3><p>Diskusikan detail barang dan tentukan lokasi meetup.</p></div>`;
    }
    await refreshConversations();
  } catch (error) { toast(error.message); }
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
  
  $$(".chat-role-tab").forEach((tab) => {
    const isActive = tab.dataset.chatRole === state.chatRole;
    tab.classList.toggle("active", isActive);
    tab.style.background = isActive ? "var(--color-primary)" : "transparent";
    tab.style.color = isActive ? "#fff" : "var(--color-text-muted)";
    const counter = tab.querySelector(".counter");
    if (counter) { counter.style.background = isActive ? "rgba(255,255,255,0.25)" : "var(--color-border)"; counter.style.color = isActive ? "#fff" : "var(--color-text-main)"; }
  });

  const filtered = state.chatRole === "selling" ? sellingConvs : buyingConvs;
  const list = $("#conversation-list");
  if (list) {
    list.style.background = "#fff"; list.style.overflowY = "auto";
    if (filtered.length) {
      list.innerHTML = filtered.map((conversation) => {
        const isSelected = String(state.activeConversation) === String(conversation.id);
        const isBuying = conversation.role === "buying";
        const roleBadge = isBuying ? `<span style="display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; background:#eff6ff; color:#2563eb; width:fit-content;">🛒 Penjual: ${escapeHtml(conversation.other_name)}</span>` : `<span style="display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; background:#fef3c7; color:#d97706; width:fit-content;">🏷️ Calon Pembeli: ${escapeHtml(conversation.other_name)}</span>`;
        return `<button class="conversation-entry" data-conversation-id="${escapeHtml(conversation.id)}" style="display:flex; flex-direction:column; width:100%; padding:14px 16px; text-align:left; border-bottom:1px solid var(--color-border); background:${isSelected ? 'var(--color-bg-body)' : '#fff'}; border-left:${isSelected ? '4px solid var(--color-primary)' : '4px solid transparent'}; transition:background 0.2s;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:4px;">${roleBadge}<div style="display:flex; align-items:center; gap:8px;"><span style="font-size:11px; font-weight:700; color:var(--color-primary-dark); font-family:var(--font-mono);">${conversation.listing_price ? formatPrice(conversation.listing_price) : ''}</span><span class="btn-del-conv" data-delete-id="${escapeHtml(conversation.id)}" style="color:#ef4444; cursor:pointer; font-size:13px; padding:2px 4px; border-radius:4px; opacity:0.75;" title="Hapus obrolan">🗑️</span></div></div>
          <strong style="font-size:13px; color:var(--color-text-main); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📦 ${escapeHtml(conversation.listing_title)}</strong>
          <small class="text-gray" style="font-size:12px; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(conversation.last_message || "Mulai percakapan")}</small>
        </button>`;
      }).join("");
    } else {
      const emptyText = state.chatRole === "selling" ? "Belum ada calon pembeli.<br>Barangmu belum ada yang menanyakan lewat chat." : "Belum ada chat pembelian.<br>Kamu belum menghubungi penjual manapun.";
      list.innerHTML = `<div style="padding:32px 16px; text-align:center; color:var(--color-text-muted); font-size:13px;"><div style="font-size:32px; margin-bottom:12px;">💬</div>${emptyText}</div>`;
    }
    list.querySelectorAll("[data-conversation-id]").forEach((button) => { button.addEventListener("click", () => openConversation(button.dataset.conversationId)); });
    list.querySelectorAll(".btn-del-conv").forEach((btn) => { btn.addEventListener("click", (e) => { e.stopPropagation(); deleteConversation(btn.dataset.deleteId); }); });
  }
  const messageDot = $("#message-dot");
  if (messageDot) {
      const hasActivity = conversations.length > 0;
      messageDot.classList.toggle("hidden", !hasActivity);
  }
  if (state.activeConversation && $("#chats-view") && $("#chats-view").classList.contains("hidden") === false) {
    const exists = conversations.some((item) => String(item.id) === String(state.activeConversation));
    if (!exists) state.activeConversation = null;
  }
}

async function openConversation(id) {
  state.activeConversation = id;
  const targetConv = state.conversations.find((item) => String(item.id) === String(id));
  if (targetConv && targetConv.role && targetConv.role !== state.chatRole) state.chatRole = targetConv.role;
  await refreshConversations();
  const conversation = state.conversations.find((item) => String(item.id) === String(id));
  if (!conversation) return;
  const windowElement = $("#chat-window");
  if (windowElement) {
    const isBuying = conversation.role === "buying";
    windowElement.style.display = "flex"; windowElement.style.flexDirection = "column"; windowElement.style.height = "500px";
    const quickChips = isBuying ? `
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Halo kak, barang masih ready?</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD di Margonda?</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD di Kelapa Dua?</button>` : `
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Halo, barang masih ready ya!</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Bisa COD di Kampus D hari apa?</button>
      <button type="button" class="quick-chip" style="font-size:12px; padding:6px 14px; border-radius:var(--radius-full); background:var(--color-primary-subtle); color:var(--color-primary); font-weight:600; white-space:nowrap;">Boleh, langsung atur jam meetup ya.</button>`;
    windowElement.innerHTML = `
      <div style="padding:16px 24px; border-bottom:1px solid var(--color-border); background:#fff; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:14px;"><div class="avatar-sm" style="font-size:18px; display:grid; place-items:center;">${isBuying ? '🛒' : '🏷️'}</div><div style="display:flex; flex-direction:column;"><div style="display:flex; align-items:center; gap:8px;"><strong style="font-size:15px; color:var(--color-text-main);">${escapeHtml(conversation.other_name)}</strong><span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; ${isBuying ? 'background:#eff6ff; color:#2563eb;' : 'background:#fef3c7; color:#d97706;'}">${isBuying ? 'Posisi: Anda Membeli' : 'Posisi: Anda Menjual'}</span></div><small class="text-gray" style="font-size:12px;">${isBuying ? 'Membahas barang penjual:' : 'Membahas barang jualan Anda:'} <b>${escapeHtml(conversation.listing_title)}</b>${conversation.listing_status === "sold" ? " <b style='color:var(--color-danger);'>· (Terjual)</b>" : ""}</small></div></div>
        <div style="display:flex; align-items:center; gap:12px;">${conversation.listing_price ? `<div style="font-size:16px; font-weight:800; color:var(--color-primary-dark); font-family:var(--font-mono);">${formatPrice(conversation.listing_price)}</div>` : ''}<button type="button" class="btn-delete-active-chat" data-delete-id="${escapeHtml(conversation.id)}" style="background:transparent; border:1px solid #ef4444; color:#ef4444; border-radius:var(--radius-sm); font-size:12px; font-weight:600; padding:6px 12px; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;" title="Hapus seluruh obrolan ini">🗑️ Hapus Chat</button></div>
      </div>
      <div id="message-list" style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px; background:var(--color-bg-body);"></div>
      <div style="display:flex; gap:8px; padding:12px 24px; background:#fff; border-top:1px solid var(--color-border); overflow-x:auto;">${quickChips}</div>
      <form id="message-form" style="display:flex; gap:12px; padding:16px 24px; background:#fff; border-top:1px solid var(--color-border);"><input name="body" class="form-input" style="flex:1; border-radius:var(--radius-full);" maxlength="2000" placeholder="Tulis pesan atau tawaran..." autocomplete="off" required><button class="btn btn-primary" style="border-radius:var(--radius-full); padding:0 24px;" type="submit" aria-label="Kirim pesan">Kirim</button></form>`;
    windowElement.querySelectorAll(".quick-chip").forEach((chip) => { chip.addEventListener("click", () => { const input = $("#message-form").elements.body; input.value = chip.textContent; input.focus(); }); });
    const delActiveBtn = windowElement.querySelector(".btn-delete-active-chat");
    if (delActiveBtn) delActiveBtn.addEventListener("click", () => { deleteConversation(delActiveBtn.dataset.deleteId); });
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
      return `<div style="max-width:75%; padding:12px 16px; font-size:14px; align-self:${mine ? 'flex-end' : 'flex-start'}; background:${mine ? 'var(--color-primary)' : '#fff'}; color:${mine ? '#fff' : 'var(--color-text-main)'}; border-radius:${mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px'}; box-shadow:var(--shadow-sm); line-height:1.5;">${escapeHtml(message.body)}<time style="display:block; font-size:10px; margin-top:6px; opacity:0.8; text-align:${mine ? 'right' : 'left'};">${time}</time></div>`;
    }).join("");
    if (list.scrollHeight !== previousHeight || list.scrollTop + list.clientHeight >= previousHeight - 30) list.scrollTop = list.scrollHeight;
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
  } catch (error) { toast(error.message); } finally { input.disabled = false; input.focus(); }
}

// ==========================================
// SINKRONISASI FILTER HEADER & BAWAH
// ==========================================

function syncHeaderToBottom() {
  if ($("#category-filter")) $("#category-filter").value = $("#header-category-filter")?.value || "";
  if ($("#filter-min-price")) $("#filter-min-price").value = $("#header-min-price")?.value || "";
  if ($("#filter-max-price")) $("#filter-max-price").value = $("#header-max-price")?.value || "";
  if ($("#filter-condition")) $("#filter-condition").value = $("#header-condition")?.value || "";
  if ($("#filter-location")) $("#filter-location").value = $("#header-location")?.value || "";
  if ($("#filter-sort")) $("#filter-sort").value = $("#header-sort")?.value || "newest";

  const label = $("#header-filter-label");
  if (label) {
    const catName = $("#header-category-filter")?.value ? $("#category-filter option[value='" + $("#header-category-filter").value + "']")?.textContent : "Semua";
    label.textContent = (catName || "Semua") + " ▼";
  }
}

function syncBottomToHeader() {
  if ($("#header-category-filter")) $("#header-category-filter").value = $("#category-filter")?.value || "";
  if ($("#header-min-price")) $("#header-min-price").value = $("#filter-min-price")?.value || "";
  if ($("#header-max-price")) $("#header-max-price").value = $("#filter-max-price")?.value || "";
  if ($("#header-condition")) $("#header-condition").value = $("#filter-condition")?.value || "";
  if ($("#header-location")) $("#header-location").value = $("#filter-location")?.value || "";
  if ($("#header-sort")) $("#header-sort").value = $("#filter-sort")?.value || "newest";

  const label = $("#header-filter-label");
  if (label) {
    const catName = $("#category-filter")?.value ? $("#category-filter option[value='" + $("#category-filter").value + "']")?.textContent : "Semua";
    label.textContent = (catName || "Semua") + " ▼";
  }
}

// ==========================================
// SEMUA EVENT LISTENERS DI SATU TEMPAT
// ==========================================

// Nav tabs
$$(".nav-tab").forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));

// Search bar
const searchInput = $("#search-input");
const searchBtn = $("#search-button");
if (searchInput) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); triggerSearch(); }
  });
}
if (searchBtn) {
  searchBtn.addEventListener("click", (event) => {
    event.preventDefault();
    triggerSearch();
  });
}

// Trending keywords
$$(".keyword-tag").forEach((tag) => {
  tag.addEventListener("click", () => {
    if ($("#search-input")) $("#search-input").value = tag.dataset.query;
    triggerSearch();
  });
});

// Category sidebar
$$(".sidebar-item").forEach((item) => {
  item.addEventListener("click", () => {
    const catId = item.dataset.category;
    if ($("#category-filter")) $("#category-filter").value = catId;
    triggerSearch();
    const market = $("#market-view");
    if (market) market.scrollIntoView({ behavior: "smooth" });
  });
});

// Chat role tabs
$$(".chat-role-tab").forEach((btn) => { btn.addEventListener("click", () => { state.chatRole = btn.dataset.chatRole; refreshConversations(); }); });

// Sell buttons
[
  "#sell-button", "#welcome-sell", "#empty-sell", "#my-sell", 
  "#hero-action-sell", "#dock-sell", "#footer-sell-link", "#btn-tambah-etalase"
].forEach((selector) => {
  const el = $(selector);
  if (el) {
    el.addEventListener("click", () => {
      if (!state.user) {
        window.location.href = "login.html?mode=register";
      } else {
        const modal = $("#listing-dialog");
        if (modal) modal.showModal();
      }
    });
  }
});

// Hero action
const heroLogin = $("#hero-action-login");
if (heroLogin) { heroLogin.addEventListener("click", () => { if (state.user) switchView("profile"); else displayAuth("login"); }); }

// Dock buttons
const dockChats = $("#dock-chats");
if (dockChats) dockChats.addEventListener("click", () => window.location.href = "chat.php");
const dockMy = $("#dock-my"); if (dockMy) dockMy.addEventListener("click", () => switchView("my-listings"));
const dockTop = $("#dock-top"); if (dockTop) dockTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Footer links
$$("[data-footer-cat]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const catId = link.dataset.footerCat;
    if ($("#category-filter")) $("#category-filter").value = catId;
    triggerSearch();
    const market = $("#market-view");
    if (market) market.scrollIntoView({ behavior: "smooth" });
  });
});

const footerLogin = $("#footer-login-link");
if (footerLogin) { footerLogin.addEventListener("click", (e) => { e.preventDefault(); if (state.user) switchView("profile"); else displayAuth("register"); }); }

if ($("#login-button")) $("#login-button").addEventListener("click", () => displayAuth());
if ($("#account-button")) $("#account-button").addEventListener("click", () => switchView("profile"));
if ($("#messages-nav")) $("#messages-nav").addEventListener("click", () => window.location.href = "chat.php");
if ($("#etalase-nav")) $("#etalase-nav").addEventListener("click", () => window.location.href = "etalase.php");

const logoutBtn = $("#logout-button");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await api("/api/logout", { method: "POST" });
      state.user = null; state.activeConversation = null;
      updateUserUI(); switchView("market");
      toast("Kamu sudah keluar.");
    } catch (error) { toast(error.message); }
  });
}

// Modal close
$$("[data-close]").forEach((button) => button.addEventListener("click", () => { const dialog = $(`#${button.dataset.close}`); if (dialog) dialog.close(); }));
$$("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

// Auth form
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
      state.user = user; state.activeConversation = null; state.chatRole = "buying";
      updateUserUI();
      if ($("#auth-dialog")) $("#auth-dialog").close();
      await refreshConversations(); await loadListings();
      const myView = $("#my-listings-view");
      if (myView && !myView.classList.contains("hidden")) await loadListings(true);
      toast(mode === "register" ? "Akun berhasil dibuat. Selamat datang!" : "Berhasil masuk. Selamat datang kembali!");
    } catch (error) { setError($("#auth-error"), error.message); } finally { if (submitBtn) submitBtn.disabled = false; }
  });
}

// Listing form
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
      const modal = $("#listing-dialog");
      if (modal) modal.close();
      await Promise.all([loadListings(), loadListings(true)]);
      toast("Barang berhasil dipasang di marketplace!");
    } catch (error) {
      setError($("#listing-error"), error.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

// Edit listing form
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
    editDeletedImages.forEach((imgId) => { formData.append("deleteImageIds[]", imgId); });
    try {
      await api(`/api/listings/${encodeURIComponent(listingId)}`, { method: "POST", body: formData });
      if ($("#edit-listing-dialog")) $("#edit-listing-dialog").close();
      await loadListings(true); await loadListings();
      toast("Barang etalase berhasil diperbarui!");
    } catch (error) { setError($("#edit-listing-error"), error.message); } finally { if (submitBtn) submitBtn.disabled = false; }
  });
}

// Profile form
const profileForm = $("#profile-form");
if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const { user } = await api("/api/profile", { method: "PUT", body: new FormData(event.currentTarget) });
      state.user = user; updateUserUI();
      toast("Profil berhasil disimpan.");
    } catch (error) { toast(error.message); }
  });
}

const profileAvatar = $("#profile-avatar");
if (profileAvatar) {
  profileAvatar.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { event.target.value = ""; toast("Ukuran foto maksimal 5 MB."); return; }
    const photoContainer = $("#profile-photo");
    if (photoContainer) photoContainer.innerHTML = `<img src="${URL.createObjectURL(file)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="Pratinjau foto profil">`;
  });
}

// --- FILTER DROPDOWN BAWAH ---
const filterToggleBtn = $("#filter-toggle-btn");
const filterDropdown = $("#filter-dropdown");
const applyFiltersBtn = $("#apply-filters-btn");
const resetFiltersBtn = $("#reset-filters-btn");

if (filterToggleBtn && filterDropdown) {
  filterToggleBtn.addEventListener("click", (event) => { 
    event.stopPropagation(); 
    filterDropdown.classList.toggle("hidden"); 
  });
  document.addEventListener("click", (event) => {
    if (!filterDropdown.contains(event.target) && event.target !== filterToggleBtn) {
      filterDropdown.classList.add("hidden");
    }
  });
}
if (applyFiltersBtn) { 
  applyFiltersBtn.addEventListener("click", () => { 
    syncBottomToHeader(); 
    loadListings().catch((e) => toast(e.message)); 
    filterDropdown?.classList.add("hidden"); 
  }); 
}
if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", () => {
    if ($("#category-filter")) $("#category-filter").value = "";
    if ($("#filter-min-price")) $("#filter-min-price").value = "";
    if ($("#filter-max-price")) $("#filter-max-price").value = "";
    if ($("#filter-condition")) $("#filter-condition").value = "";
    if ($("#filter-location")) $("#filter-location").value = "";
    if ($("#filter-sort")) $("#filter-sort").value = "newest";
    syncBottomToHeader(); 
    loadListings().catch((e) => toast(e.message));
    filterDropdown?.classList.add("hidden");
  });
}

// --- FILTER DROPDOWN HEADER ---
const headerFilterBtn = $("#header-filter-btn");
const headerFilterDropdown = $("#header-filter-dropdown");

if (headerFilterBtn && headerFilterDropdown) {
  headerFilterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    headerFilterDropdown.classList.toggle("hidden");
    if (filterDropdown) filterDropdown.classList.add("hidden");
  });
  document.addEventListener("click", (event) => {
    if (!headerFilterDropdown.contains(event.target) && event.target !== headerFilterBtn) {
      headerFilterDropdown.classList.add("hidden");
    }
  });
}

const headerApplyBtn = $("#header-apply-filters");
if (headerApplyBtn) {
  headerApplyBtn.addEventListener("click", () => {
    syncHeaderToBottom();
    headerFilterDropdown?.classList.add("hidden");
    triggerSearch();
  });
}

const headerResetBtn = $("#header-reset-filters");
if (headerResetBtn) {
  headerResetBtn.addEventListener("click", () => {
    if ($("#header-category-filter")) $("#header-category-filter").value = "";
    if ($("#header-min-price")) $("#header-min-price").value = "";
    if ($("#header-max-price")) $("#header-max-price").value = "";
    if ($("#header-condition")) $("#header-condition").value = "";
    if ($("#header-location")) $("#header-location").value = "";
    if ($("#header-sort")) $("#header-sort").value = "newest";
    syncHeaderToBottom();
    headerFilterDropdown?.classList.add("hidden");
    triggerSearch();
  });
}

// ==========================================
// INITIALIZE
// ==========================================
async function initialize() {
  try {
    await loadCategories();
    await refreshUser();
    await loadListings();
    state.pollTimer = setInterval(() => {
      if (!state.user) return;
      refreshConversations().catch((e) => toast(e.message));
      if (state.activeConversation && $("#chats-view") && !$("#chats-view").classList.contains("hidden")) {
        loadMessages(state.activeConversation).catch((e) => toast(e.message));
      }
    }, 4000);
  } catch (error) { toast(error.message); }
}

// ==========================================
// KERANJANG BELANJA (CART)
// ==========================================
async function refreshCartCount() {
  const badge = $("#cart-count");
  if (!badge) return;
  if (!state.user) { badge.classList.add("hidden"); return; }
  try {
    const { count } = await api("/api/cart");
    badge.textContent = count;
    badge.classList.toggle("hidden", !count);
  } catch (e) { /* silent */ }
}

async function loadCart() {
  const wrap = $("#cart-items");
  const empty = $("#cart-empty");
  const subtotalEl = $("#cart-subtotal");
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:24px; text-align:center; color:var(--color-text-muted);">Memuat keranjang...</div>`;
  try {
    const { cart, subtotal } = await api("/api/cart");
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (!cart.length) {
      wrap.innerHTML = "";
      if (empty) empty.classList.remove("hidden");
      return;
    }
    if (empty) empty.classList.add("hidden");
    wrap.innerHTML = cart.map((item) => `
      <div style="display:flex; gap:12px; align-items:center; border:1px solid var(--color-border); border-radius:var(--radius-md); padding:10px; background:#fff;">
        <div style="width:56px; height:56px; flex-shrink:0; background:var(--color-bg-body); border-radius:var(--radius-sm); overflow:hidden; display:grid; place-items:center;">
          ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" style="width:100%; height:100%; object-fit:cover;" alt="">` : "📦"}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.title)}</div>
          <div style="font-size:12px; color:var(--color-text-muted);">${escapeHtml(item.seller_name)}</div>
          <div style="font-size:14px; font-weight:800; color:var(--color-primary-dark);">${formatPrice(item.price)}</div>
          ${item.is_available ? "" : `<span style="font-size:10px; font-weight:700; color:var(--color-danger);">Barang sudah tidak tersedia</span>`}
        </div>
        <button type="button" class="btn-outline" style="padding:6px 10px; font-size:11px; font-weight:700; color:#ef4444; border-color:#ef4444;" data-cart-remove="${escapeHtml(item.cart_id)}">🗑️</button>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-cart-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.cartRemove));
    });
  } catch (e) {
    wrap.innerHTML = "";
    toast(e.message);
  }
}

async function addToCart(listingId) {
  if (!state.user) { window.location.href = "login.html"; return; }
  try {
    await api("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    toast("Barang masuk keranjang! 🛒");
    await refreshCartCount();
  } catch (e) { toast(e.message); }
}

async function buyNow(listingId) {
  if (!state.user) { window.location.href = "login.html"; return; }
  try {
    await api("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
  } catch (e) {
    // Kalau barang emang udah ada di keranjang, lanjut aja ke checkout
    if (!/sudah ada/i.test(e.message)) { toast(e.message); return; }
  }
  window.location.href = "cart.php";
}

async function removeFromCart(cartId) {
  try {
    await api("/api/cart/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId: Number(cartId) }),
    });
    toast("Barang dihapus dari keranjang.");
    await Promise.all([loadCart(), refreshCartCount()]);
  } catch (e) { toast(e.message); }
}

async function clearCart() {
  if (!confirm("Kosongkan seluruh isi keranjang?")) return;
  try {
    await api("/api/cart/clear", { method: "DELETE" });
    toast("Keranjang dikosongkan.");
    await Promise.all([loadCart(), refreshCartCount()]);
  } catch (e) { toast(e.message); }
}

async function codToChat(listingId) {
  if (!state.user) { window.location.href = "login.html"; return; }
  try {
    const { conversationId } = await api("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    window.location.href = "chat.php?conv=" + conversationId;
  } catch (e) { toast(e.message); }
}

// Tombol keranjang di header: BELUM LOGIN -> lempar ke login.html
const cartNav = $("#cart-nav");
if (cartNav) {
  cartNav.addEventListener("click", () => {
    if (!state.user) { window.location.href = "login.html"; return; }
    window.location.href = "cart.php";
  });
}

const cartClearBtn = $("#cart-clear-btn");
if (cartClearBtn) cartClearBtn.addEventListener("click", clearCart);

const cartCheckoutBtn = $("#cart-checkout-btn");
if (cartCheckoutBtn) cartCheckoutBtn.addEventListener("click", () => toast("Fitur checkout segera hadir 👀"));

// Badge keranjang auto-update tiap kali UI user di-refresh
const originalUpdateUserUI = updateUserUI;
updateUserUI = function () {
  originalUpdateUserUI();
  refreshCartCount();
};
refreshCartCount();



initialize();

// === LOGIC BARU: Handle Multiple Conversation dari URL (?convs=id1,id2) ===
const urlParams = new URLSearchParams(window.location.search);
const convsParam = urlParams.get('convs');

if (convsParam) {
  const targetIds = convsParam.split(',');
  
  // Tunggu sebentar agar daftar chat di sidebar selesai di-render
  setTimeout(() => {
    // Buka obrolan PERTAMA dari daftar yang dibuat
    const firstId = targetIds[0];
    const targetConv = chatState.conversations.find(c => String(c.id) === String(firstId));
    
    if (targetConv) {
      openChat(firstId, targetConv);
      
      // Kasih tau user kalau ada penjual lain yang juga diajak chat
      if (targetIds.length > 1) {
        toast(`Obrolan dengan ${targetIds.length} penjual telah dibuat. Cek sidebar!`);
      }
    }
  }, 600); // Delay 600ms biar data conversation ke-load duluan
}