// ============================================
// Resume Controller - Job Seeker CV Builder API
// -------------------------------------------------
// Every route requires an authenticated job seeker and
// every document lookup is scoped to req.user so users can
// only read/write their own CVs.
// ============================================
const Resume = require('../models/Resume');
const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

// ---------------------------------------------------------------------------
// Default resume helpers
// ---------------------------------------------------------------------------

/**
 * Clear all default flags for a user, then set exactly one resume as default.
 * Returns the updated default resume document.
 */
const setResumeAsDefault = async (userId, resumeId) => {
  await Resume.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
  const updated = await Resume.findOneAndUpdate(
    { _id: resumeId, user: userId },
    { $set: { isDefault: true } },
    { new: true },
  );
  return updated;
};

/**
 * When no default exists, pick the most recently updated resume and
 * persist it as the user's default.  Returns the newly-promoted resume
 * or null if the user has no resumes.
 */
const ensureDefaultResume = async (userId) => {
  const existing = await Resume.findOne({ user: userId, isDefault: true }).lean();
  if (existing) return existing;

  const latest = await Resume.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
  if (!latest) return null;

  return setResumeAsDefault(userId, latest._id);
};

// ---------------------------------------------------------------------------
// Profile -> resume snapshot helpers (mirror the frontend mapping)
// ---------------------------------------------------------------------------

const firstEntry = (list) => (Array.isArray(list) && list.length > 0 ? list[0] : undefined);

const toDateString = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
};

/**
 * Build a resume-shaped snapshot from the authenticated user's profile.
 * @param {object} user - User document (from req.user)
 * @returns {object} fresh resume sections derived from the profile
 */
const buildProfileSnapshot = (user = {}) => {
  const location = user.location || {};
  const exp = firstEntry(user.experienceDetails);
  const edu = firstEntry(user.educationDetails);
  const firstEducation = Array.isArray(user.education) && user.education.length > 0 ? user.education[0] : undefined;
  const eduInstitution =
    typeof firstEducation === 'object' ? firstEducation?.institution : firstEducation || '';

  const skillNames =
    Array.isArray(user.skillNames) && user.skillNames.length > 0
      ? user.skillNames
      : Array.isArray(user.skills)
        ? user.skills.map((s) => (typeof s === 'object' ? s?.name : s)).filter(Boolean)
        : [];

  const certificationList =
    Array.isArray(user.certificates) && user.certificates.length > 0
      ? user.certificates
      : Array.isArray(user.resumeAnalysis?.certifications) && user.resumeAnalysis.certifications.length > 0
        ? user.resumeAnalysis.certifications.map((c) => (typeof c === 'object' ? c : { name: c }))
        : [];

  const currentEducation = edu?.current || edu?.currentStudy || false;
  const currentExperience = exp?.current || exp?.currentWork || (hasText(exp?.startDate) && !hasText(exp?.endDate));

  const experienceEntry =
    exp && (hasText(exp?.title) || hasText(exp?.company))
      ? {
          jobTitle: exp.title || '',
          employer: exp.company || '',
          city: exp.location || '',
          state: exp.state || '',
          startDate: toDateString(exp.startDate) || '',
          endDate: toDateString(exp.endDate) || '',
          currentWork: Boolean(currentExperience),
          duties: exp.description || user.experience || '',
        }
      : null;

  const educationEntry =
    edu && (hasText(edu?.degree) || hasText(edu?.institution) || hasText(edu?.fieldOfStudy))
      ? {
          schoolName: edu.institution || eduInstitution || '',
          city: edu.location || '',
          state: edu.state || '',
          degree: edu.degree || '',
          fieldOfStudy: edu.fieldOfStudy || '',
          startDate: toDateString(edu.startDate) || '',
          endDate: toDateString(edu.endDate) || '',
          currentStudy: Boolean(currentEducation),
        }
      : null;

  const portfolio =
    Array.isArray(user.portfolio)
      ? user.portfolio
          .map((item) => ({
            title: typeof item === 'object' ? item?.label || item?.title || '' : item || '',
            description: typeof item === 'object' ? item?.url || '' : '',
          }))
          .filter((item) => item.title)
      : [];

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
    experience: experienceEntry ? [experienceEntry] : [],
    education: educationEntry ? [educationEntry] : [],
    projects: portfolio,
    skills: skillNames.map((name) => ({ name })),
    softSkills: Array.isArray(user.softSkills) ? user.softSkills : [],
    languages: Array.isArray(user.languages) ? user.languages : [],
    certifications: certificationList.map((cert) => {
      const c = typeof cert === 'object' ? cert : { name: cert };
      return {
        name: c.name || c.title || '',
        issuer: c.issuer || '',
        issueDate: toDateString(c.issueDate) || '',
        year: c.year || (c.issueDate ? toDateString(c.issueDate).slice(0, 4) : ''),
        expirationDate: toDateString(c.expirationDate) || '',
        credentialId: c.credentialId || '',
        credentialUrl: c.credentialUrl || c.url || '',
      };
    }),
    interests: { text: user.interests || '' },
    photo: user.avatar ? { url: user.avatar } : null,
  };
};

