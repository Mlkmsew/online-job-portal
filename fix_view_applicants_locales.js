const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client', 'src', 'i18n', 'locales');
const enPath = path.join(localesDir, 'en.json');
const amPath = path.join(localesDir, 'am.json');
const omPath = path.join(localesDir, 'om.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const am = JSON.parse(fs.readFileSync(amPath, 'utf8'));
const om = JSON.parse(fs.readFileSync(omPath, 'utf8'));

// 1. Ensure employer.jobs
en.employer = en.employer || {};
am.employer = am.employer || {};
om.employer = om.employer || {};

en.employer.jobs = {
  ...(en.employer.jobs || {}),
  title: 'All Posted Jobs',
  subtitle: 'All active job postings and candidate overview',
};

am.employer.jobs = {
  ...(am.employer.jobs || {}),
  title: 'ሁሉም የተለቀቁ ስራዎች',
  subtitle: 'የሁሉም ንቁ የስራ ማስታወቂያዎች እና የዕጩዎች አጠቃላይ መግለጫ',
};

om.employer.jobs = {
  ...(om.employer.jobs || {}),
  title: 'Hojiiwwan Maxxansaman Hunda',
  subtitle: 'Beeksisa hojii ammaa fi ibsa waliigalaa kadhimamtootaa',
};

// 2. Add extra keys to employer.applicants
en.employer.applicants = {
  ...(en.employer.applicants || {}),
  exportCsv: 'Export CSV',
  viewJobDetails: 'View Job Details',
  noApplicants: 'No Applicants Yet',
  noApplicantsSub: 'Applicants will appear here once people apply to your posted jobs. Use the filters above to refine your candidate queue.',
  resume: 'Resume',
  uploaded: 'Uploaded',
  fileSizeNotAvailable: 'File size: Not available',
  viewResume: 'View Resume',
  portfolio: 'Portfolio',
  website: 'Website',
  visit: 'Visit',
  github: 'GitHub',
  open: 'Open',
  linkedin: 'LinkedIn',
  notProvided: 'Not Provided',
  currentStatus: 'Current Status',
  actions: 'Actions',
  shortlist: 'Shortlist',
  fullProfile: 'Full Profile',
  hire: 'Hire',
  reject: 'Reject',
  employerNotesPrivate: 'Employer Notes (Private)',
  visibleTeamOnly: 'Visible only to your team',
  notesPlaceholder: 'Record hiring notes, feedback, or next steps...',
  match: 'Match',
  education: 'Education',
  experience: 'Experience',
  coverLetter: 'Cover Letter',
  readMore: 'Read More',
  appliedFor: 'Applied for',
  appliedDate: 'Applied',
};

am.employer.applicants = {
  ...(am.employer.applicants || {}),
  exportCsv: 'CSV ወደ ውጪ ላክ',
  viewJobDetails: 'የስራ ዝርዝሮችን ይመልከቱ',
  noApplicants: 'እስካሁን ምንም አመልካቾች የሉም',
  noApplicantsSub: 'ሰዎች ለተለቀቁት ስራዎችዎ ሲያመሰክቱ አመልካቾች እዚህ ይታያሉ። የዕጩዎችዎን ዝርዝር ለማጣራት ከላይ ያሉትን ማጣሪያዎች ይጠቀሙ።',
  resume: 'የስራ ልምድ መግለጫ (CV)',
  uploaded: 'ተጭኗል',
  fileSizeNotAvailable: 'የፋይል መጠን፡ አልተገኘም',
  viewResume: 'CV ይመልከቱ',
  portfolio: 'ፖርትፎሊዮ',
  website: 'ዌብሳይት',
  visit: 'ይጎብኙ',
  github: 'ጊትሃብ (GitHub)',
  open: 'ክፈት',
  linkedin: 'ሊንክድኢን (LinkedIn)',
  notProvided: 'አልቀረበም',
  currentStatus: 'የአሁኑ ሁኔታ',
  actions: 'እርምጃዎች',
  shortlist: 'አጭር ዝርዝር ውስጥ አድርግ',
  fullProfile: 'ሙሉ ፕሮፋይል',
  hire: 'ቅጠር',
  reject: 'ውድቅ አድርግ',
  employerNotesPrivate: 'የአሠሪ ማስታወሻዎች (ግልጽ ያልሆነ/ምስጢራዊ)',
  visibleTeamOnly: 'ለቡድንዎ ብቻ የሚታይ',
  notesPlaceholder: 'የቀጠሮ ማስታወሻዎችን፣ ግብረ-መልስን ወይም ቀጣይ እርምጃዎችን ይመዝግቡ...',
  match: 'ተዛማጅነት',
  education: 'ትምህርት',
  experience: 'የስራ ልምድ',
  coverLetter: 'ማመልከቻ ደብዳቤ (Cover Letter)',
  readMore: 'ተጨማሪ ያንብቡ',
  appliedFor: 'የማመልክበት ስራ',
  appliedDate: 'ያመለከቱበት ቀን',
};

om.employer.applicants = {
  ...(om.employer.applicants || {}),
  exportCsv: 'CSV Alatti Ergi',
  viewJobDetails: 'Tarreeffama Hojii Ilaali',
  noApplicants: 'Hanga Ammaatti Iyyaattoonni Hin Jiran',
  noApplicantsSub: 'Namoonni hojii keessan beeksifamerratti yeroo iyyatan iyyaattoonni asirratti mul\'atu. Tarree kadhimamtootaa refine gochuuf calaltoota armaan olii fayyadamaa.',
  resume: 'Seenaa Hojii (CV)',
  uploaded: 'Fe\'ameera',
  fileSizeNotAvailable: 'Hamma Fayiilii: Hin argamne',
  viewResume: 'CV Ilaali',
  portfolio: 'Poortifooliyo',
  website: 'Weebsaayiti',
  visit: 'Dawwadhaa',
  github: 'GitHub',
  open: 'Bani',
  linkedin: 'LinkedIn',
  notProvided: 'Hin dhiyaanne',
  currentStatus: 'Sadarkaa Ammaa',
  actions: 'Tarkaanfiiwwan',
  shortlist: 'Tarree Gabaabaatti Dabalii',
  fullProfile: 'Puroofaayilii Guutuu',
  hire: 'Mindessi',
  reject: 'Kuffisi',
  employerNotesPrivate: 'Yaadannoowwan Hojjechiisaa (Dhuunfaa)',
  visibleTeamOnly: 'Garee keessaniif qofa kan mul\'atu',
  notesPlaceholder: 'Yaadannoowwan mindessuu, yaada ykn tarkaanfiiwwan itti aanan galmeessaa...',
  match: 'Walsimannaa',
  education: 'Barumsa',
  experience: 'Muuxannoo Hojii',
  coverLetter: 'Xalayaa Iyyaata (Cover Letter)',
  readMore: 'Dabalata Dubbisi',
  appliedFor: 'Hojii iyyatame',
  appliedDate: 'Guyyaa iyyatame',
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(am, null, 2), 'utf8');
fs.writeFileSync(omPath, JSON.stringify(om, null, 2), 'utf8');

console.log('Successfully updated locales for ViewApplicants.jsx');
