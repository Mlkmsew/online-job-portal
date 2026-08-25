const User = require('../models/user');
const Resume = require('../models/Resume');

const hasProfileSkills = (user) => {
  const directSkills = Array.isArray(user?.skills) ? user.skills : [];
  const skillNames = Array.isArray(user?.skillNames) ? user.skillNames : [];
  const technicalSkills = Array.isArray(user?.technicalSkills) ? user.technicalSkills : [];

  return directSkills.length > 0 || skillNames.length > 0 || technicalSkills.length > 0;
};

// Check if the currently uploaded CV's parsed analysis is usable for the
// upload response feedback (parseStatus).  NOT used for recommendations.
const hasCurrentCvAnalysis = (user) => {
  if (!user?.cv || !user?.resumeAnalysis) return false;
  const analysis = user.resumeAnalysis;
  if (analysis.cvId && user.cvPublicId && analysis.cvId !== user.cvPublicId) return false;
  const hasSkills =
    (Array.isArray(analysis.skillNames) && analysis.skillNames.length > 0) ||
    (Array.isArray(analysis.skills) && analysis.skills.length > 0);
  const hasTitle = Boolean(typeof analysis.professionalTitle === 'string' && analysis.professionalTitle.trim());
  return Boolean(hasSkills || hasTitle || analysis.experienceYears != null);
};

// True when the user's profile OR Resume Builder document has enough
// fields to produce meaningful recommendations.  Only the fields
// that the matching engine actually reads are considered:
//   technicalSkills / skillNames / skills, experience, education, title.
const hasProfileOrResumeData = (user) => {
  if (!user) return false;
  const hasSkills =
    (Array.isArray(user.technicalSkills) && user.technicalSkills.length > 0) ||
    (Array.isArray(user.skillNames) && user.skillNames.length > 0) ||
    (Array.isArray(user.skills) && user.skills.length > 0);
  const hasExperience =
    user.experienceYears != null ||
    (Array.isArray(user.experienceDetails) && user.experienceDetails.length > 0) ||
    Boolean(user.experience);
  const hasEducation =
    (Array.isArray(user.educationDetails) && user.educationDetails.length > 0) ||
    (Array.isArray(user.education) && user.education.length > 0);
  const hasTitle = Boolean(
    typeof user.headline === 'string' && user.headline.trim()
  ) || Boolean(
    typeof user.currentRole === 'string' && user.currentRole.trim()
  );
  return Boolean(hasSkills || hasExperience || hasEducation || hasTitle);
};

