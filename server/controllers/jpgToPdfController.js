// =========================================================
//  controllers/jpgToPdfController.js
//  POST /api/pdf/jpg-to-pdf
//  Converts 1-20 images (JPG/PNG/WEBP) into a single PDF
//  Each image = 1 A4 page, centered with padding
// =========================================================

const { PDFDocument }  = require("pdf-lib");
const sharp            = require("sharp");
const fs               = require("fs");
const path             = require("path");
const { v4: uuidv4 }  = require("uuid");
const { uploadMultipleImages, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError }           = require("../utils/responseHelper");
const { deleteFile }                       = require("../utils/fileCleaner");
const logger                               = require("../utils/logger");

const jpgToPdf = (req, res, next) => {
  uploadMultipleImages(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || req.files.length === 0) {
      return next(apiError("Upload at least 1 image. Use field name: files"));
    }

    const outName = `images-to-pdf-${uuidv4()}.pdf`;
    const outPath = path.join(UPLOAD_DIR, outName);

    try {
      const pdfDoc = await PDFDocument.create();

      // A4 page dimensions in PDF points (1 pt = 1/72 inch)
      const PAGE_W   = 595;
      const PAGE_H   = 842;
      const PADDING  = 40;
      const MAX_W    = PAGE_W - PADDING * 2;
      const MAX_H    = PAGE_H - PADDING * 2;

      for (const file of req.files) {
        // Normalize every image to JPEG via sharp
        const meta    = await sharp(file.path).metadata();
        const imgW    = meta.width  || 800;
        const imgH    = meta.height || 600;
        const jpgBuf  = await sharp(file.path).jpeg({ quality: 90 }).toBuffer();

        // Scale image to fit inside A4 with padding
        const scale  = Math.min(MAX_W / imgW, MAX_H / imgH, 1); // never upscale
        const drawW  = imgW * scale;
        const drawH  = imgH * scale;
        const drawX  = (PAGE_W - drawW) / 2; // center horizontally
        const drawY  = (PAGE_H - drawH) / 2; // center vertically

        const embedded = await pdfDoc.embedJpg(jpgBuf);
        const page     = pdfDoc.addPage([PAGE_W, PAGE_H]);
        page.drawImage(embedded, { x: drawX, y: drawY, width: drawW, height: drawH });

        deleteFile(file.path);
      }

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outPath, pdfBytes);

      logger.info(`[jpg-to-pdf] ${req.files.length} image(s) → ${outName}`);
      fileResponse(res, outName, `${req.files.length} image(s) converted to PDF`);
    } catch (error) {
      req.files?.forEach((f) => deleteFile(f.path));
      logger.error("[jpg-to-pdf] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { jpgToPdf };