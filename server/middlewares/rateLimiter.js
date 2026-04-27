// =========================================================
//  middlewares/rateLimiter.js
//  rateLimiter  → applied to all /api/ routes (100 req/15min)
//  heavyLimiter → applied to file processing routes (10 req/min)
// =========================================================

const rateLimit = require("express-rate-limit");

// General API limiter
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many requests. Please wait a few minutes and try again.",
  },
});

// Strict limiter for CPU-heavy file operations
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: "Too many file operations. Max 10 per minute. Please slow down.",
  },
});

module.exports = { rateLimiter, heavyLimiter };