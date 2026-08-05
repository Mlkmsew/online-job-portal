import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, uploadCV } from '../../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { FiUploadCloud, FiFileText } from 'react-icons/fi';

const JobSeekerProfile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    headline: user?.headline || '',
    bio: user?.bio || '',
    skills: user?.skills || '',
    experience: user?.experience || '',
    education: user?.education || '',
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
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const allowedExts = ['.pdf', '.doc', '.docx'];
      const ext = file.name?.split('.').pop()?.toLowerCase();

      if (!allowedMimes.includes(file.type) && !allowedExts.includes('.' + ext)) {
        toast.error('Only PDF, DOC, or DOCX files are allowed.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum 10MB allowed.');
        return;
      }

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
      const apiCode = err?.response?.data?.code;
      if (apiCode === 'UNSUPPORTED_FILE_TYPE') {
        toast.error('Only PDF, DOC, or DOCX files are allowed.');
      } else {
        toast.error(err?.message || 'Failed to upload CV. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Professional Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-6 border-b pb-4">Professional Profile</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Professional Headline</label>
                <input
                  type="text"
                  name="headline"
                  className="input"
                  value={formData.headline}
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

              <div>
                <label className="block text-sm font-medium mb-1">Skills</label>
                <input
                  type="text"
                  name="skills"
                  className="input"
                  placeholder="e.g., React, Node.js, Product Management"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Experience</label>
                <textarea
                  name="experience"
                  rows="3"
                  className="textarea"
                  placeholder="e.g., 5 years in software development..."
                  value={formData.experience}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Education</label>
                <textarea
                  name="education"
                  rows="3"
                  className="textarea"
                  placeholder="e.g., BSc Computer Science, XYZ University"
                  value={formData.education}
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
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
