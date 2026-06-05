const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Bags", "Accessories"];
const DEFAULT_OUTFIT_IMAGE = "/assets/demo/silver-mini-dress.jpg";

let state = { profile: {}, privacy: {}, items: [], shopping: [], outfits: [], friends: [] };
let selectedCategory = "All";
let pendingItemImage = "";
let pendingOutfitImage = "";
let detectedTags = [];
let detectedItemIds = [];
let activeTab = "today";

const els = {
  navLinks: document.querySelectorAll(".tool-nav a[data-tab]"),
  viewSections: document.querySelectorAll(".view-section[data-view]"),
  itemCount: document.querySelector("#itemCount"),
  outfitCount: document.querySelector("#outfitCount"),
  purchaseCount: document.querySelector("#purchaseCount"),
  monthSpend: document.querySelector("#monthSpend"),
  styleSummary: document.querySelector("#styleSummary"),
  repeatHero: document.querySelector("#repeatHero"),
  repeatHeroPhoto: document.querySelector("#repeatHeroPhoto"),
  lowRepeatHero: document.querySelector("#lowRepeatHero"),
  lowRepeatHeroPhoto: document.querySelector("#lowRepeatHeroPhoto"),
  paletteStrip: document.querySelector("#paletteStrip"),
  aiReadout: document.querySelector("#aiReadout"),
  analyzeDemoButton: document.querySelector("#analyzeDemoButton"),
  recognitionTitle: document.querySelector("#recognitionTitle"),
  saveStatus: document.querySelector("#saveStatus"),
  outfitForm: document.querySelector("#outfitForm"),
  outfitImage: document.querySelector("#outfitImage"),
  outfitPreview: document.querySelector("#outfitPreview"),
  detectedChips: document.querySelector("#detectedChips"),
  outfitLog: document.querySelector("#outfitLog"),
  itemForm: document.querySelector("#itemForm"),
  itemImage: document.querySelector("#itemImage"),
  uploadPreview: document.querySelector("#uploadPreview"),
  closetGrid: document.querySelector("#closetGrid"),
  categoryFilters: document.querySelector("#categoryFilters"),
  closetCardTemplate: document.querySelector("#closetCardTemplate"),
  suggestionForm: document.querySelector("#suggestionForm"),
  suggestionGrid: document.querySelector("#suggestionGrid"),
  shoppingForm: document.querySelector("#shoppingForm"),
  importForm: document.querySelector("#importForm"),
  shoppingList: document.querySelector("#shoppingList"),
  friendForm: document.querySelector("#friendForm"),
  friendFeed: document.querySelector("#friendFeed"),
  privacyForm: document.querySelector("#privacyForm"),
  outfitSharePreview: document.querySelector("#outfitSharePreview"),
  purchaseSharePreview: document.querySelector("#purchaseSharePreview"),
  friendApprovalPreview: document.querySelector("#friendApprovalPreview")
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error || "Request failed");
  }
  return response.json();
}

async function loadState() {
  state = await api("/api/state");
  render();
}

function colorGradient(item) {
  const colors = item.colors && item.colors.length ? item.colors : ["pink", "yellow"];
  const first = resolveColor(colors[0]) || "#f49ac2";
  const second = resolveColor(colors[1]) || "#fff08a";
  return `linear-gradient(135deg, ${first}, ${second})`;
}

function resolveColor(color) {
  const colorMap = {
    black: "#161616",
    white: "#fffdf7",
    ivory: "#f5ecd8",
    cream: "#f5ecd8",
    blue: "#80b6df",
    denim: "#5f8fbd",
    brown: "#9b6a48",
    red: "#d74a5e",
    green: "#6db47d",
    sage: "#a8bfa5",
    gray: "#b8b8b8",
    grey: "#b8b8b8",
    silver: "#d6dce2",
    pink: "#f49ac2",
    pearl: "#f7efe5",
    lavender: "#d9daf8",
    yellow: "#fff08a",
    mint: "#c9ecd8"
  };
  return colorMap[String(color || "").toLowerCase()] || color;
}

function getPurchaseStatus(item) {
  if (item.status === "bought") return { label: "Bought", className: "bought" };
  if (item.status === "skip") return { label: "Skipped", className: "skip" };
  return { label: "Wishlist", className: "watch" };
}

function getMonthSpend() {
  return state.shopping
    .filter((item) => item.status === "bought")
    .reduce((sum, item) => sum + Number(item.price || 0), 0);
}

