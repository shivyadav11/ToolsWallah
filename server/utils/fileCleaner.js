// =========================================================
//  utils/fileCleaner.js
//  Auto-deletes temp files older than FILE_TTL_MINUTES
//  Called by cron every hour in server.js
// =========================================================

const fs   = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../uploads/temp");
const TTL_MS     = (parseInt(process.env.FILE_TTL_MINUTES) || 60) * 60 * 1000;

// Delete all temp files older than TTL
const cleanTempFiles = () => {
  if (!fs.existsSync(UPLOAD_DIR)) return;

  const now   = Date.now();
  const files = fs.readdirSync(UPLOAD_DIR);
  let deleted = 0;

  files.forEach((file) => {
    if (file === ".gitkeep") return;
    const filePath = path.join(UPLOAD_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > TTL_MS) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch (err) {
      console.error(`[CLEANER] Could not delete ${file}: ${err.message}`);
    }
  });

  if (deleted > 0) {
    console.log(`[CLEANER] Deleted ${deleted} old temp file(s)`);
  }
};

// Delete a single file safely (used in controllers after processing)
const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`[CLEANER] Failed to delete ${filePath}: ${err.message}`);
  }
};

module.exports = { cleanTempFiles, deleteFile };