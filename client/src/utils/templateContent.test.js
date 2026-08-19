import { describe, it, expect } from 'vitest';
import { buildResumeFromProfile } from './resumeCompletion';
import { hydrateResumeFromProfile } from './resumeBuilderData';

const userWithData = {
  firstName: 'Abebe',
  lastName: 'Kebede',
  email: 'abebe@example.com',
  phone: '+251911111111',
  headline: 'Senior Developer',
  bio: 'I am a senior developer.',
  location: { city: 'Addis Ababa', address: 'Bole' },
  skillNames: ['React', 'Node.js'],
  softSkills: ['Communication'],
  languages: [{ name: 'English', level: 'Fluent' }],
  experienceDetails: [
    { title: 'Developer', company: 'Acme', startDate: '2020-01', endDate: '2021-01', description: 'Built things.' },
  ],
  educationDetails: [{ degree: "Bachelor's", institution: 'AAU', fieldOfStudy: 'CS' }],
  certificates: [{ name: 'AWS' }],
};

const seedInitialResume = (user) => {
  const seeded = buildResumeFromProfile(user);
  const sp = seeded.profile || {};
  return {
    id: 'resume_1',
    title: 'My CV',
    score: 0,
    status: 'draft',
    template: 'modern-ats',
    profile: {
      firstName: sp.firstName || '',
      lastName: sp.lastName || '',
      profession: sp.profession || '',
      streetAddress: sp.streetAddress || '',
      city: sp.city || '',
      phone: sp.phone || '',
      email: sp.email || '',
    },
    experience: {
      jobTitle: seeded.experience?.jobTitle || '',
      employer: seeded.experience?.employer || '',
      startDate: seeded.experience?.startDate || '',
      endDate: seeded.experience?.endDate || '',
      currentWork: false,
      duties: seeded.experience?.duties || '',
    },
    education: {
      schoolName: seeded.education?.schoolName || '',
      degree: seeded.education?.degree || '',
      fieldOfStudy: seeded.education?.fieldOfStudy || '',
    },
    projects: [{ title: '', description: '' }],
    skills: (seeded.skills || []).length ? seeded.skills : [],
    softSkills: seeded.softSkills || [],
    languages: seeded.languages || [],
    summary: { text: seeded.summary?.text || '' },
    certifications: seeded.certifications || [],
    additionalInfo: {},
    sectionOrder: [],
    dirtyFields: [],
  };
};

const withDirty = (resume, keys) => ({
  ...resume,
  dirtyFields: Array.from(new Set([...(resume.dirtyFields || []), ...(Array.isArray(keys) ? keys : [keys])])),
});

const fieldChange = (resume, section, field, value) => {
  if (section === 'skills' && field === 'value') {
    return withDirty({ ...resume, skills: value }, 'skills');
  }
  return withDirty({ ...resume, [section]: { ...resume[section], [field]: value } }, `${section}.${field}`);
};

describe('Template change = design change only', () => {
  it('switching template keeps all resume content identical', () => {
    let resume = seedInitialResume(userWithData);
    resume = fieldChange(resume, 'summary', 'text', 'UNIQUE SUMMARY BY USER');
    resume = fieldChange(resume, 'experience', 'jobTitle', 'UNIQUE JOB TITLE');
    resume = fieldChange(resume, 'education', 'schoolName', 'UNIQUE SCHOOL');

    const snapshot = JSON.stringify({
      profile: resume.profile,
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      certifications: resume.certifications,
      languages: resume.languages,
      additionalInfo: resume.additionalInfo,
    });

    // Simulate selecting Template A, B, C
    ['professional', 'minimal', 'classic'].forEach((tpl) => {
      const switched = { ...resume, template: tpl, theme: {} };
      expect(JSON.stringify({
        profile: switched.profile,
        summary: switched.summary,
        experience: switched.experience,
        education: switched.education,
        skills: switched.skills,
        certifications: switched.certifications,
        languages: switched.languages,
        additionalInfo: switched.additionalInfo,
      })).toBe(snapshot);
    });
  });

  it('refresh (re-hydration from profile) preserves user-edited resume content', () => {
    let resume = seedInitialResume(userWithData);
    resume = fieldChange(resume, 'summary', 'text', 'UNIQUE SUMMARY BY USER');
    resume = fieldChange(resume, 'experience', 'jobTitle', 'UNIQUE JOB TITLE');
    resume = fieldChange(resume, 'experience', 'employer', 'UNIQUE EMPLOYER');
    resume = fieldChange(resume, 'education', 'schoolName', 'UNIQUE SCHOOL');
    resume = fieldChange(resume, 'education', 'degree', 'UNIQUE DEGREE');

    const hydrated = hydrateResumeFromProfile(resume, userWithData);

    expect(hydrated.summary.text).toBe('UNIQUE SUMMARY BY USER');
    const expList = Array.isArray(hydrated.experience) ? hydrated.experience : [hydrated.experience];
    expect(expList[0].jobTitle).toBe('UNIQUE JOB TITLE');
    expect(expList[0].employer).toBe('UNIQUE EMPLOYER');
    const eduList = Array.isArray(hydrated.education) ? hydrated.education : [hydrated.education];
    expect(eduList[0].schoolName).toBe('UNIQUE SCHOOL');
    expect(eduList[0].degree).toBe('UNIQUE DEGREE');
  });
});
