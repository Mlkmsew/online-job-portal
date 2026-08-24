import { describe, it, expect } from 'vitest';
import calculateResumeCompletion, {
  RESUME_SECTIONS,
  withResumeScore,
  buildResumeFromProfile,
  calculateProfileCompletion,
} from './resumeCompletion';

const SECTION_COUNT = RESUME_SECTIONS.length; // 9
const percent = (n) => Math.round((n / SECTION_COUNT) * 100);

const emptyResume = () => ({
  profile: {
    firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '',
    maritalStatus: '', profession: '', streetAddress: '', city: '',
    stateProvince: '', nationality: '', passportNumber: '', phone: '',
    email: '', website: '', linkedIn: '', customField: '',
  },
  experience: { jobTitle: '', employer: '', duties: '' },
  education: { schoolName: '', degree: '', fieldOfStudy: '' },
  projects: [{ title: '', description: '' }],
  skills: [{ name: '' }],
  softSkills: [''],
  languages: [{ name: '', level: 'Select', isDone: false }],
  summary: { text: '' },
  interests: { text: '' },
  certifications: [],
  photo: null,
});

const fillPersonal = (resume) => ({ ...resume, profile: { ...resume.profile, firstName: 'Abebe', lastName: 'Kebede' } });
const fillContact = (resume) => ({ ...resume, profile: { ...resume.profile, email: 'abebe@example.com', phone: '+251911111111' } });
const fillSummary = (resume) => ({ ...resume, summary: { text: 'Experienced software engineer.' } });
const fillEducation = (resume) => ({ ...resume, education: { ...resume.education, degree: "Bachelor's", schoolName: 'AAU' } });
const fillExperience = (resume) => ({ ...resume, experience: { ...resume.experience, jobTitle: 'Engineer', employer: 'Acme' } });
const fillSkills = (resume) => ({ ...resume, skills: [{ name: 'React' }] });
const fillLanguages = (resume) => ({ ...resume, languages: [{ name: 'English', level: 'Fluent' }] });
const fillProjects = (resume) => ({ ...resume, projects: [{ title: 'Portal', description: 'MERN job portal' }] });
const fillAdditionalInfo = (resume) => ({ ...resume, interests: { text: 'Reading, Cycling' }, additionalInfo: {} });
const fillPhoto = (resume) => ({ ...resume, photo: { dataUrl: 'data:image/jpeg;base64,xxx' } });

