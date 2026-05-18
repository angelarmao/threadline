const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Other"];

let state = { items: [], shopping: [], outfits: [] };
let selectedCategory = "All";
let pendingImage = "";

const els = {
  itemCount: document.querySelector("#itemCount"),
  wearCount: document.querySelector("#wearCount"),
  avgCostPerWear: document.querySelector("#avgCostPerWear"),
  shoppingCount: document.querySelector("#shoppingCount"),
  gapList: document.querySelector("#gapList"),
  decisionList: document.querySelector("#decisionList"),
  closetGrid: document.querySelector("#closetGrid"),
  categoryFilters: document.querySelector("#categoryFilters"),
  itemForm: document.querySelector("#itemForm"),
  shoppingForm: document.querySelector("#shoppingForm"),
  shoppingList: document.querySelector("#shoppingList"),
  uploadPreview: document.querySelector("#uploadPreview"),
  itemImage: document.querySelector("#itemImage"),
  closetCardTemplate: document.querySelector("#closetCardTemplate"),
  seedDemoButton: document.querySelector("#seedDemoButton")
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 10 ? 2 : 0
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

function getCategoryCounts() {
  return state.items.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
}

function getAverageCostPerWear() {
  const priced = state.items.filter((item) => Number(item.price) > 0);
  if (!priced.length) return 0;
  const total = priced.reduce((sum, item) => sum + Number(item.price) / Math.max(1, Number(item.wearCount) || 1), 0);
  return total / priced.length;
}

function getDecision(idea) {
  const closetCount = state.items.filter((item) => item.category === idea.category).length;
  const costPerWear = Number(idea.price || 0) / Math.max(1, Number(idea.plannedWears || 1));

  if (idea.status === "bought") {
    return { label: "Bought", tone: "good", note: "Move into closet after purchase." };
  }

  if (closetCount >= 4 && costPerWear > 8) {
    return { label: "Style first", tone: "skip", note: `${closetCount} owned in this category.` };
  }

  if (costPerWear <= 9 && Number(idea.plannedWears) >= 8) {
    return { label: "Strong candidate", tone: "good", note: `${formatMoney(costPerWear)} per planned wear.` };
  }

  return { label: "Waitlist", tone: "wait", note: `${formatMoney(costPerWear)} per planned wear.` };
}

function renderMetrics() {
  const wears = state.items.reduce((sum, item) => sum + (Number(item.wearCount) || 0), 0);
  els.itemCount.textContent = state.items.length;
  els.wearCount.textContent = wears;
  els.avgCostPerWear.textContent = formatMoney(getAverageCostPerWear());
  els.shoppingCount.textContent = state.shopping.length;
}

function renderGaps() {
  const counts = getCategoryCounts();
  const gapRows = CATEGORIES.filter((category) => category !== "All")
    .map((category) => {
      const count = counts[category] || 0;
      const shoppingMatches = state.shopping.filter((idea) => idea.category === category && idea.status !== "skip").length;
      let label = "Covered";
      let detail = `${count} owned`;
      if (count === 0) {
        label = "Gap";
        detail = shoppingMatches ? `${shoppingMatches} idea in queue` : "No pieces logged";
      } else if (count === 1) {
        label = "Thin";
      }
      return { category, count, label, detail };
    })
    .sort((a, b) => a.count - b.count)
    .slice(0, 4);

  els.gapList.innerHTML = gapRows
    .map(
      (row) => `
        <div class="gap-row">
          <div>
            <strong>${escapeHtml(row.category)}</strong>
            <small>${escapeHtml(row.detail)}</small>
          </div>
          <span class="score-pill ${row.label === "Covered" ? "" : "wait"}">${escapeHtml(row.label)}</span>
        </div>
      `
    )
    .join("");
}

function renderDecisions() {
  if (!state.shopping.length) {
    els.decisionList.innerHTML = '<p class="empty-state">No shopping ideas yet.</p>';
    return;
  }

  els.decisionList.innerHTML = state.shopping
    .slice(0, 4)
    .map((idea) => {
      const decision = getDecision(idea);
      return `
        <div class="decision-row">
          <strong>${escapeHtml(idea.name)}</strong>
          <small>${escapeHtml(idea.category)} · ${formatMoney(Number(idea.price))} · ${escapeHtml(decision.note)}</small>
          <span class="score-pill ${decision.tone === "skip" ? "skip" : decision.tone === "wait" ? "wait" : ""}">
            ${escapeHtml(decision.label)}
          </span>
        </div>
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

function colorGradient(item) {
  const colors = item.colors && item.colors.length ? item.colors : ["teal"];
  const first = colors[0];
  const second = colors[1] || "white";
  const colorMap = {
    black: "#1f2428",
    white: "#f7f7f2",
    ivory: "#f1eadc",
    blue: "#5f8fc9",
    denim: "#4a78a8",
    brown: "#8b5f3c",
    red: "#cf4e3f",
    green: "#4f8f71",
    gray: "#a7b0b2",
    grey: "#a7b0b2",
    silver: "#c7d0d8",
    pink: "#e7a1b0"
  };
  return `linear-gradient(135deg, ${colorMap[first] || first}, ${colorMap[second] || second})`;
}

function renderCloset() {
  const items =
    selectedCategory === "All" ? state.items : state.items.filter((item) => item.category === selectedCategory);

  if (!items.length) {
    els.closetGrid.innerHTML = '<p class="empty-state">No closet pieces in this view.</p>';
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
    node.querySelector(".item-notes").textContent = item.notes || "No notes yet.";
    els.closetGrid.append(node);
  });
}

function renderShopping() {
  if (!state.shopping.length) {
    els.shoppingList.innerHTML = '<p class="empty-state">Your queue is clear.</p>';
    return;
  }

  els.shoppingList.innerHTML = state.shopping
    .map((idea) => {
      const decision = getDecision(idea);
      return `
        <article class="shopping-row" data-id="${escapeHtml(idea.id)}">
          <div>
            <strong>${escapeHtml(idea.name)}</strong>
            <small>${escapeHtml(idea.category)} · ${formatMoney(Number(idea.price))} · ${idea.plannedWears} planned wears · ${escapeHtml(idea.reason)}</small>
            <span class="score-pill ${decision.tone === "skip" ? "skip" : decision.tone === "wait" ? "wait" : ""}">
              ${escapeHtml(decision.label)}
            </span>
          </div>
          <div class="shopping-actions">
            <button class="status-button" type="button" data-status="candidate">Candidate</button>
            <button class="status-button" type="button" data-status="skip">Skip</button>
            <button class="status-button remove" type="button" data-action="delete">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function render() {
  renderMetrics();
  renderGaps();
  renderDecisions();
  renderFilters();
  renderCloset();
  renderShopping();
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

els.itemImage.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  pendingImage = await imageToDataUrl(file);
  els.uploadPreview.style.backgroundImage = `url("${pendingImage}")`;
  els.uploadPreview.classList.add("has-image");
});

els.itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const item = {
    name: form.get("name"),
    category: form.get("category"),
    colors: form.get("colors"),
    season: form.get("season"),
    price: form.get("price"),
    wearCount: form.get("wearCount"),
    notes: form.get("notes"),
    image: pendingImage
  };
  await api("/api/items", { method: "POST", body: JSON.stringify(item) });
  formElement.reset();
  pendingImage = "";
  els.uploadPreview.style.backgroundImage = "";
  els.uploadPreview.classList.remove("has-image");
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
      plannedWears: form.get("plannedWears"),
      reason: form.get("reason")
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
  const row = event.target.closest(".shopping-row");
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
  pendingImage = "";
  els.itemForm.reset();
  els.shoppingForm.reset();
  els.uploadPreview.style.backgroundImage = "";
  els.uploadPreview.classList.remove("has-image");
  render();
});

loadState().catch((error) => {
  document.body.innerHTML = `<main class="workspace"><p class="empty-state">${escapeHtml(error.message)}</p></main>`;
});
