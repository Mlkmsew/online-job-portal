/**
 * Inject employer.companyProfile translations into all three locale files.
 * Run once: node inject_company_profile_translations.js
 */
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client', 'src', 'i18n', 'locales');

const translations = {
  en: {
    title: 'Company Profile',
    breadcrumb: 'Employer Portal',
    description: 'Complete your company information and branding to attract top talent.',
    complete: 'Complete',
    sections: {
      branding: {
        title: 'Company Branding',
        description: 'Upload your company logo and cover image.',
      },
      cover: {
        description: 'PNG, JPG, SVG. Recommended size: 1200 × 300px.',
      },
      about: {
        title: 'About the Company',
        description: 'Provide a brief overview of your organization.',
      },
      contact: {
        title: 'Contact Information',
        description: 'How candidates and partners can reach your company.',
      },
      social: {
        title: 'Social Media',
        description: 'Link your official social media pages.',
      },
      recruiter: {
        title: 'Recruiter Information',
        description: "The primary HR contact candidates will communicate with.",
      },
      verification: {
        title: 'Verification Documents',
        description: 'Upload official documents to verify your company.',
      },
      savePrompt: {
        title: 'Save Your Changes',
        description: 'Review your information before saving.',
      },
    },
    fields: {
      logo: 'Company Logo',
      coverImage: 'Cover Image',
      name: 'Company Name',
      industry: 'Industry',
      companySize: 'Company Size',
      foundedYear: 'Founded Year',
      companyType: 'Company Type',
      description: 'About Company',
      email: 'Company Email',
      phone: 'Phone Number',
      website: 'Website',
      region: 'Region / State',
      city: 'City',
      address: 'Address',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      telegram: 'Telegram',
      instagram: 'Instagram / X',
      recruiterName: 'HR / Recruiter Name',
      recruiterPosition: 'Position / Title',
      recruiterEmail: 'Recruiter Email',
      recruiterPhone: 'Recruiter Phone',
      businessLicense: 'Business License',
      tinCertificate: 'TIN Certificate',
      companyRegistration: 'Company Registration',
    },
    placeholders: {
      name: 'e.g. Acme Corporation',
      industry: 'e.g. Technology, Finance, Healthcare',
      description: 'Write a brief overview of your company, its mission, and what makes it unique...',
      address: 'e.g. Bole Sub City, Woreda 03',
      region: 'Select region',
      city: 'Select city',
      linkedin: 'https://linkedin.com/company/...',
      facebook: 'https://facebook.com/...',
      telegram: 'https://t.me/...',
      instagram: 'https://x.com/...',
      recruiterName: 'e.g. Selam Tesfaye',
      recruiterPosition: 'e.g. HR Manager',
      recruiterEmail: 'hr@company.com',
      recruiterPhone: '+251911123456',
    },
    hints: {
      logoFile: 'PNG, JPG, or SVG. Max 2MB. Min 100×100px.',
    },
    actions: {
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      createCompanyProfile: 'Create Company Profile',
      removeReplaceLogo: 'Remove / Replace Logo',
      removeReplaceCover: 'Remove / Replace Cover',
      removeReplace: 'Remove / Replace',
      view: 'View',
      openInNewTab: 'Open in New Tab',
    },
    statuses: {
      verified: 'Verified',
      pending: 'Pending Verification',
      documentReady: 'Document ready',
      imageDocumentReady: 'Image document ready',
      licensePending: 'License Pending',
      tinPending: 'TIN Pending',
      registrationPending: 'Registration Pending',
    },
    previewLabels: {
      livePreview: 'Live Preview',
      logoPreview: 'Company logo preview',
      coverPreview: 'Cover image preview',
      noSocialLinks: 'No social links added yet.',
      businessLicense: 'Business License',
      tinCertificate: 'TIN Certificate',
      companyRegistration: 'Company Registration',
      businessLicenseCount: '📄 {{name}}',
      tinCertificateCount: '📄 {{name}}',
      companyRegistrationCount: '📄 {{name}}',
      previewUnsupported: 'Preview not supported for this file type.',
      imagePreview: 'Image preview',
      documentPreview: 'Document preview',
      noDocumentUploaded: 'No document uploaded yet.',
      social: 'Social Media',
      recruiter: 'Recruiter',
      verificationDocuments: 'Verification Documents',
      selectYear: 'Select year',
    },
    validation: {
      nameRequired: 'Company name is required.',
    },
    success: {
      updated: 'Company profile saved successfully!',
      submitted: 'Company profile created successfully!',
    },
    error: {
      uploadLogo: 'Please upload a company logo.',
      saveFailed: 'Failed to save company profile. Please try again.',
    },
  },

  am: {
    title: 'የድርጅት መገለጫ',
    breadcrumb: 'የቀጣሪ ፖርታል',
    description: 'ምርጥ ሰራተኞችን ለመሳብ የድርጅትዎን መረጃ እና ብራንድ ያሟሉ።',
    complete: 'ሙሉ',
    sections: {
      branding: {
        title: 'የድርጅት ብራንዲንግ',
        description: 'የድርጅት ሎጎ እና የሽፋን ምስል ይጫኑ።',
      },
      cover: {
        description: 'PNG፣ JPG፣ SVG። የሚመከር መጠን: 1200 × 300px።',
      },
      about: {
        title: 'ስለ ድርጅቱ',
        description: 'ስለ ድርጅቱ አጭር ማብራሪያ ይስጡ።',
      },
      contact: {
        title: 'የመገኛ መረጃ',
        description: 'እጩ ሰራተኞች እና ሽርካቾች ድርጅቱን ለማግኘት የሚጠቀሙበት መረጃ።',
      },
      social: {
        title: 'ማህበራዊ ሚዲያ',
        description: 'ኦፊሴላዊ ማህበራዊ ሚዲያ ገጾቹን ያስተሳስሩ።',
      },
      recruiter: {
        title: 'የቅጥር ኃላፊ መረጃ',
        description: 'እጩ ሰራተኞች ዋናው ጋር የሚገናኙበት የሠራተኛ ጉዳይ ሃላፊ።',
      },
      verification: {
        title: 'የማረጋገጫ ሰነዶች',
        description: 'ድርጅቱን ለማረጋገጥ ኦፊሴላዊ ሰነዶችን ይጫኑ።',
      },
      savePrompt: {
        title: 'ለውጦችን አስቀምጥ',
        description: 'ከማስቀመጥዎ በፊት መረጃዎን ይፈትሹ።',
      },
    },
    fields: {
      logo: 'የድርጅት ሎጎ',
      coverImage: 'የሽፋን ምስል',
      name: 'የድርጅት ስም',
      industry: 'የኢንዱስትሪ ዘርፍ',
      companySize: 'የድርጅት መጠን',
      foundedYear: 'የተመሰረተበት ዓመት',
      companyType: 'የድርጅት አይነት',
      description: 'ስለ ድርጅቱ',
      email: 'የድርጅት ኢሜይል',
      phone: 'ስልክ ቁጥር',
      website: 'ድረ-ገጽ',
      region: 'ክልል / ግዛት',
      city: 'ከተማ',
      address: 'አድራሻ',
      linkedin: 'ሊንክዲን',
      facebook: 'ፌስቡክ',
      telegram: 'ቴሌግራም',
      instagram: 'ኢንስታግራም / ኤክስ',
      recruiterName: 'የሰራተኛ ጉዳይ ሃላፊ ስም',
      recruiterPosition: 'ቦታ / ማዕረግ',
      recruiterEmail: 'የቅጥር ሃላፊ ኢሜይል',
      recruiterPhone: 'የቅጥር ሃላፊ ስልክ',
      businessLicense: 'የቢዝነስ ፈቃድ',
      tinCertificate: 'የTIN ምስክርነት',
      companyRegistration: 'የድርጅት ምዝገባ',
    },
    placeholders: {
      name: 'ምሳሌ: Acme Corporation',
      industry: 'ምሳሌ: ቴክኖሎጂ፣ ፋይናንስ፣ ጤና',
      description: 'ስለ ድርጅቱ፣ ተልዕኮው እና ልዩ ባህሪው አጭር ማብራሪያ ይፃፉ...',
      address: 'ምሳሌ: ቦሌ ክፍለ ከተማ፣ ወረዳ 03',
      region: 'ክልል ይምረጡ',
      city: 'ከተማ ይምረጡ',
      linkedin: 'https://linkedin.com/company/...',
      facebook: 'https://facebook.com/...',
      telegram: 'https://t.me/...',
      instagram: 'https://x.com/...',
      recruiterName: 'ምሳሌ: ሰላም ተስፋዬ',
      recruiterPosition: 'ምሳሌ: የሰራተኛ ጉዳይ ሃላፊ',
      recruiterEmail: 'hr@company.com',
      recruiterPhone: '+251911123456',
    },
    hints: {
      logoFile: 'PNG፣ JPG፣ ወይም SVG። ከፍተኛ 2MB። ዝቅተኛ 100×100px።',
    },
    actions: {
      editProfile: 'መገለጫ ያርትዑ',
      saveChanges: 'ለውጦችን አስቀምጥ',
      saving: 'በማስቀመጥ ላይ...',
      createCompanyProfile: 'የድርጅት መገለጫ ይፍጠሩ',
      removeReplaceLogo: 'ሎጎ ያስወግዱ / ይቀይሩ',
      removeReplaceCover: 'የሽፋን ምስል ያስወግዱ / ይቀይሩ',
      removeReplace: 'ያስወግዱ / ይቀይሩ',
      view: 'ይመልከቱ',
      openInNewTab: 'በአዲስ ትር ይክፈቱ',
    },
    statuses: {
      verified: 'የተረጋገጠ',
      pending: 'ማረጋገጫ በጠባቂ',
      documentReady: 'ሰነድ ዝግጁ ነው',
      imageDocumentReady: 'የምስል ሰነድ ዝግጁ ነው',
      licensePending: 'ፈቃድ በጠባቂ',
      tinPending: 'TIN በጠባቂ',
      registrationPending: 'ምዝገባ በጠባቂ',
    },
    previewLabels: {
      livePreview: 'ቀጥታ ቅድሚያ እይታ',
      logoPreview: 'የድርጅት ሎጎ ቅድሚያ እይታ',
      coverPreview: 'የሽፋን ምስል ቅድሚያ እይታ',
      noSocialLinks: 'እስካሁን ማህበራዊ ሚዲያ ሊንኮች አልተጨመሩም።',
      businessLicense: 'የቢዝነስ ፈቃድ',
      tinCertificate: 'የTIN ምስክርነት',
      companyRegistration: 'የድርጅት ምዝገባ',
      businessLicenseCount: '📄 {{name}}',
      tinCertificateCount: '📄 {{name}}',
      companyRegistrationCount: '📄 {{name}}',
      previewUnsupported: 'ለዚህ የፋይል አይነት ቅድሚያ እይታ አይደገፍም።',
      imagePreview: 'የምስል ቅድሚያ እይታ',
      documentPreview: 'የሰነድ ቅድሚያ እይታ',
      noDocumentUploaded: 'እስካሁን ሰነድ አልተጫነም።',
      social: 'ማህበራዊ ሚዲያ',
      recruiter: 'የቅጥር ሃላፊ',
      verificationDocuments: 'የማረጋገጫ ሰነዶች',
      selectYear: 'ዓመት ይምረጡ',
    },
    validation: {
      nameRequired: 'የድርጅት ስም ያስፈልጋል።',
    },
    success: {
      updated: 'የድርጅቱ መገለጫ በተሳካ ሁኔታ ተቀምጧል!',
      submitted: 'የድርጅቱ መገለጫ በተሳካ ሁኔታ ተፈጥሯል!',
    },
    error: {
      uploadLogo: 'እባክዎ የድርጅት ሎጎ ይጫኑ።',
      saveFailed: 'የድርጅቱ መገለጫ ማስቀመጥ አልቻለም። እባክዎ እንደገና ይሞክሩ።',
    },
  },

  om: {
    title: 'Profaayilii Dhaabbata',
    breadcrumb: 'Pórtalii Abbaa Hojii',
    description: 'Ogeeyyii cimoo hawwachuuf odeeffannoo fi braandii dhaabbata keessan guutaa.',
    complete: 'Guutuu',
    sections: {
      branding: {
        title: 'Braandii Dhaabbata',
        description: 'Mallattoo fi suuraa haguuggii dhaabbata keessan fe\'aa.',
      },
      cover: {
        description: 'PNG, JPG, SVG. Safarri gorfamu: 1200 × 300px.',
      },
      about: {
        title: 'Waa\'ee Dhaabbata',
        description: 'Dhaabbata keessan waa\'ee gabaabinaan ibsaa.',
      },
      contact: {
        title: 'Odeeffannoo Quunnamtii',
        description: 'Dorgommootaa fi hirmaattonni dhaabbata keessan ittiin quunnamuu danda\'an.',
      },
      social: {
        title: 'Miidiyaa Hawaasaa',
        description: 'Fuula miidiyaa hawaasaa offisaalaa keessan walitti hidha.',
      },
      recruiter: {
        title: 'Odeeffannoo Raagaa',
        description: 'Dorgomaan quunnamtii raagaa HR waliin godhu.',
      },
      verification: {
        title: 'Sanadoota Mirkaneessaa',
        description: 'Dhaabbata keessan mirkaneessuuf sanadoota offisaalaa fe\'aa.',
      },
      savePrompt: {
        title: 'Jijjiiramoota Olkaa\'i',
        description: 'Dursa olkaa\'uu dura odeeffannoo keessan sakatta\'aa.',
      },
    },
    fields: {
      logo: 'Mallattoo Dhaabbata',
      coverImage: 'Suuraa Haguuggii',
      name: 'Maqaa Dhaabbata',
      industry: 'Damee Industirii',
      companySize: 'Baay\'ina Dhaabbata',
      foundedYear: 'Waggaa Hundeeffame',
      companyType: 'Gosa Dhaabbata',
      description: 'Waa\'ee Dhaabbata',
      email: 'Imeelii Dhaabbata',
      phone: 'Lakkoofsa Bilbilaa',
      website: 'Marsariitii',
      region: 'Naannoo / Godinaa',
      city: 'Magaalaa',
      address: 'Teessoo',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      telegram: 'Telegram',
      instagram: 'Instagram / X',
      recruiterName: 'Maqaa HR / Raagaa',
      recruiterPosition: 'Aanaa / Taayitaa',
      recruiterEmail: 'Imeelii Raagaa',
      recruiterPhone: 'Bilbila Raagaa',
      businessLicense: 'Hayyama Daldala',
      tinCertificate: 'Ragaa TIN',
      companyRegistration: 'Galmee Dhaabbata',
    },
    placeholders: {
      name: 'Fkn: Acme Corporation',
      industry: 'Fkn: Teknoloojii, Maallaqaa, Fayyaa',
      description: 'Waa\'ee dhaabbata, ergama fi waan addaa taasisu gabaabinaan barreessaa...',
      address: 'Fkn: Bole Sub City, Woreda 03',
      region: 'Naannoo filadhu',
      city: 'Magaalaa filadhu',
      linkedin: 'https://linkedin.com/company/...',
      facebook: 'https://facebook.com/...',
      telegram: 'https://t.me/...',
      instagram: 'https://x.com/...',
      recruiterName: 'Fkn: Selam Tesfaye',
      recruiterPosition: 'Fkn: HR Manaajara',
      recruiterEmail: 'hr@company.com',
      recruiterPhone: '+251911123456',
    },
    hints: {
      logoFile: 'PNG, JPG, ykn SVG. Hanga 2MB. Dalgee gadii 100×100px.',
    },
    actions: {
      editProfile: 'Profaayilii Gulaal',
      saveChanges: 'Jijjiiramoota Olkaa\'i',
      saving: 'Olkaa\'aa jira...',
      createCompanyProfile: 'Profaayilii Dhaabbata Uumi',
      removeReplaceLogo: 'Mallattoo Haqii / Bakka Buusi',
      removeReplaceCover: 'Suuraa Haguuggii Haqii / Bakka Buusi',
      removeReplace: 'Haqii / Bakka Buusi',
      view: 'Ilaali',
      openInNewTab: 'Taabii Haaraa keessatti Bani',
    },
    statuses: {
      verified: 'Mirkanaa\'e',
      pending: 'Mirkaneessaa Eegaa',
      documentReady: 'Sanadi qophaa\'e',
      imageDocumentReady: 'Sanadi suuraa qophaa\'e',
      licensePending: 'Hayyamni Eegaa',
      tinPending: 'TIN Eegaa',
      registrationPending: 'Galmeessaan Eegaa',
    },
    previewLabels: {
      livePreview: 'Ilaalcha Kallattii',
      logoPreview: 'Ilaalcha Mallattoo Dhaabbata',
      coverPreview: 'Ilaalcha Suuraa Haguuggii',
      noSocialLinks: 'Hanga ammaatti miidiyaa hawaasaa hin ida\'amne.',
      businessLicense: 'Hayyama Daldala',
      tinCertificate: 'Ragaa TIN',
      companyRegistration: 'Galmee Dhaabbata',
      businessLicenseCount: '📄 {{name}}',
      tinCertificateCount: '📄 {{name}}',
      companyRegistrationCount: '📄 {{name}}',
      previewUnsupported: 'Gosa faayilii kanaaf ilaalchi hin deeggaramu.',
      imagePreview: 'Ilaalcha Suuraa',
      documentPreview: 'Ilaalcha Sanada',
      noDocumentUploaded: 'Hanga ammaatti sanadi hin fe\'amne.',
      social: 'Miidiyaa Hawaasaa',
      recruiter: 'Raagaa',
      verificationDocuments: 'Sanadoota Mirkaneessaa',
      selectYear: 'Waggaa filadhu',
    },
    validation: {
      nameRequired: 'Maqaan dhaabbataa barbaachisaadha.',
    },
    success: {
      updated: 'Profaayiliin dhaabbata milkaa\'inaan olka\'eera!',
      submitted: 'Profaayiliin dhaabbata milkaa\'inaan uumameera!',
    },
    error: {
      uploadLogo: 'Mallattoo dhaabbata fe\'aa.',
      saveFailed: 'Profaayilii dhaabbata olkaa\'uu hin dandeenye. Mee irra deebi\'i yaali.',
    },
  },
};

const localeFilePaths = {
  en: path.join(localesDir, 'en.json'),
  am: path.join(localesDir, 'am.json'),
  om: path.join(localesDir, 'om.json'),
};

for (const [lang, cpTranslations] of Object.entries(translations)) {
  const filePath = localeFilePaths[lang];
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!data.employer) {
    data.employer = {};
  }

  // Inject the companyProfile namespace
  data.employer.companyProfile = cpTranslations;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Injected employer.companyProfile into ${lang}.json`);
}

console.log('\n🎉 All three locale files updated successfully!');
