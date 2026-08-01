const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const mapExperienceLevelToYears = {
  'Entry Level': 0,
  'Mid Level': 2,
  'Senior Level': 5,
  Lead: 8,
  Manager: 10,
  Director: 12,
  Executive: 15,
};

const educationKeywords = {
  'No Requirement': [],
  'High School': ['high school', 'secondary school', 'senior secondary'],
  Diploma: ['diploma', 'national diploma', 'nd'],
  Bachelor: ['bachelor', 'bsc', 'b\.sc', 'ba', 'b\.a', "bachelor's"],
  Master: ['master', 'msc', 'm\.sc', 'mba', "master's"],
  PhD: ['phd', 'doctorate'],
  'Professional Certificate': ['certificate', 'certified', 'certification'],
};

const isEducationMatch = (jobEducation, candidateEducation = []) => {
  if (!jobEducation || jobEducation === 'No Requirement') return true;
  const normalizedCandidate = candidateEducation
    .map((e) => normalizeText(e))
    .filter(Boolean);

  const keywords = educationKeywords[jobEducation] || [];
  if (!keywords.length) return false;

  return keywords.some((keyword) => normalizedCandidate.some((education) => education.includes(keyword)));
};

const normalizeSkillId = (skill) => {
  if (!skill) return '';
  return skill._id ? skill._id.toString() : skill.toString();
};

const getUserSkillIds = (user) => {
  const skillIds = [
    ...(user.skills || []).map(normalizeSkillId),
    ...(user.resumeAnalysis?.skills || []).map(normalizeSkillId),
  ].filter(Boolean);
  return [...new Set(skillIds)];
};

const getUserSkillNames = (user) => {
  const names = [
    ...(user.skills || []).map((skill) => (skill?.name ? skill.name : skill?.toString ? skill.toString() : '')),
    ...(user.resumeAnalysis?.skills || []).map((skill) => (skill?.name ? skill.name : skill?.toString ? skill.toString() : '')),
  ].filter(Boolean);
  return [...new Set(names.map((name) => normalizeText(name)).filter(Boolean))];
};

const getNormalizedTokens = (text) => normalizeText(text).split(' ').filter(Boolean);

const skillTextMatchRatio = (skillName, jobText, resumeContent) => {
  if (!skillName) return 0;
  const normalizedSkill = normalizeText(skillName);
  if (!normalizedSkill) return 0;

  if (resumeContent.includes(normalizedSkill) || jobText.includes(normalizedSkill)) {
    return 1;
  }

  const skillTokens = getNormalizedTokens(normalizedSkill);
  if (!skillTokens.length) return 0;

  const haystackTokens = new Set([...getNormalizedTokens(jobText), ...getNormalizedTokens(resumeContent)]);
  const matchedTokens = skillTokens.filter((token) => haystackTokens.has(token));
  return matchedTokens.length / skillTokens.length;
};

const extractJobSkillIds = (job) => {
  return [...new Set((job.skillsRequired || [])
    .map((skill) => (skill._id ? skill._id.toString() : skill.toString()))
    .filter(Boolean))];
};

const extractJobSkillNames = (job) => {
  return [...new Set((job.skillsRequired || [])
    .map((skill) => (skill.name ? skill.name : skill.toString()))
    .filter(Boolean)
    .map((name) => normalizeText(name))
    .filter(Boolean))];
};

