// =========================================================
//  routes/toolRoutes.js
//  GET /api/tools/list          → all tools
//  GET /api/tools/list?category=pdf
//  GET /api/tools/list?phase=1  → only Phase 1 tools
// =========================================================

const express = require("express");
const router  = express.Router();

const TOOLS = [
  // ── PDF Tools ────────────────────────────────────────────────────────────
  { id: "pdf-merge",    category: "pdf",   name: "Merge PDF",        description: "Combine multiple PDFs into one file",        endpoint: "/api/pdf/merge",        method: "POST", phase: 1 },
  { id: "pdf-split",    category: "pdf",   name: "Split PDF",        description: "Extract specific pages from a PDF",          endpoint: "/api/pdf/split",        method: "POST", phase: 1 },
  { id: "pdf-compress", category: "pdf",   name: "Compress PDF",     description: "Reduce PDF file size",                       endpoint: "/api/pdf/compress",     method: "POST", phase: 1 },
  { id: "pdf-rotate",   category: "pdf",   name: "Rotate PDF",       description: "Rotate all pages in a PDF",                  endpoint: "/api/pdf/rotate",       method: "POST", phase: 1 },
  { id: "pdf-info",     category: "pdf",   name: "PDF Info",         description: "View page count, size and metadata",         endpoint: "/api/pdf/info",         method: "POST", phase: 1 },
  { id: "pdf-to-word",  category: "pdf",   name: "PDF to Word",      description: "Convert PDF to editable .docx file",         endpoint: "/api/pdf/to-word",      method: "POST", phase: 1 },
  { id: "jpg-to-pdf",   category: "pdf",   name: "JPG to PDF",       description: "Convert images into a PDF document",         endpoint: "/api/pdf/jpg-to-pdf",   method: "POST", phase: 1 },

  // ── Image Tools ───────────────────────────────────────────────────────────
  { id: "img-compress", category: "image", name: "Compress Image",   description: "Reduce image size without quality loss",      endpoint: "/api/image/compress",   method: "POST", phase: 1 },
  { id: "img-resize",   category: "image", name: "Resize Image",     description: "Resize to exact dimensions or percentage",    endpoint: "/api/image/resize",     method: "POST", phase: 1 },
  { id: "img-convert",  category: "image", name: "Convert Image",    description: "Convert between PNG, JPG, WEBP formats",      endpoint: "/api/image/convert",    method: "POST", phase: 1 },

  // ── Text Tools ────────────────────────────────────────────────────────────
  { id: "txt-wordcount",   category: "text", name: "Word Counter",   description: "Count words, characters, reading time",       endpoint: "/api/text/wordcount",   method: "POST", phase: 1 },
  { id: "txt-caseconvert", category: "text", name: "Case Converter", description: "UPPERCASE, lowercase, camelCase, snake_case", endpoint: "/api/text/caseconvert", method: "POST", phase: 1 },
  { id: "txt-slug",        category: "text", name: "Text to Slug",   description: "Convert any text to URL-friendly slug",       endpoint: "/api/text/slug",        method: "POST", phase: 1 },

  // ── Utility Tools ─────────────────────────────────────────────────────────
  { id: "util-uuid",    category: "util",  name: "UUID Generator",   description: "Generate v4 UUIDs instantly",                endpoint: "/api/util/uuid",           method: "GET",  phase: 1 },
  { id: "util-password",category: "util",  name: "Password Generator",description: "Generate strong, customizable passwords",   endpoint: "/api/util/password",       method: "POST", phase: 1 },
  { id: "util-b64enc",  category: "util",  name: "Base64 Encode",    description: "Encode text to Base64 string",               endpoint: "/api/util/base64/encode",  method: "POST", phase: 1 },
  { id: "util-b64dec",  category: "util",  name: "Base64 Decode",    description: "Decode Base64 string back to text",          endpoint: "/api/util/base64/decode",  method: "POST", phase: 1 },
  { id: "util-json",    category: "util",  name: "JSON Formatter",   description: "Format, validate and minify JSON",           endpoint: "/api/util/json-format",    method: "POST", phase: 1 },
];

// GET /api/tools/list
router.get("/list", (req, res) => {
  const { category, phase } = req.query;
  let result = TOOLS;

  if (category) result = result.filter((t) => t.category === category);
  if (phase)    result = result.filter((t) => t.phase <= parseInt(phase));

  res.json({ success: true, total: result.length, tools: result });
});

module.exports = router;