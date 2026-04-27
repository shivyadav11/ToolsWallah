// =========================================================
//  routes/healthRoutes.js
//  GET /api/health           → basic (Render uptime probe)
//  GET /api/health/detailed  → full system info
// =========================================================

const express = require("express");
const router  = express.Router();
const os      = require("os");
const fs      = require("fs");
const path    = require("path");

const UPLOAD_DIR = path.join(__dirname, "../uploads/temp");
const BOOT_TIME  = Date.now();

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(1)} GB`;
};

const fmtUptime = (ms) => {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
};

// ── GET /api/health ───────────────────────────────────────────────────────────
// Simple — used by Render for health checks
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    uptime: fmtUptime(Date.now() - BOOT_TIME),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ── GET /api/health/detailed ──────────────────────────────────────────────────
// Full system status — for monitoring dashboard
router.get("/detailed", (req, res) => {
  const totalMem   = os.totalmem();
  const freeMem    = os.freemem();
  const usedMem    = totalMem - freeMem;
  const memPct     = ((usedMem / totalMem) * 100).toFixed(1);

  let tempFiles  = 0;
  let uploadsDirOk = true;
  try {
    tempFiles = fs.readdirSync(UPLOAD_DIR).filter((f) => f !== ".gitkeep").length;
  } catch {
    uploadsDirOk = false;
  }

  const cpuLoad = os.loadavg(); // [1min, 5min, 15min]

  const checks = {
    uploadsDir:    uploadsDirOk           ? "pass" : "fail",
    memory:        parseFloat(memPct) < 90 ? "pass" : "warn",
    corsConfigured: !!process.env.CLIENT_URL ? "pass" : "warn",
    adminKeySet:    !!process.env.ADMIN_API_KEY ? "pass" : "warn",
  };

  const hasFail = Object.values(checks).includes("fail");
  const hasWarn = Object.values(checks).includes("warn");

  res.status(hasFail ? 503 : 200).json({
    success: !hasFail,
    data: {
      status: hasFail ? "degraded" : hasWarn ? "warning" : "ok",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: {
        seconds: Math.floor((Date.now() - BOOT_TIME) / 1000),
        human:   fmtUptime(Date.now() - BOOT_TIME),
      },
      server: {
        platform:    os.platform(),
        arch:        os.arch(),
        nodeVersion: process.version,
        hostname:    os.hostname(),
      },
      memory: {
        total:      fmtBytes(totalMem),
        used:       fmtBytes(usedMem),
        free:       fmtBytes(freeMem),
        usedPercent: `${memPct}%`,
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || "unknown",
        loadAvg: {
          "1min":  cpuLoad[0].toFixed(2),
          "5min":  cpuLoad[1].toFixed(2),
          "15min": cpuLoad[2].toFixed(2),
        },
      },
      storage: {
        uploadDir: uploadsDirOk ? "ok" : "error",
        tempFilesInQueue: tempFiles,
      },
      checks,
    },
  });
});

module.exports = router;