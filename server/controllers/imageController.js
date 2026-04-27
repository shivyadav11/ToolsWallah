// =========================================================
//  controllers/imageController.js
//  POST /api/image/compress  — reduce image file size
//  POST /api/image/resize    — resize to custom dimensions
//  POST /api/image/convert   — convert format (jpg/png/webp)
// =========================================================

const sharp  = require("sharp");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadImage, UPLOAD_DIR }    = require("../middlewares/upload");
const { fileResponse, apiError }     = require("../utils/responseHelper");
const { deleteFile }                 = require("../utils/fileCleaner");
const logger                         = require("../utils/logger");

// ── POST /api/image/compress ──────────────────────────────────────────────────
// Body (form-data): file, quality (1-100, default 80)
const compressImage = (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath = req.file.path;
    const quality   = Math.min(Math.max(parseInt(req.body.quality) || 80, 1), 100);
    const ext       = path.extname(req.file.originalname).toLowerCase().replace(".", "");
    const outName   = `compressed-${uuidv4()}.${ext === "jpg" ? "jpeg" : ext}`;
    const outPath   = path.join(UPLOAD_DIR, outName);

    try {
      const img  = sharp(inputPath);
      const meta = await img.metadata();

      if (meta.format === "jpeg" || meta.format === "jpg") {
        await img.jpeg({ quality, mozjpeg: true }).toFile(outPath);
      } else if (meta.format === "png") {
        const compressionLevel = Math.round((100 - quality) / 11);
        await img.png({ compressionLevel }).toFile(outPath);
      } else if (meta.format === "webp") {
        await img.webp({ quality }).toFile(outPath);
      } else {
        await img.jpeg({ quality }).toFile(outPath); // fallback → jpeg
      }

      logger.info(`[img-compress] ${req.file.originalname} → ${outName} (quality: ${quality})`);
      deleteFile(inputPath);
      fileResponse(res, outName, `Image compressed (quality: ${quality})`);
    } catch (error) {
      deleteFile(inputPath);
      next(error);
    }
  });
};

// ── POST /api/image/resize ────────────────────────────────────────────────────
// Body (form-data): file, width (px), height (px), fit (cover|contain|fill|inside|outside)
const resizeImage = (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath = req.file.path;
    const width     = req.body.width  ? parseInt(req.body.width)  : null;
    const height    = req.body.height ? parseInt(req.body.height) : null;
    const fit       = req.body.fit    || "cover";

    if (!width && !height) {
      deleteFile(inputPath);
      return next(apiError("Provide at least width or height in the request body"));
    }

    const ext     = path.extname(req.file.originalname).toLowerCase();
    const outName = `resized-${uuidv4()}${ext}`;
    const outPath = path.join(UPLOAD_DIR, outName);

    try {
      await sharp(inputPath)
        .resize(width, height, { fit, withoutEnlargement: true })
        .toFile(outPath);

      logger.info(`[img-resize] ${req.file.originalname} → ${width}x${height}`);
      deleteFile(inputPath);
      fileResponse(res, outName, `Image resized to ${width || "auto"}x${height || "auto"}`);
    } catch (error) {
      deleteFile(inputPath);
      next(error);
    }
  });
};

// ── POST /api/image/convert ───────────────────────────────────────────────────
// Body (form-data): file, format (jpeg | png | webp)
const convertImage = (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath  = req.file.path;
    const format     = (req.body.format || "jpeg").toLowerCase();
    const allowedFmt = ["jpeg", "jpg", "png", "webp"];

    if (!allowedFmt.includes(format)) {
      deleteFile(inputPath);
      return next(apiError(`Invalid format. Choose: ${allowedFmt.join(", ")}`));
    }

    const finalFmt = format === "jpg" ? "jpeg" : format;
    const outExt   = finalFmt === "jpeg" ? "jpg" : finalFmt;
    const outName  = `converted-${uuidv4()}.${outExt}`;
    const outPath  = path.join(UPLOAD_DIR, outName);

    try {
      await sharp(inputPath).toFormat(finalFmt).toFile(outPath);
      logger.info(`[img-convert] ${req.file.originalname} → ${finalFmt}`);
      deleteFile(inputPath);
      fileResponse(res, outName, `Image converted to ${finalFmt.toUpperCase()}`);
    } catch (error) {
      deleteFile(inputPath);
      next(error);
    }
  });
};

module.exports = { compressImage, resizeImage, convertImage };