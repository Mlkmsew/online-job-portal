const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.resolve(__dirname, 'src/pages/dashboard/jobseeker/ResumeBuilder.jsx'), 'utf8');
const esbuild = require('esbuild');
try {
  esbuild.transformSync(code, { loader: 'jsx', sourcemap: false, sourcefile: 'ResumeBuilder.jsx' });
  console.log('TRANSFORM OK');
} catch (err) {
  console.error('ERROR:', err.message);
  console.error('LOCATION:', err.location);
}
