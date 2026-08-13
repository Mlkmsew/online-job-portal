const fs = require('fs');

const employerDashboardKeys = {
  en: {
    headerSubtitle: "Here is what's happening with your hiring portal today.",
    jobsPosted: "Jobs Posted",
    active: "{{count}} active position",
    active_other: "{{count}} active positions",
    totalApplicants: "Total Applicants",
    newThisWeek: "+12% this week",
    activeJobs: "Active Jobs",
    liveRoles: "{{count}} live hiring role",
    liveRoles_other: "{{count}} live hiring roles",
    scheduled: "{{count}} interview set",
    scheduled_other: "{{count}} interviews set",
    hiredCandidates: "Hired Candidates",
    filled: "{{count}} role filled",
    filled_other: "{{count}} roles filled",
    companyOverview: "Company Overview",
    editProfile: "Edit Profile",
    applicantFunnel: "Applicant Funnel",
    liveData: "Live Data",
    analytics: {
      newApplications: "New Applications",
      underReview: "Under Review",
      interview: "Interview",
      hired: "Hired"
    },
    location: "Location",
    companySize: "Company Size",
    memberSince: "Member Since",
    profileCompletion: "Profile Completion"
  },
  am: {
    headerSubtitle: "ዛሬ በአሰሪነት ዳሽቦርድዎ ላይ ያሉ ወቅታዊ መረጃዎች እዚህ አሉ።",
    jobsPosted: "የወጡ ስራዎች",
    active: "{{count}} ንቁ የስራ መደብ",
    active_other: "{{count}} ንቁ የስራ መደቦች",
    totalApplicants: "ጠቅላላ አመልካቾች",
    newThisWeek: "በዚህ ሳምንት አዲስ",
    activeJobs: "ንቁ ስራዎች",
    liveRoles: "{{count}} ክፍት የስራ መደብ",
    liveRoles_other: "{{count}} ክፍት የስራ መደቦች",
    scheduled: "{{count}} ቃለ መጠይቅ የተያዘ",
    scheduled_other: "{{count}} ቃለ መጠይቆች የተያዙ",
    hiredCandidates: "የተቀጠሩ አመልካቾች",
    filled: "{{count}} መደብ ተሞልቷል",
    filled_other: "{{count}} መደቦች ተሞልተዋል",
    companyOverview: "የድርጅቱ መግለጫ",
    editProfile: "መገለጫ አርትዕ",
    applicantFunnel: "የአመልካቾች ሁኔታ",
    liveData: "ቀጥታ መረጃ",
    analytics: {
      newApplications: "አዲስ ማመልከቻዎች",
      underReview: "በግምገማ ላይ",
      interview: "ቃለ መጠይቅ",
      hired: "የተቀጠሩ"
    },
    location: "አድራሻ/ቦታ",
    companySize: "የድርጅቱ መጠን",
    memberSince: "አባል የሆኑበት ቀን",
    profileCompletion: "የመገለጫ ማጠናቀቂያ"
  },
  om: {
    headerSubtitle: "Har'a daashboordii qacaraa keessan irratti odeeffannoo jiru kunoo.",
    jobsPosted: "Hojiiwwan Maxxanfaman",
    active: "{{count}} hojii hojiirra jiru",
    active_other: "{{count}} hojiiwwan hojiirra jiran",
    totalApplicants: "Waliigala Iyyaaltootaa",
    newThisWeek: "Torban kana haaraa",
    activeJobs: "Hojiiwwan Hojiirra Jiran",
    liveRoles: "{{count}} banamaa jiru",
    liveRoles_other: "{{count}} banamaa jiran",
    scheduled: "{{count}} gaaffii fi deebii",
    scheduled_other: "{{count}} gaaffii fi deebiiwwan",
    hiredCandidates: "Iyyaaltoota Qacaraman",
    filled: "{{count}} guutame",
    filled_other: "{{count}} guutaman",
    companyOverview: "Ibsa Dhaabbataa",
    editProfile: "Gulaali",
    applicantFunnel: "Adeemsa Iyyaaltootaa",
    liveData: "Odeeffannoo Kallattiin",
    analytics: {
      newApplications: "Iyyannoo Haaraa",
      underReview: "Qorannoo Irratti",
      interview: "Gaaffii fi Deebii",
      hired: "Qacarame"
    },
    location: "Teessoo/Bakka",
    companySize: "Guddisa Dhaabbataa",
    memberSince: "Miseensa Taanne",
    profileCompletion: "Guutinsaa Profaayilii"
  }
};

['en', 'am', 'om'].forEach((lang) => {
  const filePath = `client/src/i18n/locales/${lang}.json`;
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!fileData.dashboard) {
    fileData.dashboard = {};
  }

  // Merge keys
  const additions = employerDashboardKeys[lang];
  Object.keys(additions).forEach((k) => {
    if (typeof additions[k] === 'object' && !Array.isArray(additions[k])) {
      if (!fileData.dashboard[k]) fileData.dashboard[k] = {};
      Object.assign(fileData.dashboard[k], additions[k]);
    } else {
      fileData.dashboard[k] = additions[k];
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
  console.log(`Successfully updated ${filePath}`);
});

console.log('Employer dashboard keys updated!');