const calculateSkillScore = (job, userSkillIds = [], userSkillNames = [], resumeText = '') => {
  const jobSkillIds = extractJobSkillIds(job);
  const jobSkillNames = extractJobSkillNames(job);
  const jobText = normalizeText([job.title, job.requirements, job.description].filter(Boolean).join(' '));
  const resumeContent = normalizeText([resumeText, ...userSkillNames].filter(Boolean).join(' '));

  if (jobSkillIds.length === 0) {
    return { score: 0, matchedSkills: 0, totalSkills: 0 };
  }

  const matchedSkillIds = jobSkillIds.filter((skillId) => userSkillIds.includes(skillId));
  const matchedTextScore = jobSkillNames.reduce((acc, skillName) => {
    if (!skillName) return acc;
    return acc + skillTextMatchRatio(skillName, jobText, resumeContent);
  }, 0);

  if (matchedSkillIds.length === 0 && matchedTextScore === 0) {
    return { score: 0, matchedSkills: 0, totalSkills: jobSkillIds.length };
  }

  const skillMatchPercent = Math.round((matchedSkillIds.length / jobSkillIds.length) * 100);
  const textMatchPercent = jobSkillNames.length > 0 ? Math.round((matchedTextScore / jobSkillNames.length) * 100) : 0;

  return {
    score: Math.round((skillMatchPercent * 0.7) + (textMatchPercent * 0.3)),
    matchedSkills: matchedSkillIds.length,
    totalSkills: jobSkillIds.length,
  };
};

const calculateExperienceScore = (job, experienceYears) => {
  if (!job.experienceLevel) return 100;
  if (experienceYears == null || Number.isNaN(experienceYears)) return 50;

  const requiredYears = mapExperienceLevelToYears[job.experienceLevel] ?? 0;
  if (requiredYears === 0) return 100;

  const score = Math.min(100, Math.round((experienceYears / requiredYears) * 100));
  return score;
};

const calculateEducationScore = (job, candidateEducation = []) => {
  if (!job.educationRequired || job.educationRequired === 'No Requirement') return 100;
  return isEducationMatch(job.educationRequired, candidateEducation) ? 100 : 0;
};

const calculateCertificationScore = (job, userCertifications = []) => {
  const requirements = normalizeText(job.requirements || job.description || '');
  const requiresCert = /certificat|certified|professional certificate/i.test(requirements);
  if (!requiresCert) return 100;
  return userCertifications.length > 0 ? 100 : 0;
};

const calculateLocationScore = (job, candidateLocation) => {
  if (!job.workMode || job.workMode === 'Remote') return 100;
  if (!candidateLocation) return 50;

  const normalizedCandidate = normalizeText(candidateLocation);
  const region = normalizeText(job.location?.region || '');
  const city = normalizeText(job.location?.city || '');

  if (!region && !city) return 50;
  if (region && normalizedCandidate.includes(region)) return 100;
  if (city && normalizedCandidate.includes(city)) return 100;
  if (region && region.includes(normalizedCandidate)) return 100;
  if (city && city.includes(normalizedCandidate)) return 100;

  return 0;
};