async function detectOutfitDraft(extra = {}) {
  if (!pendingOutfitImage && !extra.image) {
    resetRecognition();
    return { tags: [], itemIds: [], colors: [], categories: [] };
  }
  const result = await api("/api/detect-outfit", {
    method: "POST",
    body: JSON.stringify({
      image: pendingOutfitImage || extra.image,
      ...extra
    })
  });
  detectedTags = result.tags || [];
  detectedItemIds = result.itemIds || [];
  renderChips(els.detectedChips, detectedTags);
  renderAiReadout(result);
  els.recognitionTitle.textContent = result.categories && result.categories.length ? `${result.categories[0]} look` : "Recognized look";
  els.saveStatus.textContent = "";
  return result;
}

function resetRecognition() {
  detectedTags = [];
  detectedItemIds = [];
  pendingOutfitImage = "";
  setPreview(els.outfitPreview, "");
  els.recognitionTitle.textContent = "Waiting for upload";
  els.detectedChips.innerHTML = '<p class="empty-inline">Upload a photo to recognize clothing, colors, and accessories.</p>';
  renderAiReadout();
}

function titleCase(value) {
  return String(value || "")
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : ""))
    .join(" ");
}

function renderChips(container, tags) {
  container.innerHTML = tags
    .map((tag, index) => `<span class="chip chip-${(index % 6) + 1}">${escapeHtml(tag)}</span>`)
    .join("");
}

function renderMetrics() {
  els.itemCount.textContent = `${state.items.length} items`;
  els.outfitCount.textContent = `${state.outfits.length} logs`;
  els.purchaseCount.textContent = `${state.shopping.length} items`;
  els.monthSpend.textContent = `${formatMoney(getMonthSpend())} bought`;
}

function renderStyleBrief() {
  const byWear = state.items.slice().sort((a, b) => Number(b.wearCount || 0) - Number(a.wearCount || 0));
  const lowWear = state.items.slice().sort((a, b) => Number(a.wearCount || 0) - Number(b.wearCount || 0));
  const colorCounts = state.items
    .flatMap((item) => item.colors || [])
    .reduce((counts, color) => ({ ...counts, [color]: (counts[color] || 0) + 1 }), {});
  const palette = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([color]) => color);
  const categories = [...new Set(state.items.map((item) => item.category))].length;

  els.repeatHero.textContent = byWear[0] ? `${byWear[0].name} · ${byWear[0].wearCount} wears` : "-";
  els.lowRepeatHero.textContent = lowWear[0] ? `${lowWear[0].name} · ${lowWear[0].wearCount} wear` : "-";
  els.repeatHeroPhoto.style.backgroundImage = byWear[0] && byWear[0].image ? `url("${byWear[0].image}")` : "";
  els.lowRepeatHeroPhoto.style.backgroundImage = lowWear[0] && lowWear[0].image ? `url("${lowWear[0].image}")` : "";
  els.styleSummary.textContent = `${state.items.length} pieces across ${categories} categories, with ${state.outfits.length} logged looks and ${palette.length} recurring palette notes.`;
  els.paletteStrip.innerHTML = palette
    .map(
      (color) => `
        <span title="${escapeHtml(color)}" style="background: ${escapeHtml(resolveColor(color))}"></span>
      `
    )
    .join("");
}

function renderAiReadout(result = {}) {
  const colors = result.colors && result.colors.length ? result.colors.map(titleCase).join(" / ") : "-";
  const categories =
    result.categories && result.categories.length ? result.categories.map(titleCase).join(" + ") : "-";
  const scan = result.summary ? "Analyzed" : "Upload photo";
  els.aiReadout.innerHTML = `
    <div>
      <span>Status</span>
      <strong>${escapeHtml(scan)}</strong>
    </div>
    <div>
      <span>Color</span>
      <strong>${escapeHtml(colors)}</strong>
    </div>
    <div>
      <span>Pieces</span>
      <strong>${escapeHtml(categories)}</strong>
    </div>
  `;
}

