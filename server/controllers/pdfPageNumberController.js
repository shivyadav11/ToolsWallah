// =========================================================
//  controllers/pdfPageNumberController.js
//  POST /api/pdf/page-numbers
//  Add page numbers to every page of a PDF
// =========================================================

const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

// ── POST /api/pdf/page-numbers ────────────────────────────
// Form-data: file
// Body: position (bottom-center|bottom-right|bottom-left|top-center)
//       startFrom (default 1)
//       format (default "Page {n} of {total}")
//       fontSize (default 11)
const addPageNumbers = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;

    // Options
    const position  = req.body.position  || "bottom-center";
    const startFrom = Math.max(parseInt(req.body.startFrom) || 1, 1);
    const format    = req.body.format    || "Page {n} of {total}";
    const fontSize  = Math.min(Math.max(parseInt(req.body.fontSize) || 11, 6), 24);
    const colorHex  = req.body.color     || "#000000";

    // Parse hex color
    const r = parseInt(colorHex.slice(1, 3), 16) / 255 || 0;
    const g = parseInt(colorHex.slice(3, 5), 16) / 255 || 0;
    const b = parseInt(colorHex.slice(5, 7), 16) / 255 || 0;

    try {
      const bytes      = fs.readFileSync(inputPath);
      const pdf        = await PDFDocument.load(bytes);
      const font       = await pdf.embedFont(StandardFonts.Helvetica);
      const pages      = pdf.getPages();
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNum  = startFrom + index;
        const text     = format
          .replace("{n}",     String(pageNum))
          .replace("{total}", String(totalPages));

        const textWidth  = font.widthOfTextAtSize(text, fontSize);
        const margin     = 20;

        // Calculate x, y based on position
        let x, y;
        switch (position) {
          case "bottom-left":
            x = margin;
            y = margin;
            break;
          case "bottom-right":
            x = width - textWidth - margin;
            y = margin;
            break;
          case "top-center":
            x = (width - textWidth) / 2;
            y = height - margin - fontSize;
            break;
          case "top-left":
            x = margin;
            y = height - margin - fontSize;
            break;
          case "top-right":
            x = width - textWidth - margin;
            y = height - margin - fontSize;
            break;
          default: // bottom-center
            x = (width - textWidth) / 2;
            y = margin;
        }

        page.drawText(text, {
          x,
          y,
          size:    fontSize,
          font,
          color:   rgb(r, g, b),
          opacity: 0.85,
        });
      });

      const outName  = `page-numbered-${uuidv4()}.pdf`;
      const outPath  = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, await pdf.save());

      logger.info(`[pdf-page-numbers] Added to ${totalPages} pages (format: "${format}")`);
      deleteFile(inputPath);
      fileResponse(res, outName, `Page numbers added to ${totalPages} page(s)`);
    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-page-numbers] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { addPageNumbers };