import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiFileText, FiAward, FiUsers, FiTarget, FiArrowRight } from 'react-icons/fi';

const CareerGuide = () => {
  const { t } = useTranslation();

  const guides = [
    {
      title: t('careerGuide.standoutCV'),
      description: t('careerGuide.standoutCVDesc'),
      icon: FiFileText,
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400',
      tips: [
        'Keep it to one page if you are a fresh graduate.',
        'Use action verbs (e.g., Developed, Managed, Coordinated).',
        'List academic projects if you lack work experience.'
      ]
    },
    {
      title: t('careerGuide.employability'),
      description: t('careerGuide.employabilityDesc'),
      icon: FiBookOpen,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400',
      tips: [
        'Module 1: Workplace Communication Essentials',
        'Module 2: Professional Ethics & Integrity',
        'Module 3: Problem Solving and Critical Thinking'
      ]
    },
    {
      title: t('careerGuide.campus'),
      description: t('careerGuide.campusDesc'),
      icon: FiUsers,
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400',
      tips: [
        'Partners: Addis Ababa University, Bahir Dar University, Hawassa University.',
        'On-the-spot interviews for top-performing students.',
        'Direct connection to primary corporate partners.'
      ]
    },
    {
      title: t('careerGuide.interview'),
      description: t('careerGuide.interviewDesc'),
      icon: FiAward,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
      tips: [
        'Use the STAR method (Situation, Task, Action, Result) for questions.',
        'Research the employer and prepare 2 questions to ask them.',
        'Dress professionally and check your tech setup for remote calls.'
      ]
    }
  ];

  return (
    <div className="section container-custom pb-20">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
        <span className="text-teal-600 dark:text-teal-400 font-extrabold text-xs uppercase tracking-wider bg-teal-50 dark:bg-teal-950/30 px-3 py-1.5 rounded-full">
          {t('careerGuide.heroBadge')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-black mt-4 text-gray-900 dark:text-white leading-tight">
          {t('careerGuide.heroTitle')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
          {t('careerGuide.heroSubtitle')}
        </p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {guides.map((guide, idx) => {
          const Icon = guide.icon;
          return (
            <div key={idx} className="card p-8 border border-gray-100 hover:border-teal-200 transition-all duration-300 flex flex-col justify-between hover:shadow-md animate-slide-up">
              <div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${guide.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{guide.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">{guide.description}</p>
                
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <FiTarget className="text-teal-500" /> {t('careerGuide.insights')}
                </h4>
                <ul className="space-y-2">
                  {guide.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-teal-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 border-t dark:border-gray-700 mt-8 flex justify-end">
                <button className="text-teal-600 dark:text-teal-400 text-sm font-bold flex items-center gap-1 group hover:underline">
                  {t('careerGuide.learnMore')} <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CareerGuide;
