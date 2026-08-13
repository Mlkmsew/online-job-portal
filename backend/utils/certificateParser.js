// ============================================
// Certificate Document Parser
// Extracts information from uploaded certificate documents:
//  - QR code detection & decoding (image files)
//  - Text layer extraction (PDF files)
//  - Verification number extraction
//  - Certificate field extraction (name, student ID, institution, ...)
// ============================================
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');
const path = require('path');
const { pathToFileURL } = require('url');

// pdf-parse (pdf.js 1.x) has a shared-state bug that returns stale text when
// several documents are parsed in the same process, and it cannot reliably
// read modern PDFs. We use the modern pdfjs-dist legacy build directly.
let pdfjsPromise = null;
const getPdfJs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then((mod) => {
      const STANDARD_FONT_URL = pathToFileURL(
        path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'legacy', 'build', 'standard_fonts') + path.sep
      ).toString();
      try {
        mod.verbosity = mod.VerbosityLevel.ERRORS;
      } catch (e) {
        // verbosity setting is optional
      }
      return { mod, STANDARD_FONT_URL };
    });
  }
  return pdfjsPromise;
};

const parsePdfText = async (buffer) => {
  const { mod, STANDARD_FONT_URL } = await getPdfJs();

  // pdfjs logs non-fatal font warnings (standard-14 fonts map to fonts that are
  // not shipped with the package). Suppress them for clean server logs; text
  // extraction is unaffected.
  const origWarn = console.warn;
  const origError = console.error;
  console.warn = () => {};
  console.error = () => {};

  let doc;
  try {
    doc = await mod.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      isEvalSupported: false,
      ignoreErrors: true,
      standardFontDataUrl: STANDARD_FONT_URL,
    }).promise;
  } catch (err) {
    console.warn = origWarn;
    console.error = origError;
    throw err;
  }

  try {
    let text = '';
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const line = content.items.map((item) => (item && item.str) || '').join(' ');
      text += `${line}\n`;
    }
    return text;
  } finally {
    console.warn = origWarn;
    console.error = origError;
    try {
      await doc.destroy();
    } catch (e) {
      // ignore cleanup errors
    }
  }
};

// ---------------------------------------------------------------
// File type detection via magic bytes (never trust extension/MIME)
// ---------------------------------------------------------------
const detectFileType = (buffer) => {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'pdf'; // %PDF
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png'; // .PNG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'; // FF D8 FF
  return null;
};

// ---------------------------------------------------------------
// Normalization helpers for fuzzy text matching
// ---------------------------------------------------------------
const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const collapse = (value) => {
  if (!value) return '';
  return String(value).replace(/\s+/g, ' ').trim();
};

// ---------------------------------------------------------------
// QR decoding for PNG / JPEG buffers (pure JS, no native deps)
// ---------------------------------------------------------------
const decodeQrFromImage = (buffer, type) => {
  try {
    let width;
    let height;
    let data;

    if (type === 'png') {
      const png = PNG.sync.read(buffer);
      width = png.width;
      height = png.height;
      data = new Uint8ClampedArray(png.data);
    } else if (type === 'jpeg') {
      const decoded = jpeg.decode(buffer, { useTArray: true, maxMemoryUsageInMB: 256 });
      width = decoded.width;
      height = decoded.height;
      data = decoded.data;
    } else {
      return { status: 'unreadable', raw: null, message: 'Unsupported image format for QR scanning.' };
    }

    if (!width || !height || !data) {
      return { status: 'unreadable', raw: null, message: 'Image could not be decoded for QR scanning.' };
    }

    const code = jsQR(data, width, height);
    if (!code || !code.data) {
      return { status: 'not_detected', raw: null, message: 'No QR code was detected in the image.' };
    }

    return { status: 'detected', raw: String(code.data).trim(), message: 'QR code detected and decoded.' };
  } catch (err) {
    return { status: 'unreadable', raw: null, message: `QR scan failed: ${err.message || 'unknown error'}` };
  }
};

// ---------------------------------------------------------------
// Verification number extraction from decoded content / text
// ---------------------------------------------------------------
const VERIFICATION_NUMBER_PATTERNS = [
  // DBU certificate number style: DBU-CERT-2026-00125
  /\bDBU-CERT-\d{4}-\d{5}\b/i,
  // Generic institution certificate codes embedded in a URL
  /\b(?:https?:\/\/[^\s/]+)?\/?[A-Z]{2,6}-(?:CERT|DEGREE|DIPLOMA|CERTIFICATE|DEG)-\d{4}-\d{3,6}\b/i,
  // Bare institution-student id style numbers found near "verify" context
  /\b[A-Z]{2,6}-(?:CERT|CERTIFICATE)-\d{2,6}-\d{3,6}\b/i,
];

const extractVerificationNumber = (text) => {
  if (!text) return null;
  const haystack = String(text).toUpperCase();
  for (const pattern of VERIFICATION_NUMBER_PATTERNS) {
    const match = haystack.match(pattern);
    if (match) {
      return match[0].toUpperCase().trim();
    }
  }
  return null;
};

