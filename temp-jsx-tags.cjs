const fs = require('fs');
const code = fs.readFileSync('client/src/pages/dashboard/jobseeker/ResumeBuilder.jsx', 'utf8');
const stack = [];
let i = 0;
let line = 1;
let inString = null;
let escape = false;
let inComment = false;

function pushLine(){
  if (code[i] === '\n') line++;
}

while (i < code.length) {
  const ch = code[i];
  const next = code[i + 1];

  if (inComment) {
    if (ch === '-' && next === '-' && code[i + 2] === '>') {
      inComment = false;
      i += 3;
      continue;
    }
    if (ch === '\n') line++;
    i++;
    continue;
  }

  if (inString) {
    if (escape) {
      escape = false;
    } else if (ch === '\\') {
      escape = true;
    } else if (ch === inString) {
      inString = null;
    }
    i++;
    continue;
  }

  if (ch === '<' && next === '!' && code[i + 2] === '-' && code[i + 3] === '-') {
    inComment = true;
    i += 4;
    continue;
  }

  if (ch === '"' || ch === "'" || ch === '`') {
    inString = ch;
    i++;
    continue;
  }

  if (ch === '<') {
    const end = code.indexOf('>', i + 1);
    if (end === -1) break;
    const raw = code.slice(i, end + 1);
    if (raw.startsWith('</')) {
      const name = raw.slice(2).match(/^([A-Za-z0-9:-]+)/)?.[1];
      if (name) {
        const last = stack[stack.length - 1];
        if (last && last.name === name) {
          stack.pop();
        } else {
          console.log('mismatched closing', name, 'line', line);
          break;
        }
      }
    } else if (raw.startsWith('<!')) {
      // ignore
    } else {
      const name = raw.slice(1).match(/^([A-Za-z0-9:-]+)/)?.[1];
      const isSelfClosing = raw.endsWith('/>');
      if (name && !isSelfClosing && !name.startsWith('?')) {
        stack.push({ name, line });
      }
    }
    i = end + 1;
    continue;
  }

  if (ch === '\n') line++;
  i++;
}

console.log('remaining open tags:', stack.slice(-20));
