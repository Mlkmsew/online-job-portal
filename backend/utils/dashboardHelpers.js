const hasProfileSkills = (user) => {
  const directSkills = Array.isArray(user?.skills) ? user.skills : [];
  const skillNames = Array.isArray(user?.skillNames) ? user.skillNames : [];
  const resumeSkills = Array.isArray(user?.resumeAnalysis?.skills) ? user.resumeAnalysis.skills : [];

  return directSkills.length > 0 || skillNames.length > 0 || resumeSkills.length > 0;
};

const canRecommendJobs = (user) => {
  if (!user) return false;
  const hasResume = Boolean(user?.cv || (Array.isArray(user?.resumeAnalysis?.skills) && user.resumeAnalysis.skills.length > 0));
  const hasDetails = Boolean(user?.headline || user?.bio || (Array.isArray(user?.educationDetails) && user.educationDetails.length > 0));
  return hasResume || hasProfileSkills(user) || hasDetails;
};

module.exports = { canRecommendJobs, hasProfileSkills };
