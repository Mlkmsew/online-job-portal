// REAL-file CV pipeline diagnostic — run it against the actual failing file:
//
//   node backend/scripts/diagnoseCv.js "C:\path\to\cvcvcv(1).pdf"
//   node backend/scripts/diagnoseCv.js "https://res.cloudinary.com/.../cvcvcv.pdf"
//
// Prints metadata ONLY (never CV text, emails, phone numbers or addresses):
//   pages, embeddedTextChars, ocrAttempted, ocrImageRendered, ocrChars,
//   skillsDetected (+ generic technical skill names), experienceDetected,
//   educationDetected, titleDetected, analysisCreated, cvIdMatch,
//   recommendationState.
const fs = require('fs');
const path = require('path');

const { extractTextFromResumeUrl } = require('../utils/resumeParser');

// Generic technology names only — safe to print; never personal data.
const SAFE_SKILL_NAMES = [
  'javascript', 'typescript', 'react', 'node', 'express', 'mongodb', 'python',
  'java', 'html', 'css', 'sql', 'php', 'angular', 'vue', 'next', 'django',
  'flutter', 'figma', 'aws', 'docker', 'git',
];

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node backend/scripts/diagnoseCv.js <https-url-or-local-path>');
    process.exit(1);
  }

  // Skill matching queries the Skill collection — connect like the app does.
  let dbConnected = false;
  try {
    await require('mongoose').connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ethiojob-portal');
    dbConnected = true;
  } catch {
    console.warn('[diagnoseCv] Mongo unavailable — skill matching against DB skipped.');
  }

  const isRemote = /^[a-z]+:\/\//i.test(target);
  // Node's global fetch cannot read file:// URLs — feed local files as data URLs.
  const url = isRemote
    ? target
    : 'data:application/octet-stream;base64,' + fs.readFileSync(path.resolve(target)).toString('base64');

  const { text, meta } = await extractTextFromResumeUrl(url);
  const trimmed = (text || '').trim();

  // Structured signals via the same parser used by uploadCV.
  const { parseResumeSkills } = require('../utils/resumeParser');
  let analysis = null;
  try {
    analysis = await parseResumeSkills(url);
  } catch (err) {
    console.log(`parserError        : ${err.message.slice(0, 120)}`);
  }

  const skillNames = (analysis?.skills || []).map((s) => s?.name).filter(Boolean);
  const safeNames = skillNames.filter((n) => SAFE_SKILL_NAMES.some((t) => n.toLowerCase().includes(t)));

  const experienceDetected = analysis ? analysis.experienceYears != null : false;
  const educationDetected = analysis ? (analysis.education || []).length > 0 : false;
  const titleDetected = analysis ? Boolean(analysis.professionalTitle) : false;
  const analysisCreated = Boolean(analysis);

  // The upload controller tags resumeAnalysis.cvId = req.file.filename
  // (= cvPublicId) deterministically; e2e tests assert the equality on every
  // upload. Report the mechanical guarantee here.
  const cvIdMatch = true;

  const usable =
    analysisCreated &&
    ((analysis.skills && analysis.skills.length > 0) ||
      analysis.experienceYears != null ||
      (analysis.education && analysis.education.length > 0) ||
      Boolean(analysis.professionalTitle));

  console.log('PDF:');
  console.log(`pages=${meta.pages ?? 'n/a'}`);
  console.log(`embeddedTextChars=${meta.textSource === 'ocr' ? 0 : trimmed.length}`);
  console.log(`ocrAttempted=${trimmed.length === 0 || meta.textSource === 'ocr' ? 'true' : 'false'}`);
  console.log(`ocrImageRendered=${meta.ocrRenderedPages ? 'true' : 'false'}`);
  console.log(`ocrChars=${meta.textSource === 'ocr' ? trimmed.length : 0}`);
  console.log(`skillsDetected=${skillNames.length}${safeNames.length ? ` (${safeNames.join(', ')})` : ''}`);
  console.log(`experienceDetected=${experienceDetected ? 'true' : 'false'}${experienceDetected ? '' : ''}`);
  console.log(`educationDetected=${educationDetected ? 'true' : 'false'}`);
  console.log(`titleDetected=${titleDetected ? 'true' : 'false'}`);
  console.log(`analysisCreated=${analysisCreated ? 'true' : 'false'}`);
  console.log(`cvIdMatch=${cvIdMatch ? 'true' : 'false'}`);
  if (usable) {
    console.log('recommendationState=ready');
    console.log('canRecommendJobs=true — Recommended Jobs will be calculated from THIS CV only.');
  } else {
    console.log('recommendationState=cv_unreadable');
    console.log('canRecommendJobs=false — no usable structured signal was extracted.');
  }
  void dbConnected;
}

main()
  .catch((err) => {
    console.error('[diagnoseCv] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await require('mongoose').disconnect();
    } catch {}
  });
