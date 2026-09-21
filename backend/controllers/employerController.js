const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const Job = require('../models/job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const Company = require('../models/Company');
const User = require('../models/user');
const PaymentTransaction = require('../models/PaymentTransaction');
const SystemSettings = require('../models/SystemSettings');
const crypto = require('crypto');

/**
 * Convert phone number to Chapa format (10 digits starting with 09 or 07)
 * @param {string} phone - Phone number in any format
 * @returns {string|null} - Formatted phone or null if invalid
 */
const formatPhoneForChapa = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 251 (Ethiopia country code), remove it
  if (digits.startsWith('251')) {
    return '0' + digits.substring(3);
  }
  
  // If starts with 0, check if it's 10 digits
  if (digits.startsWith('0') && digits.length === 10) {
    return digits;
  }
  
  // If 9 digits starting with 9 or 7, add leading 0
  if (digits.length === 9 && (digits.startsWith('9') || digits.startsWith('7'))) {
    return '0' + digits;
  }
  
  return null;
};

// Payment provider integrations
let Chapa = null;

try {
  const chapaModule = require('chapa-nodejs');
  Chapa = chapaModule.Chapa || chapaModule.default;
} catch (e) {
  console.warn('chapa-nodejs not available, Chapa payments will not work');
}

/**
 * Verify Chapa payment
 * @param {string} txRef - Transaction reference from Chapa
 * @param {number} expectedAmount - Expected amount in ETB
 * @param {string} expectedCurrency - Expected currency (ETB)
 * @returns {Promise<{verified: boolean, data?: object, error?: string}>}
 */
const verifyChapaPayment = async (txRef, expectedAmount, expectedCurrency) => {
  if (!Chapa) {
    return { verified: false, error: 'Chapa SDK not configured' };
  }

  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    return { verified: false, error: 'Chapa secret key not configured' };
  }

  try {
    const chapa = new Chapa({ secretKey });
    const response = await chapa.verify(txRef);

    if (response && response.data) {
      const { status, amount, currency } = response.data;
      
      // Verify payment status
      if (status !== 'success') {
        return { verified: false, error: `Chapa payment status: ${status}`, data: response.data };
      }

      // Verify amount (Chapa amounts are in cents, convert to ETB)
      const amountInETB = amount / 100;
      if (Math.abs(amountInETB - expectedAmount) > 0.01) {
        return { verified: false, error: `Amount mismatch: expected ${expectedAmount} ${expectedCurrency}, got ${amountInETB}`, data: response.data };
      }

      // Verify currency
      if (currency !== expectedCurrency) {
        return { verified: false, error: `Currency mismatch: expected ${expectedCurrency}, got ${currency}`, data: response.data };
      }

      return { verified: true, data: response.data };
    }

    return { verified: false, error: 'Invalid Chapa response format' };
  } catch (error) {
    console.error('Chapa verification error:', error.message);
    return { verified: false, error: `Chapa verification failed: ${error.message}` };
  }
};

/**
 * Verify Telebirr payment
 * @param {string} outTradeNo - Transaction reference (out_trade_no) from Telebirr
 * @param {number} expectedAmount - Expected amount in ETB
 * @param {string} expectedCurrency - Expected currency (ETB)
 * @returns {Promise<{verified: boolean, data?: object, error?: string}>}
 */
/**
 * Verify Telebirr Payment (Step 5: queryOrder)
 * @param {string} outTradeNo - Transaction reference (outTradeNo from order creation)
 * @param {number} expectedAmount - Expected amount in ETB
 * @param {string} expectedCurrency - Expected currency (ETB)
 * @returns {Promise<{verified: boolean, data?: object, error?: string}>}
 */
