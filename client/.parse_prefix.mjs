import { readFileSync } from 'fs';
import esbuild from 'esbuild';
const source = readFileSync(new URL('./src/pages/dashboard/jobseeker/ResumeBuilder.jsx', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
for (let line = 130; line <= lines.length; line += 10) {
  const prefix = lines.slice(0, line).join('\n');
  try {
    esbuild.transformSync(prefix, { loader: 'jsx', sourcemap: false, sourcefile: 'ResumeBuilder.jsx' });
    console.log(`prefix ${line}: OK`);
  } catch (err) {
    console.log(`prefix ${line}: FAIL`, err.message.split('\n')[0]);
    break;
  }
}
