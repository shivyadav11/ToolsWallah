// =========================================================
//  middlewares/sanitize.js — Input Security
//  1. blockMaliciousRequests → blocks path traversal, etc.
//  2. blockLargePayload      → blocks oversized text inputs
//  3. sanitizeInputs         → strips XSS from req.body
// =========================================================

const logger = require("../utils/logger");

// ── 1. Block path traversal and malicious URL patterns ───────────────────────
const dangerousPatterns = [/\.\.\//g, /etc\/passwd/gi, /proc\/self/gi, /<script/gi];

const blockMaliciousRequests = (req, res, next) => {
  const url = decodeURIComponent(req.originalUrl);
  const isBad = dangerousPatterns.some((p) => p.test(url));

  if (isBad) {
    logger.warn(`[SECURITY] Malicious request blocked: ${url} from ${req.ip}`);
    return res.status(400).json({ success: false, message: "Bad request" });
  }
  next();
};

// ── 2. Block oversized JSON payloads (not for file uploads) ──────────────────
const blockLargePayload = (req, res, next) => {
  const MAX_BODY_KB   = 512;
  const contentLength = parseInt(req.headers["content-length"] || 0);
  const contentType   = req.headers["content-type"] || "";

  // Skip check for multipart (file upload) — multer handles those
  if (!contentType.includes("multipart") && contentLength > MAX_BODY_KB * 1024) {
    logger.warn(`[SECURITY] Oversized payload (${contentLength} bytes) from ${req.ip}`);
    return res.status(413).json({
      success: false,
      message: `Payload too large. Max ${MAX_BODY_KB}KB for text inputs.`,
    });
  }
  next();
};

// ── 3. Sanitize req.body — strip HTML tags, script tags, event handlers ──────
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
};

const sanitizeObject = (obj, depth = 0) => {
  if (depth > 5) return obj; // prevent deep-nesting attacks
  if (typeof obj === "string")  return sanitizeString(obj);
  if (Array.isArray(obj))       return obj.map((v) => sanitizeObject(v, depth + 1));
  if (obj && typeof obj === "object") {
    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      clean[sanitizeString(key)] = sanitizeObject(val, depth + 1);
    }
    return clean;
  }
  return obj;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

module.exports = { blockMaliciousRequests, blockLargePayload, sanitizeInputs };