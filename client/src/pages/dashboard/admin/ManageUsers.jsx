import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchAdminUsers } from '../../../store/slices/adminSlice';
import { format } from 'date-fns';
import {
  FiUsers,
  FiSearch,
  FiMail,
  FiMapPin,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiMoreVertical,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const ROLE_STYLES = {
  jobseeker: 'bg-[#ECFDF5] text-[#0F766E] ring-[#D1FAE5]',
  employer: 'bg-[#EEF2FF] text-[#4338CA] ring-[#E0E7FF]',
  admin: 'bg-[#DCF2E8] text-[#065F46] ring-[#BBE4D6]',
};

const STATUS_META = {
  active: { label: 'Active', cls: 'bg-[#DCF2E8] text-[#065F46] ring-[#BBE4D6]', icon: FiCheckCircle },
  pending: { label: 'Pending', cls: 'bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]', icon: FiClock },
  suspended: { label: 'Suspended', cls: 'bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]', icon: FiAlertCircle },
  rejected: { label: 'Rejected', cls: 'bg-[#FEE2E2] text-[#B91C1C] ring-[#FECACA]', icon: FiXCircle },
};

const STATUS_OPTIONS = ['active', 'pending', 'suspended', 'rejected'];
const ROLE_OPTIONS = ['jobseeker', 'employer', 'admin'];
const PAGE_SIZE = 8;

const getInitials = (u) => `${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`.toUpperCase() || '?';

const getUserStatus = (u) => u?.status || (u?.isSuspended ? 'suspended' : 'active');

const Avatar = ({ user, size = 'h-11 w-11', text = 'text-sm' }) => (
  <div className={`flex ${size} flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 font-bold text-white shadow-sm ${text}`}>
    {user?.avatar ? (
      <img src={user.avatar} alt={user?.firstName || 'User'} className="h-full w-full object-cover" />
    ) : (
      getInitials(user)
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  const label = t(`admin.users.status.${status}`, { defaultValue: meta.label });
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const VerificationBadge = ({ verified }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        verified
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-gray-50 text-gray-500 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600'
      }`}
    >
      <FiCheckCircle className="h-3.5 w-3.5" />
      {verified ? t('admin.users.verified', { defaultValue: 'Verified' }) : t('admin.users.unverified', { defaultValue: 'Unverified' })}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${ROLE_STYLES[role] || ROLE_STYLES.jobseeker}`}>
      <FiUser className="h-3 w-3" />
      {t(`admin.users.role.${role}`, { defaultValue: role })}
    </span>
  );
};

const RowActions = ({ user }) => {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(null);

  const openMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 160;
    const x = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setMenu({ x, y: rect.bottom + 6 });
  };

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-label={t('admin.users.rowActions', { defaultValue: 'User actions' })}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        <FiMoreVertical className="h-4 w-4" />
      </button>
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            style={{ left: menu.x, top: menu.y }}
          >
            <Link
              to={`/admin/users/${user._id}`}
              onClick={() => setMenu(null)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <FiEye className="h-4 w-4 text-gray-400" />
              {t('admin.users.viewProfile', { defaultValue: 'View Profile' })}
            </Link>
          </div>
        </>
      )}
    </>
  );
};