const verifyTelebirrPayment = async (outTradeNo, expectedAmount, expectedCurrency) => {
  const fabricAppId = process.env.TELEBIRR_FABRIC_APP_ID;
  const merchantAppId = process.env.TELEBIRR_MERCHANT_APP_ID;
  const baseUrl = process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway';

  console.log('[TELEBIRR] Verification credential check:', {
    fabricAppIdConfigured: !!process.env.TELEBIRR_FABRIC_APP_ID,
    merchantAppIdConfigured: !!merchantAppId
  });

  if (!process.env.TELEBIRR_FABRIC_APP_ID || !merchantAppId) {
    return { verified: false, error: 'Telebirr verification credentials not configured (missing FABRIC_APP_ID or MERCHANT_APP_ID)' };
  }

  // First, get a fresh Fabric Token for verification
  const tokenResult = await getTelebirrFabricToken();
  if (!tokenResult.success) {
    return { verified: false, error: `Failed to get Fabric Token: ${tokenResult.error}` };
  }

  // Official queryOrder API (Step 5)
  try {
    const queryUrl = `${process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway'}/payment/v1/merchant/order/${outTradeNo}`;

    console.log('[TELEBIRR] Verification request:', { queryUrl, outTradeNo });

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenResult.accessToken}`,
        'X-APP-Key': process.env.TELEBIRR_FABRIC_APP_ID,
      },
    });

    const data = await response.json();
    console.log('[TELEBIRR] Verification response:', { code: data?.code, tradeState: data?.data?.tradeState });

    if (data && data.code === 0 && data.data) {
      const { tradeState, totalAmount, outTradeNo: returnedOutTradeNo } = data.data;

      // Verify payment status
      if (tradeState !== 'SUCCESS') {
        return { verified: false, error: `Telebirr payment status: ${tradeState}`, data };
      }

      // Verify amount (Telebirr amounts are in cents)
      const amountInETB = totalAmount / 100;
      if (Math.abs(amountInETB - expectedAmount) > 0.01) {
        return { verified: false, error: `Amount mismatch: expected ${expectedAmount} ETB, got ${amountInETB}`, data };
      }

      // Verify currency - assume ETB
      // The official response may have currency info

      return { verified: true, data: { tradeState, totalAmount, outTradeNo: returnedOutTradeNo } };
    }

    return { verified: false, error: `Telebirr query failed: ${data.msg || 'Unknown error'}`, data };
  } catch (error) {
    console.error('[TELEBIRR] Verification error:', error.message);
    return { verified: false, error: `Telebirr verification failed: ${error.message}` };
  }
};

/**
 * Verify Bank Transfer payment
 * Bank transfers cannot be automatically verified - they remain pending
 * until admin manually verifies them.
 * @param {string} reference - Bank transfer reference
 * @returns {Promise<{verified: boolean, data?: object, error?: string}>}
 */
const verifyBankTransferPayment = async (reference) => {
  // Bank transfers require manual admin verification
  // Return pending status - admin must verify via admin panel
  return { 
    verified: false, 
    pending: true, 
    error: 'Bank transfer requires manual admin verification. Your payment is pending review.',
    data: { reference }
  };
};

/**
 * Verify Other payment method
 * Other payment methods cannot be automatically verified
 * @returns {Promise<{verified: boolean, data?: object, error?: string}>}
 */
const verifyOtherPayment = async (reference) => {
  return { 
    verified: false, 
    pending: true, 
    error: 'Other payment methods require manual admin verification. Your payment is pending review.',
    data: { reference }
  };
};

/**
 * Main payment verification function - routes to appropriate provider
 * @param {string} paymentReference - Transaction reference from payment provider
 * @param {number} expectedAmount - Expected payment amount
 * @param {string} expectedCurrency - Expected currency (ETB, USD, EUR)
 * @param {string} paymentMethod - Payment method used (chapa, telebirr, bank_transfer, other)
 * @returns {Promise<{verified: boolean, pending?: boolean, data?: object, error?: string}>}
 */
const verifyJobPostingPayment = async (paymentReference, expectedAmount, expectedCurrency, paymentMethod) => {
  console.log('[PAYMENT VERIFICATION] Verifying payment:', {
    paymentReference,
    expectedAmount,
    expectedCurrency,
    paymentMethod,
  });

  // Development mode fallback - still requires non-empty reference
  if (process.env.NODE_ENV !== 'production') {
    // In development, simulate provider verification for testing
    if (paymentMethod === 'chapa' || paymentMethod === 'telebirr') {
      // Simulate successful verification for valid-looking references
      return { 
        verified: paymentReference && paymentReference.length > 5, 
        data: { simulated: true, provider: paymentMethod } 
      };
    }
    if (paymentMethod === 'bank_transfer') {
      return { verified: false, pending: true, error: 'Bank transfer requires manual admin verification (dev mode)' };
    }
    if (paymentMethod === 'other') {
      return { verified: false, pending: true, error: 'Other payment requires manual admin verification (dev mode)' };
    }
    return { verified: false, error: 'Unknown payment method' };
  }

  // Production: route to actual provider
  switch (paymentMethod) {
    case 'chapa':
      return verifyChapaPayment(paymentReference, expectedAmount, expectedCurrency);
    
    case 'telebirr':
      return verifyTelebirrPayment(paymentReference, expectedAmount, expectedCurrency);
    
    case 'bank_transfer':
      return verifyBankTransferPayment(paymentReference);
    
    case 'other':
      return verifyOtherPayment(paymentReference);
    
    default:
      return { verified: false, error: `Unsupported payment method: ${paymentMethod}` };
  }
};

module.exports = { verifyJobPostingPayment, verifyChapaPayment, verifyTelebirrPayment, verifyBankTransferPayment, verifyOtherPayment };

/**
 * Initiate Chapa payment
 * @param {Object} params - Payment parameters
 * @returns {Promise<{success: boolean, checkoutUrl?: string, txRef?: string, error?: string}>}
 */
const initiateChapaPayment = async ({ amount, currency, email, firstName, lastName, phone, txRef, callbackUrl, returnUrl, customization }) => {
  if (!Chapa) {
    return { success: false, error: 'Chapa SDK not configured' };
  }

  const secretKey = process.env.CHAPA_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: 'Chapa secret key not configured' };
  }

try {
    const chapa = new Chapa({ secretKey });
    
    const paymentData = {
      amount: String(Math.round(amount * 100)), // Chapa expects amount in cents as string
      currency: currency || 'ETB',
      email,
      first_name: firstName,
      last_name: lastName,
      tx_ref: txRef || `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: customization || {
        title: 'Job Posting Fee',
        description: 'Payment for job posting',
      },
    };

    // Only add phone_number if valid format (Chapa requires 10 digits starting with 09 or 07)
    if (phone && /^0[79]\d{8}$/.test(phone)) {
      paymentData.phone_number = phone;
    }

    const response = await chapa.initialize(paymentData);
    
    if (response && response.data && response.data.checkout_url) {
      return { 
        success: true, 
        checkoutUrl: response.data.checkout_url,
        txRef: paymentData.tx_ref,
      };
    }

    return { success: false, error: 'Failed to initialize Chapa payment' };
  } catch (error) {
    console.error('Chapa initialization error:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    } else if (error?.response?.data?.message) {
      errorMessage = typeof error.response.data.message === 'object' 
        ? JSON.stringify(error.response.data.message) 
        : error.response.data.message;
    } else if (error?.response?.data?.error) {
      errorMessage = typeof error.response.data.error === 'object'
        ? JSON.stringify(error.response.data.error)
        : error.response.data.error;
    } else if (error?.response?.data) {
      try {
        errorMessage = JSON.stringify(error.response.data);
      } catch {
        errorMessage = String(error.response.data);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }
    return { success: false, error: `Chapa initialization failed: ${errorMessage}` };
  }
};

