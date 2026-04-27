// =========================================================
//  controllers/atsController.js
//  POST /api/ats/check
//  Check resume against ATS scoring criteria
//  Extracts text from PDF → scores on multiple parameters
// =========================================================

const fs       = require("fs");
const { uploadPdf, UPLOAD_DIR } = require("../middlewares/upload");
const { successResponse, apiError } = require("../utils/responseHelper");
const { deleteFile }             = require("../utils/fileCleaner");
const logger                     = require("../utils/logger");

// ── ATS Scoring Logic ─────────────────────────────────────
const scoreResume = (text, jobDescription = "") => {
  const lower = text.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // ── 1. Length Score (ideal: 400-800 words) ──────────────
  const wordCount = text.trim().split(/\s+/).length;
  let lengthScore = 0;
  if      (wordCount >= 400 && wordCount <= 800) lengthScore = 100;
  else if (wordCount >= 300 && wordCount <  400) lengthScore = 75;
  else if (wordCount >  800 && wordCount <= 1200) lengthScore = 80;
  else if (wordCount <  300)                      lengthScore = 40;
  else                                            lengthScore = 60;

  // ── 2. Contact Info Score ───────────────────────────────
  const hasEmail   = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone   = /(\+91|0)?[\s-]?[6-9]\d{9}|\d{10}|\(\d{3}\)\s?\d{3}-\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com|linkedin/i.test(text);
  const hasGitHub   = /github\.com|github/i.test(text);
  const contactScore = (
    (hasEmail    ? 30 : 0) +
    (hasPhone    ? 30 : 0) +
    (hasLinkedIn ? 25 : 0) +
    (hasGitHub   ? 15 : 0)
  );

  // ── 3. Section Headers Score ────────────────────────────
  const sections = {
    experience:  /experience|work history|employment/i.test(text),
    education:   /education|academic|degree|university|college/i.test(text),
    skills:      /skills|technologies|tech stack|expertise/i.test(text),
    summary:     /summary|objective|profile|about/i.test(text),
    projects:    /projects|portfolio|work samples/i.test(text),
    achievements:/achievements|awards|certifications|accomplishments/i.test(text),
  };
  const sectionCount = Object.values(sections).filter(Boolean).length;
  const sectionScore = Math.min(100, sectionCount * 17);

  // ── 4. Action Verbs Score ───────────────────────────────
  const actionVerbs = [
    "developed","built","designed","implemented","managed","led","created",
    "improved","increased","reduced","achieved","delivered","launched","optimized",
    "automated","collaborated","coordinated","analyzed","executed","maintained",
    "deployed","integrated","resolved","streamlined","mentored"
  ];
  const foundVerbs  = actionVerbs.filter((v) => lower.includes(v));
  const verbScore   = Math.min(100, foundVerbs.length * 8);

  // ── 5. Quantification Score ─────────────────────────────
  const numbers = text.match(/\d+%|\d+\+|\$\d+|\d+ (users|clients|projects|team|years|months|people)/gi) || [];
  const quantScore = Math.min(100, numbers.length * 20);

  // ── 6. Skills Keywords Score ────────────────────────────
  const techKeywords = [
    "javascript","python","java","react","node","angular","vue","sql","mongodb",
    "aws","docker","kubernetes","git","html","css","typescript","express","django",
    "machine learning","api","agile","scrum","linux","azure","gcp","ci/cd",
    "testing","rest","graphql","redux","figma","excel","powerpoint","communication"
  ];
  const foundSkills  = techKeywords.filter((k) => lower.includes(k));
  const skillsScore  = Math.min(100, foundSkills.length * 5);

  // ── 7. JD Match Score (if job description provided) ─────
  let jdScore = null;
  let jdKeywords = [];
  let missingKeywords = [];
  if (jobDescription.trim()) {
    const jdWords = jdLower
      .split(/\W+/)
      .filter((w) => w.length > 3)
      .filter((w) => !["with","that","this","from","have","will","your","their","they"].includes(w));

    const uniqueJdWords = [...new Set(jdWords)];
    jdKeywords    = uniqueJdWords.filter((w) => lower.includes(w)).slice(0, 15);
    missingKeywords = uniqueJdWords.filter((w) => !lower.includes(w)).slice(0, 10);
    jdScore = Math.min(100, Math.round((jdKeywords.length / Math.max(uniqueJdWords.length, 1)) * 100));
  }

  // ── 8. Format Issues ────────────────────────────────────
  const issues = [];
  if (!hasEmail)           issues.push("❌ No email address found");
  if (!hasPhone)           issues.push("❌ No phone number found");
  if (wordCount < 300)     issues.push("⚠️ Resume too short (add more detail)");
  if (wordCount > 1200)    issues.push("⚠️ Resume too long (trim to 1-2 pages)");
  if (!sections.skills)    issues.push("⚠️ No Skills section found");
  if (!sections.experience)issues.push("⚠️ No Experience section found");
  if (!sections.education) issues.push("⚠️ No Education section found");
  if (numbers.length === 0)issues.push("💡 Add numbers/metrics to quantify achievements");
  if (foundVerbs.length < 3)issues.push("💡 Use more action verbs (developed, built, led...)");
  if (!hasLinkedIn)        issues.push("💡 Add your LinkedIn profile URL");

  // ── Final Score Calculation ──────────────────────────────
  const weights = {
    length:   0.10,
    contact:  0.20,
    sections: 0.20,
    verbs:    0.15,
    quant:    0.10,
    skills:   0.25,
  };

  const baseScore = Math.round(
    lengthScore  * weights.length  +
    contactScore * weights.contact +
    sectionScore * weights.sections +
    verbScore    * weights.verbs   +
    quantScore   * weights.quant   +
    skillsScore  * weights.skills
  );

  // If JD provided, blend JD score in
  const finalScore = jdScore !== null
    ? Math.round(baseScore * 0.6 + jdScore * 0.4)
    : baseScore;

  // ── Grade ────────────────────────────────────────────────
  let grade, gradeColor, gradeMsg;
  if      (finalScore >= 85) { grade = "A+"; gradeColor = "green";  gradeMsg = "Excellent! Your resume is ATS-optimized." }
  else if (finalScore >= 70) { grade = "A";  gradeColor = "green";  gradeMsg = "Good resume. Minor improvements possible." }
  else if (finalScore >= 55) { grade = "B";  gradeColor = "yellow"; gradeMsg = "Average. Follow suggestions to improve." }
  else if (finalScore >= 40) { grade = "C";  gradeColor = "orange"; gradeMsg = "Needs work. Many ATS filters may reject this." }
  else                       { grade = "D";  gradeColor = "red";    gradeMsg = "Poor ATS score. Significant improvements needed." }

  return {
    score: finalScore,
    grade,
    gradeColor,
    gradeMessage: gradeMsg,
    breakdown: {
      contactInfo:    { score: contactScore,  label: "Contact Info",     tip: "Email, phone, LinkedIn, GitHub" },
      sections:       { score: sectionScore,  label: "Resume Sections",  tip: "Experience, Education, Skills, Summary" },
      skills:         { score: skillsScore,   label: "Keywords & Skills",tip: `Found: ${foundSkills.slice(0,5).join(", ")}` },
      actionVerbs:    { score: verbScore,     label: "Action Verbs",     tip: `Found: ${foundVerbs.slice(0,5).join(", ")}` },
      quantification: { score: quantScore,    label: "Quantified Impact", tip: "Numbers, percentages, metrics" },
      length:         { score: lengthScore,   label: "Resume Length",    tip: `${wordCount} words (ideal: 400-800)` },
    },
    ...(jdScore !== null && {
      jdMatch: {
        score:           jdScore,
        matchedKeywords: jdKeywords,
        missingKeywords,
      }
    }),
    issues,
    stats: {
      wordCount,
      hasEmail,
      hasPhone,
      hasLinkedIn,
      hasGitHub,
      sectionsFound:   Object.entries(sections).filter(([, v]) => v).map(([k]) => k),
      actionVerbsUsed: foundVerbs.length,
      quantifiedPoints: numbers.length,
      skillsFound:     foundSkills.length,
    },
  };
};

