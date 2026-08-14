const hasProfileSkills = (user) => {
  const directSkills = Array.isArray(user?.skills) ? user.skills : [];
  const skillNames = Array.isArray(user?.skillNames) ? user.skillNames : [];
  const resumeSkills = Array.isArray(user?.resumeAnalysis?.skills) ? user.resumeAnalysis.skills : [];

  return directSkills.length > 0 || skillNames.length > 0 || resumeSkills.length > 0;
};

const canRecommendJobs = (user) => {
  if (!user) return false;
  // Job recommendations are only generated once the job seeker has uploaded a CV.
  return Boolean(user.cv);
};

module.exports = { canRecommendJobs, hasProfileSkills };
