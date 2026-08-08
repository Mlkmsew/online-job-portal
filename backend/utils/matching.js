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
 * Extract user skills from all profile fields
 */
const extractUserSkillNames = (user) => {
  const skills = new Set();

  // 1. Direct skills array (objects or strings)
  if (Array.isArray(user?.skills)) {
    user.skills.forEach((s) => {
      const name = typeof s === 'object' ? s.name || s.title : String(s);
      if (name) skills.add(name);
    });
  }

  // 2. SkillNames string array
  if (Array.isArray(user?.skillNames)) {
    user.skillNames.forEach((s) => {
      if (s) skills.add(String(s));
    });
  }

  // 3. Resume analysis skills
  if (Array.isArray(user?.resumeAnalysis?.skills)) {
    user.resumeAnalysis.skills.forEach((s) => {
      const name = typeof s === 'object' ? s.name || s.title : String(s);
      if (name) skills.add(name);
    });
  }

  return Array.from(skills).filter(Boolean);
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

  if (jobRawSkills.length === 0) {
    // Fallback if job has no explicit skills list: check job title/description against user skills
    const jobText = normalizeText(`${job?.title || ''} ${job?.description || ''} ${job?.requirements || ''}`);
    const matched = userRawSkills.filter((s) => {
      const norm = normalizeSkillName(s);
      return norm && jobText.includes(norm);
    });
    const score = userRawSkills.length > 0 ? Math.min(100, Math.round((matched.length / Math.max(1, userRawSkills.length)) * 100)) : 50;
    return {
      score,
      matchedSkills: matched,
      missingSkills: [],
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
  const score = Math.round(matchRatio * 100);

  return {
    score,
    matchedSkills: Array.from(new Set(matchedSkills)),
    missingSkills: Array.from(new Set(missingSkills)),
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
 * 5. LOCATION MATCHING (Weight = 5%)
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
 * Main Job Match Calculation Function
 */
const calculateJobMatch = (job, user) => {
  if (!job || !user) {
    return { score: 0, details: {}, why: [] };
  }

  const skillResult = calculateSkillMatch(job, user);
  const experienceScore = calculateExperienceMatch(job, user);
  const educationScore = calculateEducationMatch(job, user);
  const certificationScore = calculateCertificationMatch(job, user);
  const locationScore = calculateLocationMatch(job, user);

  // Overall Score Calculation: 50% Skills + 20% Exp + 15% Edu + 10% Cert + 5% Loc
  const totalScore = Math.round(
    skillResult.score * 0.50 +
    experienceScore * 0.20 +
    educationScore * 0.15 +
    certificationScore * 0.10 +
    locationScore * 0.05
  );

  const matchScore = Math.max(0, Math.min(100, totalScore));

  const details = {
    skillScore: skillResult.score,
    experienceScore,
    educationScore,
    certificationScore,
    locationScore,
    matchedSkills: skillResult.matchedSkills,
    missingSkills: skillResult.missingSkills,
  };

  const why = [];
  if (skillResult.matchedSkills.length > 0) {
    why.push(`${skillResult.matchedSkills.length} required skill${skillResult.matchedSkills.length === 1 ? '' : 's'} matched`);
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
    details,
    why,
  };
};

const calculateMatchScore = (job, user) => {
  const match = calculateJobMatch(job, user);
  return match.matchScore;
};

module.exports = { calculateJobMatch, calculateMatchScore };