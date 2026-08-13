const fs = require('fs');

const newKeys = {
  en: {
    home: {
      popularSearches: 'Popular Searches',
      softwareEngineer: 'Software Engineer',
      accountant: 'Accountant',
      nurse: 'Nurse',
      teacher: 'Teacher',
      ngoOfficer: 'NGO Officer',
      platformStatistics: 'Platform Statistics',
      trustedByThousands: 'Trusted by thousands of job seekers and employers',
      stat_totalJobs: 'Total Jobs',
      stat_activeSeekers: 'Active Job Seekers',
      stat_companies: 'Companies',
      stat_successfulPlacements: 'Successful Placements',
      blog_cvTips_title: 'How to Write a Standout CV',
      blog_cvTips_snippet: 'Learn how to structure your experience and highlight your achievements clearly.',
      blog_interviewTips_title: 'Interview Tips That Make an Impression',
      blog_interviewTips_snippet: 'Prepare with practical advice to boost your confidence and answer better.',
      blog_topSkills_title: 'Top Skills Employers Want Right Now',
      blog_topSkills_snippet: 'See which capabilities are in demand across leading industries today.',
      successStoriesTitle: 'Success Stories',
      successStory1: 'Case Study: How a youth got hired at a startup.',
      successStory2: 'Case Study: Upskilling and landing a role in finance.',
      testimonialsTitle: 'What People Say',
      testimonial1: '"Found my dream job in Addis within 2 weeks." \u2014 Amanuel',
      testimonial2: '"Great platform for employers to discover talent." \u2014 Selam',
      testimonial3: '"Easy CV upload and apply flow." \u2014 Hiwot',
      categoriesLoadError: 'Failed to load categories',
      exploreOpportunities: 'Explore opportunities',
      jobsLabel: 'jobs',
      loadingCategories: 'Loading categories...',
      noCategoriesAvailable: 'No job categories are available right now.',
      competitiveSalary: 'Competitive Salary',
      negotiableSalary: 'Negotiable Salary',
      upTo: 'Up to',
      recently: 'Recently',
      justNow: 'Just now',
      hoursAgo: 'h ago',
      daysAgo: 'd ago',
      monthsAgo: 'm ago',
      loginToBookmark: 'Please login to bookmark jobs.',
      removedFromBookmarks: 'Removed from bookmarks',
      savedToBookmarks: 'Job saved to bookmarks',
      bookmarkFailed: 'Failed to update bookmark',
      ethiopianEmployer: 'Ethiopian Employer',
      fullTime: 'Full-time',
      removeBookmark: 'Remove bookmark',
      bookmarkJob: 'Bookmark job',
      jobPosition: 'Job Position',
      defaultLocation: 'Addis Ababa, Ethiopia'
    }
  },
  am: {
    home: {
      popularSearches: '\u1273\u12CB\u1242 \u134D\u1208\u130B\u12CE\u127D',
      softwareEngineer: '\u12E8\u1236\u134D\u1275\u12CC\u122D \u1218\u1210\u1295\u12F2\u1235',
      accountant: '\u12E8\u1202\u1233\u1265 \u1263\u1208\u1219\u12EB',
      nurse: '\u1290\u122D\u1235',
      teacher: '\u1218\u121D\u1205\u122D',
      ngoOfficer: '\u12E8NGO \u1263\u1208\u1219\u12EB',
      platformStatistics: '\u12E8\u1355\u120B\u1275\u134E\u122D\u121D \u1235\u1273\u1272\u1235\u1272\u12AD\u1235',
      trustedByThousands: '\u1260\u123A\u12CE\u127D \u12E8\u121A\u1246\u1320\u1229 \u12E8\u1235\u122B \u1348\u120B\u130A\u12CE\u127D \u12A5\u1293 \u12A0\u1230\u122A\u12CE\u127D \u12EB\u1218\u1291\u1260\u1275',
      stat_totalJobs: '\u1320\u1245\u120B\u120B \u1235\u122B\u12CE\u127D',
      stat_activeSeekers: '\u1295\u1241 \u12E8\u1235\u122B \u1348\u120B\u130A\u12CE\u127D',
      stat_companies: '\u12F5\u122D\u1305\u1276\u127D',
      stat_successfulPlacements: '\u1235\u12AC\u1273\u121B \u1245\u1325\u122E\u127D',
      blog_cvTips_title: '\u130E\u120D\u1276 \u12E8\u121A\u1273\u12ED \u1232\u126A \u12A5\u1295\u12F4\u1275 \u1218\u133B\u134D',
      blog_cvTips_snippet: '\u120D\u121D\u12F5\u12CE\u1295 \u12A5\u1295\u12F4\u1275 \u121B\u12CB\u1240\u122D \u12A5\u1293 \u1235\u12AC\u1276\u127D\u12CE\u1295 \u130D\u120D\u133B \u121B\u12F5\u1228\u130D \u12A5\u1295\u12F0\u121A\u127B\u120D \u12ED\u121B\u1229\u1362',
      blog_interviewTips_title: '\u1235\u1208 \u1243\u1208-\u121D\u120D\u120D\u1235 \u1320\u1243\u121A \u121D\u12AD\u122E\u127D',
      blog_interviewTips_snippet: '\u1260\u122B\u1235 \u1218\u1270\u121B\u1218\u1295\u12CE\u1295 \u1208\u121B\u1233\u12F0\u130D \u12A5\u1293 \u1260\u1270\u123B\u1208 \u1201\u1294\u1273 \u1208\u1218\u1218\u1208\u1235 \u1270\u130D\u1263\u122B\u12CA \u121D\u12AD\u122D \u12EB\u12D8\u130B\u1301\u1362',
      blog_topSkills_title: '\u12DB\u1244 \u12A0\u1230\u122A\u12CE\u127D \u12E8\u121A\u1348\u120D\u1309\u1275 \u12AD\u1205\u120E\u1276\u127D',
      blog_topSkills_snippet: '\u1260\u12CB\u1293 \u12CB\u1293 \u12A2\u1295\u12F1\u1235\u1275\u122A\u12CE\u127D \u12CD\u1235\u1325 \u134D\u120B\u130E\u1275 \u12EB\u120B\u1278\u12CD\u1295 \u127D\u120E\u1273\u12CE\u127D\u1295 \u12ED\u1218\u120D\u12A8\u1271\u1362',
      successStoriesTitle: '\u12E8\u1235\u12AC\u1275 \u1273\u122A\u12AE\u127D',
      successStory1: '\u1325\u1293\u1275: \u12A0\u1295\u12F5 \u12C8\u1323\u1275 \u1260\u1235\u1273\u122D\u1275\u12A0\u1355 \u12CD\u1235\u1325 \u12A5\u1295\u12F4\u1275 \u12A5\u1295\u12F0\u1270\u1240\u1320\u1228\u1362',
      successStory2: '\u1325\u1293\u1275: \u12AD\u1205\u120E\u1276\u127D\u1295 \u121B\u123B\u123B\u120D \u12A5\u1293 \u1260\u134B\u12ED\u1293\u1295\u1235 \u12D8\u122D\u134D \u1235\u122B \u121B\u130D\u129B\u1275\u1362',
      testimonialsTitle: '\u1230\u12CE\u127D \u121D\u1295 \u12ED\u120B\u1209',
      testimonial1: '\u201C\u1260\u12A0\u12F2\u1235 \u12A0\u1260\u1263 \u12E8\u1205\u120D\u121D \u1235\u122B\u12EC\u1295 \u12602 \u1233\u121D\u1295\u1275 \u12CD\u1235\u1325 \u12A0\u1308\u129B\u1201\u201D \u2014 \u12A0\u121B\u1291\u12A4\u120D',
      testimonial2: '\u201C\u12A0\u1230\u122A\u12CE\u127D \u1270\u1230\u1325\u126E \u1208\u121B\u130D\u129B\u1275 \u121D\u122D\u1325 \u1218\u12F5\u1228\u12AD\u201D \u2014 \u1230\u120B\u121D',
      testimonial3: '\u201C\u1240\u120B\u120D \u1232\u126A \u1235\u1240\u120B \u12A5\u1293 \u121B\u1218\u120D\u12A8\u127B \u1202\u12F0\u1275\u201D \u2014 \u1205\u12ED\u12C8\u1275',
      categoriesLoadError: '\u12D8\u122D\u134E\u127D\u1295 \u121B\u1235\u1328\u1295 \u12A0\u120D\u1270\u1233\u12AB\u121D',
      exploreOpportunities: '\u12A5\u12F5\u120E\u127D\u1295 \u12EB\u1235\u1231',
      jobsLabel: '\u1235\u122B\u12CE\u127D',
      loadingCategories: '\u12D8\u122D\u134E\u127D \u1260\u1218\u1328\u1295 \u120B\u12ED...',
      noCategoriesAvailable: '\u121D\u1295\u121D \u12E8\u1235\u122B \u12D8\u122D\u134E\u127D \u12A0\u1201\u1295 \u12A0\u12ED\u1308\u129F\u121D\u1362',
      competitiveSalary: '\u1270\u12C8\u12F3\u12F3\u122A \u12F0\u1218\u12C8\u12DD',
      negotiableSalary: '\u1260\u1235\u121D\u121D\u1290\u1275 \u12E8\u121A\u1270\u120B\u1208\u134D \u12F0\u1218\u12C8\u12DD',
      upTo: '\u12A5\u1235\u12A8',
      recently: '\u1260\u1245\u122D\u1265 \u130A\u12DC',
      justNow: '\u12A0\u1201\u1295',
      hoursAgo: '\u1230 \u1260\u134A\u1275',
      daysAgo: '\u1240 \u1260\u134A\u1275',
      monthsAgo: '\u12C8 \u1260\u134A\u1275',
      loginToBookmark: '\u1235\u122B\u12CE\u127D\u1295 \u1208\u121B\u1235\u1240\u1218\u1325 \u12A5\u1263\u12AD\u12CE \u12ED\u130D\u1261\u1362',
      removedFromBookmarks: '\u12A8\u121D\u122D\u1328 \u1270\u12C8\u130D\u12F7\u120D',
      savedToBookmarks: '\u1235\u122B \u1270\u1240\u121D\u1327\u120D',
      bookmarkFailed: '\u121D\u120D\u12AD\u1275 \u121B\u12F5\u1228\u130D \u12A0\u120D\u1270\u1233\u12AB\u121D',
      ethiopianEmployer: '\u12A2\u1275\u12EE\u1335\u12EB\u12CA \u12A0\u1230\u122A',
      fullTime: '\u1219\u1209 \u130A\u12DC',
      removeBookmark: '\u121D\u120D\u12AD\u1275 \u12A0\u1235\u12C8\u130D\u12F5',
      bookmarkJob: '\u1235\u122B \u121D\u120D\u12AD\u1275 \u12A0\u12F5\u122D\u130D',
      jobPosition: '\u12E8\u1235\u122B \u1218\u12F0\u1265',
      defaultLocation: '\u12A0\u12F2\u1235 \u12A0\u1260\u1263\u1363 \u12A2\u1275\u12EE\u1335\u12EB'
    }
  },
  om: {
    home: {
      popularSearches: 'Barbaacha Beekamoo',
      softwareEngineer: 'Injinara Software',
      accountant: 'Herregaa',
      nurse: 'Narsii',
      teacher: 'Barsiisaa',
      ngoOfficer: 'Qondaala NGO',
      platformStatistics: 'Istaatistiksii Marsariitii',
      trustedByThousands: 'Kumaatamaan barbaacha hojii fi qacarootaan amanamaa',
      stat_totalJobs: 'Waliigalaa Hojiiwwan',
      stat_activeSeekers: 'Barbaadotaa Hojii Sochootan',
      stat_companies: 'Dhaabbilee',
      stat_successfulPlacements: "Qacarrii Milkaa'a",
      blog_cvTips_title: "CV Addaa Ta'e Akkamitti Barreessitan",
      blog_cvTips_snippet: "Muuxannoo keessan akka qajeelchitan fi milkaa'ina keessan ifatti akka ibsitan baradhaa.",
      blog_interviewTips_title: 'Gorsa Af-gaaffii Miira Dhiheessan',
      blog_interviewTips_snippet: 'Ofitti amantummaa keessan ol guddisuuf fi deebii irra caalaa kennuuf gorsa qabatamaa qopheessaa.',
      blog_topSkills_title: 'Dandeettii Qacaroonni Amma Barbaadan',
      blog_topSkills_snippet: 'Dandeettii industirii hogganoota keessatti gaafatamu ilaali.',
      successStoriesTitle: "Seenaa Milkaa'ina",
      successStory1: 'Qorannoo: Dargaggoon startup irratti akkamitti akka qacarame.',
      successStory2: 'Qorannoo: Dandeettii guddisuun hojii faaynaansii argachuu.',
      testimonialsTitle: 'Namoonni Maal Jedhu',
      testimonial1: '"Hojii abjuu koo Finfinnee keessatti torban 2 keessatti argadhe." \u2014 Amanuel',
      testimonial2: '"Marsariitii gaarii qacarootaaf dandeettiiwwan argachuuf." \u2014 Selam',
      testimonial3: "\"CV olkaa'uu fi iyyannoo salphaadha.\" \u2014 Hiwot",
      categoriesLoadError: "Gosaalee fe'uu hin dandeenye",
      exploreOpportunities: 'Carraaawwan barbaadi',
      jobsLabel: 'hojiiwwan',
      loadingCategories: "Gosaalee fe'aa jira...",
      noCategoriesAvailable: 'Gosaan hojii kamiyyuu amma hin jiru.',
      competitiveSalary: 'Mindaa Dorgomaa',
      negotiableSalary: 'Mindaa Mariin',
      upTo: 'Hanga',
      recently: 'Dhiyoo',
      justNow: 'Amma kana',
      hoursAgo: 'sa dura',
      daysAgo: 'g dura',
      monthsAgo: 'ji dura',
      loginToBookmark: "Hojiiwwan mallattoo kaa'uuf maaloo seeni.",
      removedFromBookmarks: 'Mallattoo irraa haqame',
      savedToBookmarks: "Hojiin olkaa'ame",
      bookmarkFailed: "Mallattoo haaromsuun hin dandeenye",
      ethiopianEmployer: 'Qacaraa Itiyoophiyaa',
      fullTime: 'Yeroo Guutuu',
      removeBookmark: 'Mallattoo haqi',
      bookmarkJob: 'Hojii mallattoo godhi',
      jobPosition: 'Bakka Hojii',
      defaultLocation: 'Finfinnee, Itoophiyaa'
    }
  }
};

['en', 'am', 'om'].forEach(lang => {
  const p = 'client/src/i18n/locales/' + lang + '.json';
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));

  const additions = newKeys[lang].home;
  if (!data.home) data.home = {};

  Object.entries(additions).forEach(([k, v]) => {
    if (!data.home[k]) {
      data.home[k] = v;
    }
  });

  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  console.log(lang + '.json updated with new home keys');
});

console.log('Done!');
