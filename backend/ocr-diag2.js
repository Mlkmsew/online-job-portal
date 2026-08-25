const fs = require('fs');
const path = require('path');
const os = require('os');
for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
process.env.NODE_ENV = 'development';

(async () => {
  const { fetchStoredFileBuffer } = require('./utils/cloudinaryFile');
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ role: 'jobseeker' }).toArray();
  const owner = users.find(u => u.resumeAnalysis && u.cvPublicId && u.resumeAnalysis.cvId === u.cvPublicId);
  if (!owner) { console.log('no owner'); process.exit(0); }

  const { buffer } = await fetchStoredFileBuffer(owner.cv, { cvPublicId: owner.cvPublicId });
  console.log('PDF bytes:', buffer.length);

  // Check PDF structure
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
  console.log('numPages:', doc.numPages);

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    console.log(`page ${p}: ${Math.round(vp.width)}x${Math.round(vp.height)} pts`);
    const content = await page.getTextContent();
    const textItems = content.items || [];
    console.log(`  text items: ${textItems.length}`);
    const pageText = textItems.map(it => it.str).join(' ');
    console.log(`  embedded chars: ${pageText.length}`);
    // Show unique words for skill detection
    const words = pageText.toLowerCase().split(/\s+/);
    const unique = [...new Set(words)].filter(w => w.length > 2);
    console.log(`  unique words (>2 chars): ${unique.length}`);
    // Check for target words
    const fullLower = pageText.toLowerCase();
    for (const t of ['javascript','node','html','css','teamwork','adaptability','communication','time']) {
      if (fullLower.includes(t)) console.log(`    embedded has: ${t}`);
    }
    page.cleanup();
  }
  await doc.destroy();

  // Now test rasterization with pdf-to-img
  const pdfToImgMod = await import('pdf-to-img');
  const pdfToImg = typeof pdfToImgMod.pdf === 'function' ? pdfToImgMod.pdf : pdfToImgMod.default?.pdf;
  const doc2 = await pdfToImg(buffer, { scale: 3 });
  let idx = 0;
  for await (const png of doc2) {
    idx++;
    console.log(`rasterized page ${idx}: ${png.length} bytes`);
  }
  console.log('total rasterized:', idx);

  // Check XObject approach
  const OPS = pdfjs.OPS || {};
  const IMAGE_OPS = [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].filter(v => typeof v === 'number');
  console.log('IMAGE_OPS:', IMAGE_OPS);

  const doc3 = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
  for (let p = 1; p <= doc3.numPages; p++) {
    const page = await doc3.getPage(p);
    const opList = await page.getOperatorList();
    let imgCount = 0;
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (IMAGE_OPS.includes(opList.fnArray[i])) {
        const arg = opList.argsArray[i][0];
        imgCount++;
        if (typeof arg === 'string') {
          console.log(`  page ${p} XObject: ${arg}`);
        } else if (arg && arg.width && arg.height) {
          console.log(`  page ${p} image: ${arg.width}x${arg.height} kind=${arg.kind} dataLen=${arg.data?.length || 0}`);
        }
      }
    }
    if (imgCount === 0) console.log(`  page ${p}: no XObject images`);
    page.cleanup();
  }
  await doc3.destroy();

  await mongoose.disconnect();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
