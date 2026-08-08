import { readFileSync } from 'fs';
import esbuild from 'esbuild';
const code = readFileSync(new URL('./src/pages/dashboard/jobseeker/ResumeBuilder.jsx', import.meta.url), 'utf8');
try {
  esbuild.transformSync(code, { loader: 'jsx', sourcemap: false, sourcefile: 'ResumeBuilder.jsx' });
  console.log('ok');
} catch (e) {
  console.error('ERROR:', e.message);
  if (e.location) console.error('LOCATION:', JSON.stringify(e.location));
  process.exit(1);
}
