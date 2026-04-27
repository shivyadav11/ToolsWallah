// =========================================================
//  controllers/textController.js
//  POST /api/text/wordcount    — count words, chars, etc.
//  POST /api/text/caseconvert  — convert text case
//  POST /api/text/slug         — text → URL slug
// =========================================================

const { successResponse, apiError } = require("../utils/responseHelper");

// ── POST /api/text/wordcount ──────────────────────────────────────────────────
// Body: { text: "your text here" }
const wordCount = (req, res, next) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return next(apiError("Provide text in the request body: { text: '...' }"));
  }

  const trimmed           = text.trim();
  const words             = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  const characters        = text.length;
  const charactersNoSpace = text.replace(/\s/g, "").length;
  const sentences         = trimmed === "" ? 0 : (trimmed.match(/[^.!?]*[.!?]+/g) || []).length;
  const paragraphs        = trimmed === "" ? 0 : trimmed.split(/\n\s*\n/).filter(Boolean).length;
  const readingTimeMin    = Math.ceil(words / 200); // avg reading speed = 200 wpm

  successResponse(res, {
    words,
    characters,
    charactersNoSpace,
    sentences,
    paragraphs,
    readingTimeMin,
  });
};

// ── POST /api/text/caseconvert ────────────────────────────────────────────────
// Body: { text: "...", type: "uppercase" }
// Types: uppercase | lowercase | titlecase | sentencecase | camelcase | snakecase | kebabcase
const caseConvert = (req, res, next) => {
  const { text, type } = req.body;
  if (!text) return next(apiError("Provide text in the request body"));
  if (!type) return next(apiError("Provide type: uppercase | lowercase | titlecase | sentencecase | camelcase | snakecase | kebabcase"));

  let result;
  switch (type.toLowerCase()) {
    case "uppercase":
      result = text.toUpperCase();
      break;
    case "lowercase":
      result = text.toLowerCase();
      break;
    case "titlecase":
      result = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      break;
    case "sentencecase":
      result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      break;
    case "camelcase":
      result = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase());
      break;
    case "snakecase":
      result = text.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      break;
    case "kebabcase":
      result = text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      break;
    default:
      return next(apiError("Invalid type. Use: uppercase | lowercase | titlecase | sentencecase | camelcase | snakecase | kebabcase"));
  }

  successResponse(res, { original: text, result, type });
};

// ── POST /api/text/slug ───────────────────────────────────────────────────────
// Body: { text: "Hello World!" } → { slug: "hello-world" }
const toSlug = (req, res, next) => {
  const { text } = req.body;
  if (!text) return next(apiError("Provide text in the request body"));

  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")  // remove special chars
    .replace(/[\s_-]+/g, "-")  // spaces → dashes
    .replace(/^-+|-+$/g, "");  // trim leading/trailing dashes

  successResponse(res, { original: text, slug });
};

module.exports = { wordCount, caseConvert, toSlug };