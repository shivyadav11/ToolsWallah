// =========================================================
//  controllers/ocrController.js
//  POST /api/ocr/image-to-text  — Extract text from image
//  POST /api/ocr/pdf-to-text    — Extract text from PDF pages
//  Uses: tesseract.js (pure JS OCR — no binary needed)
// =========================================================

const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadImage, uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { successResponse, apiError }          = require("../utils/responseHelper");
const { deleteFile }                         = require("../utils/fileCleaner");
const logger                                 = require("../utils/logger");

// ── POST /api/ocr/image-to-text ───────────────────────────
// Form-data: file (image)
// Body: language (default: eng)
const imageToText = (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No image uploaded. Use field name: file"));

    const inputPath = req.file.path;
    const language  = req.body.language || "eng"; // eng | hin | eng+hin

    try {
      // Dynamically require tesseract to avoid crash if not installed
      let createWorker;
      try {
        ({ createWorker } = require("tesseract.js"));
      } catch {
        deleteFile(inputPath);
        return next(apiError("OCR service unavailable. Run: npm install tesseract.js", 503));
      }

      logger.info(`[ocr] Starting OCR on ${req.file.originalname} (lang: ${language})`);

      const worker = await createWorker(language, 1, {
        logger: () => {}, // silence internal logs
      });

      const { data } = await worker.recognize(inputPath);
      await worker.terminate();

      const text        = data.text?.trim() || "";
      const confidence  = Math.round(data.confidence || 0);
      const wordCount   = text === "" ? 0 : text.split(/\s+/).length;

      logger.info(`[ocr] Done — ${wordCount} words, ${confidence}% confidence`);
      deleteFile(inputPath);

      if (!text) {
        return successResponse(res, {
          text:       "",
          wordCount:  0,
          confidence: 0,
          language,
          message:    "No text detected in this image. Try a clearer image.",
        }, "No text found");
      }

      successResponse(res, {
        text,
        wordCount,
        confidence,
        language,
        characters: text.length,
      }, `Text extracted successfully (${confidence}% confidence)`);

    } catch (error) {
      deleteFile(inputPath);
      logger.error("[ocr] Image-to-text failed: " + error.message);
      next(error);
    }
  });
};

// ── POST /api/ocr/pdf-to-text ─────────────────────────────
// Form-data: file (PDF)
// Strategy: Use pdf-parse for text-based PDFs (fast),
//           fall back message for scanned PDFs
const pdfToText = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;

    try {
      let pdfParse;
      try {
        pdfParse = require("pdf-parse");
      } catch {
        deleteFile(inputPath);
        return next(apiError("PDF text service unavailable. Run: npm install pdf-parse", 503));
      }

      const buffer = fs.readFileSync(inputPath);
      const data   = await pdfParse(buffer);
      const text   = data.text?.trim() || "";

      deleteFile(inputPath);

      if (!text || text.length < 10) {
        return successResponse(res, {
          text:      "",
          wordCount: 0,
          pages:     data.numpages || 0,
          message:   "No readable text found. This PDF may be scanned — try Image to Text tool instead.",
        }, "No text found in PDF");
      }

      const wordCount = text.split(/\s+/).filter(Boolean).length;

      logger.info(`[ocr] PDF text extracted — ${wordCount} words from ${data.numpages} pages`);

      successResponse(res, {
        text,
        wordCount,
        pages:      data.numpages || 0,
        characters: text.length,
      }, `Text extracted from ${data.numpages} page(s) successfully`);

    } catch (error) {
      deleteFile(inputPath);
      logger.error("[ocr] PDF-to-text failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { imageToText, pdfToText };