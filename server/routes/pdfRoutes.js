// =========================================================
//  routes/pdfRoutes.js — FINAL with all 16 PDF routes
// =========================================================
const express = require("express");
const router  = express.Router();
const { heavyLimiter } = require("../middlewares/rateLimiter");

// Original
const { mergePdfs, splitPdf, compressPdf, rotatePdf, getPdfInfo } = require("../controllers/pdfController");
const { pdfToWord }       = require("../controllers/pdfToWordController");
const { jpgToPdf }        = require("../controllers/jpgToPdfController");
// Group 1
const { addWatermark }    = require("../controllers/pdfWatermarkController");
const { removeWatermark } = require("../controllers/pdfRemoveWatermarkController");
const { protectPdf, unlockPdf } = require("../controllers/pdfProtectController");
const { addPageNumbers }  = require("../controllers/pdfPageNumberController");
// Group 2
const { pdfToText }       = require("../controllers/ocrController");
// Group 4 NEW
const { pdfToJpg }        = require("../controllers/pdfToJpgController");
const { wordToPdf }       = require("../controllers/wordToPdfController");
const { repairPdf }       = require("../controllers/repairPdfController");
const { removePdfPages }  = require("../controllers/removePdfPagesController");

// Original routes
router.post("/merge",            heavyLimiter, mergePdfs);
router.post("/split",            heavyLimiter, splitPdf);
router.post("/compress",         heavyLimiter, compressPdf);
router.post("/rotate",           heavyLimiter, rotatePdf);
router.post("/info",                           getPdfInfo);
router.post("/to-word",          heavyLimiter, pdfToWord);
router.post("/jpg-to-pdf",       heavyLimiter, jpgToPdf);
// Group 1
router.post("/watermark",        heavyLimiter, addWatermark);
router.post("/remove-watermark", heavyLimiter, removeWatermark);
router.post("/protect",          heavyLimiter, protectPdf);
router.post("/unlock",           heavyLimiter, unlockPdf);
router.post("/page-numbers",     heavyLimiter, addPageNumbers);
// Group 2
router.post("/to-text",          heavyLimiter, pdfToText);
// Group 4 NEW
router.post("/to-jpg",           heavyLimiter, pdfToJpg);
router.post("/word-to-pdf",      heavyLimiter, wordToPdf);
router.post("/repair",           heavyLimiter, repairPdf);
router.post("/remove-pages",     heavyLimiter, removePdfPages);

module.exports = router;