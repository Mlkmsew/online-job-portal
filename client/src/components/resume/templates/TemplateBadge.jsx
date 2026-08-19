const badgeStyles = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  premium: 'border-violet-200 bg-violet-50 text-violet-700',
  free: 'border-blue-200 bg-blue-50 text-blue-700',
};

const TemplateBadge = ({ children, tone = 'neutral', className = '' }) => {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${badgeStyles[tone] || badgeStyles.neutral} ${className}`.trim()}>
      {children}
    </span>
  );
};

export default TemplateBadge;
