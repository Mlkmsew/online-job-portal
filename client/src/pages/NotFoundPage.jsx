import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="notfound-page">
    <div className="notfound-card">
      <h2>Page Not Found</h2>
      <p>We couldn't find the page you're looking for.</p>
      <Link to="/" className="btn btn-secondary">Back to Home</Link>
    </div>
  </div>
);

export default NotFoundPage;
