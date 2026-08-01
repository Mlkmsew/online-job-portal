const AdminManageJobs = () => (
  <div className="space-y-6 p-6">
    <div className="card p-6">
      <h1 className="text-3xl font-bold">Manage Jobs</h1>
      <p className="text-gray-600 mt-2">Review, approve, or reject job postings submitted by employers.</p>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card p-5 border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">Pending Jobs</p>
        <p className="mt-3 text-3xl font-semibold">0</p>
      </div>
      <div className="card p-5 border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">Approved Jobs</p>
        <p className="mt-3 text-3xl font-semibold">0</p>
      </div>
      <div className="card p-5 border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">Rejected Jobs</p>
        <p className="mt-3 text-3xl font-semibold">0</p>
      </div>
    </div>

    <div className="card p-6 text-gray-500">Job management tools will appear here when admin review workflows are configured.</div>
  </div>
);

export default AdminManageJobs;
