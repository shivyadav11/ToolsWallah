// =========================================================
//  routes/adminRoutes.js
//  All routes protected by x-admin-key header
//  GET  /api/admin/stats   — overview dashboard data
//  GET  /api/admin/tools   — all tools sorted by usage
//  GET  /api/admin/logs    — recent server logs
//  POST /api/admin/reset   — reset analytics data
// =========================================================

const express = require("express");
const router  = express.Router();
const { getStats, getToolStats, getRecentLogs, resetAnalytics } = require("../controllers/adminController");
const logger  = require("../utils/logger");

// ── Admin auth guard ──────────────────────────────────────────────────────────
const adminAuth = (req, res, next) => {
  const key      = req.headers["x-admin-key"] || req.query.adminKey;
  const validKey = process.env.ADMIN_API_KEY;

  // If key not configured → allow in dev, block in production
  if (!validKey) {
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ success: false, message: "ADMIN_API_KEY not configured" });
    }
    logger.warn("[ADMIN] No ADMIN_API_KEY set — routes are open in development");
    return next();
  }

  if (!key || key !== validKey) {
    logger.warn(`[ADMIN] Unauthorized attempt from ${req.ip}`);
    return res.status(401).json({ success: false, message: "Unauthorized. Provide x-admin-key header." });
  }
  next();
};

router.use(adminAuth);

router.get("/stats",   getStats);
router.get("/tools",   getToolStats);
router.get("/logs",    getRecentLogs);
router.post("/reset",  resetAnalytics);

module.exports = router;