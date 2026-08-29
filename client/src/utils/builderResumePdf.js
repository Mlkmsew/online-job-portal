// ============================================
// Builder Resume -> PDF helpers
// -------------------------------------------------
// Shared utilities for turning a Resume Builder CV (structured JSON) into a
// plain-text PDF File that can be submitted to the applications API. This lets
// "Quick Apply" and the full apply flow both leverage a built resume without
// requiring a separately uploaded CV file.
// ============================================

const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\s+/g, ' ')
    .trim();

export const resumeToTextLines = (resume) => {
  const lines = [];
  const push = (value) => {
    const text = escapePdfText(value);
    if (text) lines.push(text);
  };

  const profile = resume?.profile || {};
  push([profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' '));
  push([profile.jobTitle, profile.headline].filter(Boolean).join(' - '));
  push([profile.email, profile.phone].filter(Boolean).join(' | '));
  push([profile.city, profile.address].filter(Boolean).join(', '));
  if (resume?.summary) push(typeof resume.summary === 'string' ? resume.summary : resume.summary?.text);

  const addSection = (title, items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    lines.push(title.toUpperCase());
    items.forEach((item) => {
      if (typeof item === 'string') {
        push(item);
      } else if (item && typeof item === 'object') {
        const heading = [
          item.role || item.position || item.degree || item.title,
          item.company || item.institution || item.organization,
          item.startDate,
          item.endDate,
          item.level,
        ].filter(Boolean).join(' - ');
        push(heading);
        push(item.description || item.summary || item.details);
      }
    });
  };

  addSection('EXPERIENCE', resume?.experience);
  addSection('EDUCATION', resume?.education);
  addSection('PROJECTS', resume?.projects);
  addSection('CERTIFICATIONS', resume?.certifications);
  addSection('LANGUAGES', resume?.languages);

  const skills = resume?.skills;
  if (skills) {
    lines.push('SKILLS');
    if (Array.isArray(skills)) {
      skills.forEach((s) => push(typeof s === 'string' ? s : s?.name || s?.skill));
    } else if (typeof skills === 'object' && skills !== null) {
      Object.entries(skills).forEach(([key, value]) => {
        const list = Array.isArray(value) ? value.join(', ') : String(value ?? '');
        if (list.trim()) push(`${key}: ${list}`);
      });
    }
  }

  return lines;
};

export const createTextPdf = (textLines, title = 'Resume') => {
  const safeLines = (textLines || []).filter(Boolean);
  if (!safeLines.length) {
    throw new Error('Cannot generate a resume PDF with empty content.');
  }
  const streamContent = `BT
/F1 11 Tf
50 780 Td
15 TL
${safeLines.map((line) => `(${line}) Tj\nT*`).join('\n')}
ET`;
  const objects = [];
  let offset = 0;

  const write = (obj) => {
    const body = `${obj}\n`;
    objects.push({ offset, body });
    offset += body.length;
  };

  write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  write('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  write('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
  write(`4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  write('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  objects.forEach((o) => {
    xref += `${String(o.offset).padStart(10, '0')} 00000 n \n`;
  });
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const pdf = `%PDF-1.4\n${objects.map((o) => o.body).join('')}${xref}${trailer}`;
  return new File([pdf], `${title.replace(/[^\w-]+/g, '_') || 'Resume'}.pdf`, { type: 'application/pdf' });
};

// Resolve the user's builder resumes from localStorage (mirrors JobApply.jsx).
export const getBuilderResumes = (userId) => {
  try {
    const token = localStorage.getItem('token') || 'guest';
    const storageKey = `ethiojob_resumes_${userId || token}`;
    const stored = localStorage.getItem(storageKey);
    const legacy = localStorage.getItem('ethiojob_resumes');
    const parsed = stored ? JSON.parse(stored) : legacy ? JSON.parse(legacy) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getActiveBuilderResume = (userId) => {
  try {
    const token = localStorage.getItem('token') || 'guest';
    const storageKey = `ethiojob_active_cv_${userId || token}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Returns the most appropriate built resume: the active one if set, otherwise
// the first stored builder resume. Null when the user has built nothing.
export const getPreferredBuilderResume = (userId) => {
  const active = getActiveBuilderResume(userId);
  if (active) return active;
  const resumes = getBuilderResumes(userId);
  return resumes.length > 0 ? resumes[0] : null;
};

// Build a PDF File from a builder resume, throwing if it has no content.
export const buildResumePdf = (resume) => {
  const lines = resumeToTextLines(resume);
  if (!lines.length) {
    throw new Error('This builder resume has no content.');
  }
  return createTextPdf(lines, resume?.title || 'Resume');
};
