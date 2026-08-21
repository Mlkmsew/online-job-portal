const User = require('../models/user');
const Resume = require('../models/Resume');

const hasProfileSkills = (user) => {
  const directSkills = Array.isArray(user?.skills) ? user.skills : [];
  const skillNames = Array.isArray(user?.skillNames) ? user.skillNames : [];
  const resumeSkills = Array.isArray(user?.resumeAnalysis?.skills) ? user.resumeAnalysis.skills : [];

  return directSkills.length > 0 || skillNames.length > 0 || resumeSkills.length > 0;
};

// True when the user has parsed CV data (created by the CV upload pipeline),
// i.e. a CV was uploaded at some point even if the file reference is gone.
const hasProfileCVData = (user) => {
  const analysis = user?.resumeAnalysis;
  if (!analysis) return false;
  const hasSkills = Array.isArray(analysis.skills) && analysis.skills.length > 0;
  const hasExperience = analysis.experienceYears != null;
  const hasEducation = Array.isArray(analysis.education) && analysis.education.length > 0;
  const hasTitle = Boolean(analysis.professionalTitle);
  return Boolean(hasSkills || hasExperience || hasEducation || hasTitle);
};

// Recommendations unlock once the job seeker has an uploaded CV, a Resume
// Builder CV, or parsed CV data on their profile.
const canRecommendJobs = (user, hasResumeCV) => {
  if (!user) return false;
  return Boolean(user.cv) || Boolean(hasResumeCV) || hasProfileCVData(user);
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
// the latest Resume Builder CV). Sharing this single source guarantees the
// employer-side applicant match score is the same percentage the candidate
// sees for the same job and CV.
const buildJobSeekerMatchingContext = async (userId) => {
  const user = await User.findById(userId).select('-password');
  const resumeDoc = await Resume.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
  return { user, resumeDoc, profileForMatching: enrichUserFromResume(user, resumeDoc) };
};

module.exports = { canRecommendJobs, hasProfileSkills, hasProfileCVData, enrichUserFromResume, buildJobSeekerMatchingContext };