import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const CreateCompany = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-ghost inline-flex items-center gap-2 mb-4"
        >
          <FiArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold">Add New Company</h1>
        <p className="text-gray-600 mt-2">Create a new company profile and submit it for admin approval.</p>
      </div>

      <div className="card p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Company creation is not yet implemented.</p>
          <p className="mt-2">This placeholder page ensures the admin action button has a valid destination.</p>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;
