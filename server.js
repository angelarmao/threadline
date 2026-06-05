const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DB_PATH = path.join(ROOT, "data", "db.json");
const SEED_PATH = path.join(ROOT, "data", "seed.json");

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

async function readDb() {
  const raw = await fs.readFile(DB_PATH, "utf8");
  return normalizeDb(JSON.parse(raw));
}

async function writeDb(db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

async function parseJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8_000_000) {
      throw new Error("Request body is too large.");
    }
  }
  return body ? JSON.parse(body) : {};
}

function cleanText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, 240);
}

function cleanLongText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, 1500);
}

function cleanVisibility(value, fallback = "friends") {
  return ["private", "friends", "public"].includes(value) ? value : fallback;
}

function cleanNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

function cleanItem(payload) {
  const image =
    typeof payload.image === "string" && (payload.image.startsWith("data:image/") || payload.image.startsWith("/assets/"))
      ? payload.image
      : "";
  return {
    id: payload.id || `item_${crypto.randomUUID()}`,
    name: cleanText(payload.name, "Untitled item"),
    category: cleanText(payload.category, "Other"),
    colors: Array.isArray(payload.colors)
      ? payload.colors.map((color) => cleanText(color).toLowerCase()).filter(Boolean).slice(0, 5)
      : cleanText(payload.colors)
          .split(",")
          .map((color) => color.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 5),
    season: cleanText(payload.season, "All year"),
    price: cleanNumber(payload.price),
    source: cleanText(payload.source, "Closet"),
    wearCount: Math.round(cleanNumber(payload.wearCount)),
    notes: cleanText(payload.notes),
    visibility: cleanVisibility(payload.visibility, "private"),
    image
  };
}

function cleanShopping(payload) {
  return {
    id: payload.id || `shop_${crypto.randomUUID()}`,
    name: cleanText(payload.name, "Untitled idea"),
    category: cleanText(payload.category, "Other"),
    price: cleanNumber(payload.price),
    plannedWears: Math.max(1, Math.round(cleanNumber(payload.plannedWears, 1))),
    reason: cleanText(payload.reason),
    status: ["candidate", "watch", "skip", "bought"].includes(payload.status) ? payload.status : "watch",
    store: cleanText(payload.store),
    url: cleanText(payload.url),
    receiptText: cleanLongText(payload.receiptText),
    visibility: cleanVisibility(payload.visibility, "private")
  };
}

