const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    // Job Posting Fee Settings
    jobPostingFee: {
      enabled: {
        type: Boolean,
        default: false,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        default: 'ETB',
        enum: ['ETB', 'USD', 'EUR'],
      },
      // Payment provider: 'chapa' for real Chapa integration, 'manual' for demo/manual verification
      paymentProvider: {
        type: String,
        default: 'manual',
        enum: ['chapa', 'manual'],
      },
    },

    // Platform Settings (extensible for future settings)
    platform: {
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      allowRegistration: {
        type: Boolean,
        default: true,
      },
    },

    // Metadata
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Ensure only one settings document exists (singleton pattern)
systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

systemSettingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.getSettings();
  
  // Handle both nested objects and dot notation (e.g., 'jobPostingFee.enabled')
  Object.keys(updates).forEach(key => {
    if (key.includes('.')) {
      // Dot notation - set nested value
      const parts = key.split('.');
      let obj = settings;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = updates[key];
    } else if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
      // Nested object - merge with existing
      if (!settings[key]) settings[key] = {};
      Object.assign(settings[key], updates[key]);
    } else {
      // Direct assignment
      settings[key] = updates[key];
    }
  });
  
  settings.updatedBy = userId;
  await settings.save();
  return settings;
};

const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', systemSettingsSchema);
module.exports = SystemSettings;