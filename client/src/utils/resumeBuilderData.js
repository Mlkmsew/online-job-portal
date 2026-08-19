// ============================================
// Shared Resume Builder Data Layer
// -------------------------------------------------
// The user's profile is the single source of truth
// for profile data. This module:
//   1. Maps the latest profile -> resume-shaped data
//   2. Hydrates a saved CV with the latest profile
//      data while preserving any fields the user
//      explicitly edited in the CV (dirtyFields)
//   3. Resolves the single profile photo (no copies)
//   4. Validates a CV before it can be downloaded
// ============================================

import { buildResumeFromProfile, withResumeScore } from './resumeCompletion';

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Resolve the single source of truth for the CV photo.
 * If the user edited the photo inside the CV the resume
 * photo is used; otherwise the profile avatar is used.
 * @param {object} resume - Saved CV data
 * @returns {object|null} photo { dataUrl, url, fileName } or null
 */
export const getCvPhoto = (resume = {}) => {
  if (resume?.photo?.dataUrl || resume?.photo?.url) return resume.photo;
  return null;
};

/**
 * Merge the latest profile data into a saved CV while
 * keeping any fields the user explicitly edited in the CV.
 * Fields the user edited are tracked in `resume.dirtyFields`.
 * @param {object} resume - Saved CV data
 * @param {object} user - Latest user/profile data
 * @returns {object} hydrated resume used for preview + download
 */
export const hydrateResumeFromProfile = (resume = {}, user = {}) => {
  if (!resume || typeof resume !== 'object') return resume;

  const dirty = new Set(Array.isArray(resume.dirtyFields) ? resume.dirtyFields : []);
  const fresh = buildResumeFromProfile(user);
  const freshProfile = fresh.profile || {};
  const savedProfile = resume.profile || {};

  const pickProfileField = (field) => {
    if (dirty.has(`profile.${field}`)) return savedProfile[field] || '';
    return freshProfile[field] || savedProfile[field] || '';
  };

  const profile = {};
  [
    'firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth',
    'maritalStatus', 'civilStatus', 'nationality', 'placeOfBirth',
    'passportNumber', 'driverLicense', 'profession', 'email', 'phone',
    'website', 'linkedIn', 'streetAddress', 'city', 'stateProvince',
    'country', 'customField',
  ].forEach((field) => {
    profile[field] = pickProfileField(field);
  });

  // A section counts as user-edited when its whole-section key
  // (e.g. 'experience') or any of its field keys (e.g.
  // 'experience.jobTitle') has been marked dirty.
  const isSectionDirty = (section) =>
    dirty.has(section) ||
    Array.from(dirty).some((key) => key === section || key.startsWith(`${section}.`));

  const pickList = (section, freshList) => {
    if (isSectionDirty(section)) return resume[section];
    if (Array.isArray(freshList) && freshList.length > 0) return freshList;
    return resume[section];
  };

  // Experience/Education can be a single object (legacy) or an array of entries.
  // The profile snapshot produces single entries, which are wrapped into arrays
  // so the editor + templates can render multiple entries.
  const pickArraySection = (section, freshValue) => {
    if (isSectionDirty(section)) return resume[section];
    const freshEntries = Array.isArray(freshValue)
      ? freshValue
      : freshValue && Object.keys(freshValue).length
        ? [freshValue]
        : [];
    const meaningful = freshEntries.filter((entry) => entry && Object.values(entry).some((v) => hasText(v) || typeof v === 'boolean'));
    if (meaningful.length > 0) return meaningful;
    return Array.isArray(resume[section])
      ? resume[section]
      : resume[section] && Object.keys(resume[section]).length
        ? [resume[section]]
        : (resume[section] || []);
  };

  // Single photo source: only the CV-edited photo is kept;
  // otherwise the latest profile avatar (or null) is used.
  const photo = dirty.has('photo')
    ? resume.photo
    : (fresh.photo || null);

  const summary = dirty.has('summary.text')
    ? resume.summary
    : { text: fresh.summary?.text || resume.summary?.text || '' };

  const hydrated = {
    ...resume,
    profile: { ...savedProfile, ...profile },
    photo,
    summary: resume.summary && typeof resume.summary === 'object'
      ? { ...resume.summary, ...summary }
      : { text: summary.text || '' },
    experience: pickArraySection('experience', fresh.experience),
    education: pickArraySection('education', fresh.education),
    projects: pickList('projects', fresh.projects),
    skills: pickList('skills', fresh.skills),
    softSkills: pickList('softSkills', fresh.softSkills),
    languages: pickList('languages', fresh.languages),
    certifications: pickList('certifications', fresh.certifications),
  };

  return hydrated;
};

/**
 * Hydrate every CV in a list with the latest profile data.
 * @param {Array<object>} resumes - Saved CV list
 * @param {object} user - Latest user/profile data
 * @returns {Array<object>} hydrated + re-scored CV list
 */
export const hydrateResumeListFromProfile = (resumes = [], user = {}) =>
  resumes.map((resume) => withResumeScore(hydrateResumeFromProfile(resume, user)));

/**
 * Mark a resume field as user-edited so hydration does not
 * overwrite it with profile data on the next refresh.
 * @param {object} resume - Saved CV data
 * @param {string} field - Dot notation field key, e.g. 'profile.firstName' or 'skills'
 * @returns {object} copy of the resume with the dirty field tracked
 */
export const markResumeDirty = (resume = {}, field) => {
  const dirtyFields = Array.isArray(resume.dirtyFields)
    ? new Set(resume.dirtyFields)
    : new Set();
  if (field) dirtyFields.add(field);
  return { ...resume, dirtyFields: Array.from(dirtyFields) };
};

/**
 * Validate a CV before it can be previewed/downloaded.
 * Returns a list of human-readable issues (empty = ready).
 * @param {object} resume - Hydrated CV data
 * @returns {Array<string>} issues that block download
 */
export const validateResumeForDownload = (resume = {}) => {
  const issues = [];
  const fullName = [resume.profile?.firstName, resume.profile?.lastName]
    .filter((v) => hasText(v))
    .join(' ');

  if (!fullName) {
    issues.push('Add your first and last name in Personal Information before downloading your CV.');
  }
  if (!hasText(resume.summary?.text)) {
    issues.push('Add a professional summary so your CV is complete.');
  }
  if (!resume.template) {
    issues.push('Select a CV template before downloading.');
  }
  return issues;
};

export default hydrateResumeFromProfile;
