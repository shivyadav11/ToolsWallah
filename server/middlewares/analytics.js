// =========================================================
//  middlewares/analytics.js — Tool Usage Tracker
//  Saves stats to data/analytics.json
//  Tracked: per-tool hits, errors, avg response time,
//           daily totals, hourly totals (last 48h)
// =========================================================

const fs   = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const STORE_PATH = path.join(__dirname, "../data/analytics.json");

// ── Initialize store if missing ───────────────────────────────────────────────
const initStore = () => {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({
      totalRequests: 0,
      totalErrors:   0,
      tools:  {},   // { toolId: { hits, errors, totalMs, avgMs, lastUsed } }
      daily:  {},   // { "YYYY-MM-DD": { hits, errors } }
      hourly: {},   // { "YYYY-MM-DD HH": hits }
      lastReset: new Date().toISOString(),
    }, null, 2));
  }
};

// ── Read / Write safely ───────────────────────────────────────────────────────
const loadStore = () => {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    }
  } catch (e) {
    logger.error("Analytics store corrupted, resetting: " + e.message);
  }
  return { totalRequests: 0, totalErrors: 0, tools: {}, daily: {}, hourly: {}, lastReset: new Date().toISOString() };
};

const saveStore = (store) => {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    logger.error("Failed to save analytics: " + e.message);
  }
};

// ── Map request → tool ID ─────────────────────────────────────────────────────
const routeToTool = (method, url) => {
  const clean = url.split("?")[0].replace(/\/+$/, "");
  const map = {
    "POST /api/image/compress":     "img-compress",
    "POST /api/image/resize":       "img-resize",
    "POST /api/image/convert":      "img-convert",
    "POST /api/pdf/merge":          "pdf-merge",
    "POST /api/pdf/split":          "pdf-split",
    "POST /api/pdf/compress":       "pdf-compress",
    "POST /api/pdf/rotate":         "pdf-rotate",
    "POST /api/pdf/info":           "pdf-info",
    "POST /api/pdf/to-word":        "pdf-to-word",
    "POST /api/pdf/jpg-to-pdf":     "jpg-to-pdf",
    "POST /api/text/wordcount":     "txt-wordcount",
    "POST /api/text/caseconvert":   "txt-caseconvert",
    "POST /api/text/slug":          "txt-slug",
    "GET  /api/util/uuid":          "util-uuid",
    "POST /api/util/password":      "util-password",
    "POST /api/util/base64/encode": "util-b64enc",
    "POST /api/util/base64/decode": "util-b64dec",
    "POST /api/util/json-format":   "util-json",
  };
  return map[`${method} ${clean}`] || null;
};

// ── Middleware ────────────────────────────────────────────────────────────────
initStore();

const analyticsMiddleware = (req, res, next) => {
  const start  = Date.now();
  const toolId = routeToTool(req.method, req.originalUrl);

  res.on("finish", () => {
    if (!toolId) return; // only track tool routes

    const duration = Date.now() - start;
    const isError  = res.statusCode >= 400;
    const today    = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
    const hour     = new Date().toISOString().slice(0, 13);  // YYYY-MM-DD HH

    const store = loadStore();

    // Global counters
    store.totalRequests += 1;
    if (isError) store.totalErrors += 1;

    // Per-tool stats
    if (!store.tools[toolId]) {
      store.tools[toolId] = { hits: 0, errors: 0, totalMs: 0, avgMs: 0 };
    }
    const t = store.tools[toolId];
    t.hits    += 1;
    t.totalMs += duration;
    t.avgMs    = Math.round(t.totalMs / t.hits);
    t.lastUsed = new Date().toISOString();
    if (isError) t.errors += 1;

    // Daily stats
    if (!store.daily[today]) store.daily[today] = { hits: 0, errors: 0 };
    store.daily[today].hits += 1;
    if (isError) store.daily[today].errors += 1;

    // Hourly stats
    if (!store.hourly[hour]) store.hourly[hour] = 0;
    store.hourly[hour] += 1;

    // Prune old data: keep last 30 days + 48 hours
    const days  = Object.keys(store.daily).sort();
    if (days.length  > 30) days.slice(0, days.length  - 30).forEach((d) => delete store.daily[d]);
    const hours = Object.keys(store.hourly).sort();
    if (hours.length > 48) hours.slice(0, hours.length - 48).forEach((h) => delete store.hourly[h]);

    saveStore(store);
    logger.info(`[${toolId}] ${req.method} ${res.statusCode} ${duration}ms`);
  });

  next();
};

module.exports = { analyticsMiddleware, loadStore };