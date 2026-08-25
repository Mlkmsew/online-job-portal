const path = require('path');
const os = require('os');
const fs = require('fs');
const mammoth = require('mammoth');
const Skill = require('../models/Skill');
const { escapeRegex } = require('./helpers');
const { fetchStoredFileBuffer } = require('./cloudinaryFile');

// ── Tunables ─────────────────────────────────────────────────────────────
// Embedded text below this count is considered "insufficient" and triggers OCR.
const MIN_EMBEDDED_TEXT_CHARS = 32;

// Diagnostics helper — logs ONLY safe metadata, never CV content or personal data.
const diag = (label, meta = {}) => {
  try {
    console.info(`[cv-parser] ${label}`, JSON.stringify(meta));
  } catch {}
};

const normalizeText = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9#+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Legacy pdf-parse bundles pdf.js v1.10.100 (2018), which fails
// nondeterministically on modern Node ("bad XRef entry" / "Command token too
// long" on identical bytes). pdfjs-dist's maintained legacy build parses the
// same files reliably and is already installed.
let cachedPdfjs = null;
const loadPdfjs = async () => {
  if (!cachedPdfjs) {
    cachedPdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return cachedPdfjs;
};

let cachedCanvas = null;
const loadCanvas = async () => {
  if (!cachedCanvas) {
    cachedCanvas = await import('@napi-rs/canvas');
  }
  return cachedCanvas;
};

let cachedTesseract = null;
const loadTesseract = async () => {
  if (!cachedTesseract) {
    const mod = await import('tesseract.js');
    // The ESM namespace may expose the API directly or under .default.
    cachedTesseract = typeof mod.createWorker === 'function' || typeof mod.recognize === 'function' ? mod : mod.default;
  }
  return cachedTesseract;
};

let cachedPdfToImg = null;
const loadPdfToImg = async () => {
  if (!cachedPdfToImg) {
    const mod = await import('pdf-to-img');
    cachedPdfToImg = typeof mod.pdf === 'function' ? mod.pdf : mod.default?.pdf;
  }
  return cachedPdfToImg;
};

const parsePdfBuffer = async (buffer) => {
  const started = Date.now();
  const pdfjs = await loadPdfjs();
  // Suppress the non-fatal standard-font warning for text extraction.
  const verbosity = pdfjs.VerbosityLevel && pdfjs.VerbosityLevel.ERRORS;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, verbosity }).promise;
  let text = '';
  const pages = Math.min(doc.numPages || 0, 30); // safety cap
  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
    page.cleanup();
  }
  const pageCount = doc.numPages;
  await doc.destroy();
  diag('pdf_extracted', { bytes: buffer.length, chars: text.trim().length, pages: pageCount, ms: Date.now() - started });
  return { text, pages: pageCount };
};

// Full-page rasterization via pdf-to-img (pdfjs + @napi-rs/canvas under the
// hood, with the working Node recipe). Handles vector/composed pages such as
// "Microsoft Print To PDF" output, whose text has no usable encoding AND no
// embedded raster image — pdftotext returns 0 chars for those.
const MAX_OCR_PAGES = 5;
const rasterizePdfPages = async (buffer, maxPages) => {
  const pdfToImg = await loadPdfToImg();
  const doc = await pdfToImg(buffer, { scale: 3 });
  const pages = [];
  for await (const png of doc) {
    if (!png || !png.length) continue;
    pages.push({ png });
    if (pages.length >= maxPages) break;
  }
  return pages;
};

