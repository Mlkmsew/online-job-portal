import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        <p>Join OnlineJob Portal and start applying for jobs today.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-grid">
            <label>First Name<input name="firstName" type="text" value={form.firstName} onChange={handleChange} required /></label>
            <label>Last Name<input name="lastName" type="text" value={form.lastName} onChange={handleChange} required /></label>
          </div>
          <label>Email<input name="email" type="email" value={form.email} onChange={handleChange} required /></label>
          <label>Phone<input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+251 9XX XXX XXX" required /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={handleChange} required /></label>
          <label>Confirm Password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required /></label>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary">Register</button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

