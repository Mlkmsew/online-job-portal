import { readFileSync } from 'fs';
const code = readFileSync(new URL('./src/pages/dashboard/jobseeker/ResumeBuilder.jsx', import.meta.url), 'utf8');
const lines = code.split(/\r?\n/);
for (let i = 2650; i <= 2670; i++) {
  const line = lines[i];
  if (line === undefined) continue;
  console.log(`${i+1}: ${line}`);
  console.log(line.split('').map((ch, idx) => idx % 10 === 0 ? (idx % 10) : ' ').join(''));
}
