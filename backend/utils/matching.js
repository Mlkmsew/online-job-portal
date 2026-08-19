// ============================================
// AI Job Recommendation & Scoring Engine
// ============================================

/**
 * Text normalization helper
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Canonical skill normalization to handle variations:
 * "React JS", "React.js", "React" -> "react"
 * "NodeJS", "Node.js" -> "nodejs"
 * "Mongo DB", "MongoDB" -> "mongodb"
 */
const normalizeSkillName = (skill) => {
  if (!skill) return '';
  let str = typeof skill === 'object' ? skill.name || skill.title || '' : String(skill);
  if (!str) return '';
  str = str.toLowerCase().trim();

  // Normalize common variations
  str = str.replace(/react\.?js/gi, 'react');
  str = str.replace(/node\.?js/gi, 'node');
  str = str.replace(/vue\.?js/gi, 'vue');
  str = str.replace(/express\.?js/gi, 'express');
  str = str.replace(/mongo\s*db/gi, 'mongodb');
  str = str.replace(/next\.?js/gi, 'nextjs');
  str = str.replace(/nest\.?js/gi, 'nestjs');
  str = str.replace(/typescript/gi, 'ts');
  str = str.replace(/javascript/gi, 'js');
  str = str.replace(/[^a-z0-9]/g, '');
  return str;
};

/**
 * Mapping experience levels to required years
 */
const mapExperienceLevelToYears = {
  'entry level': 0,
  'entry': 0,
  'mid level': 2,
  'mid': 2,
  'senior level': 5,
  'senior': 5,
  lead: 8,
  manager: 10,
  director: 12,
  executive: 15,
};

/**
 * Education level keywords map
 */
const educationKeywords = {
  'no requirement': [],
  'high school': ['high school', 'secondary school', '12th', 'highschool'],
  diploma: ['diploma', 'tvet', 'level 4', 'level 3', 'nd'],
  bachelor: ['bachelor', 'bsc', 'b.sc', 'ba', 'b.a', "bachelor's", 'degree', 'degree in'],
  master: ['master', 'msc', 'm.sc', 'mba', "master's", 'postgraduate'],
  phd: ['phd', 'doctorate', 'doctoral'],
  certificate: ['certificate', 'certified', 'certification'],
};

/**
 * Extract the user's soft skills. Soft skills are stored in a dedicated
 * category so they can contribute to matching without ever being treated
 * as technical/job skills.
 */
const extractUserSoftSkills = (user) => {
  const soft = new Set();

  if (Array.isArray(user?.softSkills)) {
    user.softSkills.forEach((s) => {
      if (s) soft.add(String(s));
    });
  }

  return Array.from(soft);
};

/**
 * Extract user skills from all profile fields
 */
const extractUserSkillNames = (user) => {
  const skills = new Set();

  // Stored soft skills must never be treated as technical skills, even when
  // the technical skill list is empty and we fall back to legacy fields.
  const softSkillNames = new Set(extractUserSoftSkills(user).map(normalizeSkillName).filter(Boolean));

  // 1. Categorized technical skills (preferred). Soft skills live in a
  //    separate field and must not be treated as technical skills.
  if (Array.isArray(user?.technicalSkills) && user.technicalSkills.length > 0) {
    user.technicalSkills.forEach((s) => {
      if (s) skills.add(String(s));
    });
  }

  // 2. Direct skills array (objects or strings)
  if (Array.isArray(user?.skills)) {
    user.skills.forEach((s) => {
      const name = typeof s === 'object' ? s.name || s.title : String(s);
      if (name) skills.add(name);
    });
  }

  // 3. Legacy combined skill names — only used when no categorized
  //    technical skills are present. Entries that are stored as soft skills
  //    are skipped so they are not treated as technical skills.
  if (skills.size === 0 && Array.isArray(user?.skillNames)) {
    user.skillNames.forEach((s) => {
      if (!s) return;
      const name = String(s);
      if (softSkillNames.has(normalizeSkillName(name))) return;
      skills.add(name);
    });
  }

  // 4. Resume analysis skills
  if (Array.isArray(user?.resumeAnalysis?.skills)) {
    user.resumeAnalysis.skills.forEach((s) => {
      const name = typeof s === 'object' ? s.name || s.title : String(s);
      if (name) skills.add(name);
    });
  }

  return Array.from(skills).filter(Boolean);
};

