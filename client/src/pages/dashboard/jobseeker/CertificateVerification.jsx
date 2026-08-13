import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  FiUploadCloud,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiClock,
  FiFileText,
  FiShield,
  FiGrid,
  FiSearch,
  FiRefreshCw,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import certificateService from '../../../services/certificateService';

const STATUS_META = {
  VERIFIED: {
    icon: FiCheckCircle,
    label: 'Verified',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    panel: 'border-emerald-200 bg-emerald-50/60',
    iconColor: 'text-emerald-600',
  },
  SUSPICIOUS: {
    icon: FiAlertTriangle,
    label: 'Suspicious',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    panel: 'border-amber-200 bg-amber-50/60',
    iconColor: 'text-amber-600',
  },
  INVALID: {
    icon: FiXCircle,
    label: 'Invalid',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    panel: 'border-rose-200 bg-rose-50/60',
    iconColor: 'text-rose-600',
  },
  PENDING_REVIEW: {
    icon: FiClock,
    label: 'Pending Review',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    panel: 'border-sky-200 bg-sky-50/60',
    iconColor: 'text-sky-600',
  },
};

const FIELD_LABELS = {
  fullName: 'Name',
  studentId: 'Student ID',
  certificateNumber: 'Certificate Number',
  institution: 'Institution',
  program: 'Program',
  certificateType: 'Certificate Type',
  issueDate: 'Issue Date',
  graduationYear: 'Graduation Year',
  email: 'Email',
  phone: 'Phone',
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.PENDING_REVIEW;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${meta.badge}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

const ResultPanel = ({ result }) => {
  const meta = STATUS_META[result.verificationStatus] || STATUS_META.PENDING_REVIEW;
  const Icon = meta.icon;

  const comparisonRows = [
    { key: 'certificateNumber', label: 'Certificate Number' },
    { key: 'fullName', label: 'Name' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'institution', label: 'Institution' },
    { key: 'program', label: 'Program' },
    { key: 'certificateType', label: 'Certificate Type' },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'graduationYear', label: 'Graduation Year' },
  ];

  const mismatchedKeys = (result.mismatchedFields || []).map((m) => m.field);

  return (
    <div className={`rounded-2xl border p-5 ${meta.panel}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-3 ${meta.iconColor} bg-white/70 shadow-sm`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className={`text-lg font-extrabold tracking-tight ${meta.iconColor}`}>
            {result.verificationStatus === 'VERIFIED' && '✓ '}
            {result.verificationStatus === 'SUSPICIOUS' && '⚠ '}
            {result.verificationStatus === 'INVALID' && '✕ '}
            {meta.label} Certificate
          </p>
          {result.verificationNumber && (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Verification Number: <span className="font-mono text-slate-700">{result.verificationNumber}</span>
            </p>
          )}
        </div>
        {result.isDuplicate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
            ⚠ Duplicate Certificate
          </span>
        )}
      </div>

      {result.reason && (
        <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm text-slate-700 border border-slate-200/60">
          <span className="font-bold">Reason: </span>
          {result.reason}
        </p>
      )}

      {comparisonRows.some(({ key }) => result.uploadedData?.[key] || mismatchedKeys.includes(key)) && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-bold">Field</th>
                <th className="px-4 py-2.5 font-bold">Uploaded</th>
                <th className="px-4 py-2.5 font-bold">Result</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(({ key, label }) => {
                const value = result.uploadedData?.[key];
                const isMismatch = mismatchedKeys.includes(key);
                if (!value && !isMismatch) return null;
                return (
                  <tr key={key} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{FIELD_LABELS[key] || label}</td>
                    <td className="px-4 py-2.5 text-slate-600">{value || '—'}</td>
                    <td className="px-4 py-2.5">
                      {isMismatch ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                          <FiXCircle className="h-4 w-4" /> MISMATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <FiCheckCircle className="h-4 w-4" /> MATCH
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification score */}
      {typeof result.verificationScore === 'number' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Score</p>
            <p className={`text-lg font-extrabold ${result.verificationScore >= 80 ? 'text-emerald-600' : result.verificationScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {result.verificationScore}%
            </p>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.verificationScore >= 80 ? 'bg-emerald-500' : result.verificationScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${result.verificationScore}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            The score is advisory only — the final status is decided by the verification rules.
          </p>
        </div>
      )}

      {/* Profile consistency (document vs registered account) */}
      {(() => {
        const profileRows = [
          { key: 'fullName', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
        ];
        const mismatchMap = (result.profileMismatchedFields || []).reduce((acc, m) => {
          acc[m.field] = m;
          return acc;
        }, {});
        const hasProfileRow = profileRows.some(({ key }) => {
          const m = mismatchMap[key];
          return m || result.uploadedData?.[key] || result.profileData?.[key];
        });
        if (!hasProfileRow) return null;
        return (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white/80">
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              Profile Consistency
            </div>
            <table className="w-full text-sm">
              <tbody>
                {profileRows.map(({ key, label }) => {
                  const m = mismatchMap[key];
                  const uploaded = m?.uploaded || result.uploadedData?.[key] || '';
                  const registered = m?.registered || result.profileData?.[key] || '';
                  const isMismatch = Boolean(m);
                  if (!isMismatch && !uploaded && !registered) return null;
                  return (
                    <tr key={key} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{label}</td>
                      <td className="px-4 py-2.5 text-slate-600">{uploaded || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500">{registered || '—'}</td>
                      <td className="px-4 py-2.5">
                        {isMismatch ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <FiXCircle className="h-4 w-4" /> MISMATCH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <FiCheckCircle className="h-4 w-4" /> MATCH
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
};

const HistoryItem = ({ item, expanded, onToggle }) => {
  const meta = STATUS_META[item.verificationStatus] || STATUS_META.PENDING_REVIEW;
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <FiFileText className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">
              {item.uploadedDocument?.originalName || 'Certificate document'}
            </p>
            <p className="text-xs text-slate-500">
              {item.verificationNumber ? <span className="font-mono">{item.verificationNumber}</span> : 'No verification number'}
              {' · '}
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={item.verificationStatus} />
          {expanded ? <FiChevronUp className="h-4 w-4 text-slate-400" /> : <FiChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3">
          {item.reason && <p className="mb-3 text-sm text-slate-600">{item.reason}</p>}
          {item.isDuplicate && (
            <p className="mb-3 text-xs font-bold text-rose-600">⚠ Duplicate certificate flagged for admin review.</p>
          )}
          {(item.mismatchedFields || []).length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {item.mismatchedFields.map((m, i) => (
                <span key={i} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                  {m.label} ✗ MISMATCH
                </span>
              ))}
            </div>
          )}
          {(item.profileMismatchedFields || []).length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {item.profileMismatchedFields.map((m, i) => (
                <span key={i} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-orange-200">
                  Profile {m.label} ✗ MISMATCH
                </span>
              ))}
            </div>
          )}
          {typeof item.verificationScore === 'number' && item.verificationScore > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Verification Score:</span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    item.verificationScore >= 80 ? 'bg-emerald-500' : item.verificationScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.verificationScore}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-700">{item.verificationScore}%</span>
            </div>
          )}
          {item.uploadedDocument?.url && (
            <a
              href={item.uploadedDocument.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline"
            >
              <FiExternalLink className="h-3.5 w-3.5" /> View uploaded document
            </a>
          )}
        </div>
      )}
    </div>
  );
};

const CertificateVerification = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | scanning | done
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [manualNumber, setManualNumber] = useState('');
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [manualResult, setManualResult] = useState(null);
  const [declared, setDeclared] = useState({ studentId: '', institution: '', program: '', certificateType: '', issueDate: '', graduationYear: '', email: '', phone: '' });
  const [showDeclared, setShowDeclared] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await certificateService.getMyVerifications({ limit: 20 });
      setHistory(res.data || []);
    } catch (err) {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const validateFile = (selected) => {
    if (!selected) return false;
    const ext = selected.name?.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(selected.type) && !['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      toast.error('Only PDF, JPG, or PNG files are allowed.');
      return false;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File limit is 10MB.');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!validateFile(selected)) return;
    setFile(selected);
    setResult(null);
    setPhase('idle');
    setProgress(0);
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please choose a certificate file first.');
      return;
    }
    setUploading(true);
    setPhase('scanning');
    setProgress(0);
    const fd = new FormData();
    fd.append('certificate', file);
    Object.entries(declared).forEach(([key, value]) => {
      if (value) fd.append(key, value);
    });

    try {
      const res = await certificateService.uploadAndVerify(fd, setProgress);
      setResult(res.data);
      setPhase('done');
      toast.success('Certificate processed.');
      fetchHistory();
    } catch (err) {
      setPhase('idle');
      toast.error(err?.response?.data?.message || err?.message || 'Failed to process certificate.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualCheck = async () => {
    const number = manualNumber.trim();
    if (!number) {
      toast.error('Enter a verification number.');
      return;
    }
    setCheckingNumber(true);
    try {
      const res = await certificateService.checkByNumber(number);
      setManualResult(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Verification check failed.');
    } finally {
      setCheckingNumber(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setManualResult(null);
    setPhase('idle');
    setProgress(0);
    setManualNumber('');
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Certificate Verification
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Upload your education or experience certificate to verify it against the trusted institution database.
          </p>
        </div>
        <div className="hidden rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sky-600 sm:block dark:border-sky-900 dark:bg-sky-950/40">
          <FiShield className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Upload column */}
        <div className="space-y-6 lg:col-span-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-orange-600">Upload Certificate</h2>
            <p className="mt-1 text-xs text-slate-500">PDF, JPG or PNG — up to 10MB. QR codes and the text layer are scanned automatically.</p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/60 px-6 py-8 text-center transition hover:border-orange-400 hover:bg-orange-50"
            >
              <FiUploadCloud className="h-8 w-8 text-orange-500" />
              <span className="text-sm font-bold text-orange-700">{file ? 'Replace certificate' : 'Choose certificate file'}</span>
              <span className="text-xs text-slate-500">{file ? file.name : 'or drag & drop your certificate here'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileSelect}
            />

            {file && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FiFileText className="h-5 w-5 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-xs font-bold text-rose-500 hover:underline">
                  Remove
                </button>
              </div>
            )}

            {file && !uploading && (
              <button
                type="button"
                onClick={handleUpload}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
              >
                <FiGrid className="h-4 w-4" /> Scan & Verify Certificate
              </button>
            )}

            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    {phase === 'scanning' ? 'Scanning QR code & extracting data...' : 'Uploading...'}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Declared fields (optional) */}
            <button
              type="button"
              onClick={() => setShowDeclared((s) => !s)}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              {showDeclared ? <FiChevronUp className="h-3.5 w-3.5" /> : <FiChevronDown className="h-3.5 w-3.5" />}
              Optional: declare certificate details (used when the document text cannot be read)
            </button>
            {showDeclared && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ['studentId', 'Student ID'],
                  ['institution', 'Institution'],
                  ['program', 'Program'],
                  ['certificateType', 'Certificate Type'],
                  ['issueDate', 'Issue Date (YYYY-MM-DD)'],
                  ['graduationYear', 'Graduation Year'],
                  ['email', 'Email (for profile check)'],
                  ['phone', 'Phone (for profile check)'],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
                    <input
                      type="text"
                      value={declared[key]}
                      onChange={(e) => setDeclared({ ...declared, [key]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                    />
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Manual verification number lookup */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Verify a Number Manually</h2>
            <p className="mt-1 text-xs text-slate-500">Enter the certificate verification number printed on the document or QR code.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={manualNumber}
                onChange={(e) => setManualNumber(e.target.value)}
                placeholder="e.g. DBU-CERT-2026-00125"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={checkingNumber}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {checkingNumber ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                ) : (
                  <FiSearch className="h-4 w-4" />
                )}
                Check
              </button>
            </div>
            {manualResult && (
              <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                manualResult.verificationStatus === 'VERIFIED'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}>
                <p className="font-bold">
                  {manualResult.verificationStatus === 'VERIFIED' ? '✓ Certificate Verified' : '✕ Certificate Invalid'}
                </p>
                <p className="mt-1 font-mono text-xs">{manualResult.verificationNumber}</p>
                {manualResult.fullName && <p className="mt-1 text-xs">{manualResult.fullName}</p>}
              </div>
            )}
          </section>
        </div>

        {/* Result column */}
        <div className="space-y-6 lg:col-span-2">
          {result ? (
            <>
              <ResultPanel result={result} />
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-600">
                  {result.verificationStatus === 'VERIFIED'
                    ? 'Your certificate was verified automatically.'
                    : result.verificationStatus === 'PENDING_REVIEW'
                    ? 'An administrator will review your certificate.'
                    : 'This result has been flagged for administrator review.'}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" /> Verify another
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
              <FiShield className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">No verification result yet</p>
              <p className="mt-1 max-w-[240px] text-xs text-slate-400">
                Upload a certificate to see the field-by-field verification result.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-700">Verification History</h2>
        {history.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400">
            No certificate verifications yet.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <HistoryItem
                key={item._id}
                item={item}
                expanded={expandedId === item._id}
                onToggle={() => setExpandedId(expandedId === item._id ? null : item._id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CertificateVerification;