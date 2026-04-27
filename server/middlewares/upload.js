// =========================================================
//  middlewares/upload.js — Multer File Upload Config
//  Handles: single image, single PDF, multiple PDFs,
//           multiple images (for jpg-to-pdf)
// =========================================================

const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const { v4: uuidv4 } = require("uuid");

const UPLOAD_DIR = path.join(__dirname, "../uploads/temp");
const MAX_SIZE   = (parseInt(process.env.MAX_FILE_SIZE_MB) || 25) * 1024 * 1024;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Give each uploaded file a UUID filename to avoid conflicts
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Only allow specific MIME types
const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error(`Invalid image type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, GIF, BMP`), false);
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") return cb(null, true);
  cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF allowed`), false);
};

// ── Exportable upload handlers ────────────────────────────────────────────────

// Single image upload  → req.file
const uploadImage = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter: imageFilter }).single("file");

// Single PDF upload    → req.file
const uploadPdf = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter: pdfFilter }).single("file");

// Multiple PDFs        → req.files (for merge — up to 20)
const uploadMultiplePdfs = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter: pdfFilter }).array("files", 20);

// Multiple images      → req.files (for jpg-to-pdf — up to 20)
const uploadMultipleImages = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter: imageFilter }).array("files", 20);

module.exports = {
  uploadImage,
  uploadPdf,
  uploadMultiplePdfs,
  uploadMultipleImages,
  UPLOAD_DIR,
};