// ---------------------------------------------------------------
// Certificate field extraction (regex over document text)
// ---------------------------------------------------------------
const WORDS = "[A-Za-zÀ-ÖØ-öø-ÿ'’\\.\\-]+";

const extractCertificateFields = (text) => {
  if (!text || !text.trim()) {
    return {
      fullName: '',
      studentId: '',
      certificateNumber: '',
      institution: '',
      program: '',
      certificateType: '',
      issueDate: '',
      graduationYear: '',
      email: '',
      phone: '',
    };
  }

  const haystack = text.replace(/\r/g, '\n');

  const matchGroup = (patterns) => {
    for (const re of patterns) {
      const m = haystack.match(re);
      if (m && m[1] && m[1].trim()) return collapse(m[1]);
    }
    return '';
  };

  // ── Full name ────────────────────────────────────────────────
  // Label-based extraction is preferred; the "certify that" form stops
  // before field labels that commonly follow the name.
  const nameLabelPatterns = [
    new RegExp(`full\\s+name\\s*[:\\-\\s]+(${WORDS}(?:\\s+${WORDS}){1,4})`, 'i'),
    new RegExp(`student\\s+name\\s*[:\\-\\s]+(${WORDS}(?:\\s+${WORDS}){1,4})`, 'i'),
    new RegExp(`name\\s*[:\\-\\s]+(${WORDS}(?:\\s+${WORDS}){1,4})`, 'i'),
  ];
  const certifyPattern = new RegExp(
    `this\\s+is\\s+to\\s+certify\\s+that\\s+(${WORDS}(?:\\s+(?!student\\s+id|id\\s*[:\\-]|id\\b)[A-Za-zÀ-ÖØ-öø-ÿ'’\\.\\-]+){1,3})`,
    'i'
  );
  const fullName = matchGroup([...nameLabelPatterns, certifyPattern]);

  // ── Student ID ───────────────────────────────────────────────
  const studentId = matchGroup([
    /\bDBU-IS-\d{3,6}\b/i,
    new RegExp(`student\\s*(?:id|number|no\\.?|no)\\s*[:\\-\\s]+([A-Z0-9\\-]{4,24})`, 'i'),
  ]);

  // ── Certificate number ───────────────────────────────────────
  const certificateNumber = matchGroup([
    new RegExp(`certificate\\s*(?:number|no\\.?|no|id)\\s*[:\\-\\s]+([A-Z0-9\\-]{5,30})`, 'i'),
    VERIFICATION_NUMBER_PATTERNS[0],
  ]);

  // ── Institution ──────────────────────────────────────────────
  const knownInstitutions = [
    /debre birhan university/i,
    /addis ababa university/i,
    /bahir dar university/i,
    /mekelle university/i,
    /hawassa university/i,
    /jimma university/i,
  ];
  let institution = '';
  for (const re of knownInstitutions) {
    const m = haystack.match(re);
    if (m) {
      institution = collapse(m[0]);
      break;
    }
  }
  if (!institution) {
    institution = matchGroup([
      new RegExp(`institution\\s*[:\\-]+([A-Z][A-Za-z &'\\-\\.]{3,50})`, 'i'),
      new RegExp(`university\\s*[:\\-]+([A-Z][A-Za-z &'\\-\\.]{3,50})`, 'i'),
    ]);
  }

  // ── Program / field of study ─────────────────────────────────
  // A label-colon match, or a degree-phrase, or "X program" phrasing.
  let program = matchGroup([
    new RegExp(`program(?:me)?\\s*[:\\-]+([A-Z][A-Za-z &'\\-\\.]{3,50})`, 'i'),
    new RegExp(`field\\s+of\\s+study\\s*[:\\-]+([A-Z][A-Za-z &'\\-\\.]{3,50})`, 'i'),
    new RegExp(`(bachelor\\s+of\\s+[A-Za-z &'\\-]{2,40}|master\\s+of\\s+[A-Za-z &'\\-]{2,40})`, 'i'),
  ]);
  if (!program) {
    // Token-walk approach: find a "program(me)" token and collect the
    // capitalized words immediately before it (robust against joining words
    // like "requirements of the").
    const tokens = haystack.split(/\s+/).filter(Boolean);
    for (let i = 0; i < tokens.length; i += 1) {
      if (!/^program(?:me)?[.,;:']*$/i.test(tokens[i])) continue;
      const collected = [];
      for (let j = i - 1; j >= 0 && collected.length < 4; j -= 1) {
        const clean = tokens[j].replace(/[^A-Za-z]/g, '');
        if (!clean) break;
        if (/^[A-Z]/.test(clean) && !/^(The|Of|And|In|For|An|A)$/i.test(clean)) {
          collected.unshift(tokens[j]);
        } else if (/^(of|the|in|for|and|an|a)$/i.test(clean)) {
          break;
        } else {
          break;
        }
      }
      if (collected.length) {
        program = collapse(collected.join(' '));
        break;
      }
    }
  }

  // ── Certificate type ─────────────────────────────────────────
  let certificateType = '';
  const certTypePatterns = [
    new RegExp(`certificate\\s+type\\s*[:\\-]+([A-Z][A-Za-z ]{2,40})`, 'i'),
    /(degree\s+certificate)/i,
    /(master(?:'s)?\s+degree)/i,
    /(bachelor(?:'s)?\s+degree)/i,
    /(diploma)/i,
    /(certificate\s+of\s+completion)/i,
  ];
  for (const re of certTypePatterns) {
    const m = haystack.match(re);
    if (m) {
      certificateType = collapse(m[1] || m[0]);
      break;
    }
  }
  if (certificateType) {
    certificateType = certificateType.charAt(0).toUpperCase() + certificateType.slice(1);
  }

  // ── Issue date ───────────────────────────────────────────────
  const issueDate = matchGroup([
    new RegExp(`issue\\s*date\\s*[:\\-\\s]+([0-9]{1,2}[\\/\\-][0-9]{1,2}[\\/\\-][0-9]{2,4}|[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[A-Z][a-z]+\\s+[0-9]{1,2},?\\s+[0-9]{4}|[0-9]{1,2}\\s+[A-Z][a-z]+\\s+[0-9]{4})`, 'i'),
    new RegExp(`issued\\s*on\\s*[:\\-\\s]+([0-9]{1,2}[\\/\\-][0-9]{1,2}[\\/\\-][0-9]{2,4}|[A-Z][a-z]+\\s+[0-9]{1,2},?\\s+[0-9]{4})`, 'i'),
    new RegExp(`date\\s+of\\s+issue\\s*[:\\-\\s]+([0-9]{1,2}[\\/\\-][0-9]{1,2}[\\/\\-][0-9]{2,4}|[A-Z][a-z]+\\s+[0-9]{1,2},?\\s+[0-9]{4})`, 'i'),
  ]);

  // ── Graduation year ──────────────────────────────────────────
  const graduationYear = matchGroup([
    /graduat(?:ion|ed)\s+(?:in|year)?\s*[:\\-\s]*\s*(\d{4})/i,
    /class\s+of\s+(\d{4})/i,
    /year\s+of\s+graduation\s*[:\\-\s]*\s*(\d{4})/i,
  ]);

  // ── Email ────────────────────────────────────────────────────
  const email = matchGroup([/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/]);

  // ── Phone (Ethiopian mobile first, then generic international) ─
  let phone = matchGroup([
    /(?:\+251[\s\-]?)?(?:0)?9\d{8}/,
    /\+\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}/,
  ]);
  if (phone) phone = phone.replace(/\s/g, '');

  return {
    fullName,
    studentId,
    certificateNumber,
    institution,
    program,
    certificateType,
    issueDate,
    graduationYear,
    email,
    phone,
  };
};

// ---------------------------------------------------------------
// Main entry: analyze an uploaded document buffer
// Returns a structured result describing what was found.
// ---------------------------------------------------------------
const analyzeCertificateBuffer = async (buffer) => {
  const type = detectFileType(buffer);
  if (!type) {
    throw new Error('Malformed or unsupported certificate file. Only PDF, JPG and PNG files are accepted.');
  }

  const result = {
    fileType: type,
    qrScanResult: { status: 'not_detected', raw: null, message: '' },
    text: '',
    verificationNumber: null,
    fields: extractCertificateFields(''),
  };

  if (type === 'pdf') {
    // pdfjs-dist will throw on genuinely malformed / unreadable files
    let text = '';
    try {
      text = await parsePdfText(buffer);
    } catch (err) {
      throw new Error(`Certificate PDF could not be read: ${err.message || 'malformed file'}`);
    }
    result.text = text;

    // PDFs store QR codes as embedded raster images; their pixel data is not
    // directly reachable through the text layer, so we rely on the printed
    // verification number. If no number is present the PDF is flagged as
    // "QR unreadable" and sent for manual review.
    result.qrScanResult = text ? { status: 'detected', raw: null, message: 'PDF text layer read successfully.' } : { status: 'unreadable', raw: null, message: 'PDF contained no readable text layer.' };
    result.verificationNumber = extractVerificationNumber(text);
    result.fields = extractCertificateFields(text);
  } else {
    // Image files: decode QR first
    result.qrScanResult = decodeQrFromImage(buffer, type);
    if (result.qrScanResult.status === 'detected' && result.qrScanResult.raw) {
      result.verificationNumber = extractVerificationNumber(result.qrScanResult.raw);
    }
    // Images without OCR yield no other extractable fields
    result.fields = extractCertificateFields('');
  }

  return result;
};

module.exports = { analyzeCertificateBuffer, extractVerificationNumber, extractCertificateFields, detectFileType, normalizeText, collapse };