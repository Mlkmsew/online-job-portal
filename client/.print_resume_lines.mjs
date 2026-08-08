import { readFileSync } from 'fs';
const source = readFileSync(new URL('./src/pages/dashboard/jobseeker/ResumeBuilder.jsx', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const start = 2620;
const end = 2705;
for (let i = start; i <= end; i++) {
  const line = lines[i-1];
  if (line === undefined) continue;
  console.log(`${String(i).padStart(4, ' ')}: ${line}`);
}
