// ============================================
// Loading Skeleton Components
// ============================================

// Job Card Skeleton
export const JobCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
);

// Company Card Skeleton
export const CompanyCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md animate-pulse">
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
    </div>
  </div>
);

// Profile Skeleton
export const ProfileSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md animate-pulse">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-2"></div>
    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
  </div>
);

// Chart Skeleton
export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
    <div className="flex items-end justify-between gap-2 h-64">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-t animate-pulse"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        ></div>
      ))}
    </div>
  </div>
);

// List Skeleton
export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-pulse">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Page Skeleton
export const PageSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
    </div>
    <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
  </div>
);