// Build a matching profile from the user's profile fields and Resume Builder
// data combined.  Resume Builder data overlays onto profile fields (Resume
// Builder skills are added to profile skills, Resume Builder title fills in
// missing headline, etc.).
//
// Sources used: Profile fields + Resume Builder document.
// Explicitly excluded: uploaded CV / resumeAnalysis, localStorage,
// stale parsed data, bio, preferences unrelated to matching.
const buildCombinedResumeProfile = (user, resumeDoc) => {
  // Start with profile fields.
  const technicalSkills = [
    ...(Array.isArray(user.technicalSkills) ? user.technicalSkills : []),
  ];
  const soft = Array.isArray(user.softSkills) ? user.softSkills : [];
  const profileSkillNames = [
    ...(Array.isArray(user.skillNames) ? user.skillNames : []),
  ];

  // Overlay Resume Builder skills.
  if (resumeDoc) {
    if (Array.isArray(resumeDoc.skills)) {
      resumeDoc.skills.forEach((s) => {
        const name = typeof s === 'object' ? s.name || s.title || s.label : String(s);
        if (name) {
          technicalSkills.push(String(name));
          profileSkillNames.push(String(name));
        }
      });
    }
    if (Array.isArray(resumeDoc.softSkills)) {
      resumeDoc.softSkills.forEach((s) => {
        const name = typeof s === 'object' ? s.name || s.title || s.label : String(s);
        if (name) soft.push(String(name));
      });
    }
  }

  // Deduplicate skills.
  const uniqueTech = [...new Set(technicalSkills)];
  const uniqueSkillNames = [...new Set(profileSkillNames)];
  const uniqueSoft = [...new Set(soft)];

  // Education: profile first, then overlay Resume Builder if profile is empty.
  let education = Array.isArray(user.educationDetails)
    ? user.educationDetails.map((e) => ({
        degree: typeof e === 'object' ? e.degree || '' : String(e),
        institution: typeof e === 'object' ? e.institution || '' : '',
      }))
    : Array.isArray(user.education)
      ? user.education.map((e) => ({ degree: String(e), institution: '' }))
      : [];

  if (education.length === 0 && resumeDoc && Array.isArray(resumeDoc.education) && resumeDoc.education.length > 0) {
    education = resumeDoc.education.map((e) => ({
      degree: e.degree || e.qualification || e.certificate || e.field || '',
      institution: e.institution || e.school || e.university || e.schoolName || '',
    }));
  }

  // Certifications: profile first, then overlay Resume Builder if profile is empty.
  let certifications = Array.isArray(user.certificates)
    ? user.certificates.map((c) => ({ name: typeof c === 'object' ? c.name || '' : String(c) }))
    : [];

  if (certifications.length === 0 && resumeDoc && Array.isArray(resumeDoc.certifications) && resumeDoc.certifications.length > 0) {
    certifications = resumeDoc.certifications.map((c) => ({
      name: typeof c === 'object' ? c.name || c.title || '' : String(c),
    }));
  }

  // Experience years: profile first, then Resume Builder.
  let experienceYears = user.experienceYears ?? null;
  if (experienceYears == null && resumeDoc && Array.isArray(resumeDoc.experience) && resumeDoc.experience.length > 0) {
    experienceYears = resumeDoc.experience.length;
  }

  // Title: profile first, then Resume Builder.
  const headline = user.headline || user.currentRole || '';
  const resumeTitle = resumeDoc?.profile?.title || resumeDoc?.profile?.headline || resumeDoc?.profile?.jobTitle || '';
  const title = headline || resumeTitle;

  // Location: profile only (Resume Builder does not store location).
  const location = user.location || null;

  return {
    _id: user?._id,
    __combinedProfile: true,
    technicalSkills: uniqueTech,
    skills: Array.isArray(user.skills) ? user.skills : [],
    skillNames: uniqueSkillNames,
    softSkills: uniqueSoft,
    experienceYears,
    experienceDetails: Array.isArray(user.experienceDetails) ? user.experienceDetails : [],
    experience: typeof user.experience === 'string' ? user.experience : '',
    educationDetails: education,
    education: Array.isArray(user.education) ? user.education : [],
    certificates: certifications,
    headline: title,
    currentRole: title,
    bio: '',
    location,
    jobPreferences: {},
    careerInterests: [],
  };
};

// Determine the recommendation source and build the appropriate matching
// profile.  Source priority:
//   1. 'profile' — user has Resume Builder data and/or profile fields
//   2. 'none'    — no usable data exists
//
// Uploaded CV / resumeAnalysis is NEVER used for recommendations.
// Only the CURRENT DEFAULT Resume Builder resume is used.
const getRecommendationSourceAndProfile = async (user) => {
  if (!user) return { source: 'none', profile: null };

  // Load the user's default Resume Builder document.
  // If no default exists but resumes are present, pick the most recently
  // updated one and persist it as the default (lazy initialisation).
  let resumeDoc = await Resume.findOne({ user: user._id, isDefault: true }).lean();

  if (!resumeDoc) {
    // No default flagged — pick the most recently updated resume.
    const latest = await Resume.findOne({ user: user._id }).sort({ updatedAt: -1 }).lean();
    if (latest) {
      // Persist as default (best-effort — ignore errors).
      await Resume.updateMany({ user: user._id, isDefault: true }, { $set: { isDefault: false } });
      await Resume.updateOne({ _id: latest._id }, { $set: { isDefault: true } });
      resumeDoc = { ...latest, isDefault: true };
    }
  }

  // Check if profile + Resume Builder combined have enough data.
  const combinedProfile = buildCombinedResumeProfile(user, resumeDoc);
  const hasData = hasProfileOrResumeData(combinedProfile);

  if (hasData) {
    return { source: 'profile', profile: combinedProfile };
  }

  return { source: 'none', profile: null };
};

