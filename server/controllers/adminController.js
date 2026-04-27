// =========================================================
//  controllers/adminController.js
//  GET  /api/admin/stats  — overview: requests, errors, top tools
//  GET  /api/admin/tools  — all tools sorted by usage
//  GET  /api/admin/logs   — recent server logs (?lines=50)
//  POST /api/admin/reset  — reset analytics data
// =========================================================

const fs     = require("fs");
const path   = require("path");
const os     = require("os");
const { loadStore }      = require("../middlewares/analytics");
const { successResponse } = require("../utils/responseHelper");
const logger              = require("../utils/logger");

const UPLOAD_DIR   = path.join(__dirname, "../uploads/temp");
const LOG_DIR      = path.join(__dirname, "../logs");
const STORE_PATH   = path.join(__dirname, "../data/analytics.json");

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
const getStats = (req, res) => {
  const store = loadStore();

  // Top 5 tools by hits
  const topTools = Object.entries(store.tools)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 5);

  // Today's stats
  const today      = new Date().toISOString().slice(0, 10);
  const todayStats = store.daily[today] || { hits: 0, errors: 0 };

  // Last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7Days.push({ date: key, ...(store.daily[key] || { hits: 0, errors: 0 }) });
  }

  // Last 24 hours (hourly)
  const last24h = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date();
    d.setHours(d.getHours() - i);
    const key = d.toISOString().slice(0, 13);
    last24h.push({ hour: key.slice(11) + ":00", hits: store.hourly[key] || 0 });
  }

  // Temp file count
  let tempFiles = 0;
  try { tempFiles = fs.readdirSync(UPLOAD_DIR).filter((f) => f !== ".gitkeep").length; } catch {}

  // System memory
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();

  successResponse(res, {
    overview: {
      totalRequests: store.totalRequests,
      totalErrors:   store.totalErrors,
      errorRate:     store.totalRequests
        ? `${((store.totalErrors / store.totalRequests) * 100).toFixed(1)}%`
        : "0%",
      uniqueTools:   Object.keys(store.tools).length,
      tempFiles,
      lastReset:     store.lastReset,
    },
    today:     todayStats,
    topTools,
    last7Days,
    last24h,
    system: {
      memoryUsed: `${((totalMem - freeMem) / 1024 / 1024).toFixed(0)} MB`,
      memoryFree: `${(freeMem / 1024 / 1024).toFixed(0)} MB`,
      platform:   os.platform(),
      nodeVersion: process.version,
    },
  });
};

// ── GET /api/admin/tools ──────────────────────────────────────────────────────
const getToolStats = (req, res) => {
  const store = loadStore();
  const tools = Object.entries(store.tools)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.hits - a.hits);

  successResponse(res, { tools, total: tools.length });
};

// ── GET /api/admin/logs ───────────────────────────────────────────────────────
// Query: ?lines=50 (default), max 200
const getRecentLogs = (req, res) => {
  const logFile = path.join(LOG_DIR, "combined.log");
  const lines   = Math.min(parseInt(req.query.lines) || 50, 200);

  try {
    if (!fs.existsSync(logFile)) {
      return successResponse(res, { logs: [], message: "No logs yet" });
    }
    const content   = fs.readFileSync(logFile, "utf8");
    const allLines  = content.trim().split("\n").filter(Boolean);
    const recent    = allLines.slice(-lines).reverse();

    successResponse(res, { logs: recent, total: allLines.length, showing: recent.length });
  } catch (err) {
    logger.error("Failed to read logs: " + err.message);
    res.status(500).json({ success: false, message: "Could not read logs" });
  }
};

// ── POST /api/admin/reset ─────────────────────────────────────────────────────
const resetAnalytics = (req, res) => {
  const fresh = {
    totalRequests: 0,
    totalErrors:   0,
    tools:  {},
    daily:  {},
    hourly: {},
    lastReset: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(fresh, null, 2));
    logger.warn("[ADMIN] Analytics reset");
    successResponse(res, fresh, "Analytics reset successfully");
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reset analytics" });
  }
};

module.exports = { getStats, getToolStats, getRecentLogs, resetAnalytics };