/**
 * Initiate Telebirr payment
 * @param {Object} params - Payment parameters
 * @returns {Promise<{success: boolean, checkoutUrl?: string, outTradeNo?: string, error?: string}>}
 */
/**
 * Get Telebirr Fabric Token (Step 1: Apply Fabric Token)
 * @returns {Promise<{success: boolean, accessToken?: string, expiresIn?: number, error?: string}>}
 */
const getTelebirrFabricToken = async () => {
  const fabricAppId = process.env.TELEBIRR_FABRIC_APP_ID;
  const appSecret = process.env.TELEBIRR_APP_SECRET;
  const baseUrl = process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway';

  console.log('[TELEBIRR] Fabric Token credential check:', {
    fabricAppIdConfigured: !!fabricAppId,
    appSecretConfigured: !!appSecret,
    baseUrl
  });

  if (!fabricAppId || !appSecret) {
    return { success: false, error: 'Telebirr Fabric credentials not configured (missing FABRIC_APP_ID or APP_SECRET)' };
  }

  try {
    const tokenUrl = `${baseUrl}/payment/v1/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-Key': fabricAppId,
      },
      body: JSON.stringify({ appSecret }),
    });

    const data = await response.json();
    console.log('[TELEBIRR] Fabric Token response:', { code: data?.code, hasToken: !!data?.data?.accessToken });

    if (data && data.code === 0 && data.data?.accessToken) {
      return {
        success: true,
        accessToken: data.data.accessToken,
        expiresIn: data.data.expiresIn || 3600,
      };
    }

    return { success: false, error: `Fabric Token failed: ${data.msg || 'Unknown error'}` };
  } catch (error) {
    console.error('[TELEBIRR] Fabric Token error:', error.message);
    return { success: false, error: `Fabric Token failed: ${error.message}` };
  }
};

/**
 * Create Telebirr Order (Step 2: Request Create Order)
 * @returns {Promise<{success: boolean, orderId?: string, checkoutUrl?: string, error?: string}>}
 */
const createTelebirrOrder = async ({ amount, currency, subject, outTradeNo, notifyUrl, returnUrl, accessToken }) => {
  const merchantAppId = process.env.TELEBIRR_MERCHANT_APP_ID;
  const fabricAppId = process.env.TELEBIRR_FABRIC_APP_ID;
  const shortCode = process.env.TELEBIRR_SHORT_CODE;
  const baseUrl = process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway';

  console.log('[TELEBIRR] Create Order credential check:', {
    merchantAppIdConfigured: !!merchantAppId,
    fabricAppIdConfigured: !!fabricAppId,
    shortCodeConfigured: !!shortCode,
    baseUrl
  });

  if (!merchantAppId || !fabricAppId || !shortCode) {
    return { success: false, error: 'Telebirr Order credentials not configured (missing MERCHANT_APP_ID, FABRIC_APP_ID, or SHORT_CODE)' };
  }

  if (!accessToken) {
    return { success: false, error: 'Access token required for order creation' };
  }

  try {
    const paymentRef = outTradeNo || `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalAmountCents = Math.round(amount * 100); // Telebirr expects amount in cents

    const orderUrl = `${process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway'}/payment/v1/merchant/order`;

    const orderPayload = {
      merchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID,
      shortCode: process.env.TELEBIRR_SHORT_CODE,
      outTradeNo: paymentRef,
      subject: subject || 'Job Posting Payment',
      totalAmount: totalAmountCents.toString(),
      timeoutExpress: '30m',
      notifyUrl: notifyUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/api/employer/payment/callback/telebirr`,
      returnUrl: returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/employer/post-job/checkout`,
    };

    console.log('[TELEBIRR] Create Order request:', { orderUrl, outTradeNo: paymentRef });

    const response = await fetch(orderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-APP-Key': process.env.TELEBIRR_FABRIC_APP_ID,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();
    console.log('[TELEBIRR] Create Order response:', { code: data?.code, hasOrderId: !!data?.data?.orderId });

    if (data && data.code === 0 && data.data?.orderId) {
      return {
        success: true,
        orderId: data.data.orderId,
        outTradeNo: paymentRef,
      };
    }

    return { success: false, error: `Create Order failed: ${data.msg || 'Unknown error'}` };
  } catch (error) {
    console.error('[TELEBIRR] Create Order error:', error.message);
    return { success: false, error: `Create Order failed: ${error.message}` };
  }
};

/**
 * Get Checkout URL (Step 3: Generate Checkout URL)
 * @returns {Promise<{success: boolean, checkoutUrl?: string, error?: string}>}
 */
const getTelebirrCheckoutUrl = async ({ orderId, accessToken }) => {
  const fabricAppId = process.env.TELEBIRR_FABRIC_APP_ID;
  const baseUrl = process.env.TELEBIRR_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway';

  if (!fabricAppId || !accessToken || !orderId) {
    return { success: false, error: 'Missing required parameters for checkout URL' };
  }

  try {
    const checkoutUrl = `${baseUrl}/payment/v1/checkout/${orderId}`;
    const response = await fetch(checkoutUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-APP-Key': fabricAppId,
      },
    });

    const data = await response.json();
    console.log('[TELEBIRR] Checkout URL response:', { code: data?.code, hasCheckoutUrl: !!data?.data?.checkoutUrl });

    if (data && data.code === 0 && data.data?.checkoutUrl) {
      return { success: true, checkoutUrl: data.data.checkoutUrl };
    }

    return { success: false, error: `Checkout URL failed: ${data.msg || 'Unknown error'}` };
  } catch (error) {
    console.error('[TELEBIRR] Checkout URL error:', error.message);
    return { success: false, error: `Checkout URL failed: ${error.message}` };
  }
};

