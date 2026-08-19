// ============================================
// Reusable CV Completion Score Calculator
// -------------------------------------------------
// This logic is shared between the Resume Builder
// page and the user's profile page so the CV Score
// always reflects the actual saved CV data instead
// of a hard-coded value.
//
// Score is based on the number of completed
// sections out of the following:
//   1. Personal Information
//   2. Contact Information
//   3. Professional Summary
//   4. Education
//   5. Work Experience
//   6. Skills
//   7. Languages
//   8. Certifications
//   9. Profile Photo
// ============================================

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const hasEntry = (list, extract) =>
  Array.isArray(list) &&
  list.some((item) => {
    if (item === null || item === undefined) return false;
    const value = extract ? extract(item) : item;
    if (typeof value === 'string') return hasText(value);
    return Boolean(value);
  });

export const RESUME_SECTIONS = [
  'Personal Information',
  'Contact Information',
  'Professional Summary',
  'Education',
  'Work Experience',
  'Skills',
  'Languages',
  'Certifications',
  'Profile Photo',
];

/**
 * Calculate CV completion percentage (0-100) from an actual resume object.
 * A section is considered complete only when it contains information.
 * @param {object} resume - The saved CV data (profile, education, experience, etc.)
 * @returns {number} completion percentage rounded to a whole number
 */
export const calculateResumeCompletion = (resume = {}) => {
  if (!resume || typeof resume !== 'object') return 0;

  const profile = resume.profile || {};
  let completed = 0;

  // 1. Personal Information
  const personalComplete =
    hasText(profile.firstName) ||
    hasText(profile.lastName) ||
    hasText(profile.profession) ||
    hasText(profile.gender) ||
    hasText(profile.dateOfBirth) ||
    hasText(profile.maritalStatus) ||
    hasText(profile.nationality) ||
    hasText(profile.passportNumber);
  if (personalComplete) completed += 1;

  // 2. Contact Information
  const contactComplete =
    hasText(profile.email) ||
    hasText(profile.phone) ||
    hasText(profile.website) ||
    hasText(profile.linkedIn) ||
    hasText(profile.streetAddress) ||
    hasText(profile.city) ||
    hasText(profile.stateProvince);
  if (contactComplete) completed += 1;

  // 3. Professional Summary
  if (hasText(resume.summary?.text)) completed += 1;

  // 4. Education
  const educationList = Array.isArray(resume.education)
    ? resume.education
    : resume.education
      ? [resume.education]
      : [];
  const hasEducationEntry = educationList.some(
    (edu) => edu && (hasText(edu.schoolName) || hasText(edu.degree) || hasText(edu.fieldOfStudy))
  );
  if (hasEducationEntry) completed += 1;

  // 5. Work Experience
  const experienceList = Array.isArray(resume.experience)
    ? resume.experience
    : resume.experience
      ? [resume.experience]
      : [];
  const hasExperienceEntry = experienceList.some(
    (exp) => exp && (hasText(exp.jobTitle) || hasText(exp.employer) || hasText(exp.duties))
  );
  if (hasExperienceEntry) completed += 1;

  // 6. Skills (technical + soft)
  const hasSkills =
    hasEntry(resume.skills, (skill) => (typeof skill === 'object' ? skill?.name : skill)) ||
    hasEntry(resume.softSkills);
  if (hasSkills) completed += 1;

  // 7. Languages
  const hasLanguages = hasEntry(resume.languages, (lang) =>
    typeof lang === 'object' ? lang?.name : lang
  );
  if (hasLanguages) completed += 1;

  // 8. Certifications
  const hasCertifications = hasEntry(resume.certifications, (cert) => {
    if (typeof cert === 'object') return cert?.name || cert?.title || cert?.certification || cert?.issuer;
    return cert;
  });
  if (hasCertifications) completed += 1;

  // 9. Profile Photo
  if (Boolean(resume.photo?.dataUrl) || Boolean(resume.photo?.url)) completed += 1;

  return Math.round((completed / RESUME_SECTIONS.length) * 100);
};

/**
 * Return a copy of the resume with its `score` field set to the actual
 * completion percentage so it can be persisted with the CV data.
 * @param {object} resume - The saved CV data
 * @returns {object} resume with an accurate `score` value
 */
export const withResumeScore = (resume = {}) => ({
  ...resume,
  score: calculateResumeCompletion(resume),
});

const firstEntry = (list) => (Array.isArray(list) && list.length > 0 ? list[0] : undefined);

