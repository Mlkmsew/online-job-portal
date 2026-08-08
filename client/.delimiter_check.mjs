import { readFileSync } from 'fs';
const source = readFileSync(new URL('./src/pages/dashboard/jobseeker/ResumeBuilder.jsx', import.meta.url), 'utf8');
const stack = [];
let mode = 'normal';
let quote = null;
let escaped = false;
let line = 1;
let col = 0;
const openers = {
  '(': ')',
  '[': ']',
  '{': '}',
};
for (let i = 0; i < source.length; i++) {
  const ch = source[i];
  col++;
  if (ch === '\n') { line++; col = 0; }
  if (mode === 'string') {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === quote) { mode = 'normal'; quote = null; }
    continue;
  }
  if (mode === 'template') {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '`') { mode = 'normal'; continue; }
    if (ch === '$' && source[i + 1] === '{') { stack.push({ ch: '{', line, col }); i++; col++; continue; }
    continue;
  }
  if (mode === 'line_comment') {
    if (ch === '\n') mode = 'normal';
    continue;
  }
  if (mode === 'block_comment') {
    if (ch === '*' && source[i+1] === '/') { mode = 'normal'; i++; col++; }
    continue;
  }
  if (ch === '/' && source[i+1] === '/') { mode = 'line_comment'; i++; col++; continue; }
  if (ch === '/' && source[i+1] === '*') { mode = 'block_comment'; i++; col++; continue; }
  if (ch === '`') { mode = 'template'; continue; }
  if (ch === '"' || ch === "'") { mode = 'string'; quote = ch; continue; }
  if (openers[ch]) { stack.push({ ch, line, col }); continue; }
  if (ch === ')' || ch === ']' || ch === '}') {
    if (!stack.length) { console.log('Unmatched closer', ch, 'at', line, col); break; }
    const top = stack.pop();
    if (openers[top.ch] !== ch) { console.log('Mismatch', top.ch, 'opened at', top.line, top.col, 'but', ch, 'closed at', line, col); break; }
  }
}
console.log('mode', mode, 'stack len', stack.length);
if (stack.length) console.log('top', stack.slice(-5));
