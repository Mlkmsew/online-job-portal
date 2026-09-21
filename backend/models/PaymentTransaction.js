const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    // Employer who made the payment
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Company associated with the employer
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    // Optional: job this payment is for (set after job creation)
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ['ETB', 'USD', 'EUR'],
      default: 'ETB',
    },
    // Payment method used
    paymentMethod: {
      type: String,
      required: true,
      enum: ['chapa', 'telebirr', 'bank_transfer', 'other'],
    },
    // Transaction reference from payment provider
    transactionReference: {
      type: String,
      required: true,
      trim: true,
    },
    // Status of the payment
    status: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'refunded'],
      default: 'pending',
    },
    // When payment was verified
    verifiedAt: {
      type: Date,
      default: null,
    },
    // When payment was created
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    // Additional metadata
    metadata: {
      type: Object,
      default: {},
    },
    // Error message if verification failed
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentTransactionSchema.index({ employer: 1, createdAt: -1 });
paymentTransactionSchema.index({ company: 1, createdAt: -1 });
paymentTransactionSchema.index({ transactionReference: 1 }, { unique: true });
paymentTransactionSchema.index({ status: 1 });

// Virtual for checking if payment is verified
paymentTransactionSchema.virtual('isVerified').get(function () {
  return this.status === 'verified';
});

// Static method to create a pending transaction
paymentTransactionSchema.statics.createPending = async function (data) {
  return this.create({
    ...data,
    status: 'pending',
    initiatedAt: new Date(),
  });
};

// Static method to verify a transaction
paymentTransactionSchema.statics.verifyTransaction = async function (transactionReference, verified = true, errorMessage = '') {
  const update = verified
    ? { status: 'verified', verifiedAt: new Date(), errorMessage: '' }
    : { status: 'failed', errorMessage };
  
  return this.findOneAndUpdate(
    { transactionReference },
    update,
    { new: true }
  );
};

// Static method to check if a transaction was already used for a job
paymentTransactionSchema.statics.isUsedForJob = async function (transactionReference) {
  const transaction = await this.findOne({ transactionReference, job: { $ne: null } });
  return !!transaction;
};

// Static method to link transaction to job
paymentTransactionSchema.statics.linkToJob = async function (transactionReference, jobId) {
  return this.findOneAndUpdate(
    { transactionReference },
    { job: jobId, status: 'verified', verifiedAt: new Date() },
    { new: true }
  );
};

const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', paymentTransactionSchema);
module.exports = PaymentTransaction;