function cleanOutfit(payload) {
  const image =
    typeof payload.image === "string" && (payload.image.startsWith("data:image/") || payload.image.startsWith("/assets/"))
      ? payload.image
      : "";
  return {
    id: payload.id || `fit_${crypto.randomUUID()}`,
    date: cleanText(payload.date, new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    occasion: cleanText(payload.occasion, "Everyday"),
    notes: cleanText(payload.notes),
    detectedTags: Array.isArray(payload.detectedTags)
      ? payload.detectedTags.map((tag) => cleanText(tag)).filter(Boolean).slice(0, 8)
      : [],
    itemIds: Array.isArray(payload.itemIds)
      ? payload.itemIds.map((id) => cleanText(id)).filter(Boolean).slice(0, 8)
      : [],
    confidence: cleanNumber(payload.confidence),
    visibility: cleanVisibility(payload.visibility, "friends"),
    image
  };
}

function cleanProfile(payload = {}) {
  return {
    id: cleanText(payload.id, "user_angela"),
    name: cleanText(payload.name, "Angela"),
    handle: cleanText(payload.handle, "@threadline"),
    city: cleanText(payload.city, "San Francisco"),
    styleGoals: cleanLongText(payload.styleGoals, "Repeat more favorites, buy fewer one-off pieces."),
    weatherPreference: cleanText(payload.weatherPreference, "Mild")
  };
}

function cleanPrivacy(payload = {}) {
  return {
    outfitDefault: cleanVisibility(payload.outfitDefault, "friends"),
    purchaseDefault: cleanVisibility(payload.purchaseDefault, "private"),
    shareClosetStats: Boolean(payload.shareClosetStats),
    friendApprovals: payload.friendApprovals !== false
  };
}

function cleanFriend(payload = {}) {
  return {
    id: payload.id || `friend_${crypto.randomUUID()}`,
    name: cleanText(payload.name, "New friend"),
    handle: cleanText(payload.handle, "@friend"),
    status: ["accepted", "pending", "blocked"].includes(payload.status) ? payload.status : "pending",
    activity: cleanText(payload.activity, "Sent a friend request."),
    tags: Array.isArray(payload.tags)
      ? payload.tags.map((tag) => cleanText(tag)).filter(Boolean).slice(0, 5)
      : [],
    color: cleanText(payload.color, "#dceff6"),
    image: typeof payload.image === "string" && payload.image.startsWith("/assets/") ? payload.image : "",
    shareOutfits: payload.shareOutfits !== false,
    sharePurchases: Boolean(payload.sharePurchases)
  };
}

function normalizeDb(db) {
  return {
    profile: cleanProfile(db.profile || {}),
    privacy: cleanPrivacy(db.privacy || {}),
    items: Array.isArray(db.items) ? db.items.map(cleanItem) : [],
    shopping: Array.isArray(db.shopping) ? db.shopping.map(cleanShopping) : [],
    outfits: Array.isArray(db.outfits) ? db.outfits.map(cleanOutfit) : [],
    friends: Array.isArray(db.friends) ? db.friends.map(cleanFriend) : []
  };
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function analyzeOutfit(db, payload = {}) {
  const context = `${cleanText(payload.occasion)} ${cleanText(payload.notes)}`.toLowerCase();
  const fallbackIds = ["item_silver_mini", "item_sage_flats", "item_beaded_bag"];
  const genericTerms = new Set([
    "mini",
    "dress",
    "dresses",
    "wear",
    "wore",
    "with",
    "good",
    "look",
    "looks",
    "spring",
    "summer",
    "closet"
  ]);
  const closetMatches = db.items
    .map((item) => {
      const terms = [item.name, item.category, item.season, ...(item.colors || []), item.notes].join(" ").toLowerCase();
      const contextMatches = context
        ? terms.split(/\s+/).filter((term) => term.length > 3 && !genericTerms.has(term) && context.includes(term)).length
        : 0;
      const score =
        contextMatches * 3 +
        ((item.colors || []).some((color) => context.includes(color)) ? 2 : 0) +
        (item.category && context.includes(item.category.toLowerCase()) ? 1 : 0);
      return { item, score, contextMatches };
    })
    .sort((a, b) => b.score - a.score || a.item.wearCount - b.item.wearCount)
    .slice(0, 4);

  const topScore = closetMatches[0] ? closetMatches[0].score : 0;
  const likelyItems = closetMatches
    .filter((match) => match.score > 0 && match.score >= Math.max(2, topScore - 1))
    .map((match) => match.item);
  const fallbackItems = fallbackIds
    .map((id) => db.items.find((item) => item.id === id))
    .filter(Boolean);
  const items = likelyItems.length ? likelyItems : fallbackItems;
  const categories = uniq(items.map((item) => item.category)).slice(0, 4);
  const colors = uniq(items.flatMap((item) => item.colors || [])).slice(0, 5);
  const accessories = db.items
    .filter((item) => ["Bags", "Shoes", "Accessories"].includes(item.category))
    .sort((a, b) => a.wearCount - b.wearCount)
    .slice(0, 2);
  const tags = uniq([
    ...items.map((item) => item.name.toLowerCase()),
    ...colors.map((color) => `${color} tone`),
    ...accessories.map((item) => item.name.toLowerCase()),
    ...categories.map((category) => category.toLowerCase())
  ]).slice(0, 8);

  return {
    tags,
    itemIds: items.map((item) => item.id),
    colors,
    categories,
    confidence: Math.min(0.94, 0.62 + likelyItems.length * 0.08 + (payload.image ? 0.08 : 0)),
    summary: items.length
      ? `Matched ${items.length} closet pieces and drafted ${tags.length} tags.`
      : "Upload a photo or add closet pieces for stronger recognition."
  };
}

function buildSuggestions(db, payload = {}) {
  const occasion = cleanText(payload.occasion, "Everyday");
  const weather = cleanText(payload.weather, db.profile.weatherPreference || "Mild");
  const goal = cleanText(payload.goal, db.profile.styleGoals || "Repeat more favorites.");
  const groups = {
    Tops: db.items.filter((item) => item.category === "Tops"),
    Bottoms: db.items.filter((item) => item.category === "Bottoms"),
    Dresses: db.items.filter((item) => item.category === "Dresses"),
    Outerwear: db.items.filter((item) => item.category === "Outerwear"),
    Shoes: db.items.filter((item) => item.category === "Shoes"),
    Bags: db.items.filter((item) => item.category === "Bags"),
    Accessories: db.items.filter((item) => item.category === "Accessories")
  };
  const lowRepeat = db.items.slice().sort((a, b) => a.wearCount - b.wearCount);
  const pick = (category, offset = 0) => (groups[category] || []).slice().sort((a, b) => a.wearCount - b.wearCount)[offset];
  const wishlist = db.shopping.filter((item) => item.status !== "skip").slice(0, 3);
  const formulas = [
    [pick("Dresses"), pick("Shoes"), pick("Bags"), pick("Accessories")],
    [pick("Tops"), pick("Bottoms"), pick("Shoes", 1), pick("Bags", 1)],
    [lowRepeat[0], lowRepeat[1], pick("Outerwear"), pick("Accessories", 1)]
  ];

  return formulas
    .map((parts, index) => parts.filter(Boolean))
    .filter((parts) => parts.length >= 2)
    .map((parts, index) => {
      const shoppingHint = wishlist[index % Math.max(1, wishlist.length)];
      const names = parts.map((item) => item.name);
      return {
        id: `suggestion_${index + 1}`,
        title: index === 0 ? `${occasion} no-new-buy look` : index === 1 ? "Low-repeat remix" : "Shopping-aware outfit",
        items: names,
        itemIds: parts.map((item) => item.id),
        reason: `${weather} weather, ${goal.toLowerCase()} Uses ${parts
          .filter((item) => item.wearCount < 5)
          .length} lower-repeat piece(s).`,
        shoppingGoal: shoppingHint
          ? `${shoppingHint.name} would add ${shoppingHint.plannedWears || 1} planned wears.`
          : "No wishlist pressure today.",
        score: Math.max(72, 94 - index * 7)
      };
    });
}

function inferShoppingImport(payload = {}) {
  const source = `${cleanLongText(payload.text)} ${cleanText(payload.url)}`.trim();
  const url = cleanText(payload.url);
  const host = (() => {
    try {
      return url ? new URL(url).hostname.replace(/^www\./, "") : "";
    } catch {
      return "";
    }
  })();
  const priceMatch = source.match(/\$?\b(\d{2,4})(?:\.\d{2})?\b/);
  const category = /shoe|heel|flat|boot|sandal/i.test(source)
    ? "Shoes"
    : /bag|tote|clutch|purse/i.test(source)
      ? "Bags"
      : /dress|gown/i.test(source)
        ? "Dresses"
        : /skirt|jean|short|pant/i.test(source)
          ? "Bottoms"
          : /clip|earring|necklace|bracelet/i.test(source)
            ? "Accessories"
            : "Tops";
  const name = cleanText(
    source
      .replace(/^https?:\/\/\S+/i, "")
      .replace(/\$?\b\d+(?:\.\d{2})?\b/g, "")
      .replace(/\b\S+\.(com|net|org|shop|store|example)\b/gi, "")
      .replace(/\breceipt\b.*$/i, "")
      .replace(/\s{2,}/g, " ")
      .split(/[|\n]/)[0],
    host ? `${host} find` : "Imported purchase"
  );

  return cleanShopping({
    name,
    category,
    price: priceMatch ? priceMatch[1] : 0,
    plannedWears: 6,
    reason: host ? `Imported from ${host}.` : "Imported from pasted receipt text.",
    status: payload.status || "watch",
    store: host,
    url,
    receiptText: source
  });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendError(res, 403, "Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendError(res, 404, "Not found");
      return;
    }
    sendError(res, 500, "Could not read file");
  }
}

async function routeApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (req.method === "GET" && url.pathname === "/api/state") {
      sendJson(res, 200, await readDb());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/reset") {
      const seed = JSON.parse(await fs.readFile(SEED_PATH, "utf8"));
      await writeDb(seed);
      sendJson(res, 200, seed);
      return;
    }

    if (req.method === "PATCH" && url.pathname === "/api/profile") {
      const db = await readDb();
      db.profile = cleanProfile({ ...db.profile, ...(await parseJsonBody(req)) });
      await writeDb(db);
      sendJson(res, 200, db.profile);
      return;
    }

    if (req.method === "PATCH" && url.pathname === "/api/privacy") {
      const db = await readDb();
      db.privacy = cleanPrivacy({ ...db.privacy, ...(await parseJsonBody(req)) });
      await writeDb(db);
      sendJson(res, 200, db.privacy);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/detect-outfit") {
      const db = await readDb();
      sendJson(res, 200, analyzeOutfit(db, await parseJsonBody(req)));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/suggestions") {
      const db = await readDb();
      sendJson(res, 200, { suggestions: buildSuggestions(db, await parseJsonBody(req)) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/items") {
      const db = await readDb();
      const item = cleanItem(await parseJsonBody(req));
      db.items.unshift(item);
      await writeDb(db);
      sendJson(res, 201, item);
      return;
    }

    if (parts[0] === "api" && parts[1] === "items" && parts[2]) {
      const db = await readDb();
      const index = db.items.findIndex((item) => item.id === parts[2]);
      if (index === -1) {
        sendError(res, 404, "Item not found");
        return;
      }

      if (req.method === "PATCH") {
        const next = cleanItem({ ...db.items[index], ...(await parseJsonBody(req)), id: db.items[index].id });
        db.items[index] = next;
        await writeDb(db);
        sendJson(res, 200, next);
        return;
      }

      if (req.method === "DELETE") {
        const [removed] = db.items.splice(index, 1);
        await writeDb(db);
        sendJson(res, 200, removed);
        return;
      }
    }

    if (req.method === "POST" && url.pathname === "/api/outfits") {
      const db = await readDb();
      const outfit = cleanOutfit(await parseJsonBody(req));
      db.outfits = Array.isArray(db.outfits) ? db.outfits : [];
      db.outfits.unshift(outfit);
      await writeDb(db);
      sendJson(res, 201, outfit);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/shopping") {
      const db = await readDb();
      const idea = cleanShopping(await parseJsonBody(req));
      db.shopping.unshift(idea);
      await writeDb(db);
      sendJson(res, 201, idea);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/shopping/import") {
      const db = await readDb();
      const idea = inferShoppingImport(await parseJsonBody(req));
      db.shopping.unshift(idea);
      await writeDb(db);
      sendJson(res, 201, idea);
      return;
    }

    if (parts[0] === "api" && parts[1] === "shopping" && parts[2]) {
      const db = await readDb();
      const index = db.shopping.findIndex((idea) => idea.id === parts[2]);
      if (index === -1) {
        sendError(res, 404, "Shopping idea not found");
        return;
      }

      if (req.method === "PATCH") {
        const next = cleanShopping({ ...db.shopping[index], ...(await parseJsonBody(req)), id: db.shopping[index].id });
        db.shopping[index] = next;
        await writeDb(db);
        sendJson(res, 200, next);
        return;
      }

      if (req.method === "DELETE") {
        const [removed] = db.shopping.splice(index, 1);
        await writeDb(db);
        sendJson(res, 200, removed);
        return;
      }

      if (req.method === "POST" && parts[3] === "add-to-closet") {
        const idea = db.shopping[index];
        const item = cleanItem({
          name: idea.name,
          category: idea.category,
          price: idea.price,
          source: idea.store || "Purchase tracker",
          notes: idea.reason,
          visibility: "private"
        });
        db.items.unshift(item);
        db.shopping[index] = cleanShopping({ ...idea, status: "bought" });
        await writeDb(db);
        sendJson(res, 201, item);
        return;
      }
    }

    if (req.method === "POST" && url.pathname === "/api/friends") {
      const db = await readDb();
      const friend = cleanFriend(await parseJsonBody(req));
      db.friends.unshift(friend);
      await writeDb(db);
      sendJson(res, 201, friend);
      return;
    }

    if (parts[0] === "api" && parts[1] === "friends" && parts[2]) {
      const db = await readDb();
      const index = db.friends.findIndex((friend) => friend.id === parts[2]);
      if (index === -1) {
        sendError(res, 404, "Friend not found");
        return;
      }

      if (req.method === "PATCH") {
        const next = cleanFriend({ ...db.friends[index], ...(await parseJsonBody(req)), id: db.friends[index].id });
        db.friends[index] = next;
        await writeDb(db);
        sendJson(res, 200, next);
        return;
      }
    }

    sendError(res, 404, "Unknown API route");
  } catch (error) {
    console.error(error);
    sendError(res, 400, error.message || "Bad request");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/")) {
    await routeApi(req, res);
    return;
  }
  await serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Threadline running at http://${HOST}:${PORT}`);
});
