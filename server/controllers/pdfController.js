// =========================================================
//  controllers/pdfController.js
//  POST /api/pdf/merge    — combine multiple PDFs
//  POST /api/pdf/split    — extract pages
//  POST /api/pdf/compress — reduce file size
//  POST /api/pdf/rotate   — rotate pages
//  POST /api/pdf/info     — read metadata
// =========================================================

const { PDFDocument, degrees } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, uploadMultiplePdfs, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError }                    = require("../utils/responseHelper");
const { deleteFile }                                = require("../utils/fileCleaner");
const logger                                        = require("../utils/logger");

// ── POST /api/pdf/merge ───────────────────────────────────────────────────────
// Form-data: files[] (min 2, max 20 PDF files)
const mergePdfs = (req, res, next) => {
  uploadMultiplePdfs(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || req.files.length < 2) {
      return next(apiError("Upload at least 2 PDF files. Use field name: files"));
    }

    const outName = `merged-${uuidv4()}.pdf`;
    const outPath = path.join(UPLOAD_DIR, outName);

    try {
      const merged = await PDFDocument.create();

      for (const file of req.files) {
        const bytes = fs.readFileSync(file.path);
        const pdf   = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        deleteFile(file.path);
      }

      const outBytes = await merged.save();
      fs.writeFileSync(outPath, outBytes);

      logger.info(`[pdf-merge] ${req.files.length} files merged → ${outName}`);
      fileResponse(res, outName, `${req.files.length} PDFs merged successfully`);
    } catch (error) {
      req.files?.forEach((f) => deleteFile(f.path));
      next(error);
    }
  });
};

// ── POST /api/pdf/split ───────────────────────────────────────────────────────
// Form-data: file
// Body: pages ("1,3,5")  OR  from + to (page range)
const splitPdf = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath = req.file.path;

    try {
      const bytes      = fs.readFileSync(inputPath);
      const src        = await PDFDocument.load(bytes);
      const totalPages = src.getPageCount();

      // Parse which pages to extract
      let pageIndices = [];
      if (req.body.pages) {
        // e.g. "1,3,5" → [0,2,4]
        pageIndices = req.body.pages
          .split(",")
          .map((p) => parseInt(p.trim()) - 1)
          .filter((p) => p >= 0 && p < totalPages);
      } else if (req.body.from && req.body.to) {
        const from = Math.max(0, parseInt(req.body.from) - 1);
        const to   = Math.min(totalPages - 1, parseInt(req.body.to) - 1);
        for (let i = from; i <= to; i++) pageIndices.push(i);
      } else {
        pageIndices = [...Array(totalPages).keys()]; // all pages
      }

      if (pageIndices.length === 0) {
        deleteFile(inputPath);
        return next(apiError(`No valid pages. PDF has ${totalPages} page(s)`));
      }

      const newPdf    = await PDFDocument.create();
      const pages     = await newPdf.copyPages(src, pageIndices);
      pages.forEach((p) => newPdf.addPage(p));

      const outName   = `split-${uuidv4()}.pdf`;
      const outPath   = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, await newPdf.save());

      logger.info(`[pdf-split] ${pageIndices.length} of ${totalPages} pages extracted`);
      deleteFile(inputPath);
      fileResponse(res, outName, `Extracted ${pageIndices.length} page(s) from ${totalPages}-page PDF`);
    } catch (error) {
      deleteFile(inputPath);
      next(error);
    }
  });
};

// ── POST /api/pdf/compress ────────────────────────────────────────────────────
// Form-data: file
// Note: pdf-lib cannot deep-compress images inside PDFs.
//       This removes metadata and uses object streams for size reduction.
//       For deep compression, integrate Ghostscript (server-side binary).
const compressPdf = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath  = req.file.path;
    const origSize   = fs.statSync(inputPath).size;

    try {
      const bytes = fs.readFileSync(inputPath);
      const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });

      // Strip metadata to reduce size
      pdf.setTitle("");
      pdf.setAuthor("");
      pdf.setSubject("");
      pdf.setKeywords([]);
      pdf.setProducer("ToolHub");
      pdf.setCreator("ToolHub");

      const compressed = await pdf.save({ useObjectStreams: true });
      const outName    = `compressed-${uuidv4()}.pdf`;
      const outPath    = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, compressed);

      const newSize = compressed.length;
      const saved   = Math.max(0, Math.round(((origSize - newSize) / origSize) * 100));

      logger.info(`[pdf-compress] ${origSize} → ${newSize} bytes (saved ${saved}%)`);
      deleteFile(inputPath);

      res.json({
        success: true,
        message: `PDF compressed — saved ~${saved}%`,
        filename: outName,
        downloadUrl: `${process.env.NODE_ENV === "production" ? process.env.SERVER_URL : `http://localhost:${process.env.PORT || 5000}`}/uploads/temp/${outName}`,
        stats: {
          originalSize: `${(origSize / 1024).toFixed(1)} KB`,
          newSize:      `${(newSize  / 1024).toFixed(1)} KB`,
          savedPercent: `${saved}%`,
        },
      });
    } catch (error) {
      deleteFile(inputPath);
      next(error);
    }
  });
};

// ── POST /api/pdf/rotate ──────────────────────────────────────────────────────
// Form-data: file
// Body: angle (90 | 180 | 270)
const rotatePdf = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath = req.file.path;
    const angle     = parseInt(req.body.angle) || 90;

    if (![90, 180, 270].includes(angle)) {
      deleteFile(inputPath);
      return next(apiError("Angle must be 90, 180, or 270"));
    }

    try {
      const pdf   = await PDFDocument.load(fs.readFileSync(inputPath));
      pdf.getPages().forEach((p) => p.setRotation(degrees(angle)));

      const outName = `rotated-${uuidv4()}.pdf`;
      const outPath = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, await pdf.save());

      logger.info(`[pdf-rotate] ${angle}° rotation applied`);
      deleteFile(inputPath);
      fileResponse(res, outName, `All pages rotated ${angle}°`);
    } catch (error) {
      deleteFile(inputPath);
      next(error);
    }
  });
};

// ── POST /api/pdf/info ────────────────────────────────────────────────────────
// Form-data: file → returns page count, dimensions, metadata (no output file)
const getPdfInfo = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath = req.file.path;

    try {
      const bytes = fs.readFileSync(inputPath);
      const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });

      const info = {
        pageCount: pdf.getPageCount(),
        title:     pdf.getTitle()   || "N/A",
        author:    pdf.getAuthor()  || "N/A",
        creator:   pdf.getCreator() || "N/A",
        fileSize:  `${(fs.statSync(inputPath).size / 1024).toFixed(1)} KB`,
        pages: pdf.getPages().map((p, i) => ({
          page:   i + 1,
          width:  Math.round(p.getWidth()),
          height: Math.round(p.getHeight()),
        })),
      };

      deleteFile(inputPath);
      res.json({ success: true, message: "PDF info extracted", data: info });
    } catch (error) {
      deleteFile(inputPath);
      next(error);
    }
  });
};

module.exports = { mergePdfs, splitPdf, compressPdf, rotatePdf, getPdfInfo };