/**
 * Merge a fresh profile snapshot into a saved CV while preserving any field
 * the user explicitly edited inside the CV (tracked in resume.dirtyFields).
 * @param {object} resume - Saved CV document data
 * @param {object} snapshot - Fresh profile snapshot (buildProfileSnapshot)
 * @returns {object} merged resume data
 */
const mergeProfileIntoResume = (resume, snapshot) => {
  const dirty = new Set(Array.isArray(resume.dirtyFields) ? resume.dirtyFields : []);
  const savedProfile = resume.profile || {};
  const freshProfile = snapshot.profile || {};

  const pickProfileField = (field) => {
    if (dirty.has(`profile.${field}`)) return savedProfile[field] || '';
    return freshProfile[field] || savedProfile[field] || '';
  };

  const profile = {};
  Object.keys(freshProfile).forEach((field) => {
    profile[field] = pickProfileField(field);
  });

  const pickArray = (section, freshValue) => {
    if (dirty.has(section)) return resume[section];
    const freshEntries = Array.isArray(freshValue) ? freshValue : freshValue ? [freshValue] : [];
    const meaningful = freshEntries.filter((entry) => entry && Object.values(entry).some((v) => hasText(v) || typeof v === 'boolean'));
    return meaningful.length > 0 ? meaningful : resume[section];
  };

  const photo = dirty.has('photo')
    ? resume.photo
    : snapshot.photo || resume.photo || null;

  const summary = dirty.has('summary.text')
    ? resume.summary
    : { text: snapshot.summary?.text || resume.summary?.text || '' };

  return {
    ...resume,
    profile: { ...savedProfile, ...profile },
    photo,
    summary,
    experience: pickArray('experience', snapshot.experience),
    education: pickArray('education', snapshot.education),
    projects: pickArray('projects', snapshot.projects),
    skills: pickArray('skills', snapshot.skills),
    softSkills: pickArray('softSkills', snapshot.softSkills),
    languages: pickArray('languages', snapshot.languages),
    certifications: pickArray('certifications', snapshot.certifications),
  };
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

// @desc    Get all resumes for the authenticated job seeker
// @route   GET /api/resumes
// @access  Private (jobseeker)
exports.getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
  res.status(200).json({ success: true, count: resumes.length, data: resumes });
});

// @desc    Get a single resume owned by the authenticated user
// @route   GET /api/resumes/:id
// @access  Private (jobseeker)
exports.getResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));
  res.status(200).json({ success: true, data: resume });
});

