const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DB_PATH = path.join(ROOT, "data", "db.json");
const SEED_PATH = path.join(ROOT, "data", "seed.json");

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
  return JSON.parse(raw);
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

function cleanNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

function cleanItem(payload) {
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
    image: typeof payload.image === "string" && payload.image.startsWith("data:image/") ? payload.image : ""
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
    status: ["candidate", "watch", "skip", "bought"].includes(payload.status) ? payload.status : "watch"
  };
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

    if (req.method === "POST" && url.pathname === "/api/shopping") {
      const db = await readDb();
      const idea = cleanShopping(await parseJsonBody(req));
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
