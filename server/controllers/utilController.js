// =========================================================
//  controllers/utilController.js
//  GET  /api/util/uuid              — generate UUIDs
//  POST /api/util/password          — generate passwords
//  POST /api/util/base64/encode     — encode to Base64
//  POST /api/util/base64/decode     — decode from Base64
//  POST /api/util/json-format       — format/validate JSON
// =========================================================

const { v4: uuidv4 }                = require("uuid");
const { successResponse, apiError } = require("../utils/responseHelper");

// ── GET /api/util/uuid ────────────────────────────────────────────────────────
// Query: ?count=5  (default 1, max 20)
const generateUUID = (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 1, 20);
  const uuids = Array.from({ length: count }, () => uuidv4());
  successResponse(res, { uuids, count });
};

// ── POST /api/util/password ───────────────────────────────────────────────────
// Body: { length, uppercase, lowercase, numbers, symbols, count }
const generatePassword = (req, res, next) => {
  const length    = Math.min(Math.max(parseInt(req.body.length) || 16, 4), 128);
  const count     = Math.min(parseInt(req.body.count) || 1, 10);
  const uppercase = req.body.uppercase !== false && req.body.uppercase !== "false";
  const lowercase = req.body.lowercase !== false && req.body.lowercase !== "false";
  const numbers   = req.body.numbers   !== false && req.body.numbers   !== "false";
  const symbols   = req.body.symbols   === true  || req.body.symbols   === "true";

  let chars = "";
  if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (numbers)   chars += "0123456789";
  if (symbols)   chars += "!@#$%^&*()-_=+[]{}|;:,.<>?";

  if (!chars) return next(apiError("Select at least one character type"));

  const passwords = Array.from({ length: count }, () =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );

  successResponse(res, { passwords, length, count, strength: calcStrength(length, uppercase, lowercase, numbers, symbols) });
};

// Simple strength indicator
const calcStrength = (length, upper, lower, nums, symbols) => {
  const types = [upper, lower, nums, symbols].filter(Boolean).length;
  if (length >= 16 && types === 4) return "very-strong";
  if (length >= 12 && types >= 3) return "strong";
  if (length >= 8  && types >= 2) return "medium";
  return "weak";
};

// ── POST /api/util/base64/encode ──────────────────────────────────────────────
// Body: { text: "Hello World" }
const base64Encode = (req, res, next) => {
  const { text } = req.body;
  if (!text) return next(apiError("Provide text in the request body: { text: '...' }"));
  const encoded = Buffer.from(text, "utf8").toString("base64");
  successResponse(res, { original: text, encoded });
};

// ── POST /api/util/base64/decode ──────────────────────────────────────────────
// Body: { text: "SGVsbG8gV29ybGQ=" }
const base64Decode = (req, res, next) => {
  const { text } = req.body;
  if (!text) return next(apiError("Provide Base64 text in the request body: { text: '...' }"));
  try {
    const decoded = Buffer.from(text, "base64").toString("utf8");
    successResponse(res, { original: text, decoded });
  } catch {
    next(apiError("Invalid Base64 string"));
  }
};

// ── POST /api/util/json-format ────────────────────────────────────────────────
// Body: { json: "{ ... }", minify: false }
const jsonFormat = (req, res, next) => {
  const { json, minify = false } = req.body;
  if (!json) return next(apiError("Provide json in the request body: { json: '...' }"));

  try {
    const parsed = JSON.parse(json);
    const result = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
    successResponse(res, {
      valid:  true,
      result,
      type:   typeof parsed,
      length: Array.isArray(parsed) ? parsed.length : (typeof parsed === "object" ? Object.keys(parsed).length : null),
    });
  } catch (err) {
    // Return validation error as data, not as HTTP error
    successResponse(res, { valid: false, error: err.message });
  }
};

module.exports = { generateUUID, generatePassword, base64Encode, base64Decode, jsonFormat };