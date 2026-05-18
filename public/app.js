const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Bags", "Accessories"];

let state = { items: [], shopping: [], outfits: [], friends: [] };
let selectedCategory = "All";
let pendingItemImage = "";
let pendingOutfitImage = "";
let detectedTags = [];

const els = {
  itemCount: document.querySelector("#itemCount"),
  outfitCount: document.querySelector("#outfitCount"),
  purchaseCount: document.querySelector("#purchaseCount"),
  monthSpend: document.querySelector("#monthSpend"),
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
  shoppingForm: document.querySelector("#shoppingForm"),
  shoppingList: document.querySelector("#shoppingList"),
  friendFeed: document.querySelector("#friendFeed"),
  seedDemoButton: document.querySelector("#seedDemoButton")
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
  const colorMap = {
    black: "#161616",
    white: "#fffdf7",
    ivory: "#f5ecd8",
    blue: "#80b6df",
    denim: "#5f8fbd",
    brown: "#9b6a48",
    red: "#d74a5e",
    green: "#6db47d",
    gray: "#b8b8b8",
    grey: "#b8b8b8",
    silver: "#d6dce2",
    pink: "#f49ac2",
    yellow: "#fff08a",
    mint: "#c9ecd8"
  };
  const first = colorMap[colors[0]] || colors[0] || "#f49ac2";
  const second = colorMap[colors[1]] || colors[1] || "#fff08a";
  return `linear-gradient(135deg, ${first}, ${second})`;
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

function inferTags() {
  const matches = state.items
    .slice(0, 4)
    .map((item) => item.name.toLowerCase().replace(/^straight-leg /, "").replace(/^white ribbed /, "white "))
    .filter(Boolean);
  return matches.length ? [...matches, "needs review"].slice(0, 5) : ["top match", "bottom match", "shoe match"];
}

function renderChips(container, tags) {
  container.innerHTML = tags
    .map((tag, index) => `<span class="chip chip-${(index % 6) + 1}">${escapeHtml(tag)}</span>`)
    .join("");
}

function renderMetrics() {
  els.itemCount.textContent = state.items.length;
  els.outfitCount.textContent = state.outfits.length;
  els.purchaseCount.textContent = state.shopping.length;
  els.monthSpend.textContent = formatMoney(getMonthSpend());
}

function renderOutfitLog() {
  if (!state.outfits.length) {
    els.outfitLog.innerHTML = '<p class="empty-state">No outfits logged yet.</p>';
    return;
  }

  els.outfitLog.innerHTML = state.outfits
    .slice(0, 4)
    .map((outfit) => {
      const tags = outfit.detectedTags || [];
      const photoStyle = outfit.image ? `style="background-image: url('${outfit.image}')"` : "";
      return `
        <article class="log-card">
          <div class="log-thumb" ${photoStyle}></div>
          <div class="log-copy">
            <strong>${escapeHtml(outfit.occasion || "Everyday")}</strong>
            <p class="meta">${escapeHtml(outfit.date)} · ${escapeHtml(outfit.notes || "Logged from daily fit check.")}</p>
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
    node.querySelector(".item-meta").textContent = `${item.category} · ${item.wearCount || 0} wears · ${formatMoney(Number(item.price))}`;
    els.closetGrid.append(node);
  });
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
            <p class="meta">${escapeHtml(item.category)} · ${formatMoney(Number(item.price))} · ${escapeHtml(item.reason || "No note")}</p>
            <span class="status-pill ${status.className}">${status.label}</span>
          </div>
          <div class="purchase-actions">
            <button class="status-button" type="button" data-status="bought">Bought</button>
            <button class="status-button" type="button" data-status="watch">Wishlist</button>
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

  els.friendFeed.innerHTML = state.friends
    .map((friend) => `
      <article class="friend-card">
        <div class="friend-photo" style="background: ${escapeHtml(friend.color || "#d9daf8")}"></div>
        <div>
          <strong>${escapeHtml(friend.name)}</strong>
          <p class="meta">${escapeHtml(friend.activity)}</p>
          <div class="chip-row">${(friend.tags || []).map((tag, index) => `<span class="chip chip-${(index % 6) + 1}">${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
      </article>
    `)
    .join("");
}

function render() {
  detectedTags = detectedTags.length ? detectedTags : inferTags();
  renderMetrics();
  renderChips(els.detectedChips, detectedTags);
  renderOutfitLog();
  renderFilters();
  renderCloset();
  renderPurchases();
  renderFriends();
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
  detectedTags = inferTags();
  setPreview(els.outfitPreview, pendingOutfitImage);
  renderChips(els.detectedChips, detectedTags);
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
  await api("/api/outfits", {
    method: "POST",
    body: JSON.stringify({
      image: pendingOutfitImage,
      occasion: form.get("occasion"),
      notes: form.get("notes"),
      detectedTags
    })
  });
  formElement.reset();
  pendingOutfitImage = "";
  detectedTags = [];
  setPreview(els.outfitPreview, "");
  await loadState();
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
      image: pendingItemImage
    })
  });
  formElement.reset();
  pendingItemImage = "";
  setPreview(els.uploadPreview, "");
  await loadState();
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
      reason: form.get("status") === "bought" ? "Added from purchase tracker." : "Saved to wishlist."
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
  } else if (button.dataset.status) {
    await api(`/api/shopping/${row.dataset.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: button.dataset.status })
    });
  }

  await loadState();
});

els.seedDemoButton.addEventListener("click", async () => {
  state = await api("/api/reset", { method: "POST", body: JSON.stringify({}) });
  pendingItemImage = "";
  pendingOutfitImage = "";
  detectedTags = [];
  els.itemForm.reset();
  els.outfitForm.reset();
  els.shoppingForm.reset();
  setPreview(els.uploadPreview, "");
  setPreview(els.outfitPreview, "");
  render();
});

loadState().catch((error) => {
  document.body.innerHTML = `<main class="canvas"><p class="empty-state">${escapeHtml(error.message)}</p></main>`;
});
