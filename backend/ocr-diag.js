const fs = require('fs');
const path = require('path');
const os = require('os');
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
process.env.NODE_ENV = 'development';

const TARGET_TERMS = ['javascript', 'node', 'html', 'css', 'teamwork', 'adaptability', 'communication', 'time management'];

(async () => {
  const { fetchStoredFileBuffer } = require('./utils/cloudinaryFile');
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ role: 'jobseeker' }).toArray();
  const owner = users.find(u => u.resumeAnalysis && u.cvPublicId && u.resumeAnalysis.cvId === u.cvPublicId);
  if (!owner) { console.log('no owner'); process.exit(0); }

  const { buffer } = await fetchStoredFileBuffer(owner.cv, { cvPublicId: owner.cvPublicId });
  console.log('downloaded:', buffer.length, 'bytes');

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfToImgMod = await import('pdf-to-img');
  const pdfToImg = typeof pdfToImgMod.pdf === 'function' ? pdfToImgMod.pdf : pdfToImgMod.default?.pdf;
  const tesseract = await import('tesseract.js');

  for (const scale of [2, 3, 4]) {
    console.log(`\n=== SCALE ${scale} ===`);
    try {
      const doc = await pdfToImg(buffer, { scale });
      const pages = [];
      for await (const png of doc) {
        if (png && png.length) pages.push(png);
      }
      console.log('pages:', pages.length, '| page bytes:', pages.map(p => p.length));

      const worker = await tesseract.createWorker('eng', 1, { cachePath: path.join(os.tmpdir(), 'ethiojob-ocr-cache') });
      let fullText = '';
      for (let i = 0; i < pages.length; i++) {
        const result = await worker.recognize(pages[i]);
        const text = result?.data?.text || '';
        fullText += text + '\n';
      }
      await worker.terminate();

      const words = fullText.toLowerCase();
      console.log('total chars:', fullText.trim().length);
      for (const term of TARGET_TERMS) {
        console.log(`  ${term}: ${words.includes(term) ? 'FOUND' : 'MISSING'}`);
      }
    } catch (err) {
      console.log('ERROR:', err.message);
    }
  }

  await mongoose.disconnect();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
