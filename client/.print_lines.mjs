import { readFileSync } from 'fs';
const code = readFileSync(new URL('./src/pages/dashboard/jobseeker/ResumeBuilder.jsx', import.meta.url), 'utf8');
const lines = code.split(/\r?\n/);
const start = 110;
const end = 190;
for (let i = start; i <= end; i++) {
  const line = lines[i-1];
  if (line === undefined) continue;
  console.log(`${String(i).padStart(4, ' ')}: ${line}`);
}
