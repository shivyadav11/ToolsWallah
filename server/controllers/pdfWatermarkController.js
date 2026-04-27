// =========================================================
//  controllers/pdfWatermarkController.js
//  POST /api/pdf/watermark
//  Add text watermark to every page of a PDF
// =========================================================

const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

// ── POST /api/pdf/watermark ───────────────────────────────
// Form-data: file
// Body: text, opacity (0.1-1), fontSize, color, rotation, position
const addWatermark = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;

    // Watermark options
    const text     = req.body.text     || "CONFIDENTIAL";
    const opacity  = Math.min(Math.max(parseFloat(req.body.opacity) || 0.3, 0.05), 1);
    const fontSize = Math.min(Math.max(parseInt(req.body.fontSize)  || 48, 10), 120);
    const rotation = parseInt(req.body.rotation) || -45;
    const colorHex = req.body.color || "#FF0000";
    const position = req.body.position || "center"; // center | topright | bottomleft

    // Parse hex color → rgb (0-1)
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return { r, g, b };
    };

    const { r, g, b } = hexToRgb(colorHex.replace("#", "").length === 6
      ? colorHex : "#FF0000");

    try {
      const bytes  = fs.readFileSync(inputPath);
      const pdf    = await PDFDocument.load(bytes);
      const font   = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages  = pdf.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth  = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Position calculation
        let x, y;
        switch (position) {
          case "topright":
            x = width  - textWidth  - 20;
            y = height - textHeight - 20;
            break;
          case "bottomleft":
            x = 20;
            y = 20;
            break;
          case "topleft":
            x = 20;
            y = height - textHeight - 20;
            break;
          case "bottomright":
            x = width  - textWidth  - 20;
            y = 20;
            break;
          default: // center
            x = (width  - textWidth)  / 2;
            y = (height - textHeight) / 2;
        }

        page.drawText(text, {
          x,
          y,
          size:     fontSize,
          font,
          color:    rgb(r, g, b),
          opacity,
          rotate:   degrees(rotation),
        });
      }

      const outName  = `watermarked-${uuidv4()}.pdf`;
      const outPath  = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, await pdf.save());

      logger.info(`[pdf-watermark] "${text}" added to ${pages.length} pages`);
      deleteFile(inputPath);
      fileResponse(res, outName, `Watermark "${text}" added to ${pages.length} page(s)`);
    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-watermark] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { addWatermark };