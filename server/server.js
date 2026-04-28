require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const path    = require("path");
const cron    = require("node-cron");

const logger  = require("./utils/logger");
const { cleanTempFiles }      = require("./utils/fileCleaner");
const { errorHandler }        = require("./middlewares/errorHandler");
const { rateLimiter }         = require("./middlewares/rateLimiter");
const { analyticsMiddleware } = require("./middlewares/analytics");
const { sanitizeInputs, blockLargePayload, blockMaliciousRequests } = require("./middlewares/sanitize");

const healthRoutes = require("./routes/healthRoutes");
const toolRoutes   = require("./routes/toolRoutes");
const imageRoutes  = require("./routes/imageRoutes");
const pdfRoutes    = require("./routes/pdfRoutes");
const textRoutes   = require("./routes/textRoutes");
const utilRoutes   = require("./routes/utilRoutes");
const adminRoutes  = require("./routes/adminRoutes");
const ocrRoutes    = require("./routes/ocrRoutes");
const atsRoutes    = require("./routes/atsRoutes");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Trust proxy (Render ke liye zaroori) ──────────────────
app.set("trust proxy", 1);

// ── Security ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
}));

// ── Logging ───────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

// ── Input security ────────────────────────────────────────
app.use(blockMaliciousRequests);
app.use(blockLargePayload);
app.use(sanitizeInputs);

// ── Rate limiting ─────────────────────────────────────────
app.use("/api/", rateLimiter);

// ── Analytics ─────────────────────────────────────────────
app.use("/api/", analyticsMiddleware);

// ── Routes ────────────────────────────────────────────────
app.use("/api/health", healthRoutes);
app.use("/api/tools",  toolRoutes);
app.use("/api/image",  imageRoutes);
app.use("/api/pdf",    pdfRoutes);
app.use("/api/text",   textRoutes);
app.use("/api/util",   utilRoutes);
app.use("/api/admin",  adminRoutes);
app.use("/api/ocr",    ocrRoutes);
app.use("/api/ats",    atsRoutes);

// ── Static files ──────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────
app.use(errorHandler);

// ── Cron: clean temp files every hour ────────────────────
cron.schedule("0 * * * *", () => {
  logger.info("[CRON] Cleaning old temp files...");
  cleanTempFiles();
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info("=".repeat(50));
  logger.info(`🚀  ToolHub API  →  http://localhost:${PORT}`);
  logger.info(`🌍  Environment  →  ${process.env.NODE_ENV || "development"}`);
  logger.info(`📂  Upload dir   →  ${process.env.UPLOAD_DIR || "uploads/temp"}`);
  logger.info(`🔐  Admin key    →  ${process.env.ADMIN_API_KEY ? "SET ✓" : "NOT SET ⚠"}`);
  logger.info("=".repeat(50));
});

module.exports = app;