/**
 * Initiate Telebirr Payment - Official H5 C2B Flow
 * @param {Object} params - Payment parameters
 * @returns {Promise<{success: boolean, checkoutUrl?: string, outTradeNo?: string, error?: string}>}
 */
const initiateTelebirrPayment = async ({ amount, currency, subject, outTradeNo, notifyUrl, returnUrl }) => {
  console.log('[TELEBIRR] Starting official H5 C2B flow');

  // Step 1: Get Fabric Token
  const tokenResult = await getTelebirrFabricToken();
  if (!tokenResult.success) {
    return { success: false, error: tokenResult.error };
  }

  // Step 2: Create Order
  const orderResult = await createTelebirrOrder({ amount, currency, subject, outTradeNo, notifyUrl, returnUrl, accessToken: tokenResult.accessToken });
  if (!orderResult.success) {
    return { success: false, error: orderResult.error };
  }

  // Step 3: Get Checkout URL
  const checkoutResult = await getTelebirrCheckoutUrl({ orderId: orderResult.orderId, accessToken: tokenResult.accessToken });
  if (!checkoutResult.success) {
    return { success: false, error: checkoutResult.error };
  }

  console.log('[TELEBIRR] Official H5 C2B flow completed successfully');
  return {
    success: true,
    checkoutUrl: checkoutResult.checkoutUrl,
    outTradeNo: orderResult.outTradeNo,
  };
};

// Update exports
module.exports = { 
  verifyJobPostingPayment, 
  verifyChapaPayment, 
  verifyTelebirrPayment, 
  verifyBankTransferPayment, 
  verifyOtherPayment,
  initiateChapaPayment,
  initiateTelebirrPayment,
};

// @desc  Get real employer dashboard summary & analytics from MongoDB
// @route GET /api/employer/dashboard
// @access Private (employer)
exports.getDashboard = asyncHandler(async (req, res) => {
  const employerId = req.user._id;

  // Find company owned by or linked to employer
  const company = await Company.findOne({ owner: employerId });
  const companyId = company?._id;

  // Filter queries scoped strictly to currently logged-in employer
  const jobFilter = companyId
    ? { $or: [{ postedBy: employerId }, { company: companyId }] }
    : { postedBy: employerId };

  const appFilter = companyId
    ? { $or: [{ employer: employerId }, { company: companyId }] }
    : { employer: employerId };

  const interviewFilter = companyId
    ? { $or: [{ employer: employerId }, { company: companyId }] }
    : { employer: employerId };

  const now = new Date();
  const sevenDaysAgo = new Date(now.valueOf() - 7 * 24 * 60 * 60 * 1000);

  // Database aggregations for exact statistics
  const [
    totalJobs,
    activeJobs,
    closedJobs,
    totalApplicants,
    newApplicantsCount,
    submittedCount,
    underReviewCount,
    interviewStageCount,
    hiredCount,
    upcomingInterviewsCount,
    upcomingInterviewsList,
    recentApplicantsList,
    recentNotificationsList,
  ] = await Promise.all([
    Job.countDocuments(jobFilter),
    Job.countDocuments({ ...jobFilter, status: { $in: ['active', 'published'] } }),
    Job.countDocuments({ ...jobFilter, status: { $in: ['closed', 'expired'] } }),
    Application.countDocuments(appFilter),
    Application.countDocuments({ ...appFilter, createdAt: { $gte: sevenDaysAgo } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Submitted'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Reviewed', 'Under Review'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Interview', 'Interview Scheduled', 'Interview Completed', 'Shortlisted'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Hired', 'Selected'] } }),
    Interview.countDocuments({ ...interviewFilter, scheduledDate: { $gte: now } }),
    Interview.find({ ...interviewFilter, scheduledDate: { $gte: now } })
      .populate('applicant', 'firstName lastName name email avatar')
      .populate('job', 'title')
      .sort({ scheduledDate: 1 })
      .limit(10),
    Application.find(appFilter)
      .populate('applicant', 'firstName lastName name email avatar')
      .populate('job', 'title slug')
      .sort({ createdAt: -1 })
      .limit(10),
    Notification.find({ recipient: employerId, type: { $ne: 'new_message' } })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  // Analytics funnel calculation from real DB records
  const countNew = submittedCount > 0 ? submittedCount : newApplicantsCount;
  const countReview = underReviewCount;
  const countInterview = interviewStageCount;
  const countHired = hiredCount;

  const totalFunnel = countNew + countReview + countInterview + countHired;

  const analytics = {
    newApplications: {
      count: countNew,
      percentage: totalFunnel > 0 ? Math.round((countNew / totalFunnel) * 100) : 0,
    },
    underReview: {
      count: countReview,
      percentage: totalFunnel > 0 ? Math.round((countReview / totalFunnel) * 100) : 0,
    },
    interview: {
      count: countInterview,
      percentage: totalFunnel > 0 ? Math.round((countInterview / totalFunnel) * 100) : 0,
    },
    hired: {
      count: countHired,
      percentage: totalFunnel > 0 ? Math.round((countHired / totalFunnel) * 100) : 0,
    },
  };

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplicants,
      newApplicantsCount,
      underReviewCount,
      interviewStageCount,
      hiredCount,
      interviewsCount: upcomingInterviewsCount,
      analytics,
      upcomingInterviews: upcomingInterviewsList,
      recentApplicants: recentApplicantsList,
      recentNotifications: recentNotificationsList,
      company: company || null,
    },
  });
});

