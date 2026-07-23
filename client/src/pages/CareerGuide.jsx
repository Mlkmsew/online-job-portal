import { FiBookOpen, FiFileText, FiAward, FiUsers, FiTarget, FiArrowRight } from 'react-icons/fi';

const CareerGuide = () => {
  const guides = [
    {
      title: 'Crafting a Standout CV',
      description: 'Learn how to highlight your academic projects, internships, and key skills to pass applicant tracking systems (ATS).',
      icon: FiFileText,
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400',
      tips: [
        'Keep it to one page if you are a fresh graduate.',
        'Use action verbs (e.g., Developed, Managed, Coordinated).',
        'List academic projects if you lack work experience.'
      ]
    },
    {
      title: 'Employability Skills Training',
      description: 'Unlock career readiness modules designed in partnership with industry experts to bridge the transition from university to workplace.',
      icon: FiBookOpen,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400',
      tips: [
        'Module 1: Workplace Communication Essentials',
        'Module 2: Professional Ethics & Integrity',
        'Module 3: Problem Solving and Critical Thinking'
      ]
    },
    {
      title: 'Direct Campus Partnerships',
      description: 'EthioJob partners directly with leading Ethiopian universities to host direct recruiting campaigns and job fairs on campus.',
      icon: FiUsers,
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400',
      tips: [
        'Partners: Addis Ababa University, Bahir Dar University, Hawassa University.',
        'On-the-spot interviews for top-performing students.',
        'Direct connection to primary corporate partners.'
      ]
    },
    {
      title: 'Acing Your First Interview',
      description: 'Preparation is key. Standard questions, body language cues, and how to follow up post-interview.',
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
          Value-Added Services
        </span>
        <h1 className="text-4xl sm:text-5xl font-black mt-4 text-gray-900 dark:text-white leading-tight">
          Accelerate Your Career with <span className="text-teal-600">OnlineJob Guides</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
          We go beyond simply listing jobs. OnlineJob provides resources, guidance, and partnerships to help fresh graduates and tech professionals land their dream roles.
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
                  <FiTarget className="text-teal-500" /> Key Insights & Steps
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
                  Learn More <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct recruiting CTA */}
      <div className="bg-gradient-to-r from-teal-500 to-indigo-600 rounded-3xl p-10 text-white mt-16 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 animate-fade-in">
        <div className="relative z-10 max-w-xl">
          <h3 className="text-3xl font-black mb-2">Are you a University Partner?</h3>
          <p className="text-white/80 text-sm leading-relaxed">
            Collaborate with EthioJob to recruit students directly, set up campus-exclusive interviews, and bring professional career training modules directly to your graduating class.
          </p>
        </div>
        <button className="bg-white text-teal-600 hover:bg-teal-50 transition font-bold py-3 px-8 rounded-xl shrink-0 text-sm relative z-10 shadow-lg">
          Partner With Us
        </button>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default CareerGuide;