function renderOutfitLog() {
  if (!state.outfits.length) {
    els.outfitLog.innerHTML = '<p class="empty-state">No outfits logged yet.</p>';
    return;
  }

  els.outfitLog.innerHTML = state.outfits
    .slice(0, 9)
    .map((outfit) => {
      const tags = outfit.detectedTags || [];
      const photoStyle = outfit.image ? `style="background-image: url('${outfit.image}')"` : "";
      return `
        <article class="log-card">
          <div class="log-thumb" ${photoStyle}></div>
          <div class="log-copy">
            <strong>${escapeHtml(outfit.occasion || "Everyday")}</strong>
            <p class="meta">${escapeHtml(outfit.date)} · ${escapeHtml(outfit.visibility || "friends")} · ${escapeHtml(outfit.notes || "Logged from daily fit check.")}</p>
            <div class="chip-row">${tags.map((tag, index) => `<span class="chip chip-${(index % 6) + 1}">${escapeHtml(tag)}</span>`).join("")}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFilters() {
  els.categoryFilters.innerHTML = CATEGORIES.map(
    (category) => `
      <button type="button" class="${category === selectedCategory ? "active" : ""}" data-category="${escapeHtml(category)}">
        ${escapeHtml(category)}
      </button>
    `
  ).join("");
}

function renderCloset() {
  const items =
    selectedCategory === "All" ? state.items : state.items.filter((item) => item.category === selectedCategory);

  if (!items.length) {
    els.closetGrid.innerHTML = '<p class="empty-state">Nothing in this drawer yet.</p>';
    return;
  }

  els.closetGrid.innerHTML = "";
  items.forEach((item) => {
    const node = els.closetCardTemplate.content.firstElementChild.cloneNode(true);
    const photo = node.querySelector(".item-photo");
    node.dataset.id = item.id;
    if (item.image) {
      photo.style.backgroundImage = `url("${item.image}")`;
    } else {
      photo.style.background = colorGradient(item);
    }
    node.querySelector("h3").textContent = item.name;
    const costPerWear = Number(item.wearCount || 0) > 0 ? Number(item.price || 0) / Number(item.wearCount || 1) : Number(item.price || 0);
    node.querySelector(".item-meta").textContent = `${item.category} · ${item.wearCount || 0} wears · ${formatMoney(costPerWear)} / wear`;
    node.querySelector(".item-swatches").innerHTML = (item.colors || [])
      .slice(0, 4)
      .map((color) => `<span title="${escapeHtml(color)}" style="background: ${escapeHtml(resolveColor(color))}"></span>`)
      .join("");
    els.closetGrid.append(node);
  });
}

async function renderSuggestions(payload = {}) {
  const data = await api("/api/suggestions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const suggestions = data.suggestions || [];
  if (!suggestions.length) {
    els.suggestionGrid.innerHTML = '<p class="empty-state">Add a few closet pieces to generate outfit suggestions.</p>';
    return;
  }
  els.suggestionGrid.innerHTML = suggestions
    .map(
      (suggestion) => `
        <article class="suggestion-card">
          <div class="suggestion-score">${escapeHtml(suggestion.score >= 90 ? "Best" : suggestion.score >= 84 ? "Remix" : "Try")}</div>
          <div>
            <strong>${escapeHtml(suggestion.title)}</strong>
            <p class="meta">${escapeHtml(suggestion.items.join(" + "))}</p>
            <p>${escapeHtml(suggestion.reason)}</p>
            <span class="status-pill watch">${escapeHtml(suggestion.shoppingGoal)}</span>
            <div class="reason-row">
              <span>Weather fit</span>
              <span>Repeat balance</span>
              <span>Shopping aware</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPurchases() {
  if (!state.shopping.length) {
    els.shoppingList.innerHTML = '<p class="empty-state">No purchases tracked yet.</p>';
    return;
  }

  els.shoppingList.innerHTML = state.shopping
    .map((item) => {
      const status = getPurchaseStatus(item);
      return `
        <article class="purchase-row" data-id="${escapeHtml(item.id)}">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <p class="meta">${escapeHtml(item.category)} · ${escapeHtml(item.visibility || "private")} · ${formatMoney(Number(item.price))} · ${escapeHtml(item.reason || "No note")}</p>
            <span class="status-pill ${status.className}">${status.label}</span>
          </div>
          <div class="purchase-actions">
            <button class="status-button" type="button" data-status="bought">Bought</button>
            <button class="status-button" type="button" data-status="watch">Wishlist</button>
            <button class="status-button" type="button" data-action="closet">Closet</button>
            <button class="status-button remove" type="button" data-action="delete">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFriends() {
  if (!state.friends || !state.friends.length) {
    els.friendFeed.innerHTML = '<p class="empty-state">Add friend activity after the MVP is stable.</p>';
    return;
  }

  const acceptedFriends = state.friends.filter((friend) => friend.status !== "blocked");
  els.friendFeed.innerHTML = acceptedFriends
    .map((friend) => {
      const photoStyle = friend.image
        ? `background-image: url('${escapeHtml(friend.image)}')`
        : `background: ${escapeHtml(friend.color || "#d9daf8")}`;
      return `
      <article class="friend-card">
        <div class="friend-photo" style="${photoStyle}"></div>
        <div>
          <strong>${escapeHtml(friend.name)}</strong>
          <p class="meta">${escapeHtml(friend.handle || "@friend")} · ${escapeHtml(friend.status)} · ${escapeHtml(friend.activity)}</p>
          <div class="chip-row">${(friend.tags || []).map((tag, index) => `<span class="chip chip-${(index % 6) + 1}">${escapeHtml(tag)}</span>`).join("")}</div>
          ${
            friend.status === "pending"
              ? `<div class="purchase-actions">
                  <button class="status-button" type="button" data-id="${escapeHtml(friend.id)}" data-status="accepted">Accept</button>
                  <button class="status-button remove" type="button" data-id="${escapeHtml(friend.id)}" data-status="blocked">Block</button>
                </div>`
              : `<span class="status-pill bought">Shared with you</span>`
          }
        </div>
      </article>
    `;
    })
    .join("");
}

function render() {
  renderMetrics();
  renderStyleBrief();
  if (detectedTags.length) {
    renderChips(els.detectedChips, detectedTags);
  }
  renderOutfitLog();
  renderFilters();
  renderCloset();
  renderPurchases();
  renderFriends();
  fillPrivacyForm();
  renderSharePreview();
}

function renderSharePreview() {
  els.outfitSharePreview.textContent = titleCase(state.privacy.outfitDefault || "friends");
  els.purchaseSharePreview.textContent = titleCase(state.privacy.purchaseDefault || "private");
  els.friendApprovalPreview.textContent = state.privacy.friendApprovals === false ? "Open" : "Approval on";
}

function fillPrivacyForm() {
  if (els.privacyForm.dataset.ready !== "true") {
    els.privacyForm.elements.outfitDefault.value = state.privacy.outfitDefault || "friends";
    els.privacyForm.elements.purchaseDefault.value = state.privacy.purchaseDefault || "private";
    els.privacyForm.elements.shareClosetStats.checked = Boolean(state.privacy.shareClosetStats);
    els.privacyForm.elements.friendApprovals.checked = state.privacy.friendApprovals !== false;
    els.privacyForm.dataset.ready = "true";
  }
}

function setActiveTab(tabName, pushHash = true) {
  const nextTab = [...els.viewSections].some((section) => section.dataset.view === tabName) ? tabName : "today";
  activeTab = nextTab;
  els.viewSections.forEach((section) => section.classList.toggle("active", section.dataset.view === nextTab));
  els.navLinks.forEach((link) => link.classList.toggle("active", link.dataset.tab === nextTab));
  if (pushHash && window.location.hash !== `#${nextTab}`) {
    window.history.pushState(null, "", `#${nextTab}`);
  }
}

async function imageToDataUrl(file) {
  if (!file) return "";

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

  const maxSize = 900;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(image.src);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function setPreview(previewEl, image) {
  previewEl.style.backgroundImage = image ? `url("${image}")` : "";
  previewEl.classList.toggle("has-image", Boolean(image));
}

els.outfitImage.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  pendingOutfitImage = await imageToDataUrl(file);
  setPreview(els.outfitPreview, pendingOutfitImage);
  els.saveStatus.textContent = "Analyzing uploaded photo...";
  await detectOutfitDraft({
    occasion: "Dinner",
    notes: "Silver strapless mini dress, gold heels, hoop earrings, leopard clutch"
  });
});

els.analyzeDemoButton.addEventListener("click", async () => {
  if (!pendingOutfitImage) {
    els.saveStatus.textContent = "Upload a photo first.";
    return;
  }
  await detectOutfitDraft({
    occasion: "Dinner",
    notes: "Silver strapless mini dress, gold heels, hoop earrings, leopard clutch"
  });
});

els.itemImage.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  pendingItemImage = await imageToDataUrl(file);
  setPreview(els.uploadPreview, pendingItemImage);
});

els.outfitForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  if (!pendingOutfitImage || !detectedTags.length) {
    els.saveStatus.textContent = "Upload and analyze a photo first.";
    return;
  }
  if (!detectedItemIds.length) {
    await detectOutfitDraft({ occasion: form.get("occasion"), notes: form.get("notes") });
  }
  await api("/api/outfits", {
    method: "POST",
    body: JSON.stringify({
      image: pendingOutfitImage || DEFAULT_OUTFIT_IMAGE,
      occasion: form.get("occasion"),
      notes: form.get("notes"),
      detectedTags,
      itemIds: detectedItemIds,
      visibility: form.get("visibility")
    })
  });
  formElement.reset();
  resetRecognition();
  els.saveStatus.textContent = "Saved to Outfit logs.";
  await loadState();
  await renderSuggestions();
});