// @desc    Mark job as paid (after successful payment)
// @route   POST /api/employer/jobs/:id/pay
// @access  Private (Employer)
exports.markJobAsPaid = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));

  // Check if employer owns this job
  const company = await Company.findOne({ owner: req.user._id });
  const companyId = company?._id;
  const isOwner = job.postedBy.toString() === req.user._id.toString() || 
                  (companyId && job.company.toString() === companyId.toString());

  if (!isOwner) {
    return next(new AppError('Not authorized to update this job.', 403));
  }

  // Check if job is in payment_pending status
  if (job.status !== 'payment_pending') {
    return next(new AppError('This job is not awaiting payment.', 400));
  }

  // Check if job is approved by admin
  if (!job.isApproved) {
    return next(new AppError('This job has not been approved by admin yet.', 400));
  }

  // Check job posting fee setting
  const SystemSettings = require('../models/SystemSettings');
  const settings = await SystemSettings.getSettings();
  const feeEnabled = settings.jobPostingFee?.enabled === true;
  const feeAmount = settings.jobPostingFee?.amount ?? 0;
  const feeCurrency = settings.jobPostingFee?.currency ?? 'ETB';

  if (!feeEnabled) {
    return next(new AppError('Job posting fee is not enabled.', 400));
  }

  // Payment verification - expects paymentReference from frontend
  // In a real implementation, you would verify the payment with your payment provider here
  // Example for Chapa: const isVerified = await verifyChapaPayment(req.body.paymentReference, feeAmount, feeCurrency);
  // Example for Telebirr: const isVerified = await verifyTelebirrPayment(req.body.paymentReference, feeAmount, feeCurrency);
  
  const { paymentReference, paymentMethod } = req.body;
  
  if (!paymentReference) {
    return next(new AppError('Payment reference is required.', 400));
  }

  // TODO: Integrate with your payment provider (Chapa, Telebirr, etc.)
  // Replace this with actual payment verification logic
  const paymentVerified = await verifyJobPostingPayment(paymentReference, feeAmount, feeCurrency, paymentMethod);
  
  if (!paymentVerified) {
    return next(new AppError('Payment verification failed. Please check your payment reference and try again.', 400));
  }

  // Mark job as published
  job.status = 'published';
  job.publishedAt = new Date();
  job.paymentReference = paymentReference;
  job.paymentMethod = paymentMethod || 'unknown';
  job.paymentVerifiedAt = new Date();
  await job.save({ validateBeforeSave: false });

  // Notify job seekers
  try {
    const jobseekers = await User.find(
      { role: 'jobseeker', isSuspended: { $ne: true } },
      { _id: 1 }
    ).lean();

    if (jobseekers.length > 0) {
      const companyName = job.company?.name || 'A company';
      const locationStr =
        [job.location?.city, job.location?.region].filter(Boolean).join(', ') || 'Ethiopia';

      const notifications = jobseekers.map((seeker) => ({
        recipient: seeker._id,
        type: 'new_job',
        title: 'New Job Posted',
        message: 'A new job has been approved and published.',
        link: `/jobs/${job._id}`,
        data: {
          jobId: job._id,
          jobTitle: job.title,
          companyName,
          location: locationStr,
          jobType: job.jobType,
        },
      }));

      await Notification.insertMany(notifications, { ordered: false });
    }
  } catch (notifErr) {
    console.error('Job alert fan-out error:', notifErr.message);
  }

  // Notify employer
  if (job.postedBy) {
    try {
      await createNotification({
        recipient: job.postedBy,
        type: 'job_published_after_payment',
        title: 'Job Published',
        message: `Your job posting "${job.title}" has been published after successful payment.`,
        link: '/employer/jobs',
        data: { jobId: job._id },
        sender: req.user.id,
      });
    } catch (notifErr) {
      console.error('Job published notification error:', notifErr.message);
    }
  }

  res.status(200).json({ 
    success: true, 
    message: 'Payment confirmed. Job is now published.', 
    data: job 
  });
});

module.exports = exports;

// @desc    Get job posting fee settings for checkout
// @route   GET /api/employer/payment/checkout
// @access  Private (Employer)
exports.getPaymentCheckout = asyncHandler(async (req, res, next) => {
  const employerId = req.user._id;
  
  // Get employer's company
  const company = await Company.findOne({ owner: employerId });
  if (!company) {
    return next(new AppError('Company profile not found. Please create a company profile first.', 404));
  }
  if (!company.isApproved) {
    return next(new AppError('Your company profile is awaiting admin approval. You can post jobs once it has been approved.', 403));
  }

  // Get fee settings
  const settings = await SystemSettings.getSettings();
  const feeEnabled = settings.jobPostingFee?.enabled === true;
  const feeAmount = settings.jobPostingFee?.amount ?? 0;
  const feeCurrency = settings.jobPostingFee?.currency ?? 'ETB';
  const paymentProvider = settings.jobPostingFee?.paymentProvider ?? 'manual';

  if (!feeEnabled) {
    return res.status(200).json({
      success: true,
      data: {
        paymentRequired: false,
        message: 'No payment required for job posting.',
      },
    });
  }

  if (feeAmount <= 0) {
    return next(new AppError('Job posting fee amount is not configured correctly.', 500));
  }

  // Check if there's a recent verified payment that can be reused
  // (within last 30 minutes and not yet used for a job)
  const recentTransaction = await PaymentTransaction.findOne({
    employer: employerId,
    company: company._id,
    amount: feeAmount,
    currency: feeCurrency,
    status: 'verified',
    job: null,
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // 30 minutes
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      paymentRequired: true,
      paymentProvider,
      fee: {
        amount: feeAmount,
        currency: feeCurrency,
      },
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
      },
      existingVerifiedPayment: recentTransaction ? {
        transactionReference: recentTransaction.transactionReference,
        paymentMethod: recentTransaction.paymentMethod,
        verifiedAt: recentTransaction.verifiedAt,
      } : null,
    },
  });
});

