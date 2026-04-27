// =========================================================
//  controllers/removePdfPagesController.js
//  POST /api/pdf/remove-pages
//  Remove specific pages from a PDF
//  Body: pages ("1,3,5") — pages to REMOVE
// =========================================================

const { PDFDocument } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

// ── POST /api/pdf/remove-pages ────────────────────────────
// Form-data: file
// Body: pages ("1,3,5") — 1-indexed page numbers to DELETE
const removePdfPages = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;

    if (!req.body.pages) {
      deleteFile(inputPath);
      return next(apiError("Provide pages to remove. Example: pages=1,3,5"));
    }

    try {
      const bytes      = fs.readFileSync(inputPath);
      const pdf        = await PDFDocument.load(bytes);
      const totalPages = pdf.getPageCount();

      // Parse pages to remove (1-indexed → 0-indexed)
      const pagesToRemove = req.body.pages
        .split(",")
        .map((p) => parseInt(p.trim()) - 1)
        .filter((p) => p >= 0 && p < totalPages);

      if (pagesToRemove.length === 0) {
        deleteFile(inputPath);
        return next(apiError(`No valid pages found. PDF has ${totalPages} pages. Pages must be between 1 and ${totalPages}.`));
      }

      if (pagesToRemove.length >= totalPages) {
        deleteFile(inputPath);
        return next(apiError("Cannot remove all pages. At least 1 page must remain."));
      }

      // Build list of pages to KEEP
      const pagesToKeep = Array.from({ length: totalPages }, (_, i) => i)
        .filter((i) => !pagesToRemove.includes(i));

      // Create new PDF with only kept pages
      const newPdf  = await PDFDocument.create();
      const pages   = await newPdf.copyPages(pdf, pagesToKeep);
      pages.forEach((p) => newPdf.addPage(p));

      const outName  = `pages-removed-${uuidv4()}.pdf`;
      const outPath  = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, await newPdf.save());

      const removedCount = pagesToRemove.length;
      const remainCount  = pagesToKeep.length;

      deleteFile(inputPath);
      logger.info(`[remove-pages] Removed ${removedCount} pages, ${remainCount} remaining`);

      fileResponse(
        res,
        outName,
        `${removedCount} page(s) removed — ${remainCount} page(s) remaining`
      );

    } catch (error) {
      deleteFile(inputPath);
      logger.error("[remove-pages] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { removePdfPages };