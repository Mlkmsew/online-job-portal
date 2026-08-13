const fs = require('fs');

const subpageKeys = {
  en: {
    employer: {
      tabs: {
        account: "Account",
        notifications: "Notifications",
        companyPreferences: "Company Preferences",
        appearance: "Appearance",
        privacy: "Privacy",
        dangerZone: "Danger Zone",
        upcoming: "Upcoming",
        completed: "Completed",
        canceled: "Canceled",
        all: "All"
      },
      applicants: {
        title: "Applicants Overview",
        subtitle: "Filter, screen, and manage candidates for your open roles.",
        filterByJob: "Filter by Job",
        filterByStatus: "Filter by Status",
        allJobs: "All Jobs",
        allStatuses: "All Statuses",
        searchPlaceholder: "Search by applicant name, email, or job title...",
        noApplicants: "No applicants found.",
        noApplicantsHint: "Try selecting a different job or clearing your filters.",
        scheduleInterview: "Schedule Interview",
        viewProfile: "View Profile",
        strongMatch: "Strong match",
        goodMatch: "Good match",
        belowAverage: "Below average",
        downloadResume: "Download Resume",
        viewResume: "View Resume",
        notes: "Notes",
        saveNote: "Save Note",
        statusUpdated: "Status updated successfully"
      },
      interviews: {
        title: "Interviews Management",
        subtitle: "Schedule and manage interviews with potential candidates.",
        noInterviews: "No interviews scheduled.",
        noInterviewsHint: "When you schedule interviews with applicants, they will appear here.",
        candidate: "Candidate",
        position: "Position",
        dateTime: "Date & Time",
        locationOrLink: "Location / Link",
        status: "Status",
        actions: "Actions",
        online: "Online",
        phone: "Phone",
        inPerson: "In Person"
      },
      settings: {
        title: "Company Settings",
        subtitle: "Manage your employer account, notification preferences, and team permissions.",
        accountDetails: "Account Details",
        fullName: "Full Name",
        workEmail: "Work Email",
        companyName: "Company Name",
        saveChanges: "Save Changes",
        changePassword: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        updatePassword: "Update Password",
        deleteAccount: "Delete Account",
        deleteWarning: "Once deleted, your company account and job listings cannot be recovered."
      }
    }
  },
  am: {
    employer: {
      tabs: {
        account: "መለያ",
        notifications: "ማስታወቂያዎች",
        companyPreferences: "የድርጅት ምርጫዎች",
        appearance: "ገጽታ",
        privacy: "ግላዊነት",
        dangerZone: "አደገኛ ቀጠና",
        upcoming: "ቀጣይ",
        completed: "የተጠናቀቁ",
        canceled: "የተሰረዙ",
        all: "ሁሉም"
      },
      applicants: {
        title: "የአመልካቾች አጠቃላይ መግለጫ",
        subtitle: "ለክፍት የስራ መደቦችዎ አመልካቾችን ያጣሩ፣ ይገምግሙ እና ያስተዳድሩ።",
        filterByJob: "በስራ መደብ አጣራ",
        filterByStatus: "በሁኔታ አጣራ",
        allJobs: "ሁሉም ስራዎች",
        allStatuses: "ሁሉም ሁኔታዎች",
        searchPlaceholder: "በአመልካች ስም፣ ኢሜይል ወይም የስራ መደብ ፈልግ...",
        noApplicants: "ምንም አመልካች አልተገኘም።",
        noApplicantsHint: "ሌላ ስራ በመምረጥ ወይም ማጣሪያዎችን በማጽዳት እንደገና ይሞክሩ።",
        scheduleInterview: "ቃለ መጠይቅ ያዙ",
        viewProfile: "መገለጫ ይመልከቱ",
        strongMatch: "ከፍተኛ ተስማሚ",
        goodMatch: "ጥሩ ተስማሚ",
        belowAverage: "ዝቅተኛ ተስማሚ",
        downloadResume: "ሲቪ አውርድ",
        viewResume: "ሲቪ ይመልከቱ",
        notes: "ማስታወሻዎች",
        saveNote: "ማስታወሻ አስቀምጥ",
        statusUpdated: "ሁኔታው በተሳካ ሁኔታ ተሻሽሏል"
      },
      interviews: {
        title: "የቃለ መጠይቆች አስተዳደር",
        subtitle: "ከተመረጡ አመልካቾች ጋር ቃለ መጠይቆችን ያቅዱ እና ያስተዳድሩ።",
        noInterviews: "ምንም የተቀጠረ ቃለ መጠይቅ የለም።",
        noInterviewsHint: "ከአመልካቾች ጋር ቃለ መጠይቅ ሲይዙ እዚህ ይታያሉ።",
        candidate: "እጩ",
        position: "የስራ መደብ",
        dateTime: "ቀን እና ሰዓት",
        locationOrLink: "ቦታ / ሊንክ",
        status: "ሁኔታ",
        actions: "እርምጃዎች",
        online: "በኢንተርኔት (ኦንላይን)",
        phone: "በስልክ",
        inPerson: "በአካል"
      },
      settings: {
        title: "የድርጅት ማስተካከያዎች",
        subtitle: "የአሰሪ መለያዎን፣ የማስታወቂያ ምርጫዎችን እና የቡድን ፈቃዶችን ያስተዳድሩ።",
        accountDetails: "የመለያ ዝርዝሮች",
        fullName: "ሙሉ ስም",
        workEmail: "የስራ ኢሜይል",
        companyName: "የድርጅት ስም",
        saveChanges: "ለውጦችን አስቀምጥ",
        changePassword: "የይለፍ ቃል ይቀይሩ",
        currentPassword: "የአሁኑ የይለፍ ቃል",
        newPassword: "አዲስ የይለፍ ቃል",
        confirmPassword: "አዲስ የይለፍ ቃል ያረጋግጡ",
        updatePassword: "የይለፍ ቃል አዘምን",
        deleteAccount: "መለያ ሰርዝ",
        deleteWarning: "አንዴ ከተሰረዘ የድርጅትዎ መለያ እና የስራ ማስታወቂያዎች ሊመለሱ አይችሉም።"
      }
    }
  },
  om: {
    employer: {
      tabs: {
        account: "Herrega",
        notifications: "Beeksisa",
        companyPreferences: "Filannoo Dhaabbataa",
        appearance: "Bifa",
        privacy: "Iccitiinsummaa",
        dangerZone: "Naannoo Balaa",
        upcoming: "Kan Dhufu",
        completed: "Xumuramaa",
        canceled: "Haqamaa",
        all: "Hunda"
      },
      applicants: {
        title: "Ibso Iyyaaltootaa",
        subtitle: "Iyyaaltoota hojii banamaa keessaniif calalaafi bulchaa.",
        filterByJob: "Hojiin Calali",
        filterByStatus: "Haalaan Calali",
        allJobs: "Hojiiwwan Hunda",
        allStatuses: "Haalota Hunda",
        searchPlaceholder: "Maqaa iyyaaltaa, email ykn mataduree hojiitiin barbaadi...",
        noApplicants: "Iyyaaltaan kamiyyuu hin argamne.",
        noApplicantsHint: "Hojii biraa filachuun ykn calaltuu qulqulleessuun irra deebi'ii yaali.",
        scheduleInterview: "Gaaffii fi Deebii Qabsiisi",
        viewProfile: "Profaayilii Ilaali",
        strongMatch: "Walsimannaa Cimaa",
        goodMatch: "Walsimannaa Gaarii",
        belowAverage: "Walsimannaa Gad-aanaa",
        downloadResume: "CV Buufadhu",
        viewResume: "CV Ilaali",
        notes: "Yaadannoowwan",
        saveNote: "Yaadannoo Olkaayi",
        statusUpdated: "Haali milkaa'inaan haaromeera"
      },
      interviews: {
        title: "Bulchiinsa Gaaffii fi Deebii",
        subtitle: "Iyyaaltoota kaadhimamoo waliin gaaffii fi deebii qopheessaa.",
        noInterviews: "Gaaffii fi deebii qabame hin jiru.",
        noInterviewsHint: "Yeroo iyyaaltoota waliin gaaffii fi deebii qabsiistan asitti mul'atu.",
        candidate: "Kaadhimamaa",
        position: "Bakka Hojii",
        dateTime: "Guyyaa fi Sa'aatii",
        locationOrLink: "Bakka / Linkii",
        status: "Haala",
        actions: "Tarkaanfiilee",
        online: "Inteerneetiin",
        phone: "Bilbilaan",
        inPerson: "QAAMAAN"
      },
      settings: {
        title: "Qindaa'ina Dhaabbataa",
        subtitle: "Herrega qacaraa, filannoo beeksisaa fi eeyyama garee bulchaa.",
        accountDetails: "Tarree Herregaa",
        fullName: "Maqaa Guutuu",
        workEmail: "Email Hojii",
        companyName: "Maqaa Dhaabbataa",
        saveChanges: "Jijjiirama Olkaayi",
        changePassword: "Jecha Icciitii Jijjiiri",
        currentPassword: "Jecha Icciitii Ammaa",
        newPassword: "Jecha Icciitii Haaraa",
        confirmPassword: "Jecha Icciitii Haaraa Mirkaneessi",
        updatePassword: "Jecha Icciitii Haaromsi",
        deleteAccount: "Herrega Haqi",
        deleteWarning: "Yoo haqame herregni dhaabbata keessanii fi beeksisi hojii deebi'uu hin danda'u."
      }
    }
  }
};

['en', 'am', 'om'].forEach((lang) => {
  const filePath = `client/src/i18n/locales/${lang}.json`;
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!fileData.employer) {
    fileData.employer = {};
  }

  const additions = subpageKeys[lang].employer;
  Object.keys(additions).forEach((section) => {
    if (!fileData.employer[section]) fileData.employer[section] = {};
    Object.assign(fileData.employer[section], additions[section]);
  });

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
  console.log(`Successfully injected subpage keys into ${filePath}`);
});
