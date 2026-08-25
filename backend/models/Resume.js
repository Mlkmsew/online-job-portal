// ============================================
// Resume Model - Job Seeker CV Builder Data
// -------------------------------------------------
// Each document belongs to exactly one job seeker.
// The document mirrors the resume shape used by the
// frontend Resume Builder (profile, summary, experience,
// education, skills, ...) plus the persisted visual
// template/theme so a CV can be re-rendered identically.
// ============================================
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Resume title is required'], trim: true, maxlength: 120 },

    // Visual presentation (does not affect content)
    template: { type: String, default: 'modern-ats' },
    theme: { type: Object, default: {} },

    // Lifecycle
    status: { type: String, enum: ['draft', 'completed'], default: 'draft' },
    score: { type: Number, default: 0 },

    // Content sections (flexible to match the editor data model)
    profile: { type: Object, default: {} },
    summary: { type: Object, default: {} },
    experience: { type: Array, default: [] },
    education: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    skills: { type: Array, default: [] },
    softSkills: { type: Array, default: [] },
    languages: { type: Array, default: [] },
    certifications: { type: Array, default: [] },
    interests: { type: Object, default: {} },
    photo: { type: Object, default: null },
    additionalInfo: { type: Object, default: {} },

    // Custom section render order. Contains the section keys (including any
    // keys inside additionalInfo) in the order the user arranged them.
    sectionOrder: { type: Array, default: [] },

    // Fields explicitly edited inside the CV. These are preserved when
    // profile data is synced into the CV.
    dirtyFields: { type: Array, default: [] },

    // Exactly one Resume Builder resume per user may be the default.
    // The default resume drives job recommendations.
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, updatedAt: -1 });
resumeSchema.index({ user: 1, isDefault: 1 }, { sparse: true });

// Auto-promote to default when this is the user's first resume or no
// default currently exists.  Works for both controller-mediated creates
// and direct Resume.create() calls.
resumeSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (this.isDefault) return next();
  const ResumeModel = mongoose.models.Resume || mongoose.model('Resume');
  const defaultExists = await ResumeModel.exists({ user: this.user, isDefault: true, _id: { $ne: this._id } });
  if (!defaultExists) this.isDefault = true;
  next();
});

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
module.exports = Resume;
