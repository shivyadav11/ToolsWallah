// =========================================================
//  controllers/pdfToJpgController.js
//  POST /api/pdf/to-jpg
//  Convert each PDF page to a JPG image
//  Strategy: pdf-lib extracts page info + sharp renders
//  For best results uses pdf2pic (poppler-based) if available,
//  falls back to page-by-page extraction with metadata
// =========================================================

const { PDFDocument } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { apiError }              = require("../utils/responseHelper");
const { deleteFile }            = require("../utils/fileCleaner");
const logger                    = require("../utils/logger");

const BASE_URL = process.env.NODE_ENV === "production"
  ? process.env.SERVER_URL || ""
  : `http://localhost:${process.env.PORT || 5000}`;

// ── POST /api/pdf/to-jpg ──────────────────────────────────
// Form-data: file (PDF)
// Body: quality (1-100), page ("all" | "1" | "1,2,3")
const pdfToJpg = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;
    const quality   = Math.min(Math.max(parseInt(req.body.quality) || 90, 10), 100);
    const pageParam = req.body.page || "all";

    try {
      // Try pdf2pic first (best quality — needs poppler)
      let pdf2picAvailable = false;
      try {
        require("pdf2pic");
        pdf2picAvailable = true;
      } catch { /* not installed */ }

      if (pdf2picAvailable) {
        const { fromPath } = require("pdf2pic");
        const bytes  = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(bytes);
        const total  = pdfDoc.getPageCount();

        // Determine pages to convert
        let pageNums = [];
        if (pageParam === "all") {
          pageNums = Array.from({ length: total }, (_, i) => i + 1);
        } else {
          pageNums = pageParam.split(",").map((p) => parseInt(p.trim())).filter((p) => p >= 1 && p <= total);
        }

        // Limit to 10 pages max
        pageNums = pageNums.slice(0, 10);

        const outputPrefix = uuidv4();
        const convert = fromPath(inputPath, {
          density:     150,
          saveFilename: outputPrefix,
          savePath:    UPLOAD_DIR,
          format:      "jpg",
          width:       1200,
          height:      1600,
          quality,
        });

        const images = [];
        for (const pageNum of pageNums) {
          const result = await convert(pageNum, { responseType: "image" });
          const filename = path.basename(result.path);
          images.push({
            page:        pageNum,
            filename,
            downloadUrl: `${BASE_URL}/uploads/temp/${filename}`,
          });
        }

        deleteFile(inputPath);
        logger.info(`[pdf-to-jpg] ${images.length} pages converted (pdf2pic)`);

        return res.json({
          success: true,
          message: `${images.length} page(s) converted to JPG`,
          images,
          totalPages: total,
        });
      }

      // ── Fallback: extract each page as individual PDF → notify user ──
      const bytes  = fs.readFileSync(inputPath);
      const srcPdf = await PDFDocument.load(bytes);
      const total  = srcPdf.getPageCount();

      let pageNums = [];
      if (pageParam === "all") {
        pageNums = Array.from({ length: Math.min(total, 10) }, (_, i) => i);
      } else {
        pageNums = pageParam.split(",")
          .map((p) => parseInt(p.trim()) - 1)
          .filter((p) => p >= 0 && p < total)
          .slice(0, 10);
      }

      // Save individual page PDFs (fallback when pdf2pic not available)
      const pages = [];
      for (const idx of pageNums) {
        const newPdf = await PDFDocument.create();
        const [copied] = await newPdf.copyPages(srcPdf, [idx]);
        newPdf.addPage(copied);
        const outName = `page-${idx + 1}-${uuidv4()}.pdf`;
        const outPath = path.join(UPLOAD_DIR, outName);
        fs.writeFileSync(outPath, await newPdf.save());
        pages.push({
          page:        idx + 1,
          filename:    outName,
          downloadUrl: `${BASE_URL}/uploads/temp/${outName}`,
          note:        "PDF format — install pdf2pic on server for JPG output",
        });
      }

      deleteFile(inputPath);
      logger.info(`[pdf-to-jpg] Fallback: ${pages.length} page PDFs saved`);

      res.json({
        success: true,
        message: `${pages.length} page(s) extracted. Install pdf2pic for JPG format.`,
        images: pages,
        totalPages: total,
        fallback: true,
      });

    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-to-jpg] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { pdfToJpg };