// ── POST /api/ats/check ───────────────────────────────────
// Form-data: file (PDF resume)
// Body: jobDescription (optional)
const checkAts = (req, res, next) => {
  uploadPdf(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(apiError("No resume uploaded. Use field name: file"));

    const inputPath     = req.file.path;
    const jobDescription = req.body.jobDescription || "";

    try {
      let pdfParse;
      try {
        pdfParse = require("pdf-parse");
      } catch {
        deleteFile(inputPath);
        return next(apiError("ATS service unavailable. Run: npm install pdf-parse", 503));
      }

      const buffer = fs.readFileSync(inputPath);
      const data   = await pdfParse(buffer);
      const text   = data.text?.trim() || "";

      if (!text || text.length < 50) {
        deleteFile(inputPath);
        return next(apiError("Could not extract text from resume. Make sure it's a text-based PDF, not a scanned image."));
      }

      const result = scoreResume(text, jobDescription);
      deleteFile(inputPath);

      logger.info(`[ats-check] Score: ${result.score}/100 (${result.grade}) — ${data.numpages} pages`);

      successResponse(res, {
        ...result,
        pages: data.numpages,
      }, `ATS Score: ${result.score}/100 — ${result.grade}`);

    } catch (error) {
      deleteFile(inputPath);
      logger.error("[ats-check] Failed: " + error.message);
      next(error);
    }
  });
};

module.exports = { checkAts };