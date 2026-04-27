// =========================================================
//  middlewares/errorHandler.js — Global Error Handler
//  Must be registered LAST in server.js: app.use(errorHandler)
// =========================================================

const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`);

  // Multer: file too large
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum size: ${process.env.MAX_FILE_SIZE_MB || 25}MB`,
    });
  }

  // Multer: wrong field name
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Use "file" for single or "files" for multiple.',
    });
  }

  // JSON parse error
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
    });
  }

  // All other errors
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    // Show stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler };