const hasProfileSkills = (user) => {
  const directSkills = Array.isArray(user?.skills) ? user.skills : [];
  const resumeSkills = Array.isArray(user?.resumeAnalysis?.skills) ? user.resumeAnalysis.skills : [];

  return directSkills.length > 0 || resumeSkills.length > 0;
};

const canRecommendJobs = (user) => {
  const hasResume = Boolean(user?.cv || (Array.isArray(user?.resumeAnalysis?.skills) && user.resumeAnalysis.skills.length > 0));
  return hasResume || hasProfileSkills(user);
};

module.exports = { canRecommendJobs, hasProfileSkills };
