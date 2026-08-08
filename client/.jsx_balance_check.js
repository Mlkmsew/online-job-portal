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
  col += 1;
  if (ch === '\n') {
    line += 1;
    col = 0;
    if (state === 'line_comment') state = 'normal';
    continue;
  }
  if (state === 'normal') {
    if (ch === '"' || ch === "'" || ch === '`') {
      state = 'string';
      quote = ch;
      escaped = false;
    } else if (ch === '/' && text[i+1] === '/') {
      state = 'line_comment';
      i += 1; col += 1;
    } else if (ch === '/' && text[i+1] === '*') {
      state = 'block_comment';
      i += 1; col += 1;
    } else if (ch === '{') {
      braceDepth += 1;
    } else if (ch === '}') {
      braceDepth -= 1;
      if (braceDepth < 0) {
        console.log(`Unmatched } at ${line}:${col}`);
        process.exit(1);
      }
    } else if (ch === '(') {
      parenDepth += 1;
    } else if (ch === ')') {
      parenDepth -= 1;
      if (parenDepth < 0) {
        console.log(`Unmatched ) at ${line}:${col}`);
        process.exit(1);
      }
    } else if (ch === '[') {
      bracketDepth += 1;
    } else if (ch === ']') {
      bracketDepth -= 1;
      if (bracketDepth < 0) {
        console.log(`Unmatched ] at ${line}:${col}`);
        process.exit(1);
      }
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
      state = 'normal';
      i += 1; col += 1;
    }
  }
  if ((line === 2661 || line === 2659 || line === 2549 || line === 2551 || line === 2620) && ch==='\n') {
    // no op
  }
}
console.log('done', {braceDepth, parenDepth, bracketDepth});