/**
 * Soft skill matching: compare the user's stored soft skills against the
 * job's soft skill requirements. Returns a small bonus (max +5 points) so
 * soft skills can contribute to the overall match without inflating the
 * technical skill score.
 */
const calculateSoftSkillMatch = (job, user) => {
  const jobSoft = Array.isArray(job?.skills?.soft) ? job.skills.soft : [];
  if (jobSoft.length === 0) return { matched: [], bonus: 0 };

  const userSoft = extractUserSoftSkills(user);
  if (userSoft.length === 0) return { matched: [], bonus: 0 };

  const userNorm = new Set(userSoft.map(normalizeSkillName).filter(Boolean));
  const matched = jobSoft.filter((jobSkill) => {
    const norm = normalizeSkillName(jobSkill);
    if (!norm) return false;
    if (userNorm.has(norm)) return true;
    return userSoft.some((uSkill) => {
      const uNorm = normalizeSkillName(uSkill);
      return uNorm && (uNorm.includes(norm) || norm.includes(uNorm));
    });
  });

  const ratio = matched.length / jobSoft.length;
  const bonus = Math.round(ratio * 5);

  return { matched: Array.from(new Set(matched)), bonus };
};

/**
 * Extract job required skills
 */
const extractJobRequiredSkills = (job) => {
  const skills = new Set();

  if (Array.isArray(job?.skillsRequired)) {
    job.skillsRequired.forEach((s) => {
      const name = typeof s === 'object' ? s.name || s.title : String(s);
      if (name) skills.add(name);
    });
  }

  if (Array.isArray(job?.skills?.technical)) {
    job.skills.technical.forEach((s) => {
      if (s) skills.add(String(s));
    });
  }

  return Array.from(skills).filter(Boolean);
};

/**
 * 1. SKILL MATCHING (Weight = 50%)
 */
const calculateSkillMatch = (job, user) => {
  const userRawSkills = extractUserSkillNames(user);
  const userNormalizedSkills = new Set(userRawSkills.map(normalizeSkillName).filter(Boolean));

  // Also extract words from user headline/bio as candidate skill tokens
  const userTextTokens = normalizeText(`${user?.headline || ''} ${user?.bio || ''}`).split(' ');
  userTextTokens.forEach((token) => {
    if (token.length > 2) userNormalizedSkills.add(normalizeSkillName(token));
  });

  const jobRawSkills = extractJobRequiredSkills(job);
  const softMatch = calculateSoftSkillMatch(job, user);

  if (jobRawSkills.length === 0) {
    // Fallback if job has no explicit skills list: check job title/description against user skills
    const jobText = normalizeText(`${job?.title || ''} ${job?.description || ''} ${job?.requirements || ''}`);
    const matched = userRawSkills.filter((s) => {
      const norm = normalizeSkillName(s);
      return norm && jobText.includes(norm);
    });
    const baseScore = userRawSkills.length > 0 ? Math.min(100, Math.round((matched.length / Math.max(1, userRawSkills.length)) * 100)) : 50;
    return {
      score: Math.min(100, baseScore + softMatch.bonus),
      matchedSkills: matched,
      missingSkills: [],
      softMatchedSkills: softMatch.matched,
    };
  }

  const matchedSkills = [];
  const missingSkills = [];

  jobRawSkills.forEach((jobSkill) => {
    const norm = normalizeSkillName(jobSkill);
    if (userNormalizedSkills.has(norm)) {
      matchedSkills.push(jobSkill);
    } else {
      // Fuzzy token check
      const matchedByFuzzy = userRawSkills.some((uSkill) => {
        const uNorm = normalizeSkillName(uSkill);
        return uNorm.includes(norm) || norm.includes(uNorm);
      });
      if (matchedByFuzzy) {
        matchedSkills.push(jobSkill);
      } else {
        missingSkills.push(jobSkill);
      }
    }
  });

  const matchRatio = matchedSkills.length / jobRawSkills.length;
  const baseScore = Math.round(matchRatio * 100);
  const score = Math.min(100, baseScore + softMatch.bonus);

  return {
    score,
    matchedSkills: Array.from(new Set(matchedSkills)),
    missingSkills: Array.from(new Set(missingSkills)),
    softMatchedSkills: softMatch.matched,
  };
};

