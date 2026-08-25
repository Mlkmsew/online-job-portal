// READ-ONLY verification of the CV authenticated-download fix against the
// REAL Cloudinary account + DB. Prints SAFE metadata only (no URLs, no CV
// text, no personal data). Uploads nothing, writes nothing.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/user');
  const { fetchStoredFileBuffer } = require('../utils/cloudinaryFile');

  const user = await User.findOne(
    { role: 'jobseeker', cv: { $exists: true, $ne: null }, cvPublicId: { $exists: true, $ne: null } },
    { cv: 1, cvPublicId: 1, cvOriginalName: 1 }
  ).lean();

  if (!user || !user.cv) {
    console.log('no stored CV found — nothing to verify');
    return;
  }

  console.log(`asset present=true originalNamePresent=${Boolean(user.cvOriginalName)} publicIdPresent=${Boolean(user.cvPublicId)}`);

  // Step 1: direct fetch of the stored URL (expected to 401 on restricted accounts).
  let directStatus = 'n/a';
  try {
    const r = await fetch(user.cv, { signal: AbortSignal.timeout(20000) });
    directStatus = r.status;
  } catch (e) {
    directStatus = `network:${e.name}`;
  }
  console.log(`direct_delivery_status=${directStatus}`);

  // Step 2: production download layer (direct → signed fallback).
  const started = Date.now();
  const { buffer, method } = await fetchStoredFileBuffer(user.cv, { cvPublicId: user.cvPublicId });
  const isPdf = buffer.length > 4 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  console.log(`download_method=${method}`);
  console.log(`downloaded_bytes=${buffer.length}`);
  console.log(`magic_bytes_pdf=${isPdf}`);
  console.log(`ms=${Date.now() - started}`);

  // Step 3: full parser entry point used by uploadCV.
  const { parseResumeSkills } = require('../utils/resumeParser');
  const analysis = await parseResumeSkills(user.cv, { cvPublicId: user.cvPublicId });
  console.log(`analysis_created=${Boolean(analysis.text != null)}`);
  console.log(`text_chars=${(analysis.text || '').trim().length}`);
  console.log(`skills_matched=${analysis.skills.length}`);
  console.log(`experience_years_found=${analysis.experienceYears != null}`);
})()
  .catch((err) => {
    console.error(`verify_failed: ${String(err.message).slice(0, 160)}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect().catch(() => {}));
