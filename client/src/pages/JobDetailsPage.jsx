const JobDetailsPage = () => (
  <div className="page-section">
    <div className="section-header">
      <h2>Job Details</h2>
      <p>Open the full job description, requirements, and application steps.</p>
    </div>
    <div className="job-details-card">
      <h3>Senior Product Designer</h3>
      <p>Company: Digital Innovation Hub</p>
      <p>Location: Addis Ababa</p>
      <p>Employment type: Full-time</p>
      <p>Salary: Negotiable</p>
      <h4>Responsibilities</h4>
      <ul>
        <li>Create product flows and visual designs for web and mobile.</li>
        <li>Collaborate with product, marketing, and engineering.</li>
        <li>Advise on usability for Ethiopian audiences.</li>
      </ul>
      <h4>Qualifications</h4>
      <ul>
        <li>3+ years in product or UX design.</li>
        <li>Strong communication and portfolio.</li>
        <li>Experience with Figma or Adobe XD.</li>
      </ul>
      <button className="btn btn-secondary">Apply Now</button>
    </div>
  </div>
);

export default JobDetailsPage;
