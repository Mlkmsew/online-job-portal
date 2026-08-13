const fs = require('fs');

const fixLocales = () => {
  const enPath = './client/src/i18n/locales/en.json';
  const amPath = './client/src/i18n/locales/am.json';
  const omPath = './client/src/i18n/locales/om.json';

  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const am = JSON.parse(fs.readFileSync(amPath, 'utf8'));
  const om = JSON.parse(fs.readFileSync(omPath, 'utf8'));

  en.dashboard.analytics = {
    title: "Analytics",
    newApplications: "New Applications",
    underReview: "Under Review",
    interview: "Interview",
    hired: "Hired"
  };

  am.dashboard.analytics = {
    title: "ትንታኔዎች",
    newApplications: "አዲስ ማመልከቻዎች",
    underReview: "በግምገማ ላይ",
    interview: "ቃለ መጠይቅ",
    hired: "ተቀጥረዋል"
  };

  om.dashboard.analytics = {
    title: "Madaallii",
    newApplications: "Iyyata Haaraa",
    underReview: "Qorannoo Jala",
    interview: "Gaaffii fi Deebii",
    hired: "Qacaraman"
  };

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
  fs.writeFileSync(amPath, JSON.stringify(am, null, 2), 'utf8');
  fs.writeFileSync(omPath, JSON.stringify(om, null, 2), 'utf8');

  console.log('Successfully updated analytics section in en.json, am.json, and om.json');
};

fixLocales();