els.itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  await api("/api/items", {
    method: "POST",
    body: JSON.stringify({
      name: form.get("name"),
      category: form.get("category"),
      colors: form.get("colors"),
      price: form.get("price"),
      image: pendingItemImage,
      visibility: "private"
    })
  });
  formElement.reset();
  pendingItemImage = "";
  setPreview(els.uploadPreview, "");
  await loadState();
  await renderSuggestions();
});

els.suggestionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await renderSuggestions({
    occasion: form.get("occasion"),
    weather: form.get("weather"),
    goal: form.get("goal")
  });
});

els.shoppingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  await api("/api/shopping", {
    method: "POST",
    body: JSON.stringify({
      name: form.get("name"),
      category: form.get("category"),
      price: form.get("price"),
      status: form.get("status"),
      reason: form.get("status") === "bought" ? "Added from purchase tracker." : "Saved to wishlist.",
      visibility: form.get("visibility")
    })
  });
  formElement.reset();
  await loadState();
  await renderSuggestions();
});

els.importForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const text = form.get("importText");
  await api("/api/shopping/import", {
    method: "POST",
    body: JSON.stringify({
      text,
      url: String(text || "").startsWith("http") ? text : "",
      status: "watch"
    })
  });
  formElement.reset();
  await loadState();
});

