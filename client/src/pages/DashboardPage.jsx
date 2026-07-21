const DashboardPage = () => (
  <div className="dashboard-page">
    <div className="dashboard-hero">
      <h2>Dashboard</h2>
      <p>Welcome to your EthioJob dashboard. Track applications, manage your profile, and discover relevant opportunities.</p>
    </div>
    <div className="dashboard-grid">
      <div className="dashboard-card">
        <h3>Active Applications</h3>
        <p>12</p>
      </div>
      <div className="dashboard-card">
        <h3>Saved Jobs</h3>
        <p>5</p>
      </div>
      <div className="dashboard-card">
        <h3>Recommended Jobs</h3>
        <p>18</p>
      </div>
      <div className="dashboard-card">
        <h3>Profile Strength</h3>
        <p>76%</p>
      </div>
    </div>
  </div>
);

export default DashboardPage;
