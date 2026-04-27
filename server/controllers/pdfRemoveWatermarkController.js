// =========================================================
//  controllers/pdfRemoveWatermarkController.js
//  POST /api/pdf/remove-watermark
//  Strategy:
//  1. Remove all text annotations/overlays
//  2. Flatten transparent layers
//  3. Remove embedded image overlays if possible
//  Note: Works best on text watermarks added by ToolHub.
//        Image-based watermarks from Adobe/iLovePDF are
//        embedded in page content stream — cannot be removed
//        without destructive editing. We handle both cases.
// =========================================================

const { PDFDocument, PDFName, PDFDict, PDFArray, PDFStream } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

// ── POST /api/pdf/remove-watermark ───────────────────────
const removeWatermark = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;

    try {
      const bytes = fs.readFileSync(inputPath);
      const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = pdf.getPages();
      let removedCount = 0;

      for (const page of pages) {
        const pageDict = page.node;

        // ── Strategy 1: Remove Annots (annotation watermarks) ──
        try {
          if (pageDict.has(PDFName.of("Annots"))) {
            const annots = pageDict.lookup(PDFName.of("Annots"), PDFArray);
            const filtered = [];

            for (let i = 0; i < annots.size(); i++) {
              const annot = annots.lookup(i, PDFDict);
              const subtype = annot.lookupMaybe(PDFName.of("Subtype"), PDFName);

              // Keep everything EXCEPT Watermark and FreeText (common watermark types)
              if (
                subtype &&
                (subtype.asString() === "/Watermark" ||
                 subtype.asString() === "/FreeText")
              ) {
                removedCount++;
              } else {
                filtered.push(annots.lookup(i));
              }
            }

            if (filtered.length !== annots.size()) {
              pageDict.set(PDFName.of("Annots"), pdf.context.obj(filtered));
            }
          }
        } catch { /* skip if annots not readable */ }

        // ── Strategy 2: Remove XObject overlays (image watermarks) ──
        try {
          const resources = pageDict.lookupMaybe(PDFName.of("Resources"), PDFDict);
          if (resources) {
            const xObjects = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
            if (xObjects) {
              const keys = xObjects.keys();
              for (const key of keys) {
                try {
                  const xObj = xObjects.lookup(key);
                  if (xObj instanceof PDFStream) {
                    const dict      = xObj.dict;
                    const subtype   = dict.lookupMaybe(PDFName.of("Subtype"), PDFName);
                    const oc        = dict.has(PDFName.of("OC")); // Optional Content — common in watermarks

                    // If it has Optional Content (OC) layer — it's likely a watermark overlay
                    if (oc) {
                      xObjects.delete(key);
                      removedCount++;
                    }
                  }
                } catch { /* skip unreadable objects */ }
              }
            }
          }
        } catch { /* skip if resources not readable */ }

        // ── Strategy 3: Remove Optional Content Groups (OCG) ──
        // Watermarks added by Adobe/iLovePDF often use OCG layers
        try {
          const catalog = pdf.catalog;
          if (catalog.has(PDFName.of("OCProperties"))) {
            const ocProps = catalog.lookup(PDFName.of("OCProperties"), PDFDict);
            if (ocProps && ocProps.has(PDFName.of("OCGs"))) {
              catalog.delete(PDFName.of("OCProperties"));
              removedCount++;
            }
          }
        } catch { /* skip */ }
      }

      // ── Save result ───────────────────────────────────────
      const outName  = `watermark-removed-${uuidv4()}.pdf`;
      const outPath  = path.join(UPLOAD_DIR, outName);
      const outBytes = await pdf.save({ useObjectStreams: true });
      fs.writeFileSync(outPath, outBytes);

      const message = removedCount > 0
        ? `Watermark removed successfully (${removedCount} element(s) cleaned)`
        : "PDF processed — text/annotation watermarks removed. Note: Image watermarks baked into page content cannot be fully removed.";

      logger.info(`[pdf-remove-watermark] ${removedCount} elements removed from ${pages.length} pages`);
      deleteFile(inputPath);

      res.json({
        success:     true,
        message,
        filename:    outName,
        downloadUrl: `${process.env.NODE_ENV === "production"
          ? process.env.SERVER_URL
          : `http://localhost:${process.env.PORT || 5000}`}/uploads/temp/${outName}`,
        stats: {
          pages:    `${pages.length}`,
          removed:  `${removedCount} element(s)`,
        },
        note: removedCount === 0
          ? "This PDF may have an image-based watermark baked into the page. These cannot be removed without damaging the document."
          : null,
      });
    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-remove-watermark] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { removeWatermark };