const buildMatchDetails = (job, user) => {
  const userSkillIds = new Set([
    ...(user.skills || []).map((skill) => (skill._id ? skill._id.toString() : skill.toString())),
    ...(user.resumeAnalysis?.skills || []).map((skill) => (skill._id ? skill._id.toString() : skill.toString())),
  ]);

  const requiredSkills = (job.skillsRequired || []).map((skill) => ({
    id: skill._id ? skill._id.toString() : skill.toString(),
    name: skill.name || skill,
  }));

  const matchedSkills = requiredSkills.filter((skill) => userSkillIds.has(skill.id));
  const missingSkills = requiredSkills.filter((skill) => !userSkillIds.has(skill.id));

  const experienceYears = user.resumeAnalysis?.experienceYears ?? null;
  const educationList = [
    ...new Set([...(user.education || []), ...(user.resumeAnalysis?.education || [])].filter(Boolean)),
  ];
  const certificationList = [
    ...new Set([...(user.certificates || []).map((cert) => cert.name).filter(Boolean), ...(user.resumeAnalysis?.certifications || [])]),
  ];

  const userSkillIdsArray = Array.from(userSkillIds);
  const userSkillNames = getUserSkillNames(user);
  const resumeText = user.resumeAnalysis?.rawText || '';
  const skillResult = calculateSkillScore(job, userSkillIdsArray, userSkillNames, resumeText);
  const skillScore = skillResult.score;
  const experienceScore = calculateExperienceScore(job, experienceYears);
  const educationScore = calculateEducationScore(job, educationList);
  const certificationScore = calculateCertificationScore(job, certificationList);
  const locationScore = calculateLocationScore(job, user.resumeAnalysis?.location || user.location?.region || user.location?.city);

  let score = 0;
  if (skillScore > 0) {
    score = skillScore * 0.5 +
      experienceScore * 0.2 +
      educationScore * 0.15 +
      certificationScore * 0.1 +
      locationScore * 0.05;
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  const details = {
    skillScore,
    experienceScore,
    educationScore,
    certificationScore,
    locationScore,
    matchedSkills: matchedSkills.map((skill) => skill.name),
    missingSkills: missingSkills.map((skill) => skill.name),
    experienceYears,
    education: educationList,
    certifications: certificationList,
    location: user.resumeAnalysis?.location || user.location?.region || user.location?.city || null,
  };

  const why = [];
  if (matchedSkills.length > 0) {
    why.push(`✓ ${matchedSkills.length} required skill${matchedSkills.length === 1 ? '' : 's'} matched`);
  }
  if (missingSkills.length > 0) {
    why.push(`Missing ${missingSkills.length} skill${missingSkills.length === 1 ? '' : 's'}`);
  }
  if (experienceScore === 100) {
    why.push('Experience requirement satisfied');
  } else if (experienceScore > 0) {
    why.push('Experience partially aligned');
  }
  if (educationScore === 100) {
    why.push('Education requirement satisfied');
  }
  if (certificationScore === 100) {
    why.push('Certification requirement satisfied');
  }
  if (locationScore === 100) {
    why.push('Location preference matched');
  }

  return { score, details, why };
};

const calculateMatchScore = (job, user) => {
  const userSkillIds = getUserSkillIds(user);
  const userSkillNames = getUserSkillNames(user).map((name) => normalizeText(name));
  const resumeText = normalizeText(user.resumeAnalysis?.rawText || '');

  const skillResult = calculateSkillScore(job, userSkillIds, userSkillNames, resumeText);
  const skillScore = skillResult.score;

  const jobText = normalizeText([job.title, job.requirements, job.description].filter(Boolean).join(' '));
  const matchedSkillTextCount = userSkillNames.filter((name) => name && jobText.includes(name)).length;
  const keywordScore = userSkillNames.length > 0
    ? Math.round((matchedSkillTextCount / userSkillNames.length) * 20)
    : 5;

  const userHeadlineText = normalizeText(user.headline || '');
  const userBioText = normalizeText(user.bio || '');
  const titleWords = normalizeText(job.title || '').split(/\s+/).filter((w) => w.length > 3);
  const matchedTitleWords = titleWords.filter((word) => userHeadlineText.includes(word) || userBioText.includes(word) || resumeText.includes(word)).length;
  const titleScore = titleWords.length > 0 ? Math.round((matchedTitleWords / titleWords.length) * 15) : 5;

  const experienceScore = calculateExperienceScore(job, user.resumeAnalysis?.experienceYears ?? null);
  const educationScore = calculateEducationScore(job, [...new Set([...(user.education || []), ...(user.resumeAnalysis?.education || [])].filter(Boolean))]);
  const certificationScore = calculateCertificationScore(job, [...new Set([...(user.certificates || []).map((cert) => cert.name).filter(Boolean), ...(user.resumeAnalysis?.certifications || [])])]);
  const locationScore = calculateLocationScore(job, user.resumeAnalysis?.location || user.location?.region || user.location?.city);

  const score = skillScore * 0.5 + keywordScore * 0.15 + titleScore * 0.1 + experienceScore * 0.1 + educationScore * 0.075 + certificationScore * 0.05 + locationScore * 0.05;
  if (skillScore === 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
};

module.exports = { calculateJobMatch: buildMatchDetails, calculateMatchScore };