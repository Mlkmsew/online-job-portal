const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Skill = require('../models/Skill');
const { escapeRegex } = require('./helpers');

const normalizeText = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9#+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getFileExtension = (url) => {
  try {
    const parsed = new URL(url);
    return path.extname(parsed.pathname).toLowerCase();
  } catch {
    return path.extname(url).toLowerCase();
  }
};

const parsePdfBuffer = async (buffer) => {
  const data = await pdfParse(buffer);
  return data?.text || '';
};

const parseDocxBuffer = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
};

const extractTextFromResumeUrl = async (resumeUrl) => {
  const response = await fetch(resumeUrl);
  if (!response.ok) {
    throw new Error(`Unable to download resume file: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = getFileExtension(resumeUrl);
  const contentType = response.headers.get('content-type') || '';

  if (ext === '.pdf' || contentType.includes('pdf')) {
    return parsePdfBuffer(buffer);
  }

  if (ext === '.docx' || contentType.includes('officedocument.wordprocessingml.document')) {
    return parseDocxBuffer(buffer);
  }

  if (ext === '.doc') {
    return parseDocxBuffer(buffer);
  }

  const text = buffer.toString('utf-8').trim();
  if (text) return text;

  throw new Error('Unsupported resume format or unreadable file.');
};

const extractSkillsFromText = async (text) => {
  if (!text || !text.trim()) return [];
  const normalized = normalizeText(text);
  const skills = await Skill.find();
  const matched = new Map();

  skills.forEach((skill) => {
    if (!skill.name) return;
    const normalizedName = normalizeText(skill.name);
    if (!normalizedName) return;
    const regex = new RegExp(`\\b${escapeRegex(normalizedName)}\\b`, 'i');
    if (regex.test(normalized)) {
      matched.set(skill._id.toString(), skill);
    }
  });

  return Array.from(matched.values());
};

const parseExperienceYears = (text) => {
  if (!text || !text.trim()) return null;
  const cleaned = text.toLowerCase();
  const yearMatches = [...cleaned.matchAll(/(\d+(?:\.\d+)?)\s*(?:\+?\s*)?(years?|yrs?|year)/g)];
  if (yearMatches.length > 0) {
    const numbers = yearMatches.map((match) => parseFloat(match[1])).filter(Number.isFinite);
    return numbers.length ? Math.max(...numbers) : null;
  }
  const altMatch = cleaned.match(/experience\s*(?:of)?\s*(\d+(?:\.\d+)?)/);
  return altMatch ? parseFloat(altMatch[1]) : null;
};

const parseEducation = (text) => {
  if (!text || !text.trim()) return [];
  const normalized = text.toLowerCase();
  const degrees = [
    'bachelor',
    'bsc',
    'b\.sc',
    'ba',
    'master',
    'msc',
    'm\.sc',
    'mba',
    'phd',
    'diploma',
    'certificate',
    'high school',
    'associate',
  ];
  const results = new Set();

  degrees.forEach((degree) => {
    const regex = new RegExp(`\\b${degree}\\b`, 'i');
    if (regex.test(normalized)) {
      results.add(degree.replace(/\\b/g, '').replace(/\\./g, '').toUpperCase());
    }
  });

  const customMatches = [...normalized.matchAll(/(bachelor(?: of [a-z ]+)?|master(?: of [a-z ]+)?|phd|diploma(?: in [a-z ]+)?|certificate(?: in [a-z ]+)?)/gi)];
  customMatches.forEach((match) => {
    results.add(match[1].trim());
  });

  return Array.from(results).slice(0, 6);
};

const parseCertifications = (text) => {
  if (!text || !text.trim()) return [];
  const normalized = text.toLowerCase();
  const certPatterns = [
    /certified in [a-z0-9 ]+/gi,
    /certificate in [a-z0-9 ]+/gi,
    /aws certified[ a-z]*/gi,
    /pmp/gi,
    /cisco [a-z0-9 ]+/gi,
  ];
  const results = new Set();

  certPatterns.forEach((pattern) => {
    const matches = normalized.match(pattern) || [];
    matches.forEach((value) => results.add(value.trim()));
  });

  return Array.from(results).slice(0, 6);
};

const parseLocation = (text) => {
  if (!text || !text.trim()) return null;
  const normalized = text.replace(/\r/g, ' ').replace(/\n/g, ' ');
  const locationMatch = normalized.match(/location[:\-\s]+([a-zA-Z0-9 ,.\-]+)/i);
  if (locationMatch && locationMatch[1]) {
    return locationMatch[1].trim();
  }
  const cityMatch = normalized.match(/(?:city|town|address)[:\-\s]+([a-zA-Z0-9 ,.\-]+)/i);
  if (cityMatch && cityMatch[1]) {
    return cityMatch[1].trim();
  }
  return null;
};

const parseResumeSkills = async (resumeUrl) => {
  const text = await extractTextFromResumeUrl(resumeUrl);
  const skills = await extractSkillsFromText(text);
  const experienceYears = parseExperienceYears(text);
  const education = parseEducation(text);
  const certifications = parseCertifications(text);
  const location = parseLocation(text);

  return {
    text,
    skills,
    experienceYears,
    education,
    certifications,
    location,
  };
};

module.exports = { parseResumeSkills };