/**
 * 2. EXPERIENCE MATCHING (Weight = 20%)
 */
const calculateExperienceMatch = (job, user) => {
  let userYears = user?.experienceYears;
  if (userYears == null && user?.resumeAnalysis?.experienceYears != null) {
    userYears = user.resumeAnalysis.experienceYears;
  }
  if (userYears == null && Array.isArray(user?.experienceDetails) && user.experienceDetails.length > 0) {
    userYears = user.experienceDetails.length;
  }
  if (userYears == null) {
    userYears = user?.experience ? 1 : 0;
  }
  userYears = Number(userYears) || 0;

  let requiredYears = 0;
  if (typeof job?.experienceLevel === 'string') {
    const lvl = job.experienceLevel.toLowerCase().trim();
    requiredYears = mapExperienceLevelToYears[lvl] ?? 0;
  }
  if (job?.experienceRequired != null) {
    const parsed = parseInt(job.experienceRequired, 10);
    if (!Number.isNaN(parsed)) requiredYears = parsed;
  }

  if (requiredYears === 0) return 100;
  if (userYears >= requiredYears) return 100;
  return Math.min(100, Math.round((userYears / requiredYears) * 100));
};

/**
 * 3. EDUCATION MATCHING (Weight = 15%)
 */
const calculateEducationMatch = (job, user) => {
  const jobEdu = job?.educationRequired || job?.education;
  if (!jobEdu || normalizeText(jobEdu) === 'no requirement') return 100;

  const candidateEdus = [];
  if (Array.isArray(user?.educationDetails)) {
    user.educationDetails.forEach((e) => {
      if (e?.degree) candidateEdus.push(normalizeText(e.degree));
      if (e?.institution) candidateEdus.push(normalizeText(e.institution));
    });
  }
  if (Array.isArray(user?.education)) {
    user.education.forEach((e) => candidateEdus.push(normalizeText(e)));
  }
  if (Array.isArray(user?.resumeAnalysis?.education)) {
    user.resumeAnalysis.education.forEach((e) => candidateEdus.push(normalizeText(e)));
  }

  if (!candidateEdus.length) return 40; // Neutral fallback

  const jobEduNorm = normalizeText(jobEdu);
  const keywords = educationKeywords[jobEduNorm] || [jobEduNorm];

  const matched = keywords.some((kw) => candidateEdus.some((cEdu) => cEdu.includes(kw)));
  return matched ? 100 : 30;
};

/**
 * 4. CERTIFICATION MATCHING (Weight = 10%)
 */
const calculateCertificationMatch = (job, user) => {
  const reqText = normalizeText(`${job?.requirements || ''} ${job?.description || ''}`);
  const requiresCert = /certificat|certified|license|pmp|aws|cisco/i.test(reqText);
  if (!requiresCert) return 100;

  const userCerts = [
    ...(Array.isArray(user?.certificates) ? user.certificates.map((c) => c.name || c) : []),
    ...(Array.isArray(user?.resumeAnalysis?.certifications) ? user.resumeAnalysis.certifications : []),
  ].filter(Boolean);

  return userCerts.length > 0 ? 100 : 20;
};

/**
 * 5. LOCATION MATCHING (Weight = 10%)
 */
const calculateLocationMatch = (job, user) => {
  if (!job?.workMode || job.workMode === 'Remote' || job.isRemote) return 100;

  const candidateLoc = normalizeText(
    `${user?.location?.city || ''} ${user?.location?.address || ''} ${user?.location?.region || ''} ${user?.resumeAnalysis?.location || ''}`
  );
  if (!candidateLoc) return 70; // Neutral fallback

  const jobCity = normalizeText(job?.location?.city || '');
  const jobRegion = normalizeText(job?.location?.region || '');

  if (!jobCity && !jobRegion) return 100;
  if (jobCity && candidateLoc.includes(jobCity)) return 100;
  if (jobRegion && candidateLoc.includes(jobRegion)) return 100;

  return 30;
};

