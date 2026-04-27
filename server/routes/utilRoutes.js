// =========================================================
//  routes/utilRoutes.js
//  GET  /api/util/uuid              — ?count=5
//  POST /api/util/password          — body: { length, options }
//  POST /api/util/base64/encode     — body: { text }
//  POST /api/util/base64/decode     — body: { text }
//  POST /api/util/json-format       — body: { json, minify }
// =========================================================

const express = require("express");
const router  = express.Router();
const { generateUUID, generatePassword, base64Encode, base64Decode, jsonFormat } = require("../controllers/utilController");

router.get("/uuid",             generateUUID);
router.post("/password",        generatePassword);
router.post("/base64/encode",   base64Encode);
router.post("/base64/decode",   base64Decode);
router.post("/json-format",     jsonFormat);

module.exports = router;