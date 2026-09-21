const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['terms', 'privacy'],
            required: [true, 'Agreement type is required'],
        },
        title: {
            type: String,
            required: [true, 'Agreement title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Agreement description is required'],
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        content: {
            type: String,
            required: [true, 'Agreement content is required'],
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'inactive',
        },
        version: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

// Ensure only one active agreement per type
agreementSchema.index({ type: 1, status: 1 });

// Pre-save middleware: when activating an agreement, deactivate others of the same type
agreementSchema.pre('save', async function (next) {
    if (this.isModified('status') && this.status === 'active') {
        await this.constructor.updateMany(
            { type: this.type, _id: { $ne: this._id }, status: 'active' },
            { $set: { status: 'inactive' } }
        );
    }
    next();
});

// Static method to get active agreements for employers
agreementSchema.statics.getActiveAgreements = async function () {
    return this.find({ status: 'active' }).select('type title description content version createdAt updatedAt').lean();
};

// Static method to get active agreement by type
agreementSchema.statics.getActiveByType = async function (type) {
    return this.findOne({ type, status: 'active' }).select('type title description content version createdAt updatedAt').lean();
};

const Agreement = mongoose.models.Agreement || mongoose.model('Agreement', agreementSchema);
module.exports = Agreement;