// Fallback for photo-scans: extract embedded image XObjects directly.
// NOTE: pdfjs-dist v4 page.render() produces BLANK canvases under Node
// (verified empirically; custom canvasFactory does not help), so instead of
// rasterizing we pull the image objects out of the operator list. Scanned CVs
// are exactly this: one full-page image per page, which is all OCR needs.
const MAX_OCR_IMAGES = 8;
const renderPdfPagesToImages = async (buffer, maxPages) => {
  const pdfjs = await loadPdfjs();
  const canvasModule = await loadCanvas();
  const OPS = pdfjs.OPS || {};
  const IMAGE_OPS = [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].filter(
    (v) => typeof v === 'number'
  );
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
  const pages = Math.min(doc.numPages || 0, maxPages);
  const images = [];

  const resolveImageObj = (page, name) =>
    new Promise((resolve) => {
      try {
        page.objs.get(name, resolve);
      } catch {
        try {
          page.commonObjs.get(name, resolve);
        } catch {
          resolve(null);
        }
      }
    });

  for (let p = 1; p <= pages && images.length < MAX_OCR_IMAGES; p++) {
    const page = await doc.getPage(p);
    try {
      const opList = await page.getOperatorList();
      for (let i = 0; i < opList.fnArray.length && images.length < MAX_OCR_IMAGES; i++) {
        if (!IMAGE_OPS.includes(opList.fnArray[i])) continue;
        let obj = opList.argsArray[i][0];
        if (typeof obj === 'string') obj = await resolveImageObj(page, obj);
        if (!obj || !obj.width || !obj.height || !obj.data) continue;

        const { createCanvas } = canvasModule;
        const w = obj.width;
        const h = obj.height;
        const canvas = createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        const imgData = ctx.createImageData(w, h);
        const px = imgData.data;
        if (obj.kind === 2) {
          // RGB_24BPP
          for (let s = 0, d = 0; s + 2 < obj.data.length; s += 3) {
            px[d++] = obj.data[s];
            px[d++] = obj.data[s + 1];
            px[d++] = obj.data[s + 2];
            px[d++] = 255;
          }
        } else if (obj.kind === 3) {
          // RGBA_32BPP
          px.set(obj.data.subarray ? obj.data.subarray(0, px.length) : obj.data.slice(0, px.length));
        } else {
          // GRAYSCALE_1BPP / image mask (packed bits, 0 = ink)
          const rowBytes = (w + 7) >> 3;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const byte = obj.data[y * rowBytes + (x >> 3)] || 0;
              const bit = (byte >> (7 - (x & 7))) & 1;
              const v = bit ? 255 : 0;
              const o = (y * w + x) * 4;
              px[o] = px[o + 1] = px[o + 2] = v;
              px[o + 3] = 255;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        images.push({ png: canvas.toBuffer('image/png') });
      }
    } catch (err) {
      diag('ocr_page_render_failed', { page: p, reason: String(err.message || err).slice(0, 100) });
    } finally {
      page.cleanup();
    }
  }
  const totalPages = doc.numPages;
  await doc.destroy();
  return { images, totalPages };
};

// Pre-process an image for OCR: convert to grayscale, stretch contrast,
// and binarize to clean black-on-white text.  Tesseract works best with
// high-contrast binary input; this recovers text from coloured backgrounds,
// low-contrast screenshots, and designer-template CVs.
const preprocessImageForOcr = async (pngBuffer) => {
  try {
    const canvasModule = await loadCanvas();
    const { createCanvas, loadImage } = canvasModule;
    if (typeof loadImage !== 'function') return pngBuffer;
    const img = await loadImage(pngBuffer);
    const w = img.width;
    const h = img.height;
    if (!w || !h) return pngBuffer;
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const px = imageData.data;

    // Pass 1: convert to grayscale and find brightness range.
    let min = 255;
    let max = 0;
    for (let i = 0; i < px.length; i += 4) {
      const gray = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
      px[i] = px[i + 1] = px[i + 2] = gray;
      if (gray < min) min = gray;
      if (gray > max) max = gray;
    }

    // Pass 2: contrast-stretch and binarize.
    const range = max - min || 1;
    for (let i = 0; i < px.length; i += 4) {
      const stretched = Math.round(((px[i] - min) / range) * 255);
      const bw = stretched > 128 ? 255 : 0;
      px[i] = px[i + 1] = px[i + 2] = bw;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toBuffer('image/png');
  } catch {
    return pngBuffer;
  }
};

// Real OCR via tesseract.js. Language data is downloaded once and cached in
// a temp dir. Per-page failures degrade gracefully instead of throwing.
const ocrImages = async (images) => {
  const tesseract = await loadTesseract();
  const cachePath = path.join(os.tmpdir(), 'ethiojob-ocr-cache');
  fs.mkdirSync(cachePath, { recursive: true });
  let text = '';
  // Prefer the persistent worker API (v2-v5); fall back to one-shot recognize.
  let worker = null;
  try {
    if (typeof tesseract.createWorker === 'function') {
      worker = await tesseract.createWorker('eng', 1, { cachePath });
    }
    for (const img of images) {
      try {
        const processed = await preprocessImageForOcr(img.png);
        const result = worker
          ? await worker.recognize(processed)
          : await tesseract.recognize(processed, 'eng', { cachePath });
        text += (result?.data?.text || '') + '\n';
      } catch (err) {
        diag('ocr_page_failed', { reason: String(err.message || err).slice(0, 100) });
      }
    }
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
  return text;
};

const extractTextFromResumeUrl = async (resumeUrl, options = {}) => {
  const started = Date.now();
  // Download through the shared authenticated layer: try the stored delivery
  // URL directly first; when the account blocks unsigned delivery (HTTP 401
  // for restricted PDFs) it transparently retries via the secret-signed
  // Cloudinary download endpoint. The API secret never leaves this process.
  const { buffer, contentType, ext } = await fetchStoredFileBuffer(resumeUrl, {
    cvPublicId: options.cvPublicId,
  });
  const looksLikePdf = buffer.length > 4 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';

  // Route on magic bytes too: raw-type storage (and some CDNs) serve PDFs
  // without a .pdf extension and with application/octet-stream — the %PDF-
  // header is the only reliable signal in that case.
  if (ext === '.pdf' || contentType.includes('pdf') || looksLikePdf) {
    // A CDN/proxy error page served as HTML would otherwise be handed to the
    // PDF parser and fail confusingly — reject it explicitly.
    if (!contentType.includes('pdf') && contentType.includes('text/html')) {
      diag('download_html_for_pdf', { bytes: buffer.length });
      throw new Error('Resume download returned an HTML error page instead of a PDF.');
    }

    let extracted;
    try {
      extracted = await parsePdfBuffer(buffer);
    } catch (err) {
      // Corrupted / unreadable text layer — still attempt OCR before giving up.
      diag('pdf_extract_failed', { bytes: buffer.length, reason: String(err.message || err).slice(0, 120) });
      extracted = { text: '', pages: 0 };
    }

    let { text, pages } = extracted;
    let textSource = 'embedded';
    const meta = { fileType: 'pdf', pages: pages || null, textSource, bytes: buffer.length };

    // Scanned / image-only / print-to-PDF CVs yield ~0 characters — fall back
    // to OCR over rasterized page images.
    if (text.trim().length < MIN_EMBEDDED_TEXT_CHARS) {
      diag('ocr_fallback_attempt', { embeddedChars: text.trim().length });
      try {
        // 1) Full-page rasterization (vector/composed pages, e.g. Print To PDF).
        let ocrPages = [];
        let renderedVia = 'rasterized';
        try {
          ocrPages = await rasterizePdfPages(buffer, MAX_OCR_PAGES);
          diag('rasterize_result', { pages: ocrPages.length });
        } catch (err) {
          diag('rasterize_failed', { reason: String(err.message || err).slice(0, 120) });
        }

        // 2) Fallback for photo-scans: embedded image XObjects.
        if (!ocrPages.length) {
          const { images, totalPages } = await renderPdfPagesToImages(buffer, MAX_OCR_PAGES);
          ocrPages = images;
          renderedVia = 'embedded_images';
          diag('xobject_extract', { totalPages, images: images.length });
        }

        let ocrText = await ocrImages(ocrPages);
        let ocrPageCount = ocrPages.length;

        // Full-page rasterization draws BLANK output for some image-only PDFs
        // under Node (vector pages work; embedded-image pages may not). When
        // the first pass yields too little text, top up with direct
        // embedded-XObject extraction, which handles photo-scans.
        if (ocrText.trim().length < MIN_EMBEDDED_TEXT_CHARS && renderedVia === 'rasterized') {
          try {
            const { images, totalPages } = await renderPdfPagesToImages(buffer, MAX_OCR_PAGES);
            diag('xobject_extract', { totalPages, images: images.length });
            if (images.length) {
              const more = await ocrImages(images);
              ocrText += '\n' + more;
              ocrPageCount += images.length;
            }
          } catch (err) {
            diag('xobject_extract_failed', { reason: String(err.message || err).slice(0, 120) });
          }
        }

        diag('ocr_result', { via: renderedVia, totalPages: pages, ocrPages: ocrPageCount, chars: ocrText.trim().length });
        if (ocrText.trim().length > text.trim().length) {
          text = ocrText;
          textSource = 'ocr';
          meta.textSource = 'ocr';
          meta.ocrRenderedPages = ocrPageCount;
        }
      } catch (err) {
        // OCR failure must never break the upload — degrade gracefully.
        diag('ocr_failed', { reason: String(err.message || err).slice(0, 120) });
      }
    }

    return { text, meta };
  }

  if (ext === '.docx' || contentType.includes('officedocument.wordprocessingml.document')) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    diag('docx_extracted', { bytes: buffer.length, chars: text.trim().length, ms: Date.now() - started });
    return { text, meta: { fileType: 'docx', pages: null, textSource: 'embedded', bytes: buffer.length } };
  }

  if (ext === '.doc') {
    const result = await mammoth.extractRawText({ buffer }).catch(() => ({ value: '' }));
    const text = result.value || '';
    diag('doc_extracted', { bytes: buffer.length, chars: text.trim().length });
    if (text.trim()) return { text, meta: { fileType: 'doc', pages: null, textSource: 'embedded', bytes: buffer.length } };
    throw new Error('Legacy .doc files could not be read. Please upload a PDF or DOCX.');
  }

  const text = buffer.toString('utf-8').trim();
  if (text) return { text, meta: { fileType: ext || 'txt', pages: null, textSource: 'embedded', bytes: buffer.length } };

  throw new Error('Unsupported resume format or unreadable file.');
};


// Canonical fallback skill names used ONLY when the DB Skill collection is
// empty (e.g. an environment where skills were never seeded). Mirrors
// utils/seeder.js plus the web stack commonly required by posted jobs, so a
// perfectly readable CV never parses to zero skills — and therefore zero job
// recommendations — just because the catalog table is unseeded.
// Matching uses the exact same normalization + word-boundary logic as DB docs.
const FALLBACK_SKILL_NAMES = [
  // IT / technical
  'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'PHP', 'Laravel',
  'MySQL', 'PostgreSQL', 'SQL', 'MongoDB', 'React', 'Angular', 'Vue',
  'HTML', 'CSS', 'AWS', 'Docker', 'Git',
  // Soft skills
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Time Management',
  // Business skills
  'Project Management', 'Data Analysis', 'Digital Marketing', 'Sales', 'Customer Service',
];

const extractSkillsFromText = async (text) => {
  if (!text || !text.trim()) return [];
  const normalized = normalizeText(text);
  let skills = [];
  let dbCatalogUsed = false;
  try {
    skills = await Skill.find();
    dbCatalogUsed = Array.isArray(skills) && skills.length > 0;
  } catch (err) {
    // A transient Skill-collection failure must not fail the whole upload —
    // the remaining signals (experience, education, title) still parse.
    diag('skill_db_error', { reason: String(err.message || err).slice(0, 100) });
  }
  const matched = new Map();
  const seen = new Set();

  const matchSkill = (name, doc) => {
    if (!name) return;
    const normalizedName = normalizeText(name);
    if (!normalizedName) return;
    if (seen.has(normalizedName)) return;
    const regex = new RegExp(`\\b${escapeRegex(normalizedName)}\\b`, 'i');
    if (regex.test(normalized)) {
      seen.add(normalizedName);
      matched.set(doc ? doc._id.toString() : normalizedName, doc || { name });
    }
  };

  skills.forEach((skill) => matchSkill(skill.name, skill));
  if (!dbCatalogUsed) FALLBACK_SKILL_NAMES.forEach((name) => matchSkill(name, null));

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

const parseProfessionalTitle = (text) => {
  if (!text || !text.trim()) return null;
  // Look for a headline near the top of the resume
  const firstLines = text.slice(0, 1200).replace(/\r/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const titlePatterns = [
    /(?:professional (?:title|summary)|job title|position|role)[:\-\s]+([a-z0-9 ,.\/&]+)/i,
    /^(?:senior|junior|lead|mid|entry)[ a-z]* (?:developer|engineer|designer|manager|analyst|specialist|consultant|officer|associate|administrator|accountant|nurse|teacher|scientist|architect|writer|coordinator)[ a-z]*$/i,
  ];
  for (let i = 0; i < Math.min(firstLines.length, 8); i++) {
    const line = firstLines[i];
    if (/^(senior|junior|lead|mid|entry|full stack|software|frontend|backend|devops|data|product|project|content|graphic|marketing|sales|human resources|hr|finance|accounting)/i.test(line)) {
      return line.length <= 60 ? line : null;
    }
    for (const pattern of titlePatterns) {
      const match = line.match(pattern);
      if (match && match[1] && match[1].length <= 60) return match[1].trim();
    }
  }
  return null;
};

const parseLanguages = (text) => {
  if (!text || !text.trim()) return [];
  const normalized = text.replace(/\r/g, ' ').replace(/\n/g, ' ');
  const known = ['amharic', 'english', 'oromo', 'afan oromo', 'tigrigna', 'tigrinya', 'somali', 'arabic', 'french', 'german', 'italian', 'spanish', 'swahili', 'chinese', 'hindi'];
  const found = new Set();
  known.forEach((lang) => {
    const re = new RegExp(`\\b${lang}\\b`, 'i');
    if (re.test(normalized)) found.add(lang.charAt(0).toUpperCase() + lang.slice(1));
  });
  return Array.from(found).slice(0, 5);
};

const parsePreferredJobTypes = (text) => {
  if (!text || !text.trim()) return [];
  const normalized = text.toLowerCase();
  const types = [];
  const typeMap = [
    { key: 'full time', match: /full[-\s]?time/ },
    { key: 'part time', match: /part[-\s]?time/ },
    { key: 'contract', match: /\bcontract\b/ },
    { key: 'internship', match: /\binternship\b/ },
    { key: 'freelance', match: /\bfreelance\b/ },
    { key: 'remote', match: /\bremote\b/ },
    { key: 'hybrid', match: /\bhybrid\b/ },
  ];
  typeMap.forEach(({ key, match }) => {
    if (match.test(normalized)) types.push(key);
  });
  return types.slice(0, 4);
};

const parseIndustry = (text) => {
  if (!text || !text.trim()) return null;
  const normalized = text.toLowerCase();
  const industries = [
    'information technology', 'software', 'technology', 'healthcare', 'health', 'finance',
    'banking', 'education', 'engineering', 'agriculture', 'marketing', 'sales',
    'construction', 'telecommunication', 'media', 'logistics', 'transport', 'manufacturing',
    'hospitality', 'government', 'legal', 'customer service',
  ];
  for (const industry of industries) {
    if (normalized.includes(industry)) {
      return industry.charAt(0).toUpperCase() + industry.slice(1);
    }
  }
  return null;
};

const parseResumeSkills = async (resumeUrl, options = {}) => {
  const extracted = await extractTextFromResumeUrl(resumeUrl, options);
  const text = typeof extracted === 'string' ? extracted : extracted.text;
  const extractionMeta = typeof extracted === 'string' ? null : extracted.meta;
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
    professionalTitle: parseProfessionalTitle(text),
    languages: parseLanguages(text),
    preferredJobTypes: parsePreferredJobTypes(text),
    industry: parseIndustry(text),
    __meta: extractionMeta,
  };
};

module.exports = { parseResumeSkills, extractTextFromResumeUrl, extractSkillsFromText };