/**
 * 6. JOB TYPE & CAREER PREFERENCE MATCHING (Weight = 10%)
 * Compares the job's employment type and industry against the user's stated
 * career preferences (preferred job types, industries, career interests).
 */
const normalizeJobType = (value) => {
  if (!value) return '';
  const map = {
    'full time': 'fulltime',
    'full-time': 'fulltime',
    fulltime: 'fulltime',
    'part time': 'parttime',
    'part-time': 'parttime',
    parttime: 'parttime',
    contract: 'contract',
    internship: 'internship',
    freelance: 'freelance',
    temporary: 'temporary',
    'on site': 'onsite',
    onsite: 'onsite',
    remote: 'remote',
    hybrid: 'hybrid',
  };
  return map[String(value).toLowerCase().trim()] || String(value).toLowerCase().trim();
};

const extractUserPreferences = (user) => {
  const prefs = user?.jobPreferences || {};
  const jobTypes = new Set([
    ...(Array.isArray(prefs.preferredJobTypes) ? prefs.preferredJobTypes : []),
    ...(Array.isArray(prefs.jobTypes) ? prefs.jobTypes : []),
  ]);
  const industries = new Set([
    ...(Array.isArray(prefs.industries) ? prefs.industries : []),
    ...(Array.isArray(prefs.preferredIndustries) ? prefs.preferredIndustries : []),
  ]);
  const interests = new Set([
    ...(Array.isArray(prefs.careerInterests) ? prefs.careerInterests : []),
    ...(Array.isArray(user?.careerInterests) ? user.careerInterests : []),
  ]);
  // Also derive preferences from resume analysis / headline when available
  if (user?.resumeAnalysis?.careerInterests) {
    (Array.isArray(user.resumeAnalysis.careerInterests)
      ? user.resumeAnalysis.careerInterests
      : [user.resumeAnalysis.careerInterests]
    ).forEach((v) => v && interests.add(v));
  }
  return { jobTypes, industries, interests };
};

const calculatePreferenceMatch = (job, user) => {
  const { jobTypes, industries, interests } = extractUserPreferences(user);
  const hasPreferences = jobTypes.size + industries.size + interests.size > 0;
  if (!hasPreferences) return 70; // Neutral fallback when no stated preferences

  let score = 0;
  let matched = 0;
  let total = 0;

  const jobTypeNorm = normalizeJobType(job?.jobType);
  if (jobTypeNorm && jobTypes.size > 0) {
    total += 1;
    if (Array.from(jobTypes).some((t) => normalizeJobType(t) === jobTypeNorm)) matched += 1;
  }

  const jobIndustry = String(job?.industry || job?.category?.name || '').toLowerCase().trim();
  if (jobIndustry && industries.size > 0) {
    total += 1;
    if (Array.from(industries).some((ind) => String(ind).toLowerCase().includes(jobIndustry) || jobIndustry.includes(String(ind).toLowerCase()))) matched += 1;
  }
  if (jobIndustry && interests.size > 0) {
    total += 1;
    if (Array.from(interests).some((int) => String(int).toLowerCase().includes(jobIndustry) || jobIndustry.includes(String(int).toLowerCase()))) matched += 1;
  }

  if (total === 0) return 70;
  return Math.round((matched / total) * 100);
};

/**
 * Build a human-readable reason explaining why the job is recommended.
 */
const buildMatchReason = (user, job, skillResult, experienceScore) => {
  const matched = skillResult?.matchedSkills || [];
  let reason = '';

  if (matched.length > 0) {
    const skillList = matched.slice(0, 3).join(', ');
    const years = Number(user?.experienceYears ?? user?.resumeAnalysis?.experienceYears ?? 0) || 0;
    reason = `Strong match based on your ${skillList}${years > 0 ? ` and ${years} year${years === 1 ? '' : 's'} of experience` : ''}.`;
  } else if (experienceScore >= 80) {
    reason = `Strong match based on your ${experienceScore === 100 ? '' : ''}experience and background.`;
  } else if (skillResult?.score >= 40) {
    reason = 'Good match based on your profile skills and background.';
  } else {
    reason = 'Potential match based on your profile.';
  }

  return reason;
};

