// =========================================================
//  controllers/repairPdfController.js
//  POST /api/pdf/repair
//  Attempt to fix/recover corrupted or damaged PDF files
//  Strategy: load with ignoreEncryption + lenient parsing
//            → re-save as clean PDF
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

// ── POST /api/pdf/repair ──────────────────────────────────
const repairPdf = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;
    const origSize  = fs.statSync(inputPath).size;

    try {
      const bytes = fs.readFileSync(inputPath);

      let pdf;
      let repairNote = [];

      // ── Attempt 1: Normal load ───────────────────────────
      try {
        pdf = await PDFDocument.load(bytes);
        repairNote.push("PDF structure validated");
      } catch {
        // ── Attempt 2: Ignore encryption ──────────────────
        try {
          pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
          repairNote.push("Removed encryption/password protection");
        } catch (e2) {
          // ── Attempt 3: Partial recovery ───────────────────
          try {
            pdf = await PDFDocument.load(bytes, {
              ignoreEncryption: true,
              throwOnInvalidObject: false,
            });
            repairNote.push("Recovered from invalid objects");
          } catch {
            deleteFile(inputPath);
            return next(apiError("PDF is too severely corrupted to repair. The file structure cannot be recovered."));
          }
        }
      }

      const totalPages = pdf.getPageCount();
      if (totalPages === 0) {
        deleteFile(inputPath);
        return next(apiError("PDF has no recoverable pages. File may be completely corrupted."));
      }

      // ── Clean metadata ───────────────────────────────────
      try { pdf.setTitle(pdf.getTitle() || ""); }      catch {}
      try { pdf.setAuthor(pdf.getAuthor() || ""); }    catch {}
      try { pdf.setSubject(pdf.getSubject() || ""); }  catch {}
      try { pdf.setKeywords([]); }                     catch {}
      pdf.setProducer("ToolHub — PDF Repair");
      pdf.setCreator("ToolHub");

      // ── Re-save as clean PDF ─────────────────────────────
      const cleanBytes = await pdf.save({ useObjectStreams: true });
      const outName    = `repaired-${uuidv4()}.pdf`;
      const outPath    = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, cleanBytes);

      const newSize  = cleanBytes.length;
      const sizeDiff = origSize - newSize;

      deleteFile(inputPath);
      logger.info(`[pdf-repair] ${totalPages} pages recovered, size: ${origSize} → ${newSize}`);

      res.json({
        success:     true,
        message:     `PDF repaired successfully — ${totalPages} page(s) recovered`,
        filename:    outName,
        downloadUrl: `${BASE_URL}/uploads/temp/${outName}`,
        stats: {
          pages:       `${totalPages}`,
          originalSize: `${(origSize / 1024).toFixed(1)} KB`,
          repairedSize: `${(newSize / 1024).toFixed(1)} KB`,
          spaceSaved:   sizeDiff > 0 ? `${(sizeDiff / 1024).toFixed(1)} KB` : "0 KB",
        },
        repairs: repairNote,
      });

    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-repair] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { repairPdf };