// Overlay a Resume Builder CV onto a plain copy of the user profile so the
// matching engine can score against the CV content (skills, experience,
// education, title) even when the profile fields themselves are empty.
const enrichUserFromResume = (user, resume) => {
  if (!resume) return user;
  const merged = { ...(typeof user.toObject === 'function' ? user.toObject() : user) };

  const profile = resume.profile || {};
  const title = profile.title || profile.headline || profile.jobTitle || null;
  if (title) {
    if (!merged.headline) merged.headline = title;
    if (!merged.currentRole) merged.currentRole = title;
  }

  const summary = resume.summary || {};
  if (!merged.bio && summary) {
    const text = typeof summary === 'string' ? summary : summary.text || summary.summary;
    if (text) merged.bio = text;
  }

  const skillNames = new Set(Array.isArray(merged.skillNames) ? merged.skillNames : []);
  const collectSkill = (s) => {
    if (!s) return;
    const name = typeof s === 'object' ? s.name || s.title || s.label : String(s);
    if (name) skillNames.add(String(name));
  };
  if (Array.isArray(resume.skills)) resume.skills.forEach(collectSkill);
  if (Array.isArray(resume.softSkills)) resume.softSkills.forEach(collectSkill);
  if (skillNames.size > 0) merged.skillNames = Array.from(skillNames);

  // Keep the categorized skill lists separate so the matching engine can use
  // technical skills without treating resume soft skills as technical ones.
  if (Array.isArray(resume.skills) && resume.skills.length > 0) {
    const tech = new Set(Array.isArray(merged.technicalSkills) ? merged.technicalSkills : []);
    resume.skills.forEach((s) => {
      const name = typeof s === 'object' ? s.name || s.title || s.label : String(s);
      if (name) tech.add(String(name));
    });
    merged.technicalSkills = Array.from(tech);
  }
  if (Array.isArray(resume.softSkills) && resume.softSkills.length > 0) {
    const soft = new Set(Array.isArray(merged.softSkills) ? merged.softSkills : []);
    resume.softSkills.forEach((s) => {
      const name = typeof s === 'object' ? s.name || s.title || s.label : String(s);
      if (name) soft.add(String(name));
    });
    merged.softSkills = Array.from(soft);
  }

  if (merged.experienceYears == null && Array.isArray(resume.experience) && resume.experience.length > 0) {
    merged.experienceYears = resume.experience.length;
  }

  if ((!Array.isArray(merged.educationDetails) || merged.educationDetails.length === 0) && Array.isArray(resume.education) && resume.education.length > 0) {
    merged.educationDetails = resume.education.map((e) => ({
      degree: e.degree || e.qualification || e.certificate || e.field || '',
      institution: e.institution || e.school || e.university || e.schoolName || '',
    }));
  }

  if ((!Array.isArray(merged.languages) || merged.languages.length === 0) && Array.isArray(resume.languages) && resume.languages.length > 0) {
    merged.languages = resume.languages.map((l) => (typeof l === 'object' && l.name ? { name: l.name, level: l.level || 'Native' } : { name: String(l), level: 'Native' }));
  }

  if (Array.isArray(resume.certifications) && resume.certifications.length > 0 && (!Array.isArray(merged.certificates) || merged.certificates.length === 0)) {
    merged.certificates = resume.certifications.map((c) => (typeof c === 'object' ? c.name || c.title || String(c) : String(c)));
  }

  return merged;
};

// Load the exact user profile object the matching engine scores against,
// identical to the one used for job seeker recommendations (raw profile plus
// the current default Resume Builder CV).  Sharing this single source
// guarantees the employer-side applicant match score is the same percentage
// the candidate sees for the same job and CV.
const buildJobSeekerMatchingContext = async (userId) => {
  const user = await User.findById(userId).select('-password');

  // Use the default Resume Builder resume.  Lazy-init if needed.
  let resumeDoc = await Resume.findOne({ user: userId, isDefault: true }).lean();
  if (!resumeDoc) {
    const latest = await Resume.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
    if (latest) {
      await Resume.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
      await Resume.updateOne({ _id: latest._id }, { $set: { isDefault: true } });
      resumeDoc = { ...latest, isDefault: true };
    }
  }

  return { user, resumeDoc, profileForMatching: enrichUserFromResume(user, resumeDoc) };
};

module.exports = {
  hasProfileSkills,
  hasCurrentCvAnalysis,
  hasProfileOrResumeData,
  buildCombinedResumeProfile,
  getRecommendationSourceAndProfile,
  enrichUserFromResume,
  buildJobSeekerMatchingContext,
};
