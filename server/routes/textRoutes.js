const express = require("express");
const router  = express.Router();

const textController = require("../controllers/textController");

router.post("/wordcount",   textController.wordCount);
router.post("/caseconvert", textController.caseConvert);
router.post("/slug",        textController.toSlug);

module.exports = router;