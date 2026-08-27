// ============================================
// Company Profile Completion
// ============================================
// Single, consistent definition of what makes an Employer Company Profile
// "complete". Both the Employer Company Profile page and the Employer Dashboard
// MUST use this list so the percentage is identical everywhere.
//
// Rules:
//  - Only fields the employer can actually view/edit/save from CompanyProfile.jsx
//    are counted. `companyType` is editable but intentionally NOT counted (it always
//    has a valid default and must not artificially affect completeness).
//  - Optional social links (telegram / instagram) are NOT counted; requiring them
//    would prevent a genuinely complete profile from reaching 100%.
//  - The three verification documents ARE required for a complete profile.
//  - `logo` / `coverImage` are optional branding and are NOT counted.
//
// Paths use the CompanyProfile FORM shape (documents.businessLicense etc.). The
// getCompanyProfileCompletion() helper also accepts the persisted Company object
// (top-level businessLicense etc.) via an alias, so the Dashboard can reuse it.

export const COMPANY_PROFILE_COMPLETION_FIELDS = [
  'name',
  'description',
  'industry',
  'companySize',
  'foundedYear',
  'website',
  'email',
  'phone',
  'location.region',
  'location.city',
  'location.address',
  'socialLinks.linkedin',
  'socialLinks.facebook',
  'recruiter.hrManagerName',
  'recruiter.position',
  'recruiter.email',
  'recruiter.phone',
  'documents.businessLicense',
  'documents.tinCertificate',
  'documents.companyRegistration',
];

const getValueAtPath = (obj, path) => {
  if (!obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
};

// A field is "filled" when it holds a non-empty trimmed value.
export const isFieldFilled = (value) => !!(value && String(value).trim() !== '');

// Compute company profile completion (0-100) from either:
//  - the CompanyProfile form values (form shape with documents.*)
//  - the persisted Company object (top-level fields)
export const getCompanyProfileCompletion = (data) => {
  if (!data) return 0;

  const filled = COMPANY_PROFILE_COMPLETION_FIELDS.filter((field) => {
    let value = getValueAtPath(data, field);
    if (value == null && field.startsWith('documents.')) {
      // Allow the persisted Company object shape (top-level field).
      value = getValueAtPath(data, field.replace(/^documents\./, ''));
    }
    return isFieldFilled(value);
  }).length;

  if (COMPANY_PROFILE_COMPLETION_FIELDS.length === 0) return 0;
  return Math.round((filled / COMPANY_PROFILE_COMPLETION_FIELDS.length) * 100);
};

export default getCompanyProfileCompletion;
