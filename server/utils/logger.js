// =========================================================
//  utils/logger.js — Winston Logger
//  Writes to: logs/combined.log + logs/error.log
//  Console output in development only
// =========================================================

const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs   = require("fs");

// Ensure logs/ directory exists
const LOG_DIR = path.join(__dirname, "../logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log line format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),

  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),  // include stack traces for errors
    logFormat
  ),

  transports: [
    // All logs → combined.log (rotates at 5MB, keeps 5 files)
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),

    // Error logs only → error.log
    new transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
      tailable: true,
    }),
  ],
});

// Pretty console output in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "HH:mm:ss" }),
        printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
      ),
    })
  );
}

module.exports = logger;