const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Skill extraction must work even when the Skill catalog collection is EMPTY
// (regression: the production deployment had zero skills seeded, so every CV
// parsed to zero skills and every job recommendation scored identically).
let mongod;

test.before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 120000 } });
  await mongoose.connect(mongod.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const namesOf = (skills) => skills.map((s) => s.name).sort();

test('fallback catalog extracts recognizable skills when the Skill collection is empty', async () => {
  const { extractSkillsFromText } = require('../utils/resumeParser');
  const count = await mongoose.connection.db.collection('skills').countDocuments();
  assert.equal(count, 0); // unseeded environment

  const text =
    'Curriculum Vitae. Skilled in Java, Python and React with strong Communication and Teamwork. Bachelor of Science.';
  const skills = await extractSkillsFromText(text);

  assert.deepEqual(namesOf(skills), ['Communication', 'Java', 'Python', 'React', 'Teamwork']);
  // Fallback entries carry no fabricated _id — only a name.
  skills.forEach((s) => assert.equal(s._id, undefined));
});

test('word-boundary matching avoids false positives on skill substrings', async () => {
  const { extractSkillsFromText } = require('../utils/resumeParser');
  // "JavaScript" must not match "Java"; "PostgreSQL" must not match "SQL".
  const skills = await extractSkillsFromText('Experience with JavaScript and PostgreSQL databases.');
  assert.deepEqual(namesOf(skills), ['JavaScript', 'PostgreSQL']);
});

test('DB-backed matches win exclusively when the Skill catalog is seeded', async () => {
  const Skill = require('../models/Skill');
  const javaDoc = await Skill.create({ name: 'Java' });
  const { extractSkillsFromText } = require('../utils/resumeParser');

  // Text mentions Java AND Python; catalog only knows Java → DB path is used,
  // the fallback list is NOT merged in.
  const skills = await extractSkillsFromText('Skills: Java, Python.');
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'Java');
  assert.equal(String(skills[0]._id), String(javaDoc._id));
});
