// ============================================
// Cloudinary authenticated file access helpers
// ============================================
// Cloudinary accounts with the "Allow delivery of PDF files" security
// restriction enabled reject ALL unsigned delivery of stored PDFs (HTTP 401).
// Public delivery URLs are therefore NOT safe to fetch blindly server-side.
// These helpers reuse the exact mechanism proven for employer resume
// downloads: an Admin-API "download" request signed with CLOUDINARY_API_SECRET,
// so file bytes are obtained with server-side credentials only. The secret is
// never exposed beyond this process.
const { cloudinary } = require('../config/cloudinary');

const DOWNLOAD_TIMEOUT_MS = 30000;

// Safe diagnostics — metadata only, never URLs, CV content or personal data.
const diag = (label, meta = {}) => {
  try {
    console.info(`[cv-parser] ${label}`, JSON.stringify(meta));
  } catch {}
};

// Parse a Cloudinary delivery URL into resource type, public id and format.
// Returns null for non-Cloudinary URLs.
const parseCloudinaryUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!/res\.cloudinary\.com$/i.test(parsed.hostname)) return null;
    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIdx = segments.indexOf('upload');
    if (uploadIdx === -1) return null;
    const resourceType = segments[uploadIdx - 1];
    // Everything after 'upload', skipping any version (v123) segment
    let assetSegments = segments.slice(uploadIdx + 1);
    if (assetSegments.length && /^v\d+$/.test(assetSegments[0])) {
      assetSegments = assetSegments.slice(1);
    }
    if (!assetSegments.length) return null;
    const filename = assetSegments[assetSegments.length - 1];
    const lastDot = filename.lastIndexOf('.');
    const publicId = [
      ...assetSegments.slice(0, -1),
      lastDot !== -1 ? filename.slice(0, lastDot) : filename,
    ].join('/');
    return {
      resourceType,
      publicId,
      format: lastDot !== -1 ? filename.slice(lastDot + 1) : '',
    };
  } catch {
    return null;
  }
};

// Build the authenticated single-asset download URL (same recipe as the
// employer resume streaming route). For 'raw' resources Cloudinary stores the
// public id WITH its extension; for 'image' resources the extension is the
// format and the public id excludes it.
const buildSignedDownloadUrl = (info, timestamp = Math.floor(Date.now() / 1000)) => {
  const publicId =
    info.resourceType === 'raw' && info.format ? `${info.publicId}.${info.format}` : info.publicId;
  const params = { public_id: publicId, timestamp, type: 'upload' };
  if (info.format && info.resourceType !== 'raw') params.format = info.format;

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  const qs = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const url = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${info.resourceType}/download?${qs}&signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}`;
  return { url, publicId, resourceType: info.resourceType };
};

const isHttpUrl = (url) => {
  try {
    const scheme = new URL(url).protocol;
    return scheme === 'http:' || scheme === 'https:';
  } catch {
    return false;
  }
};

const timedFetch = async (url) => {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: err.name || 'network_error',
      headers: { get: () => null },
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  }
};

const extensionOf = (value) => {
  const clean = String(value || '').split(/[?#]/)[0];
  const name = clean.slice(clean.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot > -1 ? name.slice(dot).toLowerCase() : '';
};

// Download a stored CV/file as bytes:
//   1. Try the stored delivery URL directly (works when the account allows
//      public delivery and for data:/local test URLs).
//   2. On any HTTP error (401/403/...), retry via the secret-signed Cloudinary
//      download endpoint derived from the URL and/or cvPublicId.
// Returns { buffer, contentType, method, ext } where `ext` keeps the ORIGINAL
// filename extension so downstream format routing stays correct even when the
// signed endpoint serves extensionless paths.
const fetchStoredFileBuffer = async (fileUrl, { cvPublicId } = {}) => {
  let response = await timedFetch(fileUrl);
  if (response.ok) {
    const buffer = Buffer.from(await response.arrayBuffer());
    diag('download_ok', { method: 'direct', status: response.status, bytes: buffer.length });
    return {
      buffer,
      contentType: response.headers.get('content-type') || '',
      method: 'direct',
      ext: extensionOf(fileUrl),
    };
  }

  diag('download_http_error', { status: response.status, method: 'direct', willRetrySigned: true });

  if (!isHttpUrl(fileUrl)) throw new Error(`Unable to download resume file: ${response.statusText}`);

  // Candidate identities for the signed download, deduplicated per attempt.
  const candidates = [];
  const fromUrl = parseCloudinaryUrl(fileUrl);
  if (fromUrl) candidates.push(fromUrl);
  if (cvPublicId && typeof cvPublicId === 'string') {
    const ext = extensionOf(cvPublicId);
    candidates.push({ resourceType: 'raw', publicId: cvPublicId, format: ext ? ext.slice(1) : '' });
    if (!ext) candidates.push({ resourceType: 'raw', publicId: `${cvPublicId}.pdf`, format: 'pdf' });
    candidates.push({
      resourceType: 'image',
      publicId: ext ? cvPublicId.slice(0, cvPublicId.lastIndexOf('.')) : cvPublicId,
      format: '',
    });
  }

  const seen = new Set();
  let lastStatus = response.status;
  for (const candidate of candidates) {
    const key = `${candidate.resourceType}:${candidate.publicId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const signed = buildSignedDownloadUrl(candidate);
    response = await timedFetch(signed.url);
    lastStatus = response.status;
    if (!response.ok) {
      diag('download_http_error', { status: response.status, method: 'signed_download', resourceType: candidate.resourceType });
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    diag('download_ok', {
      method: 'signed_download',
      status: response.status,
      bytes: buffer.length,
      resourceType: candidate.resourceType,
      publicIdPresent: Boolean(candidate.publicId),
    });
    return {
      buffer,
      contentType: response.headers.get('content-type') || '',
      method: 'signed_download',
      ext: extensionOf(`${candidate.publicId}${candidate.format ? '.' + candidate.format : ''}`),
    };
  }

  throw new Error(`Unable to download resume file: status ${lastStatus}`);
};

module.exports = {
  parseCloudinaryUrl,
  buildSignedDownloadUrl,
  fetchStoredFileBuffer,
};
