const fs = require('fs');
const filepath = 'client/src/pages/dashboard/jobseeker/ResumeBuilder.jsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

// Track nesting from line 2170 (index 2169) - activeTab === 'Skills' && (
// Looking for when the Skills section's div count reaches 0
const start = 2169; // 0-indexed (line 2170)
const end   = 2460; // 0-indexed

let divBalance = 0;
let parenDepth = 0;

console.log('=== Tracking from line 2170 ===');
for (let i = start; i <= end; i++) {
  const line = lines[i];
  const opens  = (line.match(/<div/g)   || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  const openParens  = (line.match(/\(\s*$/g) || []).length; // line ending with (
  const closeParens = (line.match(/^\s*\)\}/g) || []).length; // line starting with )}
  
  const prevDivBalance = divBalance;
  divBalance += opens - closes;
  
  if (opens > 0 || closes > 0 || closeParens > 0) {
    const flag = closeParens > 0 ? ' <<< CLOSING )}' : '';
    console.log(`${i+1}: divBal=${divBalance} | ${line.trimStart().substring(0,70)}${flag}`);
  }
  
  if (closeParens > 0) {
    // Print what the balance was BEFORE this line
    console.log(`       (div balance before this )} was: ${prevDivBalance})`);
  }
}