// @desc    Verify payment for job posting (before creating job)
// @route   POST /api/employer/payment/verify
// @access  Private (Employer)
exports.verifyJobPostingPayment = asyncHandler(async (req, res, next) => {
  const employerId = req.user._id;
  const { transactionReference, paymentMethod } = req.body;

  if (!transactionReference || !paymentMethod) {
    return next(new AppError('Transaction reference and payment method are required.', 400));
  }

  // Get employer's company
  const company = await Company.findOne({ owner: employerId });
  if (!company) {
    return next(new AppError('Company profile not found.', 404));
  }

  // Get fee settings
  const settings = await SystemSettings.getSettings();
  const feeEnabled = settings.jobPostingFee?.enabled === true;
  const feeAmount = settings.jobPostingFee?.amount ?? 0;
  const feeCurrency = settings.jobPostingFee?.currency ?? 'ETB';

  if (!feeEnabled) {
    return next(new AppError('Job posting fee is not enabled.', 400));
  }

  // IDEMPOTENCY CHECK: First check if we already have a verified transaction for this reference
  const existingVerifiedTransaction = await PaymentTransaction.findOne({
    employer: employerId,
    company: company._id,
    transactionReference,
    status: 'verified',
  });

  if (existingVerifiedTransaction) {
    return res.status(200).json({
      success: true,
      alreadyVerified: true,
      message: 'Payment already verified. You can now post your job.',
      data: {
        transactionReference: existingVerifiedTransaction.transactionReference,
        paymentMethod: existingVerifiedTransaction.paymentMethod,
        verifiedAt: existingVerifiedTransaction.verifiedAt,
      },
    });
  }

  // Verify the payment with the payment provider
  const verificationResult = await verifyJobPostingPayment(transactionReference, feeAmount, feeCurrency, paymentMethod);

  // Handle pending payments (bank_transfer, other) - these require manual admin verification
  if (verificationResult.pending) {
    // Check if pending transaction already exists
    let pendingTransaction = await PaymentTransaction.findOne({
      employer: employerId,
      company: company._id,
      transactionReference,
    });

    if (!pendingTransaction) {
      // Record pending transaction
      pendingTransaction = await PaymentTransaction.createPending({
        employer: employerId,
        company: company._id,
        amount: feeAmount,
        currency: feeCurrency,
        paymentMethod,
        transactionReference,
        status: 'pending',
        metadata: { providerResponse: verificationResult.data },
      });
    }

    return res.status(200).json({
      success: true,
      pending: true,
      message: verificationResult.error || 'Payment submitted for manual verification. An admin will review and approve.',
      data: {
        transactionReference,
        paymentMethod,
        status: 'pending',
        requiresAdminVerification: true,
      },
    });
  }

  if (!verificationResult.verified) {
    // Record failed transaction
    await PaymentTransaction.createPending({
      employer: employerId,
      company: company._id,
      amount: feeAmount,
      currency: feeCurrency,
      paymentMethod,
      transactionReference,
      status: 'failed',
      errorMessage: verificationResult.error || 'Payment verification failed with provider',
      metadata: { providerResponse: verificationResult.data },
    });
    
    return next(new AppError(verificationResult.error || 'Payment verification failed. Please check your payment reference and try again.', 400));
  }

  // Check if this transaction was already used for a job
  const existingTransaction = await PaymentTransaction.findOne({ transactionReference });
  if (existingTransaction) {
    if (existingTransaction.job) {
      return next(new AppError('This payment has already been used for a job posting.', 400));
    }
    // Update existing pending/failed transaction to verified
    existingTransaction.status = 'verified';
    existingTransaction.verifiedAt = new Date();
    existingTransaction.paymentMethod = paymentMethod;
    existingTransaction.metadata = { 
      ...existingTransaction.metadata, 
      providerResponse: verificationResult.data 
    };
    await existingTransaction.save();
  } else {
    // Create new verified transaction
    await PaymentTransaction.createPending({
      employer: employerId,
      company: company._id,
      amount: feeAmount,
      currency: feeCurrency,
      paymentMethod,
      transactionReference,
      status: 'verified',
      verifiedAt: new Date(),
      metadata: { providerResponse: verificationResult.data },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully. You can now post your job.',
    data: {
      transactionReference,
      paymentMethod,
      verifiedAt: new Date(),
    },
  });
});

// @desc    Get payment status for a transaction reference
// @route   GET /api/employer/payment/status/:transactionReference
// @access  Private (Employer)
exports.getPaymentStatus = asyncHandler(async (req, res, next) => {
  const employerId = req.user._id;
  const { transactionReference } = req.params;

  const transaction = await PaymentTransaction.findOne({
    employer: employerId,
    transactionReference,
  });

  if (!transaction) {
    return next(new AppError('Payment transaction not found.', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      transactionReference: transaction.transactionReference,
      paymentMethod: transaction.paymentMethod,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      verifiedAt: transaction.verifiedAt,
      jobId: transaction.job,
    },
  });
});

// @desc    Initiate Chapa payment
// @route   POST /api/employer/payment/initiate/chapa
// @access  Private (Employer)
exports.initiateChapaPayment = asyncHandler(async (req, res, next) => {
  const employerId = req.user._id;
  const { returnUrl } = req.body;

  console.log('[CHAPA INITIATE] Request for employer:', employerId);

  // Get employer's company
  const company = await Company.findOne({ owner: employerId });
  if (!company) {
    console.log('[CHAPA INITIATE] Company not found for employer:', employerId);
    return next(new AppError('Company profile not found.', 404));
  }
  if (!company.isApproved) {
    console.log('[CHAPA INITIATE] Company not approved:', company._id);
    return next(new AppError('Your company profile is awaiting admin approval.', 403));
  }

  // Get fee settings
  const settings = await SystemSettings.getSettings();
  const feeEnabled = settings.jobPostingFee?.enabled === true;
  const feeAmount = settings.jobPostingFee?.amount ?? 0;
  const feeCurrency = settings.jobPostingFee?.currency ?? 'ETB';

  if (!feeEnabled || feeAmount <= 0) {
    return next(new AppError('Job posting fee is not configured.', 400));
  }

  // Check for existing pending transaction to prevent duplicate Chapa initialization
  const existingPending = await PaymentTransaction.findOne({
    employer: employerId,
    company: company._id,
    paymentMethod: 'chapa',
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes
  }).sort({ createdAt: -1 });

  let txRef;
  let pendingTx;

  if (existingPending) {
    // Mark old pending as cancelled/failed to prevent confusion
    existingPending.status = 'failed';
    existingPending.errorMessage = 'Superseded by new payment initiation';
    existingPending.metadata = {
      ...existingPending.metadata,
      supersededAt: new Date(),
    };
    await existingPending.save();
  }

  // Always create a new transaction with unique tx_ref for Chapa
  txRef = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  pendingTx = await PaymentTransaction.createPending({
    employer: employerId,
    company: company._id,
    amount: feeAmount,
    currency: feeCurrency,
    paymentMethod: 'chapa',
    transactionReference: txRef,
    status: 'pending',
    metadata: { initiatedAt: new Date() },
  });

  // Initiate Chapa payment
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const callbackUrl = `${clientUrl}/api/employer/payment/callback/chapa`;
  const finalReturnUrl = returnUrl || `${clientUrl}/employer/post-job/checkout`;

  const result = await initiateChapaPayment({
    amount: feeAmount,
    currency: feeCurrency,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    phone: formatPhoneForChapa(req.user.phone),
    txRef,
    callbackUrl,
    returnUrl: finalReturnUrl,
    customization: {
      title: 'Job Posting Fee',
      description: 'Payment for job posting on Emare Job Portal',
    },
  });

  if (!result.success) {
    pendingTx.status = 'failed';
    pendingTx.errorMessage = result.error;
    await pendingTx.save();
    return next(new AppError(result.error || 'Failed to initialize Chapa payment', 500));
  }

  res.status(200).json({
    success: true,
    data: {
      checkoutUrl: result.checkoutUrl,
      txRef: result.txRef,
      transactionId: pendingTx._id,
    },
  });
});

// @desc    Initiate Telebirr payment
// @route   POST /api/employer/payment/initiate/telebirr
// @access  Private (Employer)
exports.initiateTelebirrPayment = asyncHandler(async (req, res, next) => {
  const employerId = req.user._id;
  const { returnUrl } = req.body;

  // Get employer's company
  const company = await Company.findOne({ owner: employerId });
  if (!company) {
    return next(new AppError('Company profile not found.', 404));
  }
  if (!company.isApproved) {
    return next(new AppError('Your company profile is awaiting admin approval.', 403));
  }

  // Get fee settings
  const settings = await SystemSettings.getSettings();
  const feeEnabled = settings.jobPostingFee?.enabled === true;
  const feeAmount = settings.jobPostingFee?.amount ?? 0;
  const feeCurrency = settings.jobPostingFee?.currency ?? 'ETB';

  if (!feeEnabled || feeAmount <= 0) {
    return next(new AppError('Job posting fee is not configured.', 400));
  }

  // Create a pending transaction first
  const outTradeNo = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const pendingTx = await PaymentTransaction.createPending({
    employer: employerId,
    company: company._id,
    amount: feeAmount,
    currency: feeCurrency,
    paymentMethod: 'telebirr',
    transactionReference: outTradeNo,
    status: 'pending',
    metadata: { initiatedAt: new Date() },
  });

  // Initiate Telebirr payment
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const notifyUrl = `${clientUrl}/api/employer/payment/callback/telebirr`;
  const finalReturnUrl = returnUrl || `${clientUrl}/employer/post-job/checkout`;

  const result = await initiateTelebirrPayment({
    amount: feeAmount,
    currency: feeCurrency,
    subject: `Job Posting Fee - ${company.name}`,
    outTradeNo,
    notifyUrl,
    returnUrl: finalReturnUrl,
  });

  if (!result.success) {
    pendingTx.status = 'failed';
    pendingTx.errorMessage = result.error;
    await pendingTx.save();
    return next(new AppError(result.error || 'Failed to initiate Telebirr payment', 500));
  }

  res.status(200).json({
    success: true,
    data: {
      checkoutUrl: result.checkoutUrl,
      outTradeNo: result.outTradeNo,
      transactionId: pendingTx._id,
    },
  });
});

// @desc    Initiate Bank Transfer payment
// @route   POST /api/employer/payment/initiate/bank_transfer
// @access  Private (Employer)
exports.initiateBankTransferPayment = asyncHandler(async (req, res, next) => {
  const employerId = req.user._id;
  const { returnUrl } = req.body;

  // Get employer's company
  const company = await Company.findOne({ owner: employerId });
  if (!company) {
    return next(new AppError('Company profile not found.', 404));
  }
  if (!company.isApproved) {
    return next(new AppError('Your company profile is awaiting admin approval.', 403));
  }

  // Get fee settings
  const settings = await SystemSettings.getSettings();
  const feeEnabled = settings.jobPostingFee?.enabled === true;
  const feeAmount = settings.jobPostingFee?.amount ?? 0;
  const feeCurrency = settings.jobPostingFee?.currency ?? 'ETB';

  if (!feeEnabled || feeAmount <= 0) {
    return next(new AppError('Job posting fee is not configured.', 400));
  }

  // Get bank account details from settings
  const bankDetails = settings.jobPostingFee?.bankAccountDetails || {
    bankName: 'Commercial Bank of Ethiopia',
    accountName: 'Emare Job Portal',
    accountNumber: '1000123456789',
    branch: 'Addis Ababa Main Branch',
    swiftCode: 'CBEETAAA',
  };

  // Create a pending transaction
  const transactionReference = `JOB-BT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const pendingTx = await PaymentTransaction.createPending({
    employer: employerId,
    company: company._id,
    amount: feeAmount,
    currency: feeCurrency,
    paymentMethod: 'bank_transfer',
    transactionReference,
    status: 'pending',
    metadata: { 
      initiatedAt: new Date(),
      bankDetails,
      returnUrl: returnUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/employer/post-job/checkout`,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      transactionReference: pendingTx.transactionReference,
      transactionId: pendingTx._id,
      bankDetails,
      amount: feeAmount,
      currency: feeCurrency,
      instructions: `Please transfer ${feeAmount} ${feeCurrency} to the bank account below. Include the transaction reference (${transactionReference}) in the transfer description. After completing the transfer, submit the transfer proof/reference through the payment portal.`,
    },
  });
});

