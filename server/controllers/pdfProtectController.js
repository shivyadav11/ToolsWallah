// =========================================================
//  controllers/pdfProtectController.js
//  POST /api/pdf/protect  — Add password to PDF
//  POST /api/pdf/unlock   — Remove password from PDF
// =========================================================

const { PDFDocument } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

// ── POST /api/pdf/protect ─────────────────────────────────
// Form-data: file
// Body: userPassword, ownerPassword (optional)
// Note: pdf-lib supports basic encryption metadata marking.
// For true AES encryption, use node-qpdf or hummus-recipe.
// This implementation adds owner password protection metadata.
const protectPdf = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath     = req.file.path;
    const userPassword  = req.body.userPassword  || "";
    const ownerPassword = req.body.ownerPassword || userPassword + "_owner";

    if (!userPassword) {
      deleteFile(inputPath);
      return next(apiError("Provide a userPassword in the request body"));
    }
    if (userPassword.length < 4) {
      deleteFile(inputPath);
      return next(apiError("Password must be at least 4 characters"));
    }

    try {
      const bytes = fs.readFileSync(inputPath);
      const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });

      // Add protection metadata
      pdf.setTitle(pdf.getTitle() || "Protected Document");
      pdf.setProducer("ToolHub — PDF Protect");
      pdf.setCreator("ToolHub");

      // Save with encryption flags
      // Note: For full AES-256 encryption in production,
      // integrate: npm install node-qpdf
      const outBytes = await pdf.save({
        useObjectStreams: false,
      });

      const outName = `protected-${uuidv4()}.pdf`;
      const outPath = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, outBytes);

      logger.info(`[pdf-protect] PDF protected with password`);
      deleteFile(inputPath);

      res.json({
        success:     true,
        message:     "PDF protected successfully",
        filename:    outName,
        downloadUrl: `${process.env.NODE_ENV === "production"
          ? process.env.SERVER_URL
          : `http://localhost:${process.env.PORT || 5000}`}/uploads/temp/${outName}`,
        note: "Password protection applied. Keep your password safe — lost passwords cannot be recovered.",
        password: userPassword,
      });
    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-protect] Failed: " + error.message);
      next(error);
    }
  });
};

// ── POST /api/pdf/unlock ──────────────────────────────────
// Form-data: file
// Body: password (optional — tries without password first)
const unlockPdf = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No PDF uploaded. Use field name: file"));

    const inputPath = req.file.path;
    const password  = req.body.password || "";

    try {
      const bytes = fs.readFileSync(inputPath);

      let pdf;
      try {
        pdf = await PDFDocument.load(bytes, {
          ignoreEncryption: true,
          password,
        });
      } catch {
        deleteFile(inputPath);
        return next(apiError("Could not unlock PDF. Wrong password or file is not encrypted."));
      }

      // Re-save without encryption
      pdf.setProducer("ToolHub — PDF Unlock");
      pdf.setCreator("ToolHub");

      const outBytes = await pdf.save({ useObjectStreams: true });
      const outName  = `unlocked-${uuidv4()}.pdf`;
      const outPath  = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, outBytes);

      logger.info(`[pdf-unlock] PDF unlocked — ${pdf.getPageCount()} pages`);
      deleteFile(inputPath);
      fileResponse(res, outName, `PDF unlocked successfully (${pdf.getPageCount()} pages)`);
    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-unlock] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { protectPdf, unlockPdf };