els.categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  selectedCategory = button.dataset.category;
  render();
});

els.closetGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const card = event.target.closest(".closet-card");
  if (!button || !card) return;
  const item = state.items.find((entry) => entry.id === card.dataset.id);
  if (!item) return;

  if (button.dataset.action === "wear") {
    await api(`/api/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ wearCount: Number(item.wearCount || 0) + 1 })
    });
  }

  if (button.dataset.action === "delete") {
    await api(`/api/items/${item.id}`, { method: "DELETE" });
  }

  await loadState();
});

els.shoppingList.addEventListener("click", async (event) => {
  const row = event.target.closest(".purchase-row");
  const button = event.target.closest("button");
  if (!row || !button) return;

  if (button.dataset.action === "delete") {
    await api(`/api/shopping/${row.dataset.id}`, { method: "DELETE" });
  } else if (button.dataset.action === "closet") {
    await api(`/api/shopping/${row.dataset.id}/add-to-closet`, { method: "POST" });
  } else if (button.dataset.status) {
    await api(`/api/shopping/${row.dataset.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: button.dataset.status })
    });
  }

  await loadState();
  await renderSuggestions();
});

els.friendForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  await api("/api/friends", {
    method: "POST",
    body: JSON.stringify({
      name: form.get("name"),
      handle: form.get("handle"),
      status: state.privacy.friendApprovals === false ? "accepted" : "pending",
      tags: ["request", "privacy"]
    })
  });
  formElement.reset();
  await loadState();
});

els.friendFeed.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  await api(`/api/friends/${button.dataset.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: button.dataset.status })
  });
  await loadState();
});

els.privacyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await api("/api/privacy", {
    method: "PATCH",
    body: JSON.stringify({
      outfitDefault: form.get("outfitDefault"),
      purchaseDefault: form.get("purchaseDefault"),
      shareClosetStats: form.has("shareClosetStats"),
      friendApprovals: form.has("friendApprovals")
    })
  });
  els.privacyForm.dataset.ready = "false";
  await loadState();
});

els.navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveTab(link.dataset.tab);
  });
});

window.addEventListener("popstate", () => {
  setActiveTab(window.location.hash.slice(1) || "today", false);
});

async function init() {
  try {
    await loadState();
    setActiveTab(window.location.hash.slice(1) || activeTab, false);
    resetRecognition();
    await renderSuggestions();
  } catch (error) {
    document.body.innerHTML = `<main class="canvas"><p class="empty-state">${escapeHtml(error.message)}</p></main>`;
  }
}

init();
