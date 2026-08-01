const AdminReports = () => (
  <div className="space-y-6 p-6">
    <div className="card p-6">
      <h1 className="text-3xl font-bold">Reports & Statistics</h1>
      <p className="text-gray-600 mt-2">View platform-wide insights and performance metrics for company and job activity.</p>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card p-5 border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">Total Companies</p>
        <p className="mt-3 text-3xl font-semibold">0</p>
      </div>
      <div className="card p-5 border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">Active Jobs</p>
        <p className="mt-3 text-3xl font-semibold">0</p>
      </div>
      <div className="card p-5 border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">Total Applications</p>
        <p className="mt-3 text-3xl font-semibold">0</p>
      </div>
    </div>
  </div>
);

export default AdminReports;
