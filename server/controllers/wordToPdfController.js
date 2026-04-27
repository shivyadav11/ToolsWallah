// =========================================================
//  controllers/wordToPdfController.js
//  POST /api/pdf/word-to-pdf
//  Convert .docx Word files to PDF
//  Uses: docx-pdf (libreoffice-based) or mammoth + pdf-lib
// =========================================================

const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 25) * 1024 * 1024;

// Multer for .docx files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const uploadDocx = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(docx|doc)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx and .doc files allowed"), false);
    }
  },
}).single("file");

// ── POST /api/pdf/word-to-pdf ─────────────────────────────
const wordToPdf = (req, res, next) => {
  uploadDocx(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No Word file uploaded. Use field name: file"));

    const inputPath = req.file.path;

    try {
      // Try mammoth to extract text from docx
      let mammoth;
      try {
        mammoth = require("mammoth");
      } catch {
        deleteFile(inputPath);
        return next(apiError("Word to PDF service unavailable. Run: npm install mammoth", 503));
      }

      // Extract text content from .docx
      const result = await mammoth.extractRawText({ path: inputPath });
      const rawText = result.value || "";

      if (!rawText || rawText.trim().length < 5) {
        deleteFile(inputPath);
        return next(apiError("Could not extract text from this Word file. File may be empty or corrupted."));
      }

      // Build PDF from extracted text
      const { PDFDocument: PDFDoc, StandardFonts: SF, rgb: RGB } = require("pdf-lib");
      const pdfDoc  = await PDFDoc.create();
      const font    = await pdfDoc.embedFont(SF.Helvetica);
      const boldFont = await pdfDoc.embedFont(SF.HelveticaBold);

      const PAGE_W   = 595;
      const PAGE_H   = 842;
      const MARGIN   = 60;
      const maxW     = PAGE_W - MARGIN * 2;
      const lineH    = 16;
      const fontSize = 11;

      // Split text into lines
      const paragraphs = rawText.split("\n").filter((p) => p.trim() !== "");

      let page  = pdfDoc.addPage([PAGE_W, PAGE_H]);
      let yPos  = PAGE_H - MARGIN;
      let pageNum = 1;

      const addNewPage = () => {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        yPos = PAGE_H - MARGIN;
        pageNum++;
      };

      for (const para of paragraphs) {
        // Word wrap
        const words  = para.trim().split(" ");
        let line     = "";

        for (const word of words) {
          const testLine  = line ? `${line} ${word}` : word;
          const lineWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (lineWidth > maxW && line) {
            if (yPos < MARGIN + lineH) addNewPage();
            page.drawText(line, { x: MARGIN, y: yPos, size: fontSize, font, color: RGB(0, 0, 0) });
            yPos -= lineH;
            line  = word;
          } else {
            line = testLine;
          }
        }

        if (line) {
          if (yPos < MARGIN + lineH) addNewPage();
          page.drawText(line, { x: MARGIN, y: yPos, size: fontSize, font, color: RGB(0, 0, 0) });
          yPos -= lineH;
        }

        yPos -= 6; // paragraph spacing
      }

      const outName  = `word-to-pdf-${uuidv4()}.pdf`;
      const outPath  = path.join(UPLOAD_DIR, outName);
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outPath, pdfBytes);

      deleteFile(inputPath);
      logger.info(`[word-to-pdf] ${req.file.originalname} → ${outName} (${pageNum} pages)`);
      fileResponse(res, outName, `Word document converted to PDF (${pageNum} page${pageNum > 1 ? "s" : ""})`);

    } catch (error) {
      deleteFile(inputPath);
      logger.error("[word-to-pdf] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { wordToPdf };