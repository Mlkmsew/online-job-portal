const fs = require('fs');

const interviewTranslations = {
  en: {
    interviews: {
      dashboardTitle: "Employer Interview Dashboard",
      pipeline: "Interview pipeline",
      pipelineSubtitle: "Coordinate interviews, track outcomes, and keep every candidate conversation moving with a modern ATS experience.",
      scheduleNew: "Schedule New Interview",
      upcoming: "Upcoming Interviews",
      scheduledInPipeline: "Scheduled in the pipeline",
      today: "Today's Interviews",
      onCalendarToday: "On the calendar today",
      completed: "Completed Interviews",
      closedSuccessfully: "Closed successfully",
      cancelled: "Cancelled Interviews",
      needsFollowUp: "Needs follow-up",
      searchPlaceholder: "Search candidate, email, or job title",
      calendarView: "Calendar view",
      hideCalendar: "Hide calendar",
      newInterview: "New Interview",
      all: "All",
      interviewsShown: "{{count}} interviews shown",
      allDates: "All Dates",
      todayFilter: "Today",
      tomorrowFilter: "Tomorrow",
      thisWeekFilter: "This Week",
      thisMonthFilter: "This Month",
      noInterviews: "No interviews match this view yet.",
      loadingPipeline: "Loading interviews from the recruitment pipeline...",
      reschedule: "Reschedule",
      reminder: "Reminder",
      startInterview: "Start Interview",
      evaluate: "Evaluate",
      evaluationSummary: "Evaluation Summary",
      inPerson: "In Person",
      online: "Online",
      phone: "Phone",
      pending: "Pending",
      hired: "Hired",
      passed: "Passed",
      rejected: "Rejected",
      pendingEvaluation: "Pending Evaluation",
      overdue: "Overdue",
      startingSoon: "Starting soon",
      laterToday: "Later today",
      future: "Future"
    }
  },
  am: {
    interviews: {
      dashboardTitle: "የአሰሪ የቃለ መጠይቅ ዳሽቦርድ",
      pipeline: "የቃለ መጠይቅ ሂደት",
      pipelineSubtitle: "ቃለ መጠይቆችን ያቀናጁ፣ ውጤቶችን ይከታተሉ እና የእጩዎችን ውይይት በዘመናዊ የቅጥር ስርዓት ያሳልፉ።",
      scheduleNew: "አዲስ ቃለ መጠይቅ ያስይዙ",
      upcoming: "መጪ ቃለ መጠይቆች",
      scheduledInPipeline: "በሂደት ላይ የተያዙ",
      today: "የዛሬ ቃለ መጠይቆች",
      onCalendarToday: "ዛሬ በቀን መቁጠሪያ ላይ",
      completed: "የተጠናቀቁ ቃለ መጠይቆች",
      closedSuccessfully: "በስኬት የተጠናቀቁ",
      cancelled: "የተሰረዙ ቃለ መጠይቆች",
      needsFollowUp: "ክትትል የሚፈልጉ",
      searchPlaceholder: "እጩ፣ ኢሜይል ወይም የስራ ርዕስ ይፈልጉ",
      calendarView: "የቀን መቁጠሪያ እይታ",
      hideCalendar: "ቀን መቁጠሪያ ደብቅ",
      newInterview: "አዲስ ቃለ መጠይቅ",
      all: "ሁሉም",
      interviewsShown: "{{count}} ቃለ መጠይቆች ተሳይተዋል",
      allDates: "ሁሉም ቀናት",
      todayFilter: "ዛሬ",
      tomorrowFilter: "ነገ",
      thisWeekFilter: "በዚህ ሳምንት",
      thisMonthFilter: "በዚህ ወር",
      noInterviews: "እስካሁን ከዚህ እይታ ጋር የሚስማሙ ቃለ መጠይቆች የሉም።",
      loadingPipeline: "የቃለ መጠይቅ መረጃዎች በመጫን ላይ...",
      reschedule: "ቀን ቀይር",
      reminder: "ማስታወሻ ላክ",
      startInterview: "ቃለ መጠይቅ ጀምር",
      evaluate: "ገምግም",
      evaluationSummary: "የግምገማ ማጠቃለያ",
      inPerson: "በአካል",
      online: "ኦንላይን",
      phone: "በስልክ",
      pending: "በመጠባበቅ ላይ",
      hired: "የተቀጠረ",
      passed: "ያለፈ",
      rejected: "ውድቅ የተደረገ",
      pendingEvaluation: "ግምገማ የሚጠብቅ",
      overdue: "ጊዜው ያለፈበት",
      startingSoon: "በቅርብ የሚጀምር",
      laterToday: "ዛሬ ቆየት ብሎ",
      future: "ወደፊት"
    }
  },
  om: {
    interviews: {
      dashboardTitle: "Daashboordii Gaaffii fi Deebii Qacaraa",
      pipeline: "Adeemsa Gaaffii fi Deebii",
      pipelineSubtitle: "Gaaffii fi deebii qindeessaa, bu'aawwan hordofaa, fi haasaa kaadhimamtootaa sirna haaraan geessaa.",
      scheduleNew: "Gaaffii fi Deebii Haaraa Qabsiisi",
      upcoming: "Gaaffii fi Deebii Dhufan",
      scheduledInPipeline: "Adeemsa keessatti qabaman",
      today: "Gaaffii fi Deebii Har'aa",
      onCalendarToday: "Har'a dhaha irratti",
      completed: "Gaaffii fi Deebii Xumuraman",
      closedSuccessfully: "Milkaa'inaan xumuraman",
      cancelled: "Gaaffii fi Deebii Haqaman",
      needsFollowUp: "Hordoffii barbaada",
      searchPlaceholder: "Kaadhimamaa, email ykn mataduree hojii barbaadi",
      calendarView: "Agarsiisa Dhahaa",
      hideCalendar: "Dhahaa dhoksi",
      newInterview: "Gaaffii fi Deebii Haaraa",
      all: "Hunda",
      interviewsShown: "Gaaffii fi deebii {{count}} agarsiifaman",
      allDates: "Guyyoota Hunda",
      todayFilter: "Har'a",
      tomorrowFilter: "Baanqa",
      thisWeekFilter: "Torban Kana",
      thisMonthFilter: "Ji'a Kana",
      noInterviews: "Gaaffii fi deebiin agarsiisa kanaan walsimatu ammaaf hin jiru.",
      loadingPipeline: "Odeeffannoon gaaffii fi deebii fe'amaa jira...",
      reschedule: "Guyyaa Jijjiiri",
      reminder: "Yaadachiisa Ergi",
      startInterview: "Gaaffii fi Deebii Jalqabi",
      evaluate: "Madaali",
      evaluationSummary: "Gabaasa Madaallii",
      inPerson: "Qaamaan",
      online: "Inteerneetiin",
      phone: "Bilbilaan",
      pending: "Eeggannoorra",
      hired: "Qacarame",
      passed: "Darbee",
      rejected: "Kufaadhaan",
      pendingEvaluation: "Madaallii Eeggata",
      overdue: "Yeroon Darbe",
      startingSoon: "Dhiyootti Jalqaba",
      laterToday: "Har'a Turaa",
      future: "Gara Fuulduraa"
    }
  }
};

['en', 'am', 'om'].forEach((lang) => {
  const filePath = `client/src/i18n/locales/${lang}.json`;
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!fileData.interviews) {
    fileData.interviews = {};
  }

  Object.assign(fileData.interviews, interviewTranslations[lang].interviews);

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
  console.log(`Updated interviews translations in ${filePath}`);
});