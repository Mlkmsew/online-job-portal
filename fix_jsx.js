const fs = require('fs');
const filepath = 'client/src/pages/dashboard/jobseeker/ResumeBuilder.jsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

// Replace lines 1677-1749 (0-indexed 1676-1748) with the correct structure
// Line 1677 (index 1676) = <div className="grid gap-4 sm:grid-cols-3">
// Line 1749 (index 1748) = </div>   (currently closes the mixed-up grid)

const startIdx = 1676; // 0-indexed, line 1677
const endIdx   = 1748; // 0-indexed, line 1749 inclusive

const newBlock = `                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.firstName || ''}
                            onChange={(e) => handleFieldChange('profile', 'firstName', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Middle name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.middleName || ''}
                            onChange={(e) => handleFieldChange('profile', 'middleName', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                          <input
                            type="text"
                            value={activeResume.profile?.lastName || ''}
                            onChange={(e) => handleFieldChange('profile', 'lastName', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">Desired job position</label>
                          <input
                            type="text"
                            value={activeResume.profile?.profession || ''}
                            onChange={(e) => handleFieldChange('profile', 'profession', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">Professional summary</label>
                          <textarea
                            rows="4"
                            value={activeResume.summary?.text || ''}
                            onChange={(e) => handleFieldChange('summary', 'text', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                          <input
                            type="email"
                            value={activeResume.profile?.email || ''}
                            onChange={(e) => handleFieldChange('profile', 'email', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                          <input
                            type="tel"
                            value={activeResume.profile?.phone || ''}
                            onChange={(e) => handleFieldChange('profile', 'phone', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                          <input
                            type="text"
                            value={activeResume.profile?.streetAddress || ''}
                            onChange={(e) => handleFieldChange('profile', 'streetAddress', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
                          <input
                            type="text"
                            value={activeResume.profile?.city || ''}
                            onChange={(e) => handleFieldChange('profile', 'city', e.target.value)}
                            className="w-full rounded-[12px] border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                      </div>`;

// Replace the section
const newLines = newBlock.split('\n');
lines.splice(startIdx, endIdx - startIdx + 1, ...newLines);

fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
console.log(`Replaced lines ${startIdx+1}-${endIdx+1} with ${newLines.length} lines`);
console.log('Done');