// @desc    Create a new resume for the authenticated job seeker
// @route   POST /api/resumes
// @access  Private (jobseeker)
// The client seeds the initial CV from the user's profile and sends the full
// resume payload. The server stores it under the authenticated user only.
exports.createResume = asyncHandler(async (req, res, next) => {
  const { title, template, theme, profile, summary, experience, education, projects, skills, softSkills, languages, certifications, interests, photo, additionalInfo, sectionOrder, dirtyFields, status } = req.body || {};

  if (!title || !title.trim()) {
    return next(new AppError('Resume title is required.', 400));
  }

  const resume = await Resume.create({
    user: req.user._id,
    title: String(title).trim(),
    template: template || 'modern-ats',
    theme: theme && typeof theme === 'object' ? theme : {},
    status: status === 'completed' ? 'completed' : 'draft',
    score: typeof req.body.score === 'number' ? req.body.score : 0,
    profile: profile || {},
    summary: summary || {},
    experience: Array.isArray(experience) ? experience : [],
    education: Array.isArray(education) ? education : [],
    projects: Array.isArray(projects) ? projects : [],
    skills: Array.isArray(skills) ? skills : [],
    softSkills: Array.isArray(softSkills) ? softSkills : [],
    languages: Array.isArray(languages) ? languages : [],
    certifications: Array.isArray(certifications) ? certifications : [],
    interests: interests || {},
    photo: photo || null,
    additionalInfo: additionalInfo || {},
    sectionOrder: Array.isArray(sectionOrder) ? sectionOrder : [],
    dirtyFields: Array.isArray(dirtyFields) ? dirtyFields : [],
    isDefault: req.body.isDefault === true,
  });

  // Auto-promote to default when this is the user's first resume or no
  // default currently exists.
  const defaultExists = await Resume.exists({ user: req.user._id, isDefault: true, _id: { $ne: resume._id } });
  if (!defaultExists) {
    await setResumeAsDefault(req.user._id, resume._id);
    resume.isDefault = true;
  }

  res.status(201).json({ success: true, message: 'Resume created successfully.', data: resume });
});

// @desc    Update a resume owned by the authenticated user
// @route   PUT /api/resumes/:id
// @access  Private (jobseeker)
exports.updateResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const editable = [
    'title', 'template', 'theme', 'status', 'score', 'profile', 'summary',
    'experience', 'education', 'projects', 'skills', 'softSkills', 'languages',
    'certifications', 'interests', 'photo', 'additionalInfo', 'sectionOrder',
    'dirtyFields',
  ];

  editable.forEach((field) => {
    if (req.body[field] !== undefined) resume[field] = req.body[field];
  });

  if (req.body.title !== undefined && (!req.body.title || !String(req.body.title).trim())) {
    return next(new AppError('Resume title cannot be empty.', 400));
  }

  // Handle default flag change — must enforce single-default invariant.
  if (req.body.isDefault === true && !resume.isDefault) {
    await setResumeAsDefault(req.user._id, resume._id);
    resume.isDefault = true;
  } else if (req.body.isDefault === false && resume.isDefault) {
    // Cannot unset the only default without promoting another; promote the
    // most recently updated remaining resume.
    const other = await Resume.findOne({ user: req.user._id, _id: { $ne: resume._id } }).sort({ updatedAt: -1 });
    if (other) {
      await setResumeAsDefault(req.user._id, other._id);
    }
    resume.isDefault = false;
  }

  await resume.save();

  res.status(200).json({ success: true, message: 'Resume updated successfully.', data: resume });
});

// @desc    Delete a resume owned by the authenticated user
// @route   DELETE /api/resumes/:id
// @access  Private (jobseeker)
exports.deleteResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const wasDefault = resume.isDefault;
  await Resume.deleteOne({ _id: resume._id });

  // If we deleted the default, promote the most recently updated remaining
  // resume.  If none remains, no default is needed.
  if (wasDefault) {
    const nextDefault = await Resume.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
    if (nextDefault) {
      await setResumeAsDefault(req.user._id, nextDefault._id);
    }
  }

  res.status(200).json({ success: true, message: 'Resume deleted successfully.', data: {} });
});

// @desc    Sync profile data into a resume (safe: preserves user-edited fields)
// @route   POST /api/resumes/:id/sync-profile
// @access  Private (jobseeker)
exports.syncProfile = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const snapshot = buildProfileSnapshot(req.user);
  const merged = mergeProfileIntoResume(resume.toObject(), snapshot);

  Object.keys(merged).forEach((key) => {
    if (key !== '_id' && key !== 'id' && key !== 'user' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
      resume[key] = merged[key];
    }
  });

  await resume.save();

  res.status(200).json({ success: true, message: 'Profile data synced into resume.', data: resume });
});

// @desc    Set a resume as the user's default (active) resume
// @route   PATCH /api/resumes/:id/default
// @access  Private (jobseeker)
exports.setDefault = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  if (resume.isDefault) {
    return res.status(200).json({ success: true, message: 'Resume is already the default.', data: resume });
  }

  const updated = await setResumeAsDefault(req.user._id, resume._id);
  res.status(200).json({ success: true, message: 'Default resume updated.', data: updated });
});

module.exports = exports;
