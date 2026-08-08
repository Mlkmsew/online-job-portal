const fs = require('fs');
const parser = require('./node_modules/@babel/parser');
const code = fs.readFileSync('src/pages/dashboard/jobseeker/ResumeBuilder.jsx', 'utf8');
try {
  parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'] });
  console.log('PARSE_OK');
} catch (err) {
  console.error('ERR_MESSAGE::' + err.message);
  if (err.loc) console.error('LOC::' + JSON.stringify(err.loc));
  process.exit(1);
}
