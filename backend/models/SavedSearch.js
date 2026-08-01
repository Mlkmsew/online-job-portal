const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Saved search name is required'], trim: true },
    query: { type: Object, default: {} },
    notifyOnNewJobs: { type: Boolean, default: false },
  },
  { timestamps: true }
);

savedSearchSchema.index({ user: 1, name: 1 }, { unique: true });

const SavedSearch = mongoose.models.SavedSearch || mongoose.model('SavedSearch', savedSearchSchema);
module.exports = SavedSearch;
