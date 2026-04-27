// =========================================================
//  routes/atsRoutes.js
//  POST /api/ats/check  — Check resume ATS score
// =========================================================

const express    = require("express");
const router     = express.Router();
const { heavyLimiter } = require("../middlewares/rateLimiter");
const { checkAts }     = require("../controllers/atsController");

// POST /api/ats/check
// Form-data: file (PDF) + jobDescription (optional text)
router.post("/check", heavyLimiter, checkAts);

module.exports = router;