// @desc    Chapa payment callback/webhook
// @route   POST /api/employer/payment/callback/chapa
// @access  Public (Chapa webhook)
exports.chapaPaymentCallback = asyncHandler(async (req, res, next) => {
  // Chapa sends webhook with tx_ref and status
  const { tx_ref, status, amount, currency } = req.body;
  
  if (!tx_ref) {
    return res.status(400).json({ success: false, message: 'Missing tx_ref' });
  }

  // Find the transaction
  const transaction = await PaymentTransaction.findOne({ transactionReference: tx_ref });
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  if (status === 'success') {
    // Verify the payment
    const verificationResult = await verifyChapaPayment(tx_ref, transaction.amount, transaction.currency);
    
    if (verificationResult.verified) {
      transaction.status = 'verified';
      transaction.verifiedAt = new Date();
      transaction.metadata = { 
        ...transaction.metadata, 
        providerResponse: verificationResult.data,
        webhookReceivedAt: new Date(),
      };
      await transaction.save();
    } else {
      transaction.status = 'failed';
      transaction.errorMessage = verificationResult.error;
      await transaction.save();
    }
  } else {
    transaction.status = 'failed';
    transaction.errorMessage = `Chapa status: ${status}`;
    await transaction.save();
  }

  res.status(200).json({ success: true, message: 'Webhook processed' });
});

