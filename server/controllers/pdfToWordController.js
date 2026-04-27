// =========================================================
//  controllers/pdfToWordController.js
//  POST /api/pdf/to-word
//  Strategy: extract text from PDF → build .docx with docx library
//  Note: For pixel-perfect layout, a paid API (CloudConvert) is
//        recommended. This gives clean text-based conversion.
// =========================================================

const fs     = require("fs");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { fileResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

const pdfToWord = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No file uploaded. Use field name: file"));

    const inputPath = req.file.path;

    try {
      // Require dynamically — fail gracefully if not installed
      let pdfParse, docx;
      try {
        pdfParse = require("pdf-parse");
        docx     = require("docx");
      } catch {
        deleteFile(inputPath);
        return next(apiError("PDF to Word service unavailable. Install: npm install pdf-parse docx", 503));
      }

      const { Document, Paragraph, TextRun, HeadingLevel, Packer } = docx;

      // Step 1: Extract text from PDF
      const pdfBuffer = fs.readFileSync(inputPath);
      const data      = await pdfParse(pdfBuffer);
      const rawText   = data.text || "";

      // Step 2: Split into paragraphs
      const paragraphs = rawText
        .split(/\n{2,}/)
        .map((block) => block.replace(/\n/g, " ").trim())
        .filter(Boolean);

      if (paragraphs.length === 0) {
        deleteFile(inputPath);
        return next(apiError("No readable text found in this PDF. It may be a scanned image."));
      }

      // Step 3: Build .docx document
      const doc = new Document({
        creator: "ToolHub",
        title:   req.file.originalname.replace(".pdf", ""),
        description: "Converted by ToolHub",
        sections: [{
          children: paragraphs.map((text, i) =>
            new Paragraph({
              children: [new TextRun({ text, size: 24, font: "Arial" })],
              heading:  i === 0 ? HeadingLevel.HEADING_1 : undefined,
              spacing:  { after: 200 },
            })
          ),
        }],
      });

      // Step 4: Save .docx
      const outName  = `converted-${uuidv4()}.docx`;
      const outPath  = path.join(UPLOAD_DIR, outName);
      const buffer   = await Packer.toBuffer(doc);
      fs.writeFileSync(outPath, buffer);

      logger.info(`[pdf-to-word] ${req.file.originalname} → ${outName} (${paragraphs.length} paragraphs)`);
      deleteFile(inputPath);
      fileResponse(res, outName, `PDF converted to Word (${paragraphs.length} paragraphs extracted)`);
    } catch (error) {
      deleteFile(inputPath);
      logger.error("[pdf-to-word] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { pdfToWord };