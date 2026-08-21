import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiActivity, FiBookOpen, FiShield, FiSearch, FiArrowRight, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';

const SkillAssessment = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [showResults, setShowResults] = useState(true);

  const userSkills = useMemo(() => {
    const rawSkills = [
      ...(Array.isArray(user?.skills) ? user.skills : []),
      ...(Array.isArray(user?.resumeAnalysis?.skills) ? user.resumeAnalysis.skills : []),
    ];
    return Array.from(new Set(rawSkills
      .map((skill) => (typeof skill === 'string' ? skill : skill?.name || ''))
      .filter(Boolean)
      .slice(0, 12)));
  }, [user]);

  const assessmentScore = useMemo(() => {
    const base = 50;
    const bonus = Math.min(40, userSkills.length * 4);
    return base + bonus;
  }, [userSkills]);

  const readinessLabel = assessmentScore >= 80
    ? t('skillAssessment.readinessCareerReady', { defaultValue: 'Career-ready' })
    : assessmentScore >= 65
    ? t('skillAssessment.readinessStrongMatch', { defaultValue: 'Strong match' })
    : t('skillAssessment.readinessImprove', { defaultValue: 'Opportunity to improve' });

  const recommendedSkills = useMemo(() => {
    const popular = ['Project Management', 'Data Analysis', 'Communication', 'Team Collaboration', 'Leadership'];
    return popular.filter((skill) => !userSkills.includes(skill)).slice(0, 4);
  }, [userSkills]);

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('skillAssessment.title', { defaultValue: 'Skill Assessment' })}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            {t('skillAssessment.subtitle', { defaultValue: 'Discover your strengths, identify focus areas, and take action with practical recommendations tailored to your profile.' })}
          </p>
        </div>
        <Link
          to="/dashboard/find-jobs"
          className="inline-flex items-center gap-2 rounded-full bg-[#1769E0] text-white px-5 py-3 font-semibold shadow-lg hover:bg-[#0D5BC4] transition"
        >
          <FiSearch className="w-4 h-4" /> {t('skillAssessment.searchJobs', { defaultValue: 'Search Jobs' })}
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.75fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{t('skillAssessment.skillScore', { defaultValue: 'Skill score' })}</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{assessmentScore}%</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{readinessLabel}. {t('skillAssessment.keepBuilding', { defaultValue: 'Keep building skills that matter for your next role.' })}</p>
              </div>
              <div className="rounded-3xl bg-blue-50 p-5 text-center">
                <p className="text-sm text-gray-500">{t('skillAssessment.coreStrengths', { defaultValue: 'Core strengths' })}</p>
                <p className="mt-3 text-4xl font-black text-blue-700">{userSkills.length}</p>
                <p className="text-sm text-gray-500">{t('skillAssessment.skillsIdentified', { defaultValue: 'skills identified' })}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5 bg-slate-50 dark:bg-gray-900">
                <p className="text-sm text-gray-500">{t('skillAssessment.recommendedImprovement', { defaultValue: 'Recommended improvement' })}</p>
                <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{t('skillAssessment.interviewReadiness', { defaultValue: 'Strengthen your interview readiness' })}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5 bg-slate-50 dark:bg-gray-900">
                <p className="text-sm text-gray-500">{t('skillAssessment.nextHiringPriority', { defaultValue: 'Next hiring priority' })}</p>
                <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{t('skillAssessment.showcaseAchievements', { defaultValue: 'Showcase measurable achievements' })}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowResults(!showResults)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1769E0] px-5 py-3 text-white font-semibold hover:bg-[#0D5BC4] transition"
            >
              {showResults ? t('skillAssessment.refreshResults', { defaultValue: 'Refresh results' }) : t('skillAssessment.beginAssessment', { defaultValue: 'Begin assessment' })} <FiArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('skillAssessment.topSkills', { defaultValue: 'Top skills' })}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('skillAssessment.topSkillsDesc', { defaultValue: 'Skills discovered from your profile.' })}</p>
                </div>
                <FiCheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                {userSkills.length > 0 ? (
                  userSkills.map((skill) => (
                    <div key={skill} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-gray-900 dark:text-slate-300">
                      {skill}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('skillAssessment.noSkills', { defaultValue: 'No skills found yet. Add your relevant experience in your profile to get more accurate recommendations.' })}</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('skillAssessment.nextSkills', { defaultValue: 'Next skills' })}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('skillAssessment.nextSkillsDesc', { defaultValue: 'Suggested skills to improve your match.' })}</p>
                </div>
                <FiTrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                {recommendedSkills.map((skill) => (
                  <div key={skill} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-gray-900 dark:text-slate-300">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showResults && (
            <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('skillAssessment.summaryTitle', { defaultValue: 'Assessment summary' })}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('skillAssessment.summaryDesc', { defaultValue: 'Review your current readiness and plan your next actions.' })}</p>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
                >
                  {t('skillAssessment.hideDetails', { defaultValue: 'Hide details' })}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: t('skillAssessment.resumeQuality', { defaultValue: 'Resume Quality' }), score: 86, description: t('skillAssessment.resumeQualityDesc', { defaultValue: 'Clear structure and effective presentation.' }) },
                  { label: t('skillAssessment.skillMatch', { defaultValue: 'Skill Match' }), score: assessmentScore, description: t('skillAssessment.skillMatchDesc', { defaultValue: 'Close alignment with roles in your target career path.' }) },
                  { label: t('skillAssessment.interviewReadinessLabel', { defaultValue: 'Interview Readiness' }), score: 72, description: t('skillAssessment.interviewReadinessDesc', { defaultValue: 'Good foundation—try adding more measurable achievements.' }) },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5 bg-slate-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-lg font-black text-blue-600">{item.score}%</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-blue-50 text-blue-700 p-3">
                <FiBookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{t('skillAssessment.profileFocus', { defaultValue: 'Profile focus' })}</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('skillAssessment.updateProfile', { defaultValue: 'Update your profile' })}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('skillAssessment.updateProfileDesc', { defaultValue: 'Add recent projects and measurable results to increase your score and match quality.' })}</p>
            <Link to="/dashboard/profile" className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1769E0] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D5BC4]">
              {t('skillAssessment.improveProfile', { defaultValue: 'Improve profile' })}
            </Link>
          </div>

          <div className="rounded-3xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-blue-50 text-blue-700 p-3">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{t('skillAssessment.careerActions', { defaultValue: 'Career actions' })}</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('skillAssessment.applyWithConfidence', { defaultValue: 'Apply with confidence' })}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('skillAssessment.applyWithConfidenceDesc', { defaultValue: 'Use your strongest skills to target roles and keep your application messages concise and compelling.' })}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SkillAssessment;
