// =========================================================
//  server.js — Add these 2 lines to your existing server.js
// =========================================================
//
//  IMPORT (near other route imports):
//  const atsRoutes = require("./routes/atsRoutes");
//
//  ROUTE (near other app.use lines):
//  app.use("/api/ats", atsRoutes);
//
// =========================================================
//  FULL server.js — replace entire file with this
// =========================================================

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
const atsRoutes    = require("./routes/atsRoutes");   // ← NEW Group 3

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
}));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));
app.use(blockMaliciousRequests);
app.use(blockLargePayload);
app.use(sanitizeInputs);
app.use("/api/", rateLimiter);
app.use("/api/", analyticsMiddleware);

app.use("/api/health", healthRoutes);
app.use("/api/tools",  toolRoutes);
app.use("/api/image",  imageRoutes);
app.use("/api/pdf",    pdfRoutes);
app.use("/api/text",   textRoutes);
app.use("/api/util",   utilRoutes);
app.use("/api/admin",  adminRoutes);
app.use("/api/ocr",    ocrRoutes);
app.use("/api/ats",    atsRoutes);   // ← NEW Group 3

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});
app.use(errorHandler);

cron.schedule("0 * * * *", () => {
  logger.info("[CRON] Cleaning old temp files...");
  cleanTempFiles();
});

app.listen(PORT, () => {
  logger.info("=".repeat(50));
  logger.info(`🚀  ToolHub API  →  http://localhost:${PORT}`);
  logger.info(`🌍  Environment  →  ${process.env.NODE_ENV || "development"}`);
  logger.info(`📂  Upload dir   →  ${process.env.UPLOAD_DIR || "uploads/temp"}`);
  logger.info(`🔐  Admin key    →  ${process.env.ADMIN_API_KEY ? "SET ✓" : "NOT SET ⚠"}`);
  logger.info("=".repeat(50));
});

module.exports = app;