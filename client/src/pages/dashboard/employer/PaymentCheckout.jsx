import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import systemSettingsService from '../../../services/systemSettingsService';
import toast from 'react-hot-toast';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiArrowLeft, FiLock, FiBriefcase, FiDollarSign, FiRefreshCw, FiExternalLink } from 'react-icons/fi';

const PAYMENT_METHODS = [
  { value: 'chapa', label: 'Chapa', icon: '💳', realPayment: true },
  { value: 'telebirr', label: 'Telebirr', icon: '📱', realPayment: true },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', realPayment: true },
  { value: 'other', label: 'Other', icon: '💰', realPayment: false },
];

// Timeout wrapper for fetch requests
const fetchWithTimeout = (promise, ms = 15000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );
  return Promise.race([promise, timeout]);
};

const PaymentCheckout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('chapa');
  const [transactionReference, setTransactionReference] = useState('');
  const [showExistingPayment, setShowExistingPayment] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [isChapaReturn, setIsChapaReturn] = useState(false);
  const [isVerifyingChapaReturn, setIsVerifyingChapaReturn] = useState(false);
  const [chapaVerificationFailed, setChapaVerificationFailed] = useState(false);
  const verificationInitiatedRef = useRef(false);

  // Check if we're returning from a successful verification
  const state = location.state || {};
  const returnFromVerification = state.returnFromVerification;
  const verifiedTransactionRef = state.verifiedTransactionRef;

  // SessionStorage keys for storing transaction references before redirect
  const CHAPA_TX_REF_KEY = 'chapa_transaction_reference';
  const TELEBIRR_TX_REF_KEY = 'telebirr_transaction_reference';
  const BANK_TRANSFER_TX_REF_KEY = 'bank_transfer_transaction_reference';

  // State for tracking Telebirr and Bank Transfer returns
  const [isTelebirrReturn, setIsTelebirrReturn] = useState(false);
  const [isVerifyingTelebirrReturn, setIsVerifyingTelebirrReturn] = useState(false);
  const [telebirrVerificationFailed, setTelebirrVerificationFailed] = useState(false);
  const telebirrVerificationInitiatedRef = useRef(false);

  const [isBankTransferReturn, setIsBankTransferReturn] = useState(false);
  const [isVerifyingBankTransferReturn, setIsVerifyingBankTransferReturn] = useState(false);
  const [bankTransferVerificationFailed, setBankTransferVerificationFailed] = useState(false);
  const bankTransferVerificationInitiatedRef = useRef(false);

  // ===== RENDER-LEVEL DEBUG LOGGING (read-only) =====
  const storedChapaTxRefOnRender = sessionStorage.getItem(CHAPA_TX_REF_KEY);
  const storedTelebirrTxRefOnRender = sessionStorage.getItem(TELEBIRR_TX_REF_KEY);
  const storedBankTransferTxRefOnRender = sessionStorage.getItem(BANK_TRANSFER_TX_REF_KEY);
  const localStorageChapaBackupOnRender = localStorage.getItem('CHAPA_DEBUG_TX_REF');
  const localStorageTelebirrBackupOnRender = localStorage.getItem('TELEBIRR_DEBUG_TX_REF');
  const localStorageBankTransferBackupOnRender = localStorage.getItem('BANK_TRANSFER_DEBUG_TX_REF');
  const paramsOnRender = new URLSearchParams(location.search);
  const urlTxRefOnRender = paramsOnRender.get('tx_ref') || paramsOnRender.get('trx_ref') || paramsOnRender.get('reference');
  const urlOutTradeNoOnRender = paramsOnRender.get('out_trade_no');
  
  console.log('[CHAPA FLOW] ===== PAYMENT CHECKOUT RENDER =====');
  console.log('[CHAPA FLOW] window.location.href:', window.location.href);
  console.log('[CHAPA FLOW] location.search:', location.search);
  console.log('[CHAPA FLOW] urlTxRef (from URL):', urlTxRefOnRender);
  console.log('[CHAPA FLOW] urlOutTradeNo (from URL):', urlOutTradeNoOnRender);
  console.log('[CHAPA FLOW] storedChapaTxRef (sessionStorage):', storedChapaTxRefOnRender);
  console.log('[CHAPA FLOW] storedTelebirrTxRef (sessionStorage):', storedTelebirrTxRefOnRender);
  console.log('[CHAPA FLOW] storedBankTransferTxRef (sessionStorage):', storedBankTransferTxRefOnRender);
  console.log('[CHAPA FLOW] localStorage Chapa backup:', localStorageChapaBackupOnRender);
  console.log('[CHAPA FLOW] localStorage Telebirr backup:', localStorageTelebirrBackupOnRender);
  console.log('[CHAPA FLOW] localStorage Bank Transfer backup:', localStorageBankTransferBackupOnRender);
  console.log('[CHAPA FLOW] sessionStorage keys:', { CHAPA_TX_REF_KEY, TELEBIRR_TX_REF_KEY, BANK_TRANSFER_TX_REF_KEY });
  console.log('[CHAPA FLOW] isChapaReturn:', isChapaReturn);
  console.log('[CHAPA FLOW] isVerifyingChapaReturn:', isVerifyingChapaReturn);
  console.log('[CHAPA FLOW] isTelebirrReturn:', isTelebirrReturn);
  console.log('[CHAPA FLOW] isVerifyingTelebirrReturn:', isVerifyingTelebirrReturn);
  console.log('[CHAPA FLOW] isBankTransferReturn:', isBankTransferReturn);
  console.log('[CHAPA FLOW] isVerifyingBankTransferReturn:', isVerifyingBankTransferReturn);
  console.log('[CHAPA FLOW] verificationResult:', verificationResult);
  console.log('[CHAPA FLOW] loading:', loading);
  console.log('[CHAPA FLOW] checkoutData:', checkoutData);
  console.log('[CHAPA FLOW] ALL URL PARAMS:', Object.fromEntries(paramsOnRender.entries()));
  console.log('[CHAPA FLOW] Should show form:', !verificationResult && !isVerifyingChapaReturn && !isChapaReturn && !chapaVerificationFailed && !isVerifyingTelebirrReturn && !isTelebirrReturn && !telebirrVerificationFailed && !isVerifyingBankTransferReturn && !isBankTransferReturn && !bankTransferVerificationFailed);
  console.log('[CHAPA FLOW] Should show verifying:', isVerifyingChapaReturn && !verificationResult);
  console.log('[CHAPA FLOW] Should show success:', !!verificationResult);
  console.log('[CHAPA FLOW] Should show verification failed:', chapaVerificationFailed && !verificationResult);

  // Handle return from Chapa checkout - check for tx_ref in URL
  // This runs on location changes (e.g., page refresh with Chapa return params)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlTxRef = params.get('tx_ref') || params.get('trx_ref') || params.get('reference');
    const status = params.get('status') || params.get('state');
    const storedTxRef = sessionStorage.getItem(CHAPA_TX_REF_KEY);
    const localStorageBackup = localStorage.getItem('CHAPA_DEBUG_TX_REF');
    
    console.log('[CHAPA FLOW] STEP 4 - RETURNED FROM CHAPA');
    console.log('[CHAPA FLOW] window.location.href:', window.location.href);
    console.log('[CHAPA FLOW] window.location.search:', location.search);
    console.log('[CHAPA FLOW] URL params:', Object.fromEntries(params.entries()));
    console.log('[CHAPA FLOW] sessionStorage transaction reference:', storedTxRef);
    console.log('[CHAPA FLOW] localStorage backup (CHAPA_DEBUG_TX_REF):', localStorageBackup);
    console.log('[CHAPA FLOW] isChapaReturn:', isChapaReturn);
    console.log('[CHAPA FLOW] isVerifyingChapaReturn:', isVerifyingChapaReturn);
    console.log('[CHAPA FLOW] verificationResult:', verificationResult);
    console.log('[CHAPA FLOW] verificationInitiatedRef.current:', verificationInitiatedRef.current);
    
    // Use sessionStorage first, then localStorage backup
    const effectiveStoredTxRef = storedTxRef || localStorageBackup;
    
    // Check if this is a Chapa return:
    // 1. URL has tx_ref/trx_ref/reference (with success/failure status)
    // 2. OR URL has no params but we have a stored transaction reference (Chapa redirected without params)
    const hasUrlTxRef = !!urlTxRef;
    const hasStoredTxRef = !!effectiveStoredTxRef;
    const isChapaReturnDetected = hasUrlTxRef || hasStoredTxRef;
    
    console.log('[CHAPA FLOW] hasUrlTxRef:', hasUrlTxRef, 'hasStoredTxRef:', hasStoredTxRef, 'isChapaReturnDetected:', isChapaReturnDetected);
    
    if (!isChapaReturnDetected) {
      console.log('[CHAPA FLOW] NOT a Chapa return - skipping');
      return;
    }
    
    if (verificationInitiatedRef.current) {
      console.log('[CHAPA FLOW] Skipping - verification already initiated');
      return;
    }
    
    // If we have URL tx_ref, check status for success/failure
    let shouldVerify = false;
    let isFailure = false;
    
    if (hasUrlTxRef) {
      const isSuccessStatus = status === 'success' || status === 'completed' || status === 'SUCCESS' || status === 'COMPLETED' || status === 'Paid' || status === 'PAID';
      const isFailureStatus = status === 'failed' || status === 'cancelled' || status === 'FAILED' || status === 'CANCELLED' || status === 'Failed';
      
      console.log('[CHAPA FLOW] URL status check - isSuccessStatus:', isSuccessStatus, 'isFailureStatus:', isFailureStatus);
      
      if (isSuccessStatus) {
        shouldVerify = true;
      } else if (isFailureStatus) {
        isFailure = true;
      } else {
        // URL has tx_ref but unknown status - still verify
        console.log('[CHAPA FLOW] URL has tx_ref but unknown status, will verify anyway');
        shouldVerify = true;
      }
    } else {
      // No URL tx_ref but we have stored reference - this is a Chapa return without params
      console.log('[CHAPA FLOW] No URL tx_ref but stored reference exists - treating as Chapa return');
      shouldVerify = true;
    }
    
    if (!shouldVerify && !isFailure) {
      console.log('[CHAPA FLOW] Not a success/failure return, not verifying');
      return;
    }
    
    verificationInitiatedRef.current = true;
    
    // Get transaction reference: URL first, then sessionStorage/localStorage fallback
    const txRef = urlTxRef || effectiveStoredTxRef;
    
    console.log('[CHAPA FLOW] STEP 5 - VERIFYING PAYMENT');
    console.log('[CHAPA FLOW] urlTxRef:', urlTxRef);
    console.log('[CHAPA FLOW] effectiveStoredTxRef:', effectiveStoredTxRef);
    console.log('[CHAPA FLOW] reference being verified:', txRef);
    console.log('[CHAPA FLOW] paymentMethod:', 'chapa');
    console.log('[CHAPA FLOW] isFailure:', isFailure);
    
    if (!txRef) {
      console.error('[CHAPA FLOW] No transaction reference available');
      setError('Transaction reference not found. Please try again.');
      return;
    }
    
    setIsChapaReturn(true);
    setIsVerifyingChapaReturn(true);
    setTransactionReference(txRef);
    setPaymentMethod('chapa');
    
    // Clean up URL AFTER capturing the reference
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    if (isFailure) {
      console.log('[CHAPA FLOW] Chapa payment failed/cancelled');
      setError('Payment was not completed. Please try again.');
      setIsVerifyingChapaReturn(false);
      return;
    }
    
    // Verify with the captured reference directly
    handleVerifyPayment(txRef);
  }, [location, isChapaReturn]);

  // Handle return from Telebirr checkout - check for out_trade_no in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlOutTradeNo = params.get('out_trade_no');
    const tradeState = params.get('trade_state');
    const storedTxRef = sessionStorage.getItem(TELEBIRR_TX_REF_KEY);
    const localStorageBackup = localStorage.getItem('TELEBIRR_DEBUG_TX_REF');
    
    console.log('[TELEBIRR FLOW] STEP 4 - RETURNED FROM TELEBIRR');
    console.log('[TELEBIRR FLOW] window.location.href:', window.location.href);
    console.log('[TELEBIRR FLOW] window.location.search:', location.search);
    console.log('[TELEBIRR FLOW] URL params:', Object.fromEntries(params.entries()));
    console.log('[TELEBIRR FLOW] sessionStorage transaction reference:', storedTxRef);
    console.log('[TELEBIRR FLOW] localStorage backup (TELEBIRR_DEBUG_TX_REF):', localStorageBackup);
    console.log('[TELEBIRR FLOW] isTelebirrReturn:', isTelebirrReturn);
    console.log('[TELEBIRR FLOW] isVerifyingTelebirrReturn:', isVerifyingTelebirrReturn);
    console.log('[TELEBIRR FLOW] verificationResult:', verificationResult);
    console.log('[TELEBIRR FLOW] telebirrVerificationInitiatedRef.current:', telebirrVerificationInitiatedRef.current);
    
    // Use sessionStorage first, then localStorage backup
    const effectiveStoredTxRef = storedTxRef || localStorageBackup;
    
    // Check if this is a Telebirr return:
    // 1. URL has out_trade_no (with trade_state)
    // 2. OR URL has no params but we have a stored transaction reference (Telebirr redirected without params)
    const hasUrlOutTradeNo = !!urlOutTradeNo;
    const hasStoredTxRef = !!effectiveStoredTxRef;
    const isTelebirrReturnDetected = hasUrlOutTradeNo || hasStoredTxRef;
    
    console.log('[TELEBIRR FLOW] hasUrlOutTradeNo:', hasUrlOutTradeNo, 'hasStoredTxRef:', hasStoredTxRef, 'isTelebirrReturnDetected:', isTelebirrReturnDetected);
    
    if (!isTelebirrReturnDetected) {
      console.log('[TELEBIRR FLOW] NOT a Telebirr return - skipping');
      return;
    }
    
    if (telebirrVerificationInitiatedRef.current) {
      console.log('[TELEBIRR FLOW] Skipping - verification already initiated');
      return;
    }
    
    // If we have URL out_trade_no, check trade_state for success/failure
    let shouldVerify = false;
    let isFailure = false;
    
    if (hasUrlOutTradeNo) {
      const isSuccessStatus = tradeState === 'SUCCESS' || tradeState === 'success';
      const isFailureStatus = tradeState === 'FAIL' || tradeState === 'fail' || tradeState === 'CLOSED' || tradeState === 'closed';
      
      console.log('[TELEBIRR FLOW] URL status check - isSuccessStatus:', isSuccessStatus, 'isFailureStatus:', isFailureStatus);
      
      if (isSuccessStatus) {
        shouldVerify = true;
      } else if (isFailureStatus) {
        isFailure = true;
      } else {
        // URL has out_trade_no but unknown status - still verify
        console.log('[TELEBIRR FLOW] URL has out_trade_no but unknown status, will verify anyway');
        shouldVerify = true;
      }
    } else {
      // No URL out_trade_no but we have stored reference - this is a Telebirr return without params
      console.log('[TELEBIRR FLOW] No URL out_trade_no but stored reference exists - treating as Telebirr return');
      shouldVerify = true;
    }
    
    if (!shouldVerify && !isFailure) {
      console.log('[TELEBIRR FLOW] Not a success/failure return, not verifying');
      return;
    }
    
    telebirrVerificationInitiatedRef.current = true;
    
    // Get transaction reference: URL first, then sessionStorage/localStorage fallback
    const outTradeNo = urlOutTradeNo || effectiveStoredTxRef;
    
    console.log('[TELEBIRR FLOW] STEP 5 - VERIFYING PAYMENT');
    console.log('[TELEBIRR FLOW] urlOutTradeNo:', urlOutTradeNo);
    console.log('[TELEBIRR FLOW] effectiveStoredTxRef:', effectiveStoredTxRef);
    console.log('[TELEBIRR FLOW] reference being verified:', outTradeNo);
    console.log('[TELEBIRR FLOW] paymentMethod:', 'telebirr');
    console.log('[TELEBIRR FLOW] isFailure:', isFailure);
    
    if (!outTradeNo) {
      console.error('[TELEBIRR FLOW] No transaction reference available');
      setError('Transaction reference not found. Please try again.');
      return;
    }
    
    setIsTelebirrReturn(true);
    setIsVerifyingTelebirrReturn(true);
    setTransactionReference(outTradeNo);
    setPaymentMethod('telebirr');
    
    // Clean up URL AFTER capturing the reference
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    if (isFailure) {
      console.log('[TELEBIRR FLOW] Telebirr payment failed/cancelled');
      setError('Payment was not completed. Please try again.');
      setIsVerifyingTelebirrReturn(false);
      return;
    }
    
    // Verify with the captured reference directly
    handleVerifyPayment(outTradeNo);
  }, [location, isTelebirrReturn]);

  // Handle return from Bank Transfer - check for bank transfer reference in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlBankRef = params.get('bank_ref') || params.get('reference') || params.get('tx_ref');
    const status = params.get('status') || params.get('state');
    const storedTxRef = sessionStorage.getItem(BANK_TRANSFER_TX_REF_KEY);
    const localStorageBackup = localStorage.getItem('BANK_TRANSFER_DEBUG_TX_REF');
    
    console.log('[BANK TRANSFER FLOW] STEP 4 - RETURNED FROM BANK TRANSFER');
    console.log('[BANK TRANSFER FLOW] window.location.href:', window.location.href);
    console.log('[BANK TRANSFER FLOW] window.location.search:', location.search);
    console.log('[BANK TRANSFER FLOW] URL params:', Object.fromEntries(params.entries()));
    console.log('[BANK TRANSFER FLOW] sessionStorage transaction reference:', storedTxRef);
    console.log('[BANK TRANSFER FLOW] localStorage backup (BANK_TRANSFER_DEBUG_TX_REF):', localStorageBackup);
    console.log('[BANK TRANSFER FLOW] isBankTransferReturn:', isBankTransferReturn);
    console.log('[BANK TRANSFER FLOW] isVerifyingBankTransferReturn:', isVerifyingBankTransferReturn);
    console.log('[BANK TRANSFER FLOW] verificationResult:', verificationResult);
    console.log('[BANK TRANSFER FLOW] bankTransferVerificationInitiatedRef.current:', bankTransferVerificationInitiatedRef.current);
    
    // Use sessionStorage first, then localStorage backup
    const effectiveStoredTxRef = storedTxRef || localStorageBackup;
    
    // Check if this is a Bank Transfer return:
    // 1. URL has bank_ref/reference (with status)
    // 2. OR URL has no params but we have a stored transaction reference
    const hasUrlBankRef = !!urlBankRef;
    const hasStoredTxRef = !!effectiveStoredTxRef;
    const isBankTransferReturnDetected = hasUrlBankRef || hasStoredTxRef;
    
    console.log('[BANK TRANSFER FLOW] hasUrlBankRef:', hasUrlBankRef, 'hasStoredTxRef:', hasStoredTxRef, 'isBankTransferReturnDetected:', isBankTransferReturnDetected);
    
    if (!isBankTransferReturnDetected) {
      console.log('[BANK TRANSFER FLOW] NOT a Bank Transfer return - skipping');
      return;
    }
    
    if (bankTransferVerificationInitiatedRef.current) {
      console.log('[BANK TRANSFER FLOW] Skipping - verification already initiated');
      return;
    }
    
    // For Bank Transfer, we don't auto-verify - we show pending state
    // The payment will be manually verified by admin
    let shouldShowPending = false;
    
    if (hasUrlBankRef || hasStoredTxRef) {
      shouldShowPending = true;
      console.log('[BANK TRANSFER FLOW] Bank Transfer return detected - showing pending state');
    }
    
    if (!shouldShowPending) {
      console.log('[BANK TRANSFER FLOW] Not a Bank Transfer return');
      return;
    }
    
    bankTransferVerificationInitiatedRef.current = true;
    
    // Get transaction reference: URL first, then sessionStorage/localStorage fallback
    const bankRef = urlBankRef || effectiveStoredTxRef;
    
    console.log('[BANK TRANSFER FLOW] STEP 5 - BANK TRANSFER PENDING');
    console.log('[BANK TRANSFER FLOW] urlBankRef:', urlBankRef);
    console.log('[BANK TRANSFER FLOW] effectiveStoredTxRef:', effectiveStoredTxRef);
    console.log('[BANK TRANSFER FLOW] reference:', bankRef);
    console.log('[BANK TRANSFER FLOW] paymentMethod:', 'bank_transfer');
    
    if (!bankRef) {
      console.error('[BANK TRANSFER FLOW] No transaction reference available');
      setError('Transaction reference not found. Please try again.');
      return;
    }
    
    setIsBankTransferReturn(true);
    setIsVerifyingBankTransferReturn(true);
    setTransactionReference(bankRef);
    setPaymentMethod('bank_transfer');
    
    // Clean up URL AFTER capturing the reference
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    // For Bank Transfer, we don't call handleVerifyPayment - it's manually reviewed by admin
    // Instead we show a pending state
    setIsVerifyingBankTransferReturn(false);
  }, [location, isBankTransferReturn]);

  const loadCheckoutData = useCallback(async () => {
    const storedChapaTxRef = sessionStorage.getItem(CHAPA_TX_REF_KEY);
    const storedTelebirrTxRef = sessionStorage.getItem(TELEBIRR_TX_REF_KEY);
    const storedBankTransferTxRef = sessionStorage.getItem(BANK_TRANSFER_TX_REF_KEY);
    const localStorageChapaBackup = localStorage.getItem('CHAPA_DEBUG_TX_REF');
    const localStorageTelebirrBackup = localStorage.getItem('TELEBIRR_DEBUG_TX_REF');
    const localStorageBankTransferBackup = localStorage.getItem('BANK_TRANSFER_DEBUG_TX_REF');
    
    const effectiveChapaTxRef = storedChapaTxRef || localStorageChapaBackup;
    const effectiveTelebirrTxRef = storedTelebirrTxRef || localStorageTelebirrBackup;
    const effectiveBankTransferTxRef = storedBankTransferTxRef || localStorageBankTransferBackup;
    
    const currentIsChapaReturn = isChapaReturn;
    const currentIsVerifyingChapaReturn = isVerifyingChapaReturn;
    const currentIsTelebirrReturn = isTelebirrReturn;
    const currentIsVerifyingTelebirrReturn = isVerifyingTelebirrReturn;
    const currentIsBankTransferReturn = isBankTransferReturn;
    const currentIsVerifyingBankTransferReturn = isVerifyingBankTransferReturn;
    
    console.log('[CHAPA FLOW] loadCheckoutData called:', {
      isChapaReturn: currentIsChapaReturn,
      isVerifyingChapaReturn: currentIsVerifyingChapaReturn,
      isTelebirrReturn: currentIsTelebirrReturn,
      isVerifyingTelebirrReturn: currentIsVerifyingTelebirrReturn,
      isBankTransferReturn: currentIsBankTransferReturn,
      isVerifyingBankTransferReturn: currentIsVerifyingBankTransferReturn,
      storedChapaTxRef,
      storedTelebirrTxRef,
      storedBankTransferTxRef,
      effectiveChapaTxRef,
      effectiveTelebirrTxRef,
      effectiveBankTransferTxRef,
      verificationResult
    });
    
    // Skip loading if we're handling ANY payment return or verifying, OR if we have a stored reference
    if (currentIsChapaReturn || currentIsVerifyingChapaReturn || effectiveChapaTxRef ||
        currentIsTelebirrReturn || currentIsVerifyingTelebirrReturn || effectiveTelebirrTxRef ||
        currentIsBankTransferReturn || currentIsVerifyingBankTransferReturn || effectiveBankTransferTxRef) {
      console.log('[CHAPA FLOW] loadCheckoutData SKIPPED - Payment return/verification in progress or stored reference exists');
      setLoading(false);
      return;
    }
    
    console.log('[CHAPA FLOW] loadCheckoutData PROCEEDING with normal load');
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(systemSettingsService.getPaymentCheckout(), 15000);
      console.log('[CHAPA FLOW] loadCheckoutData API response:', res.data);
      if (res.data?.success) {
        setCheckoutData(res.data.data);
        
        // If we have an existing verified payment, show option to use it
        if (res.data.data.existingVerifiedPayment) {
          console.log('[CHAPA FLOW] Existing verified payment found:', res.data.data.existingVerifiedPayment);
          setShowExistingPayment(true);
        }
      } else {
        // Backend returned success: false
        throw new Error(res.data?.message || 'Failed to load payment information.');
      }
    } catch (err) {
      console.error('[CHAPA FLOW] loadCheckoutData error:', err);
      const errorMessage = err.response?.data?.message || err.message || t('employer.paymentCheckout.loadError') || 'Failed to load payment information.';
      setError(errorMessage);
      // Don't show toast for timeout - let the error UI handle it
      if (!err.message?.includes('timeout')) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleRetry = () => {
    console.log('[CHAPA FLOW] handleRetry Called');
    setIsChapaReturn(false);
    setChapaVerificationFailed(false);
    setIsTelebirrReturn(false);
    setTelebirrVerificationFailed(false);
    setIsBankTransferReturn(false);
    setBankTransferVerificationFailed(false);
    sessionStorage.removeItem(CHAPA_TX_REF_KEY);
    sessionStorage.removeItem(TELEBIRR_TX_REF_KEY);
    sessionStorage.removeItem(BANK_TRANSFER_TX_REF_KEY);
    localStorage.removeItem('CHAPA_DEBUG_TX_REF');
    localStorage.removeItem('TELEBIRR_DEBUG_TX_REF');
    localStorage.removeItem('BANK_TRANSFER_DEBUG_TX_REF');
    loadCheckoutData();
  };

  useEffect(() => {
    const storedChapaTxRef = sessionStorage.getItem(CHAPA_TX_REF_KEY);
    const storedTelebirrTxRef = sessionStorage.getItem(TELEBIRR_TX_REF_KEY);
    const storedBankTransferTxRef = sessionStorage.getItem(BANK_TRANSFER_TX_REF_KEY);
    const localStorageChapaBackup = localStorage.getItem('CHAPA_DEBUG_TX_REF');
    const localStorageTelebirrBackup = localStorage.getItem('TELEBIRR_DEBUG_TX_REF');
    const localStorageBankTransferBackup = localStorage.getItem('BANK_TRANSFER_DEBUG_TX_REF');
    
    const effectiveChapaTxRef = storedChapaTxRef || localStorageChapaBackup;
    const effectiveTelebirrTxRef = storedTelebirrTxRef || localStorageTelebirrBackup;
    const effectiveBankTransferTxRef = storedBankTransferTxRef || localStorageBankTransferBackup;
    
    console.log('[CHAPA FLOW] loadCheckoutData useEffect checking conditions:', { 
      isChapaReturn, 
      isVerifyingChapaReturn,
      isTelebirrReturn,
      isVerifyingTelebirrReturn,
      isBankTransferReturn,
      isVerifyingBankTransferReturn,
      storedChapaTxRef,
      storedTelebirrTxRef,
      storedBankTransferTxRef,
      effectiveChapaTxRef,
      effectiveTelebirrTxRef,
      effectiveBankTransferTxRef,
      verificationResult
    });
    
    if (!isChapaReturn && !isVerifyingChapaReturn && !effectiveChapaTxRef &&
        !isTelebirrReturn && !isVerifyingTelebirrReturn && !effectiveTelebirrTxRef &&
        !isBankTransferReturn && !isVerifyingBankTransferReturn && !effectiveBankTransferTxRef) {
      console.log('[CHAPA FLOW] loadCheckoutData useEffect: Calling loadCheckoutData');
      loadCheckoutData();
    } else {
      console.log('[CHAPA FLOW] loadCheckoutData useEffect: SKIPPING loadCheckoutData');
    }
  }, [loadCheckoutData, isChapaReturn, isVerifyingChapaReturn, isTelebirrReturn, isVerifyingTelebirrReturn, isBankTransferReturn, isVerifyingBankTransferReturn]);

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod);
  const isChapaRealPayment = selectedMethod?.realPayment && checkoutData?.paymentProvider === 'chapa';
  const isTelebirrRealPayment = selectedMethod?.realPayment && checkoutData?.paymentProvider === 'telebirr';
  const isBankTransferRealPayment = selectedMethod?.realPayment && checkoutData?.paymentProvider === 'bank_transfer';
  const isRealPayment = isChapaRealPayment || isTelebirrRealPayment || isBankTransferRealPayment;

const handleInitiateRealPayment = async () => {
    console.log('[TELEBIRR] handleInitiateRealPayment called, paymentMethod:', paymentMethod, 'isRealPayment:', isRealPayment);
    if (!isRealPayment) return;

    // Route to appropriate initiation function based on payment method
    if (paymentMethod === 'chapa') {
      return handleInitiateChapaPayment();
    } else if (paymentMethod === 'telebirr') {
      return handleInitiateTelebirrPayment();
    } else if (paymentMethod === 'bank_transfer') {
      return handleInitiateBankTransfer();
    }
  };

  const handleInitiateChapaPayment = async () => {
    if (!isChapaRealPayment) return;
    
    console.log('[CHAPA FLOW] STEP 1 - INITIATING PAYMENT');
    console.log('[CHAPA FLOW] isRealPayment:', isRealPayment);
    console.log('[CHAPA FLOW] checkoutData:', checkoutData);
    console.log('[CHAPA FLOW] company:', checkoutData?.company);
    console.log('[CHAPA FLOW] fee:', checkoutData?.fee);
    console.log('[CHAPA FLOW] paymentProvider:', checkoutData?.paymentProvider);
    console.log('[CHAPA FLOW] sessionStorage BEFORE:', sessionStorage.getItem(CHAPA_TX_REF_KEY));
    setInitiating(true);
    setError(null);
    try {
      const returnUrl = `${window.location.origin}/employer/post-job/checkout`;
      const res = await systemSettingsService.initiateChapaPayment(returnUrl);
      
      console.log('[CHAPA FLOW] STEP 1 - BACKEND INITIATE RESPONSE');
      console.log('[CHAPA FLOW] Full response object:', res);
      console.log('[CHAPA FLOW] res.status:', res.status);
      console.log('[CHAPA FLOW] res.data:', res.data);
      console.log('[CHAPA FLOW] res.data.success:', res.data?.success);
      console.log('[CHAPA FLOW] res.data.message:', res.data?.message);
      console.log('[CHAPA FLOW] res.data.data:', res.data?.data);
      console.log('[CHAPA FLOW] res.data.data.checkoutUrl:', res.data?.data?.checkoutUrl);
      console.log('[CHAPA FLOW] res.data.data.txRef:', res.data?.data?.txRef);
      console.log('[CHAPA FLOW] res.data.data.transactionId:', res.data?.data?.transactionId);
      console.log('[CHAPA FLOW] res.data.data.tx_ref:', res.data?.data?.tx_ref);
      console.log('[CHAPA FLOW] res.data.data.transactionReference:', res.data?.data?.transactionReference);
      console.log('[CHAPA FLOW] res.data.data.trx_ref:', res.data?.data?.trx_ref);
      console.log('[CHAPA FLOW] res.data.data.reference:', res.data?.data?.reference);
      console.log('[CHAPA FLOW] ALL data fields:', res.data?.data ? Object.keys(res.data.data) : 'none');
      
      if (res.data?.success && res.data.data?.checkoutUrl) {
        // Store transaction reference in sessionStorage before redirect
        // Backend returns txRef (camelCase), also check other possible fields
        const txRefToStore = res.data.data?.txRef || res.data.data?.tx_ref || res.data.data?.transactionReference || res.data.data?.trx_ref || res.data.data?.reference;
        console.log('[CHAPA FLOW] Candidate references to store:', {
          txRef: res.data.data?.txRef,
          tx_ref: res.data.data?.tx_ref,
          transactionReference: res.data.data?.transactionReference,
          trx_ref: res.data.data?.trx_ref,
          reference: res.data.data?.reference,
          selected: txRefToStore
        });
        if (txRefToStore) {
          console.log('[CHAPA FLOW] STEP 2 - BEFORE REDIRECT');
          console.log('[CHAPA FLOW] origin:', window.location.origin);
          console.log('[CHAPA FLOW] href:', window.location.href);
          console.log('[CHAPA FLOW] transaction reference:', txRefToStore);
          console.log('[CHAPA FLOW] sessionStorage BEFORE setItem:', sessionStorage.getItem(CHAPA_TX_REF_KEY));
          
          sessionStorage.setItem(CHAPA_TX_REF_KEY, txRefToStore);
          // Also store in localStorage as backup for debugging sessionStorage persistence
          localStorage.setItem('CHAPA_DEBUG_TX_REF', txRefToStore);
          console.log('[CHAPA FLOW] localStorage backup set');
          
          console.log('[CHAPA FLOW] sessionStorage AFTER setItem:', sessionStorage.getItem(CHAPA_TX_REF_KEY));
          console.log('[CHAPA FLOW] localStorage AFTER setItem:', localStorage.getItem('CHAPA_DEBUG_TX_REF'));
          console.log('[CHAPA FLOW] checkoutUrl:', res.data.data.checkoutUrl);
        } else {
          console.warn('[CHAPA FLOW] WARNING: No transaction reference in backend response!');
          console.warn('[CHAPA FLOW] STOPPING - will not redirect without transaction reference');
          setError('Payment initialization failed: no transaction reference received from server');
          toast.error('Payment initialization failed: no transaction reference received from server');
          return;
        }
        // Redirect to Chapa checkout
        console.log('[CHAPA FLOW] Redirecting to Chapa checkoutUrl:', res.data.data.checkoutUrl);
        window.location.href = res.data.data.checkoutUrl;
      } else {
        throw new Error(res.data?.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('[CHAPA FLOW] Payment initiation error:', err);
      console.error('[CHAPA FLOW] Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize payment. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInitiating(false);
    }
  };

  const handleInitiateTelebirrPayment = async () => {
    console.log('[TELEBIRR] BUTTON CLICKED');
    const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod);
    const isRealTelebirr = selectedMethod?.realPayment;
    if (!isRealTelebirr) {
      console.warn('[TELEBIRR] Not a real payment method, returning early');
      return;
    }
    
    console.log('[TELEBIRR FLOW] STEP 1 - INITIATING TELEBIRR PAYMENT');
    console.log('[TELEBIRR FLOW] checkoutData:', checkoutData);
    console.log('[TELEBIRR FLOW] company:', checkoutData?.company);
    console.log('[TELEBIRR FLOW] fee:', checkoutData?.fee);
    console.log('[TELEBIRR FLOW] sessionStorage BEFORE:', sessionStorage.getItem(TELEBIRR_TX_REF_KEY));
    setInitiating(true);
    setError(null);
    try {
      const returnUrl = `${window.location.origin}/employer/post-job/checkout`;
      const res = await systemSettingsService.initiateTelebirrPayment(returnUrl);
      
      console.log('[TELEBIRR FLOW] STEP 1 - BACKEND INITIATE RESPONSE');
      console.log('[TELEBIRR FLOW] Full response object:', res);
      console.log('[TELEBIRR FLOW] res.status:', res.status);
      console.log('[TELEBIRR FLOW] res.data:', res.data);
      console.log('[TELEBIRR FLOW] res.data.success:', res.data?.success);
      console.log('[TELEBIRR FLOW] res.data.message:', res.data?.message);
      console.log('[TELEBIRR FLOW] res.data.data:', res.data?.data);
      console.log('[TELEBIRR FLOW] res.data.data.checkoutUrl:', res.data?.data?.checkoutUrl);
      console.log('[TELEBIRR FLOW] res.data.data.outTradeNo:', res.data?.data?.outTradeNo);
      console.log('[TELEBIRR FLOW] res.data.data.transactionId:', res.data?.data?.transactionId);
      console.log('[TELEBIRR FLOW] ALL data fields:', res.data?.data ? Object.keys(res.data.data) : 'none');
      
      if (res.data?.success && res.data.data?.checkoutUrl) {
        // Store transaction reference in sessionStorage before redirect
        const outTradeNoToStore = res.data.data?.outTradeNo;
        console.log('[TELEBIRR FLOW] Candidate reference to store:', {
          outTradeNo: res.data.data?.outTradeNo,
          selected: outTradeNoToStore
        });
        if (outTradeNoToStore) {
          console.log('[TELEBIRR FLOW] STEP 2 - BEFORE REDIRECT');
          console.log('[TELEBIRR FLOW] origin:', window.location.origin);
          console.log('[TELEBIRR FLOW] href:', window.location.href);
          console.log('[TELEBIRR FLOW] transaction reference:', outTradeNoToStore);
          console.log('[TELEBIRR FLOW] sessionStorage BEFORE setItem:', sessionStorage.getItem(TELEBIRR_TX_REF_KEY));
          
          sessionStorage.setItem(TELEBIRR_TX_REF_KEY, outTradeNoToStore);
          // Also store in localStorage as backup for debugging sessionStorage persistence
          localStorage.setItem('TELEBIRR_DEBUG_TX_REF', outTradeNoToStore);
          console.log('[TELEBIRR FLOW] localStorage backup set');
          
          console.log('[TELEBIRR FLOW] sessionStorage AFTER setItem:', sessionStorage.getItem(TELEBIRR_TX_REF_KEY));
          console.log('[TELEBIRR FLOW] localStorage AFTER setItem:', localStorage.getItem('TELEBIRR_DEBUG_TX_REF'));
          console.log('[TELEBIRR FLOW] checkoutUrl (QR code):', res.data.data.checkoutUrl);
        } else {
          console.warn('[TELEBIRR FLOW] WARNING: No outTradeNo in backend response!');
          console.warn('[TELEBIRR FLOW] STOPPING - will not redirect without transaction reference');
          setError('Payment initialization failed: no transaction reference received from server');
          toast.error('Payment initialization failed: no transaction reference received from server');
          return;
        }
        // Redirect to Telebirr checkout (QR code URL)
        console.log('[TELEBIRR FLOW] Redirecting to Telebirr checkoutUrl:', res.data.data.checkoutUrl);
        window.location.href = res.data.data.checkoutUrl;
      } else {
        throw new Error(res.data?.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('[TELEBIRR FLOW] Payment initiation error:', err);
      console.error('[TELEBIRR FLOW] Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize Telebirr payment. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInitiating(false);
    }
  };

  const handleInitiateBankTransfer = async () => {
    const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod);
    const isRealBankTransfer = selectedMethod?.realPayment && checkoutData?.paymentProvider === 'bank_transfer';
    if (!isRealBankTransfer) return;
    
    console.log('[BANK TRANSFER FLOW] STEP 1 - INITIATING BANK TRANSFER');
    console.log('[BANK TRANSFER FLOW] checkoutData:', checkoutData);
    console.log('[BANK TRANSFER FLOW] company:', checkoutData?.company);
    console.log('[BANK TRANSFER FLOW] fee:', checkoutData?.fee);
    
    setInitiating(true);
    setError(null);
    try {
      // For Bank Transfer, we don't redirect to an external URL
      // Instead, we create a pending transaction and show bank details
      const returnUrl = `${window.location.origin}/employer/post-job/checkout`;
      const res = await systemSettingsService.initiateBankTransfer(returnUrl);
      
      console.log('[BANK TRANSFER FLOW] STEP 1 - BACKEND INITIATE RESPONSE');
      console.log('[BANK TRANSFER FLOW] Full response object:', res);
      console.log('[BANK TRANSFER FLOW] res.data:', res.data);
      console.log('[BANK TRANSFER FLOW] res.data.success:', res.data?.success);
      console.log('[BANK TRANSFER FLOW] res.data.data:', res.data?.data);
      console.log('[BANK TRANSFER FLOW] ALL data fields:', res.data?.data ? Object.keys(res.data.data) : 'none');
      
      if (res.data?.success && res.data.data?.transactionReference) {
        const bankRefToStore = res.data.data?.transactionReference;
        console.log('[BANK TRANSFER FLOW] Storing bank transfer reference:', bankRefToStore);
        
        sessionStorage.setItem(BANK_TRANSFER_TX_REF_KEY, bankRefToStore);
        localStorage.setItem('BANK_TRANSFER_DEBUG_TX_REF', bankRefToStore);
        
        console.log('[BANK TRANSFER FLOW] sessionStorage AFTER setItem:', sessionStorage.getItem(BANK_TRANSFER_TX_REF_KEY));
        console.log('[BANK TRANSFER FLOW] localStorage AFTER setItem:', localStorage.getItem('BANK_TRANSFER_DEBUG_TX_REF'));
        
        // Show bank details UI - don't redirect
        // The bank details will be shown in the UI
        toast.success('Bank transfer initiated. Please complete the transfer using the details below.');
      } else {
        throw new Error(res.data?.message || 'Failed to initialize bank transfer');
      }
    } catch (err) {
      console.error('[BANK TRANSFER FLOW] Payment initiation error:', err);
      console.error('[BANK TRANSFER FLOW] Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize bank transfer. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInitiating(false);
    }
  };

  const handleVerifyPayment = async (reference) => {
    const txRef = reference || transactionReference.trim();
    
    if (!txRef) {
      toast.error(t('employer.paymentCheckout.transactionRefRequired') || 'Transaction reference is required.');
      return;
    }

    console.log('[CHAPA FLOW] STEP 5 - VERIFYING PAYMENT (handleVerifyPayment)');
    console.log('[CHAPA FLOW] transactionReference (param):', reference);
    console.log('[CHAPA FLOW] transactionReference (state):', transactionReference);
    console.log('[CHAPA FLOW] reference being verified:', txRef);
    console.log('[CHAPA FLOW] paymentMethod:', paymentMethod);
    console.log('[CHAPA FLOW] sessionStorage current:', sessionStorage.getItem(CHAPA_TX_REF_KEY));
    setVerifying(true);
    setError(null);
    try {
      const requestData = {
        transactionReference: txRef,
        paymentMethod,
      };
      console.log('[CHAPA FLOW] Verification request payload:', requestData);
      const res = await systemSettingsService.verifyJobPostingPayment(requestData);

      console.log('[CHAPA FLOW] STEP 6 - VERIFICATION RESPONSE');
      console.log('[CHAPA FLOW] Full response object:', res);
      console.log('[CHAPA FLOW] Response status:', res.status);
      console.log('[CHAPA FLOW] Response data:', res.data);
      console.log('[CHAPA FLOW] Response data.success:', res.data?.success);
      console.log('[CHAPA FLOW] Response data.data:', res.data?.data);
      console.log('[CHAPA FLOW] Response data.message:', res.data?.message);
      console.log('[CHAPA FLOW] Response data.alreadyVerified:', res.data?.alreadyVerified);
      console.log('[CHAPA FLOW] Response data.pending:', res.data?.pending);

      if (res.data?.success) {
        console.log('[CHAPA FLOW] STEP 6 - VERIFICATION SUCCESS');
        console.log('[CHAPA FLOW] verificationResult data:', res.data.data);
        setVerificationResult(res.data.data);
        setChapaVerificationFailed(false);
        setLoading(false);
        // Clear stored reference on successful verification
        sessionStorage.removeItem(CHAPA_TX_REF_KEY);
        localStorage.removeItem('CHAPA_DEBUG_TX_REF');
        console.log('[CHAPA FLOW] Cleared sessionStorage reference');
        console.log('[CHAPA FLOW] Cleared localStorage backup');
        console.log('[CHAPA FLOW] sessionStorage after clear:', sessionStorage.getItem(CHAPA_TX_REF_KEY));
        console.log('[CHAPA FLOW] localStorage after clear:', localStorage.getItem('CHAPA_DEBUG_TX_REF'));
        toast.success(t('employer.paymentCheckout.paymentVerified') || 'Payment verified successfully!');
        // Stay on success page - user will click "Go to Post Job" button to navigate
      } else {
        const errorMsg = res.data?.message || t('employer.paymentCheckout.verificationFailed') || 'Payment verification failed.';
        console.log('[CHAPA FLOW] STEP 7 - VERIFICATION FAILED:', errorMsg, 'full response:', res.data);
        setError(errorMsg);
        setLoading(false);
        // If this was a Chapa return, show verification failure state instead of payment form
        if (isChapaReturn) {
          setChapaVerificationFailed(true);
        }
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('[CHAPA FLOW] STEP 7 - VERIFICATION ERROR:', err);
      console.error('[CHAPA FLOW] Error response:', err.response);
      console.error('[CHAPA FLOW] Error response data:', err.response?.data);
      console.log('[CHAPA FLOW] Error response status:', err.response?.status);
      const errorMessage = err.response?.data?.message || t('employer.paymentCheckout.verificationError') || 'An error occurred during payment verification.';
      setError(errorMessage);
      setLoading(false);
      // If this was a Chapa return, show verification failure state instead of payment form
      if (isChapaReturn) {
        setChapaVerificationFailed(true);
      }
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
      setIsVerifyingChapaReturn(false);
    }
  };

  const handleUseExistingPayment = () => {
    if (checkoutData?.existingVerifiedPayment) {
      const { transactionReference: ref, paymentMethod: method, verifiedAt } = checkoutData.existingVerifiedPayment;
      navigate('/employer/post-job', {
        state: {
          paymentVerified: true,
          transactionReference: ref,
          paymentMethod: method,
          verifiedAt,
        },
        replace: true,
      });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/employer', { replace: true });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Success/verification states should render regardless of loading state
  if (verificationResult) {
    // Payment successful - render success UI
    console.log('[CHAPA FLOW] RENDER: verificationResult exists - returning Success UI');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
              </p>
            </div>
          </div>

          {/* Success State */}
          <div className="card bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                {t('employer.paymentCheckout.paymentSuccessful') || 'Payment Successful'}
              </h2>
              <p className="text-emerald-700 dark:text-emerald-400 mb-6">
                {t('employer.paymentCheckout.paymentVerifiedDesc') || 'Your payment has been successfully verified.'}
              </p>
              <div className="text-left max-w-xs mx-auto text-sm space-y-1 mb-6">
                <p><span className="font-medium">{t('employer.paymentCheckout.transactionRef') || 'Transaction Ref:'}</span> {verificationResult.transactionReference}</p>
                <p><span className="font-medium">{t('employer.paymentCheckout.paymentMethod') || 'Payment Method:'}</span> {verificationResult.paymentMethod}</p>
                <p><span className="font-medium">{t('employer.paymentCheckout.verifiedAt') || 'Verified At:'}</span> {new Date(verificationResult.verifiedAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => navigate('/employer/post-job', { replace: true })}
                className="btn btn-primary inline-flex items-center justify-center gap-2 w-full max-w-xs mx-auto py-3 text-lg"
              >
                <FiArrowLeft className="h-4 w-4" />
                {t('employer.paymentCheckout.goToPostJob') || 'Go to Post Job'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isVerifyingChapaReturn) {
    // Verifying payment - render verifying UI
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
              </p>
            </div>
          </div>

          {/* Verifying Payment State */}
          <div className="card bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                {t('employer.paymentCheckout.verifyingPayment') || 'Verifying Payment...'}
              </h2>
              <p className="text-emerald-700 dark:text-emerald-400 mb-6">
                {t('employer.paymentCheckout.verifyingDesc') || 'We are verifying your payment. This will only take a moment.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isVerifyingTelebirrReturn) {
    // Telebirr Verifying Payment State
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
              </p>
            </div>
          </div>

          {/* Telebirr Verifying Payment State */}
          <div className="card bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">
                {t('employer.paymentCheckout.verifyingTelebirrPayment') || 'Verifying Telebirr Payment...'}
              </h2>
              <p className="text-blue-700 dark:text-blue-400 mb-6">
                {t('employer.paymentCheckout.verifyingTelebirrDesc') || 'We are verifying your Telebirr payment. This will only take a moment.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isVerifyingBankTransferReturn) {
    // Bank Transfer Verifying State
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
              </p>
            </div>
          </div>

          {/* Bank Transfer Verifying State */}
          <div className="card bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              </div>
              <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300 mb-2">
                {t('employer.paymentCheckout.verifyingBankTransferPayment') || 'Verifying Bank Transfer...'}
              </h2>
              <p className="text-amber-700 dark:text-amber-400 mb-6">
                {t('employer.paymentCheckout.verifyingBankTransferDesc') || 'We are verifying your bank transfer. An admin will review your submission.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (chapaVerificationFailed) {
    // Verification failed - render failed UI
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
              </p>
            </div>
          </div>

          {/* Verification Failed State */}
          <div className="card bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <FiAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">
                {t('employer.paymentCheckout.verificationFailedTitle') || 'Payment Verification Failed'}
              </h2>
              <p className="text-red-700 dark:text-red-400 mb-4">
                {t('employer.paymentCheckout.verificationFailedDesc') || 'We could not verify your payment. Please check the details below and try again.'}
              </p>
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 mb-6 text-left">
                  <p className="font-medium text-red-800 dark:text-red-300 mb-2">
                    {t('employer.paymentCheckout.errorDetails') || 'Error Details:'}
                  </p>
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={handleRetry} className="btn btn-primary">
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  {t('common.retry') || 'Retry Verification'}
                </button>
                <button onClick={handleBackToDashboard} className="btn btn-outline">
                  <FiArrowLeft className="mr-2 h-4 w-4" />
                  {t('employer.paymentCheckout.backToDashboard') || 'Back to Dashboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (telebirrVerificationFailed) {
    // Telebirr verification failed - render failed UI
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
              </p>
            </div>
          </div>

          {/* Telebirr Verification Failed State */}
          <div className="card bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <FiAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">
                {t('employer.paymentCheckout.verificationFailedTitle') || 'Telebirr Payment Verification Failed'}
              </h2>
              <p className="text-red-700 dark:text-red-400 mb-4">
                {t('employer.paymentCheckout.verificationFailedDesc') || 'We could not verify your Telebirr payment. Please check the details below and try again.'}
              </p>
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 mb-6 text-left">
                  <p className="font-medium text-red-800 dark:text-red-300 mb-2">
                    {t('employer.paymentCheckout.errorDetails') || 'Error Details:'}
                  </p>
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={handleRetry} className="btn btn-primary">
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  {t('common.retry') || 'Retry Verification'}
                </button>
                <button onClick={handleBackToDashboard} className="btn btn-outline">
                  <FiArrowLeft className="mr-2 h-4 w-4" />
                  {t('employer.paymentCheckout.backToDashboard') || 'Back to Dashboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bankTransferVerificationFailed) {
    // Bank Transfer verification failed - render failed UI
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
            >
              <FiArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
              </p>
            </div>
          </div>

          {/* Bank Transfer Verification Failed State */}
          <div className="card bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <FiAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">
                {t('employer.paymentCheckout.verificationFailedTitle') || 'Bank Transfer Verification Failed'}
              </h2>
              <p className="text-red-700 dark:text-red-400 mb-4">
                {t('employer.paymentCheckout.verificationFailedDesc') || 'We could not verify your bank transfer. Please check the details below and try again.'}
              </p>
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 mb-6 text-left">
                  <p className="font-medium text-red-800 dark:text-red-300 mb-2">
                    {t('employer.paymentCheckout.errorDetails') || 'Error Details:'}
                  </p>
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <button onClick={handleRetry} className="btn btn-primary">
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  {t('common.retry') || 'Retry Verification'}
                </button>
                <button onClick={handleBackToDashboard} className="btn btn-outline">
                  <FiArrowLeft className="mr-2 h-4 w-4" />
                  {t('employer.paymentCheckout.backToDashboard') || 'Back to Dashboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Now check loading state for normal flow
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#1769E0] border-t-transparent mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('employer.paymentCheckout.loading') || 'Loading payment information...'}</p>
        </div>
      </div>
    );
  }

  if (error && !checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="card max-w-md w-full text-center p-8">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <FiAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('employer.paymentCheckout.errorTitle') || 'Unable to Load Payment Page'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRetry} className="btn btn-primary">
              <FiRefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry') || 'Retry'}
            </button>
            <button onClick={handleBackToDashboard} className="btn btn-outline">
              <FiArrowLeft className="mr-2 h-4 w-4" />
              {t('employer.paymentCheckout.backToDashboard') || 'Back to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!checkoutData?.paymentRequired) {
    // No payment required - redirect to post job
    if (!returnFromVerification) {
      navigate('/employer/post-job', { replace: true });
    }
    return null;
  }

  const { fee, company, existingVerifiedPayment } = checkoutData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToDashboard}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
          >
            <FiArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">{t('common.back') || 'Back'}</span>
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <FiCreditCard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('employer.paymentCheckout.title') || 'Job Posting Payment'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('employer.paymentCheckout.subtitle') || 'Complete the payment to proceed with posting your job'}
            </p>
          </div>
        </div>

        {/* Existing Verified Payment */}
        {/* Do NOT show "Use This Payment" during/after a fresh Chapa return - verificationResult takes precedence */}
        {showExistingPayment && existingVerifiedPayment && !verificationResult && !isChapaReturn && (
          <div className="card bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 mb-6">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
                    {t('employer.paymentCheckout.existingPaymentTitle') || 'Verified Payment Found'}
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                    {t('employer.paymentCheckout.existingPaymentDesc', { 
                      method: existingVerifiedPayment.paymentMethod,
                      date: new Date(existingVerifiedPayment.verifiedAt).toLocaleDateString()
                    }) || `You have a verified ${existingVerifiedPayment.paymentMethod} payment from ${new Date(existingVerifiedPayment.verifiedAt).toLocaleDateString()}.`}
                  </p>
                </div>
                <button
                  onClick={handleUseExistingPayment}
                  className="btn btn-primary whitespace-nowrap"
                >
                  {t('employer.paymentCheckout.useExistingPayment') || 'Use This Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiDollarSign className="h-5 w-5 text-emerald-600" />
              {t('employer.paymentCheckout.paymentSummary') || 'Payment Summary'}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FiBriefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('employer.paymentCheckout.company') || 'Company'}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">{company?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FiDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('employer.paymentCheckout.jobPostingFee') || 'Job Posting Fee'}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(fee?.amount, fee?.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t('employer.paymentCheckout.total') || 'Total'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(fee?.amount, fee?.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {!verificationResult && 
         !isVerifyingChapaReturn && !isChapaReturn && !chapaVerificationFailed &&
         !isVerifyingTelebirrReturn && !isTelebirrReturn && !telebirrVerificationFailed &&
         !isVerifyingBankTransferReturn && !isBankTransferReturn && !bankTransferVerificationFailed && (
          <div className="card">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiLock className="h-5 w-5 text-[#1769E0]" />
                {t('employer.paymentCheckout.paymentDetails') || 'Payment Details'}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('employer.paymentCheckout.paymentMethod') || 'Payment Method'}
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
{PAYMENT_METHODS.map((method) => {
                      const isReal = method.realPayment && checkoutData?.paymentProvider === method.value;
                      return (
                      <label
                        key={method.value}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          paymentMethod === method.value
                            ? 'border-[#1769E0] bg-[#EAF2FE] dark:bg-[#1769E0]/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={() => setPaymentMethod(method.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{method.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {method.label}
                            {isReal && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <FiExternalLink className="mr-1 h-3 w-3" />
                                {t('employer.paymentCheckout.realPayment', { defaultValue: 'Real Payment' })}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          paymentMethod === method.value
                            ? 'border-[#1769E0] bg-[#1769E0]'
                            : 'border-gray-300 dark:border-gray-600'
                        }">
                          {paymentMethod === method.value && (
                            <FiCheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {isRealPayment ? (
                // Real Payment Flow - Chapa, Telebirr, or Bank Transfer
                <div className="space-y-4">
                  {paymentMethod === 'chapa' && (
                    // Chapa Payment Flow
                    <>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-medium text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                          <FiLock className="h-4 w-4" />
                          {t('employer.paymentCheckout.chapaSecure', { defaultValue: 'Secure Chapa Checkout' })}
                        </h4>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                          {t('employer.paymentCheckout.chapaDescription', { defaultValue: 'You will be redirected to Chapa\'s secure payment page to complete your payment. After successful payment, you will be automatically redirected back to verify your payment.' })}
                        </p>
                      </div>
                      
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                            <FiAlertCircle className="h-4 w-4" />
                            {error}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={handleInitiateRealPayment}
                        disabled={initiating}
                        className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {initiating ? (
                          <>
                            <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            {t('employer.paymentCheckout.redirecting', { defaultValue: 'Redirecting to Chapa...' })}
                          </>
                        ) : (
                          <>
                            <FiExternalLink className="mr-2 h-5 w-5" />
                            {t('employer.paymentCheckout.payWithChapa', { defaultValue: 'Pay with Chapa' }) || 'Pay with Chapa'} {formatCurrency(fee?.amount, fee?.currency)}
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {paymentMethod === 'telebirr' && (
                    // Telebirr Payment Flow
                    <>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <FiLock className="h-4 w-4" />
                          {t('employer.paymentCheckout.telebirrSecure', { defaultValue: 'Secure Telebirr Checkout' })}
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          {t('employer.paymentCheckout.telebirrDescription', { defaultValue: 'You will be redirected to Telebirr to complete your payment via QR code. After successful payment, you will be automatically redirected back to verify your payment.' })}
                        </p>
                      </div>
                      
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                            <FiAlertCircle className="h-4 w-4" />
                            {error}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={handleInitiateRealPayment}
                        disabled={initiating}
                        className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {initiating ? (
                          <>
                            <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            {t('employer.paymentCheckout.redirectingTelebirr', { defaultValue: 'Redirecting to Telebirr...' })}
                          </>
                        ) : (
                          <>
                            <FiExternalLink className="mr-2 h-5 w-5" />
                            {t('employer.paymentCheckout.payWithTelebirr', { defaultValue: 'Pay with Telebirr' }) || 'Pay with Telebirr'} {formatCurrency(fee?.amount, fee?.currency)}
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    // Bank Transfer Payment Flow
                    <>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                          <FiLock className="h-4 w-4" />
                          {t('employer.paymentCheckout.bankTransferSecure', { defaultValue: 'Bank Transfer Payment' })}
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          {t('employer.paymentCheckout.bankTransferDescription', { defaultValue: 'Transfer the amount to the bank account below. Include the transaction reference in the transfer description. After completing the transfer, submit the details for verification.' })}
                        </p>
                      </div>
                      
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                            <FiAlertCircle className="h-4 w-4" />
                            {error}
                          </p>
                        </div>
                      )}
                      
                      {/* Bank Transfer Details */}
                      {checkoutData?.bankDetails && (
                        <div className="space-y-4">
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                              {t('employer.paymentCheckout.bankDetails') || 'Bank Account Details'}
                            </h5>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">{t('employer.paymentCheckout.bankName') || 'Bank Name'}</p>
                                <p className="font-medium text-gray-900 dark:text-white">{checkoutData.bankDetails.bankName}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">{t('employer.paymentCheckout.accountName') || 'Account Name'}</p>
                                <p className="font-medium text-gray-900 dark:text-white">{checkoutData.bankDetails.accountName}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">{t('employer.paymentCheckout.accountNumber') || 'Account Number'}</p>
                                <p className="font-medium text-gray-900 dark:text-white font-mono">{checkoutData.bankDetails.accountNumber}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">{t('employer.paymentCheckout.branch') || 'Branch'}</p>
                                <p className="font-medium text-gray-900 dark:text-white">{checkoutData.bankDetails.branch}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400">{t('employer.paymentCheckout.swiftCode') || 'SWIFT Code'}</p>
                                <p className="font-medium text-gray-900 dark:text-white font-mono">{checkoutData.bankDetails.swiftCode}</p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-gray-500 dark:text-gray-400">{t('employer.paymentCheckout.transactionReference') || 'Transaction Reference'}</p>
                                <p className="font-medium text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">{transactionReference || 'Will be generated on initiation'}</p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-gray-500 dark:text-gray-400">{t('employer.paymentCheckout.amount') || 'Amount'}</p>
                                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(fee?.amount, fee?.currency)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <h5 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                              {t('employer.paymentCheckout.bankTransferInstructions') || 'Instructions'}
                            </h5>
                            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
                              <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span>{t('employer.paymentCheckout.bankTransferInstruction1') || 'Transfer the exact amount shown above to the bank account details provided.'}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span>{t('employer.paymentCheckout.bankTransferInstruction2') || 'Include the Transaction Reference in the transfer description/memo.'}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span>{t('employer.paymentCheckout.bankTransferInstruction3') || 'Save the transfer receipt/proof of payment.'}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span>{t('employer.paymentCheckout.bankTransferInstruction4') || 'Click "Submit Transfer Details" below and provide the transfer information.'}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span>{t('employer.paymentCheckout.bankTransferInstruction5') || 'An admin will review and approve your payment within 24 hours.'}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                            <FiAlertCircle className="h-4 w-4" />
                            {error}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={handleInitiateRealPayment}
                        disabled={initiating}
                        className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {initiating ? (
                          <>
                            <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            {t('employer.paymentCheckout.initiatingBankTransfer', { defaultValue: 'Initiating Bank Transfer...' })}
                          </>
                        ) : (
                          <>
                            <FiCreditCard className="mr-2 h-5 w-5" />
                            {t('employer.paymentCheckout.initiateBankTransfer', { defaultValue: 'Initiate Bank Transfer' })} {formatCurrency(fee?.amount, fee?.currency)}
                          </>
                        )}
                      </button>
                      
                      {/* Transfer Submission Form - shown after initiation */}
                      {isBankTransferReturn && !verificationResult && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            {t('employer.paymentCheckout.submitTransferDetails') || 'Submit Transfer Details'}
                          </h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('employer.paymentCheckout.transferDate') || 'Transfer Date'}
                            </label>
                            <input
                              type="date"
                              className="input w-full"
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('employer.paymentCheckout.transferReference') || 'Bank Transfer Reference / Receipt Number'}
                            </label>
                            <input
                              type="text"
                              className="input w-full"
                              placeholder={t('employer.paymentCheckout.transferRefPlaceholder') || 'Enter bank transfer reference/receipt number'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('employer.paymentCheckout.transferAmount') || 'Amount Transferred'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="input w-full"
                              min={fee?.amount}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t('employer.paymentCheckout.transferProof') || 'Proof of Transfer (optional)'}
                            </label>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="input w-full"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {t('employer.paymentCheckout.transferProofHint') || 'Upload a photo of the transfer receipt or bank confirmation'}
                            </p>
                          </div>
                          <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                            {t('employer.paymentCheckout.bankTransferPendingNotice') || 'Your transfer details will be reviewed by an admin. This typically takes up to 24 hours. You will be notified once verified.'}
                          </p>
                          <button
                            onClick={() => handleVerifyPayment(transactionReference)}
                            disabled={verifying}
                            className="btn btn-primary w-full py-3 text-lg disabled:opacity-50"
                          >
                            {verifying ? (
                              <>
                                <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                {t('employer.paymentCheckout.submitting') || 'Submitting...'}
                              </>
                            ) : (
                              <>
                                <FiCreditCard className="mr-2 h-5 w-5" />
                                {t('employer.paymentCheckout.submitTransferDetails') || 'Submit Transfer Details'}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // Manual Verification Flow
                <div className="space-y-4">
                  {/* Transaction Reference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('employer.paymentCheckout.transactionReference') || 'Transaction Reference / Transaction ID'}
                    </label>
                    <input
                      type="text"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      placeholder={t('employer.paymentCheckout.transactionRefPlaceholder') || 'Enter transaction ID from payment provider'}
                      className="input w-full"
                      disabled={verifying}
                      autoComplete="off"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('employer.paymentCheckout.transactionRefHint') || 'Enter the transaction ID you received from your payment provider (Chapa, Telebirr, Bank Transfer receipt, etc.)'}
                    </p>
                    {error && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <FiAlertCircle className="h-4 w-4" />
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Payment Instructions */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FiAlertCircle className="h-4 w-4 text-amber-500" />
                      {t('employer.paymentCheckout.instructionsTitle') || 'Payment Instructions'}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                        <span>{t('employer.paymentCheckout.instruction1') || 'Complete the payment using your chosen payment method outside of this platform'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                        <span>{t('employer.paymentCheckout.instruction2') || 'Return to this page and enter the Transaction Reference / Transaction ID you received'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                        <span>{t('employer.paymentCheckout.instruction3') || 'Click "Verify Payment" to confirm your payment'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                        <span>{t('employer.paymentCheckout.instruction4') || 'Once verified, you will be redirected to the job posting form'}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Verify Button */}
                  <button
                    onClick={() => handleVerifyPayment(transactionReference)}
                    disabled={verifying || !transactionReference.trim()}
                    className="btn btn-primary w-full py-3 text-lg disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        {t('employer.paymentCheckout.verifying') || 'Verifying Payment...'}
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="mr-2 h-5 w-5" />
                        {t('employer.paymentCheckout.verifyPayment') || 'Verify Payment'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Cancel */}
              <button
                onClick={handleBackToDashboard}
                disabled={verifying || initiating}
                className="btn btn-outline w-full"
              >
                {t('employer.paymentCheckout.cancel') || 'Cancel and Return to Dashboard'}
              </button>
</div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCheckout;