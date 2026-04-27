// =========================================================
//  routes/ocrRoutes.js
//  POST /api/ocr/image-to-text  — Image → text
//  POST /api/ocr/pdf-to-text    — PDF → text
// =========================================================

const express = require("express");
const router  = express.Router();
const { heavyLimiter }            = require("../middlewares/rateLimiter");
const { imageToText, pdfToText }  = require("../controllers/ocrController");

// POST /api/ocr/image-to-text — body: file + language
router.post("/image-to-text", heavyLimiter, imageToText);

// POST /api/ocr/pdf-to-text   — body: file
router.post("/pdf-to-text",   heavyLimiter, pdfToText);

module.exports = router;