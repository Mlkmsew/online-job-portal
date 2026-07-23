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

const parseResumeSkills = async (resumeUrl) => {
  const text = await extractTextFromResumeUrl(resumeUrl);
  const skills = await extractSkillsFromText(text);
  return { text, skills };
};

module.exports = { parseResumeSkills };
