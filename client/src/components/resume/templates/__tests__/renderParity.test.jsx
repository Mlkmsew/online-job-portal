import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getTemplateDefinitions, getTemplateComponent } from '../config';
import { getResumeThemeColor } from '../templateUtils';

const userResume = {
  id: 'r1',
  template: 'professional',
  theme: { color: 'blue', primaryColor: '#2563eb' },
  profile: {
    firstName: 'ActualFirstNameXYZ',
    middleName: '',
    lastName: 'ActualLastNameXYZ',
    profession: 'ActualProfessionXYZ',
    email: 'actual.user@example.com',
    phone: '+2519actual0000',
    city: 'ActualCity',
    streetAddress: 'ActualStreet',
    nationality: 'Ethiopian',
    linkedIn: 'actual-linkedin',
  },
  summary: { text: 'Actual summary line one.\nActual summary line two.' },
  experience: {
    jobTitle: 'ActualJobTitleXYZ',
    employer: 'ActualEmployerXYZ',
    startDate: '2020',
    endDate: '2023',
    city: 'ActualCity',
    duties: 'Actual duty bullet one.\nActual duty bullet two.',
  },
  education: {
    schoolName: 'ActualSchoolXYZ',
    degree: 'BSc',
    fieldOfStudy: 'ActualFieldXYZ',
    startDate: '2015',
    endDate: '2019',
  },
  skills: [{ name: 'ActualSkillXYZ', level: 'Expert' }],
  softSkills: ['ActualSoftSkillXYZ'],
  languages: [{ name: 'ActualLanguageXYZ', level: 'Fluent' }],
  certifications: [{ name: 'ActualCertXYZ', issuer: 'Issuer', year: '2024' }],
  projects: [{ title: 'ActualProjectXYZ', description: 'Actual project description.' }],
  photo: null,
};

const DEMO_STRINGS = [
  'Melkamsew',
  'Alehegn',
  'Information Systems Student',
  'Debre Birhan University',
  'DBU Eduflow',
  'Your Profession',
  'Add a summary.',
  'Write a short career objective',
  'Sample',
  'Lorem',
];

describe('template render parity (templates render only user data)', () => {
  getTemplateDefinitions().forEach((def) => {
    it(`renders only user data with ${def.id}`, () => {
      const Component = getTemplateComponent(def.id);
      const color = getResumeThemeColor(userResume, def);
      const html = renderToStaticMarkup(Component({ resume: userResume, color }));

      expect(html).toContain('ActualFirstNameXYZ');
      expect(html).toContain('ActualLastNameXYZ');
      // Every populated section must appear regardless of template
      expect(html).toContain('Actual summary line one.');
      expect(html).toContain('ActualJobTitleXYZ');
      expect(html).toContain('ActualEmployerXYZ');
      expect(html).toContain('ActualSchoolXYZ');
      expect(html).toContain('ActualSkillXYZ');
      expect(html).toContain('ActualSoftSkillXYZ');
      expect(html).toContain('ActualLanguageXYZ');
      expect(html).toContain('ActualCertXYZ');
      expect(html).toContain('ActualProjectXYZ');

      DEMO_STRINGS.forEach((demo) => {
        expect(html).not.toContain(demo);
      });
    });
  });

  it('preserves user line breaks in the summary when rendered (Professional)', () => {
    const Component = getTemplateComponent('professional');
    const color = getResumeThemeColor(userResume, getTemplateDefinitions().find((d) => d.id === 'professional'));
    const html = renderToStaticMarkup(Component({ resume: userResume, color }));
    expect(html).toContain('Actual summary line one.\nActual summary line two.');
  });
});

const extremeResume = {
  id: 'r2',
  template: 'professional',
  theme: { color: 'blue', primaryColor: '#2563eb' },
  profile: {
    firstName: 'ExtremeLongFirstNameThatNeverStopsAndKeepsGoing',
    middleName: '',
    lastName: 'ExtremeLongLastNameWithoutAnySpacesInsideItAtAll',
    profession: 'X'.repeat(400),
    email: 'super.long.unbroken.email.address.that.has.no.spaces@very-long-subdomain-name.example-company-name.com',
    phone: 'Y'.repeat(80),
    city: 'C'.repeat(200),
  },
  summary: { text: `${'This is a very long sentence that keeps going and wraps naturally. '.repeat(8)}\n${'Z'.repeat(1200)}` },
  experience: {
    jobTitle: 'W'.repeat(150),
    employer: 'V'.repeat(150),
    startDate: '2020',
    endDate: '2024',
    duties: `${'A typical duty description with several words and then a break. '.repeat(6)}\n${'U'.repeat(900)}`,
  },
  education: {
    schoolName: 'T'.repeat(150),
    degree: 'Bachelor of Science in Extraordinarily Long Field',
    fieldOfStudy: 'Q'.repeat(160),
  },
  skills: [
    { name: 'A'.repeat(300), level: 'Expert' },
    { name: 'React', level: 'Expert' },
  ],
  softSkills: ['S'.repeat(250)],
  languages: [{ name: 'E'.repeat(120), level: 'Fluent' }],
  certifications: [{ name: 'C'.repeat(180), issuer: 'Issuer', year: '2024' }],
  projects: [{ title: 'P'.repeat(140), description: `${'Project description that keeps going and going and going. '.repeat(5)}\n${'D'.repeat(700)}` }],
  additionalInfo: {
    awards: { title: 'Awards', items: [{ title: 'A'.repeat(100), description: 'F'.repeat(400) }] },
    custom: { title: 'Custom Section', items: [{ title: 'Custom Item', description: `${'Custom description text. '.repeat(4)}${'G'.repeat(800)}` }] },
  },
  sectionOrder: ['awards', 'custom'],
  photo: null,
};

const emptyResume = {
  id: 'r3',
  template: 'professional',
  theme: { color: 'blue', primaryColor: '#2563eb' },
  profile: { firstName: '', lastName: '', email: '', phone: '', profession: '', city: '' },
  summary: { text: '' },
  experience: { jobTitle: '', employer: '', duties: '' },
  education: { schoolName: '', degree: '', fieldOfStudy: '' },
  skills: [],
  softSkills: [],
  languages: [],
  certifications: [],
  projects: [],
  additionalInfo: {},
  photo: null,
};

describe('text-wrapping safety (all templates, all text fields)', () => {
  getTemplateDefinitions().forEach((def) => {
    it(`renders extreme long text without failing with ${def.id}`, () => {
      const Component = getTemplateComponent(def.id);
      const color = getResumeThemeColor(extremeResume, def);
      const html = renderToStaticMarkup(Component({ resume: extremeResume, color }));

      expect(html).toContain('ExtremeLongFirstNameThatNeverStopsAndKeepsGoing');
      expect(html.length).toBeGreaterThan(100);
      DEMO_STRINGS.forEach((demo) => {
        expect(html).not.toContain(demo);
      });
    });

    it(`renders empty fields without demo fallbacks with ${def.id}`, () => {
      const Component = getTemplateComponent(def.id);
      const color = getResumeThemeColor(emptyResume, def);
      const html = renderToStaticMarkup(Component({ resume: emptyResume, color }));

      DEMO_STRINGS.forEach((demo) => {
        expect(html).not.toContain(demo);
      });
    });
  });

  it('the shared template CSS includes global wrapping rules', () => {
    const css = readFileSync(join(process.cwd(), 'src/components/resume/templates/shared.css'), 'utf8');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('word-break: break-word');
    expect(css).toContain('min-width: 0');
    expect(css).toContain('max-width: 100%');
  });
});