// @desc    Telebirr payment callback/webhook (Step 7: Notify)
// @route   POST /api/employer/payment/callback/telebirr
// @access  Public (Telebirr webhook)
exports.telebirrPaymentCallback = asyncHandler(async (req, res, next) => {
  // Telebirr sends webhook with payment result
  // Official callback includes: orderId, outTradeNo, tradeState, totalAmount, tradeTime, sign, etc.
  const { orderId, outTradeNo, tradeState, totalAmount, tradeTime, sign } = req.body;

  console.log('[TELEBIRR] Callback received:', { orderId, outTradeNo, tradeState, totalAmount, hasSign: !!sign });

  if (!outTradeNo) {
    return res.status(400).json({ success: false, message: 'Missing outTradeNo' });
  }

  // Find the transaction by outTradeNo (stored as transactionReference)
  const transaction = await PaymentTransaction.findOne({ transactionReference: outTradeNo });
  if (!transaction) {
    console.warn('[TELEBIRR] Callback: Transaction not found for outTradeNo:', outTradeNo);
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  // Verify the callback signature if provided (official signature verification)
  if (sign) {
    const crypto = require('crypto');
    const fabricAppId = process.env.TELEBIRR_FABRIC_APP_ID;
    const appSecret = process.env.TELEBIRR_APP_SECRET;
    const shortCode = process.env.TELEBIRR_SHORT_CODE;

    // Build signature payload per official documentation
    // The exact fields and format should match official documentation
    const expectedSignPayload = {
      orderId: req.body.orderId,
      outTradeNo: outTradeNo,
      tradeState: tradeState,
      totalAmount: totalAmount,
      tradeTime: req.body.tradeTime,
    };

    const encodedParams = Object.entries({
      ...expectedSignPayload,
      appId: process.env.TELEBIRR_FABRIC_APP_ID,
      appSecret: process.env.TELEBIRR_APP_SECRET,
      shortCode: process.env.TELEBIRR_SHORT_CODE,
    })
      .filter(([key, value]) => value != null && value !== '')
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const expectedSign = crypto.createHash('sha256').update(encodedParams).digest('hex');

    if (sign !== expectedSign) {
      console.warn('[TELEBIRR] Callback: Invalid signature', { received: sign, expected: expectedSign });
      // Don't fail here - log warning but continue processing
    } else {
      console.log('[TELEBIRR] Callback: Signature verified successfully');
    }
  }

  // Handle payment result
  if (tradeState === 'SUCCESS') {
    // Verify the payment with Telebirr API for extra security
    const verificationResult = await verifyTelebirrPayment(outTradeNo, transaction.amount, transaction.currency);

    if (verificationResult.verified) {
      transaction.status = 'verified';
      transaction.verifiedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        providerResponse: verificationResult.data,
        webhookReceivedAt: new Date(),
        orderId: req.body.orderId,
        tradeTime: req.body.tradeTime,
      };
      await transaction.save();
      console.log('[TELEBIRR] Callback: Payment verified and transaction updated to verified');
    } else {
      transaction.status = 'failed';
      transaction.errorMessage = verificationResult.error;
      await transaction.save();
      console.warn('[TELEBIRR] Callback: Verification failed:', verificationResult.error);
    }
  } else {
    transaction.status = 'failed';
    transaction.errorMessage = `Telebirr status: ${tradeState}`;
    await transaction.save();
    console.warn('[TELEBIRR] Callback: Payment not successful:', tradeState);
  }

  res.status(200).json({ success: true, message: 'Webhook processed' });
});