/**
 * Map the user profile object (as stored on the backend / in the auth store)
 * into a resume-shaped object so the same `calculateResumeCompletion` logic
 * can be reused on the user's profile page.
 * @param {object} user - The saved user/profile data
 * @returns {object} resume-shaped object
 */
export const buildResumeFromProfile = (user = {}) => {
  if (!user || typeof user !== 'object') return {};

  const location = user.location || {};
  const exp = firstEntry(user.experienceDetails);
  const edu = firstEntry(user.educationDetails);
  const firstEducation = Array.isArray(user.education) && user.education.length > 0
    ? user.education[0]
    : undefined;
  const eduInstitution = (typeof firstEducation === 'object' ? firstEducation?.institution : firstEducation) || '';

  const skillNames =
    (Array.isArray(user.skillNames) && user.skillNames.length > 0)
      ? user.skillNames
      : (Array.isArray(user.skills)
          ? user.skills.map((s) => (typeof s === 'object' ? s?.name : s)).filter(Boolean)
          : []);

  const certificationList =
    (Array.isArray(user.certificates) && user.certificates.length > 0)
      ? user.certificates
      : (Array.isArray(user.resumeAnalysis?.certifications) && user.resumeAnalysis.certifications.length > 0
          ? user.resumeAnalysis.certifications.map((c) => (typeof c === 'object' ? c : { name: c }))
          : []);

  const certifications = certificationList.map((cert) => {
    const c = typeof cert === 'object' ? cert : { name: cert };
    const issueDate = c.issueDate ? (c.issueDate instanceof Date ? c.issueDate.toISOString().slice(0, 10) : String(c.issueDate).slice(0, 10)) : '';
    const year = c.year || (issueDate ? issueDate.slice(0, 4) : '');
    return {
      name: c.name || c.title || '',
      issuer: c.issuer || '',
      issueDate,
      year: String(year || ''),
      expirationDate: c.expirationDate ? (c.expirationDate instanceof Date ? c.expirationDate.toISOString().slice(0, 10) : String(c.expirationDate).slice(0, 10)) : '',
      credentialId: c.credentialId || '',
      credentialUrl: c.credentialUrl || c.url || '',
    };
  });

  const currentEducation = edu?.current || edu?.currentStudy || false;
  const currentExperience = exp?.current || exp?.currentWork || !exp?.endDate;

  return {
    profile: {
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      lastName: user.lastName || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      maritalStatus: user.maritalStatus || '',
      civilStatus: user.civilStatus || user.maritalStatus || '',
      nationality: user.nationality || '',
      placeOfBirth: user.placeOfBirth || '',
      passportNumber: user.passportNumber || '',
      driverLicense: user.driverLicense || '',
      profession: user.headline || user.currentRole || '',
      email: user.email || '',
      phone: user.phone || '',
      website: user.website || '',
      linkedIn: user.linkedIn || '',
      streetAddress: location.address || '',
      city: location.city || '',
      stateProvince: location.region || '',
      country: location.country || '',
      customField: user.customField || '',
    },
    summary: { text: user.bio || '' },
    education: {
      schoolName: edu?.institution || eduInstitution || '',
      city: edu?.location || '',
      degree: edu?.degree || '',
      fieldOfStudy: edu?.fieldOfStudy || '',
      startDate: edu?.startDate || '',
      endDate: edu?.endDate || '',
      currentStudy: currentEducation,
    },
    experience: {
      jobTitle: exp?.title || '',
      employer: exp?.company || '',
      city: exp?.location || '',
      startDate: exp?.startDate || '',
      endDate: exp?.endDate || '',
      currentWork: currentExperience,
      duties: exp?.description || user.experience || '',
    },
    projects: Array.isArray(user.portfolio)
      ? user.portfolio.map((item) => ({
          title: typeof item === 'object' ? item?.label || item?.title || '' : item || '',
          description: typeof item === 'object' ? item?.url || '' : '',
        })).filter((item) => item.title)
      : [],
    skills: skillNames.map((name) => ({ name })),
    softSkills: Array.isArray(user.softSkills) ? user.softSkills : [],
    languages: Array.isArray(user.languages) ? user.languages : [],
    certifications,
    interests: { text: user.interests || '' },
    photo: user.avatar ? { url: user.avatar } : null,
  };
};

/**
 * Calculate CV completion percentage directly from the user profile object,
 * reusing the exact same section-based logic as the Resume Builder.
 * @param {object} user - The saved user/profile data
 * @returns {number} completion percentage (0-100)
 */
export const calculateProfileCompletion = (user = {}) =>
  calculateResumeCompletion(buildResumeFromProfile(user));

export default calculateResumeCompletion;