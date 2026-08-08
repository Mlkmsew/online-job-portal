const fs = require('fs');
const path = 'client/src/pages/dashboard/jobseeker/ResumeBuilder.jsx';
const code = fs.readFileSync(path, 'utf8');
let i = 0;
const stack = [];
let quote = null;
let escape = false;
let line = 1;
let inLineComment = false;
let inBlockComment = false;

while (i < code.length) {
  const ch = code[i];
  const next = code[i + 1];

  if (inLineComment) {
    if (ch === '\n') {
      inLineComment = false;
      line += 1;
    }
    i += 1;
    continue;
  }

  if (inBlockComment) {
    if (ch === '*' && next === '/') {
      inBlockComment = false;
      i += 2;
      continue;
    }
    if (ch === '\n') line += 1;
    i += 1;
    continue;
  }

  if (quote) {
    if (escape) {
      escape = false;
    } else if (ch === '\\') {
      escape = true;
    } else if (ch === quote) {
      quote = null;
    }
    i += 1;
    continue;
  }

  if (ch === '/' && next === '/') {
    inLineComment = true;
    i += 2;
    continue;
  }
  if (ch === '/' && next === '*') {
    inBlockComment = true;
    i += 2;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') {
    quote = ch;
    i += 1;
    continue;
  }

  if (ch === '{' || ch === '(' || ch === '[') {
    stack.push({ ch, line });
  } else if (ch === '}' || ch === ')' || ch === ']') {
    const last = stack.pop();
    if (!last) {
      console.log('extra close', ch, 'line', line);
      break;
    }
    if ((ch === '}' && last.ch !== '{') || (ch === ')' && last.ch !== '(') || (ch === ']' && last.ch !== '[')) {
      console.log('mismatch', last.ch, '->', ch, 'line', line);
      console.log('stack before mismatch', stack.slice(-10));
      break;
    }
  }

  if (ch === '\n') line += 1;
  i += 1;
}

if (stack.length) {
  console.log('remaining opens', stack.slice(-10));
} else {
  console.log('balanced');
}
