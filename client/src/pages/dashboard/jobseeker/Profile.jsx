import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, uploadCV } from '../../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { FiUploadCloud, FiFileText } from 'react-icons/fi';

const JobSeekerProfile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    headline: user?.headline || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const [cvFile, setCvFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err || 'Failed to update profile.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCvFile(file);
    }
  };

  const handleCVUpload = async () => {
    if (!cvFile) return toast.error('Please select a file first.');

    const uploadData = new FormData();
    uploadData.append('cv', cvFile);

    try {
      await dispatch(uploadCV(uploadData)).unwrap();
      toast.success('CV uploaded successfully!');
      setCvFile(null);
    } catch (err) {
      toast.error(err || 'Failed to upload CV.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6 border-b pb-4">Personal Details</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className="input"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className="input"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Headline (e.g., Senior Software Engineer)</label>
                <input
                  type="text"
                  name="headline"
                  className="input"
                  value={formData.headline}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Professional Bio</label>
                <textarea
                  name="bio"
                  rows="4"
                  className="textarea"
                  value={formData.bio}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: CV Upload */}
        <div className="space-y-6">
          <div className="card bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-xl font-semibold mb-4">Resume / CV</h2>
            
            {user?.cv ? (
              <div className="mb-6 p-4 border rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FiFileText className="text-primary-500 text-2xl flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium truncate">Current Resume</p>
                    <a href={user.cv} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline">
                      View Document
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">You haven't uploaded a CV yet. Employers won't be able to review your application effectively.</p>
            )}

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
              />
              
              <FiUploadCloud className="mx-auto text-4xl text-gray-400 mb-3" />
              
              {cvFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-4">{cvFile.name}</p>
                  <button 
                    type="button" 
                    onClick={handleCVUpload}
                    className="btn btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? 'Uploading...' : 'Upload Now'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Drag & drop your CV here, or click to browse.</p>
                  <p className="text-xs text-gray-500 mb-4">Supported formats: PDF, DOC. Max size: 10MB.</p>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    className="btn btn-outline w-full text-sm py-2"
                  >
                    Select File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default JobSeekerProfile;
