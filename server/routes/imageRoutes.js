// =========================================================
//  routes/imageRoutes.js
//  POST /api/image/compress  — body: file + quality (1-100)
//  POST /api/image/resize    — body: file + width + height
//  POST /api/image/convert   — body: file + format
// =========================================================

const express = require("express");
const router  = express.Router();
const { heavyLimiter }                      = require("../middlewares/rateLimiter");
const { compressImage, resizeImage, convertImage } = require("../controllers/imageController");

router.post("/compress", heavyLimiter, compressImage);
router.post("/resize",   heavyLimiter, resizeImage);
router.post("/convert",  heavyLimiter, convertImage);

module.exports = router;