const Pagination = ({ page, totalPages, from, to, total, onPage }) => {
  const { t } = useTranslation();
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  const btn = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition';
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('admin.users.showingRange', { defaultValue: 'Showing {{from}}–{{to}} of {{total}} users', from, to, total })}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className={`${btn} text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700`}
        >
          <FiChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('admin.users.previous', { defaultValue: 'Previous' })}</span>
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={`${btn} ${
                p === page
                  ? 'bg-[#1769E0] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          className={`${btn} text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700`}
        >
          <span className="hidden sm:inline">{t('admin.users.next', { defaultValue: 'Next' })}</span>
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const UserRow = ({ user }) => {
  const { t } = useTranslation();
  const location = [user?.location?.city, user?.location?.region, user?.location?.address].filter(Boolean).join(', ');
  const registered = user?.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—';
  const status = getUserStatus(user);

  return (
    <tr className="group border-b border-gray-50 transition hover:bg-gray-50/70 dark:border-gray-700 dark:hover:bg-gray-700/40">
      <td className="px-4 py-3.5">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-emerald-600" aria-label={t('admin.users.selectUser', { defaultValue: 'Select user' })} />
      </td>
      <td className="px-4 py-3.5">
        <Link to={`/admin/users/${user._id}`} className="flex min-w-0 items-center gap-3">
          <Avatar user={user} size="h-10 w-10" text="text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900 group-hover:text-[#1769E0] dark:text-white dark:group-hover:text-emerald-400">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-gray-400">#{String(user._id).slice(-6).toUpperCase()}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
          <FiMail className="h-3.5 w-3.5 text-gray-400" />
          <span className="max-w-[220px] truncate">{user.email}</span>
        </span>
      </td>
      <td className="px-4 py-3.5">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{registered}</td>
      <td className="px-4 py-3.5">
        <VerificationBadge verified={!!user.isEmailVerified} />
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3.5">
        <RowActions user={user} />
      </td>
    </tr>
  );
};

const UserCard = ({ user }) => {
  const { t } = useTranslation();
  const location = [user?.location?.city, user?.location?.region, user?.location?.address].filter(Boolean).join(', ');
  const registered = user?.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—';
  const status = getUserStatus(user);

  return (
    <Link
      to={`/admin/users/${user._id}`}
      className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1769E0] hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#1769E0]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h3>
            <p className="truncate text-xs text-gray-400">#{String(user._id).slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <RowActions user={user} />
      </div>

      <div className="mt-4 space-y-2.5 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <FiMail className="h-3.5 w-3.5" />
            {user.email}
          </span>
          {location && (
            <span className="inline-flex items-center gap-1.5">
              <FiMapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5">
          <FiClock className="h-3.5 w-3.5" />
          {t('admin.users.registered', { defaultValue: 'Registered' })}: {registered}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <VerificationBadge verified={!!user.isEmailVerified} />
        <RoleBadge role={user.role} />
      </div>
    </Link>
  );
};

const TableSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  </div>
);

const SelectField = ({ value, onChange, label, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
  >
    {label}
    {children}
  </select>
);

const ManageUsers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.admin);
  const currentUser = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [page, setPage] = useState(1);

  const visibleUsers = useMemo(
    () => (users || []).filter((user) => user.role !== 'admin' && user._id !== currentUser?._id),
    [users, currentUser]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleUsers.filter((u) => {
      if (q && ![u.firstName, u.lastName, u.email, u.role].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      const status = getUserStatus(u);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      const verified = !!u.isEmailVerified;
      if (verificationFilter === 'verified' && !verified) return false;
      if (verificationFilter === 'unverified' && verified) return false;
      return true;
    });
  }, [visibleUsers, search, roleFilter, statusFilter, verificationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, verificationFilter]);

  const clearFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
    setVerificationFilter('all');
  };

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || verificationFilter !== 'all';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sidebar.manageUsers')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('admin.manageUsers.subtitle')}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:ring-emerald-800">
          <FiUsers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
            {t('admin.users.totalUsers', { defaultValue: 'Total Users' })}: {visibleUsers.length}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { key: 'active', icon: FiCheckCircle, tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
          { key: 'pending', icon: FiClock, tint: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
          { key: 'suspended', icon: FiAlertCircle, tint: 'bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' },
          { key: 'rejected', icon: FiXCircle, tint: 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
        ].map(({ key, icon: Icon, tint }) => {
          const count = visibleUsers.filter((u) => getUserStatus(u) === key).length;
          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t(`admin.users.status.${key}`, { defaultValue: key })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder', { defaultValue: 'Search by name, email, or role...' })}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <SelectField value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label={<option value="all">{t('admin.users.allRoles', { defaultValue: 'All Roles' })}</option>}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {t(`admin.users.role.${r}`, { defaultValue: r })}
              </option>
            ))}
          </SelectField>
          <SelectField value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label={<option value="all">{t('admin.users.allStatus', { defaultValue: 'All Status' })}</option>}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`admin.users.status.${s}`, { defaultValue: s })}
              </option>
            ))}
          </SelectField>
          <SelectField value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} label={<option value="all">{t('admin.users.allVerification', { defaultValue: 'All Verification' })}</option>}>
            <option value="verified">{t('admin.users.verified', { defaultValue: 'Verified' })}</option>
            <option value="unverified">{t('admin.users.unverified', { defaultValue: 'Unverified' })}</option>
          </SelectField>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t('admin.users.clearFilters', { defaultValue: 'Clear Filters' })}
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length > 0 ? (
        <>
          {/* Desktop / tablet table */}
          <div className="card hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
                    <th className="px-4 py-3.5">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-emerald-600" aria-label={t('admin.users.selectAll', { defaultValue: 'Select all' })} />
                    </th>
                    <th className="px-4 py-3.5">{t('admin.users.colUser', { defaultValue: 'User' })}</th>
                    <th className="px-4 py-3.5">{t('admin.users.colEmail', { defaultValue: 'Email' })}</th>
                    <th className="px-4 py-3.5">{t('admin.users.colRole', { defaultValue: 'Role' })}</th>
                    <th className="px-4 py-3.5">{t('admin.users.colRegistered', { defaultValue: 'Registered' })}</th>
                    <th className="px-4 py-3.5">{t('admin.users.colVerification', { defaultValue: 'Verification' })}</th>
                    <th className="px-4 py-3.5">{t('admin.users.colStatus', { defaultValue: 'Status' })}</th>
                    <th className="px-4 py-3.5 text-right">{t('admin.users.colActions', { defaultValue: 'Actions' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map((user) => (
                    <UserRow key={user._id} user={user} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-4 md:hidden">
            {pageUsers.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination page={currentPage} totalPages={totalPages} from={from} to={to} total={filtered.length} onPage={setPage} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-gray-100 bg-white py-16 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <FiUsers className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('admin.manageUsers.noUsers') || 'No users found.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;