describe('calculateResumeCompletion', () => {
  it('returns 0 for an empty CV', () => {
    expect(calculateResumeCompletion(emptyResume())).toBe(0);
  });

  it('returns 0 for no/undefined resume', () => {
    expect(calculateResumeCompletion()).toBe(0);
    expect(calculateResumeCompletion(null)).toBe(0);
    expect(calculateResumeCompletion('nope')).toBe(0);
  });

  it('increments as sections are completed', () => {
    let resume = fillPersonal(emptyResume());
    expect(calculateResumeCompletion(resume)).toBe(percent(1));

    resume = fillContact(resume);
    expect(calculateResumeCompletion(resume)).toBe(percent(2));

    resume = fillEducation(resume);
    expect(calculateResumeCompletion(resume)).toBe(percent(3));

    resume = fillExperience(resume);
    expect(calculateResumeCompletion(resume)).toBe(percent(4));

    resume = fillSkills(resume);
    expect(calculateResumeCompletion(resume)).toBe(percent(5));
  });

  it('returns 100% when every scored section is completed', () => {
    let resume = emptyResume();
    [
      fillPersonal, fillContact, fillSummary, fillEducation,
      fillExperience, fillSkills, fillProjects, fillLanguages,
      fillAdditionalInfo,
    ].forEach((fill) => { resume = fill(resume); });
    expect(calculateResumeCompletion(resume)).toBe(100);
  });

  it('gives a fully populated CV without a photo exactly 100% (photo is optional)', () => {
    let resume = emptyResume();
    [
      fillPersonal, fillContact, fillSummary, fillEducation,
      fillExperience, fillSkills, fillProjects, fillLanguages,
      fillAdditionalInfo,
    ].forEach((fill) => { resume = fill(resume); });
    expect(resume.photo).toBeNull();
    expect(calculateResumeCompletion(resume)).toBe(100);
    // Adding a photo must not change the score either way.
    expect(calculateResumeCompletion(fillPhoto(resume))).toBe(100);
  });

  it('ignores certifications since the builder no longer exposes that tab', () => {
    const withoutCerts = { ...emptyResume(), certifications: [] };
    const withCerts = {
      ...withoutCerts,
      certifications: [{ name: 'AWS Certified' }],
    };
    expect(calculateResumeCompletion(withCerts)).toBe(calculateResumeCompletion(withoutCerts));
  });

  it('scores the same regardless of the selected template', () => {
    let resume = emptyResume();
    [
      fillPersonal, fillContact, fillSummary, fillEducation,
      fillExperience, fillSkills, fillProjects, fillLanguages,
      fillAdditionalInfo,
    ].forEach((fill) => { resume = fill(resume); });
    const scores = ['modern-ats', 'minimal', 'classic', 'luxe', 'horizontal'].map(
      (template) => calculateResumeCompletion({ ...resume, template })
    );
    expect(new Set(scores).size).toBe(1);
    expect(scores[0]).toBe(100);
  });

  it('never returns a score below 0 or above 100', () => {
    const samples = [
      undefined,
      null,
      emptyResume(),
      fillPersonal(emptyResume()),
      { ...emptyResume(), photo: { url: 'x' } },
      Array.from({ length: 50 }).reduce((acc) => ({ ...acc, unknownField: 'x' }), {}),
    ];
    samples.forEach((sample) => {
      const score = calculateResumeCompletion(sample);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    });
  });

  it('counts legacy single-object projects and array-shaped experience/education', () => {
    const resume = {
      ...emptyResume(),
      projects: { title: 'Legacy Project', description: '' },
      experience: [{ jobTitle: 'Dev', employer: 'Co' }],
      education: [{ schoolName: 'Uni' }],
    };
    // personal/contact still empty → education + experience + skills? none + projects = 3 of 10
    expect(calculateResumeCompletion(resume)).toBe(percent(3));
  });

  it('accepts custom additional sections and string interests as Additional Information', () => {
    const withCustomSection = {
      ...emptyResume(),
      interests: { text: '' },
      additionalInfo: { sec1: { title: 'Awards', items: ['Employee of the Year'] } },
    };
    expect(calculateResumeCompletion(withCustomSection)).toBe(percent(1));

    const withStringInterests = { ...emptyResume(), interests: 'Chess' };
    expect(calculateResumeCompletion(withStringInterests)).toBe(percent(1));

    const blankCustomSection = {
      ...emptyResume(),
      additionalInfo: { sec1: { title: '', items: [''] } },
    };
    expect(calculateResumeCompletion(blankCustomSection)).toBe(0);
  });

  it('does not count empty placeholder entries as completed', () => {
    const resume = {
      ...emptyResume(),
      skills: [{ name: '   ' }, { name: '' }],
      languages: [{ name: '', level: 'Select' }],
      softSkills: [''],
      certifications: [{}],
      projects: [{ title: '', description: '' }],
      interests: { text: '   ' },
      additionalInfo: {},
    };
    expect(calculateResumeCompletion(resume)).toBe(0);
  });
});

describe('withResumeScore', () => {
  it('stores the real completion percentage and persists other data', () => {
    const resume = fillPersonal(emptyResume());
    const scored = withResumeScore(resume);
    expect(scored.score).toBe(percent(1));
    expect(scored.profile.firstName).toBe('Abebe');
  });
});

describe('buildResumeFromProfile / calculateProfileCompletion', () => {
  it('reuses the same section-based scoring for a user profile', () => {
    const user = {
      firstName: 'Jane',
      lastName: 'Doe',
      headline: 'Product Manager',
      email: 'jane@example.com',
      phone: '123456',
      bio: 'I build products.',
      location: { city: 'Addis Ababa', address: 'Bole' },
      skillNames: ['Product'],
      softSkills: ['Leadership'],
      languages: [{ name: 'Amharic', level: 'Fluent' }],
      experienceDetails: [{ title: 'PM', company: 'TechCo' }],
      educationDetails: [{ degree: 'MSc', institution: 'AAU' }],
      certificates: [{ name: 'PMP' }],
      portfolio: [{ label: 'Design Sprint', url: 'https://example.com' }],
      interests: 'Mentoring',
      avatar: 'https://example.com/avatar.jpg',
    };
    // Photo is optional — the avatar above is deliberately ignored by scoring.
    expect(calculateProfileCompletion(user)).toBe(100);
    expect(calculateProfileCompletion({ ...user, avatar: undefined })).toBe(100);

    expect(calculateProfileCompletion({ firstName: 'Jane' })).toBe(percent(1));
    expect(calculateProfileCompletion({})).toBe(0);
  });

  it('builds a valid resume shape from a profile', () => {
    const resume = buildResumeFromProfile({ firstName: 'A', lastName: 'B', email: 'a@b.c', location: { city: 'X' } });
    expect(resume.profile.firstName).toBe('A');
    expect(resume.profile.email).toBe('a@b.c');
    expect(resume.profile.city).toBe('X');
    expect(calculateResumeCompletion(resume)).toBe(percent(2));
  });
});
