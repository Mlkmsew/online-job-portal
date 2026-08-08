const fs = require('fs');
const path = 'src/pages/dashboard/jobseeker/ResumeBuilder.jsx';
const text = fs.readFileSync(path, 'utf8');
let line = 1;
let col = 0;
let state = 'normal';
let quote = '';
let escaped = false;
let braceDepth = 0;
let parenDepth = 0;
let bracketDepth = 0;
for (let i = 0; i < text.length; i++) {
  const ch = text[i];
  if (ch === '\n') {
    line++;
    col = 0;
    if (state === 'line_comment') state = 'normal';
    continue;
  }
  col++;
  if (state === 'normal') {
    if (ch === '"' || ch === "'" || ch === '`') {
      state = 'string'; quote = ch; escaped = false;
    } else if (ch === '/' && text[i+1] === '/') {
      state = 'line_comment'; i++; col++;
    } else if (ch === '/' && text[i+1] === '*') {
      state = 'block_comment'; i++; col++;
    } else if (ch === '{') {
      braceDepth++;
    } else if (ch === '}') {
      braceDepth--;
    } else if (ch === '(') {
      parenDepth++;
    } else if (ch === ')') {
      parenDepth--;
    } else if (ch === '[') {
      bracketDepth++;
    } else if (ch === ']') {
      bracketDepth--;
    }
  } else if (state === 'string') {
    if (escaped) {
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (ch === quote) {
      state = 'normal';
    }
  } else if (state === 'block_comment') {
    if (ch === '*' && text[i+1] === '/') {
      state = 'normal'; i++; col++;
    }
  }
  if ((line >= 2600 && line <= 2950 && (ch === '}' || ch === ')' || ch === '{' || ch === '(')) || line === 1416 || line === 2550 || line === 2750) {
    console.log(`${line}:${col} ${ch} B${braceDepth} P${parenDepth} Q${bracketDepth}`);
  }
}
console.log('FINAL', {braceDepth, parenDepth, bracketDepth});
