import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiBriefcase } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const formatDisplayText = (value) => {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const TrustedCompanyCard = ({ company }) => {
  const { t } = useTranslation();
  const [logoFailed, setLogoFailed] = useState(false);

  const name = formatDisplayText(company.name) || t('home.companyLabel');
  const initial = (company.name || 'C').charAt(0).toUpperCase();
  const openPositions = company.openPositions ?? 0;
  const hasLogo = !!company.logo && !logoFailed;

  return (
    <Link
      to={`/companies/${company._id}`}
      className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#1769E0] hover:shadow-lg hover:shadow-emerald-500/10"
    >
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 text-base font-bold text-slate-700 shadow-2xs">
          {hasLogo ? (
            <img
              src={company.logo}
              alt={name}
              onError={() => setLogoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        {company.isVerified && (
          <span
            className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-sm"
            title={t('home.verifiedCompany')}
            aria-label={t('home.verifiedCompany')}
          >
            <FiCheckCircle className="h-3 w-3" />
          </span>
        )}
      </div>

      <h4 className="mt-3 w-full truncate text-sm font-bold text-slate-900 group-hover:text-emerald-700">
        {name}
      </h4>
      <p className="mt-1 w-full truncate text-xs text-slate-500">
        {formatDisplayText(company.industry) || t('home.hiringNow')}
      </p>

      <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <FiBriefcase className="h-3 w-3" />
        {openPositions} {t('home.openPosition', { count: openPositions })}
      </span>
    </Link>
  );
};

export default TrustedCompanyCard;