/**
 * 7. JOB TITLE MATCHING (Weight = 15%)
 * Compares the job title against the user's stated/parsed role (headline,
 * current role, or the professional title parsed from an uploaded CV).
 */
const calculateTitleMatch = (job, user) => {
  const userTitle = normalizeText(
    `${user?.headline || ''} ${user?.currentRole || ''} ${user?.resumeAnalysis?.professionalTitle || ''}`
  );
  if (!userTitle) return 60;

  const jobTitle = normalizeText(job?.title || '');
  if (!jobTitle) return 100;

  const titleTokens = new Set(jobTitle.split(' ').filter((w) => w.length > 2));
  if (titleTokens.size === 0) return 60;

  const userTokens = new Set(userTitle.split(' ').filter((w) => w.length > 2));
  let matched = 0;
  titleTokens.forEach((t) => {
    const hit = Array.from(userTokens).some((ut) => ut === t || ut.includes(t) || t.includes(ut));
    if (hit) matched += 1;
  });

  const ratio = matched / titleTokens.size;
  if (ratio >= 0.6) return 100;
  if (ratio >= 0.33) return 70;
  if (ratio > 0) return 40;
  return 20;
};

/**
 * Main Job Match Calculation Function
 */
const calculateJobMatch = (job, user) => {
  if (!job || !user) {
    return { score: 0, details: {}, why: [] };
  }

  const skillResult = calculateSkillMatch(job, user);
  const experienceScore = calculateExperienceMatch(job, user);
  const titleScore = calculateTitleMatch(job, user);
  const educationScore = calculateEducationMatch(job, user);
  const certificationScore = calculateCertificationMatch(job, user);
  const locationScore = calculateLocationMatch(job, user);

  // Skills (incl. certifications) folded into the 40% skills weight.
  const combinedSkillScore = Math.round(skillResult.score * 0.85 + certificationScore * 0.15);

  // Overall Score: 40% Skills + 25% Exp + 15% Job Title + 10% Edu + 10% Location
  const totalScore = Math.round(
    combinedSkillScore * 0.40 +
    experienceScore * 0.25 +
    titleScore * 0.15 +
    educationScore * 0.10 +
    locationScore * 0.10
  );

  const matchScore = Math.max(0, Math.min(100, totalScore));

  const details = {
    skillScore: skillResult.score,
    experienceScore,
    titleScore,
    educationScore,
    certificationScore,
    locationScore,
    matchedSkills: skillResult.matchedSkills,
    missingSkills: skillResult.missingSkills,
    softMatchedSkills: skillResult.softMatchedSkills || [],
  };

  const why = [];
  if (skillResult.matchedSkills.length > 0) {
    why.push(`${skillResult.matchedSkills.length} required skill${skillResult.matchedSkills.length === 1 ? '' : 's'} matched`);
  }
  if (titleScore === 100) {
    why.push('Job title matches your profile');
  } else if (titleScore > 0) {
    why.push('Job title partially aligned with your background');
  }
  if (experienceScore === 100) {
    why.push('Experience requirement satisfied');
  } else if (experienceScore > 0) {
    why.push('Experience partially aligned');
  }
  if (educationScore === 100) {
    why.push('Education requirement satisfied');
  }
  if (locationScore === 100) {
    why.push('Location preference matched');
  }

  return {
    score: matchScore,
    matchScore,
    matchedSkills: skillResult.matchedSkills,
    missingSkills: skillResult.missingSkills,
    reason: buildMatchReason(user, job, skillResult, experienceScore),
    details,
    why,
  };
};

const calculateMatchScore = (job, user) => {
  const match = calculateJobMatch(job, user);
  return match.matchScore;
};

module.exports = { calculateJobMatch, calculateMatchScore };