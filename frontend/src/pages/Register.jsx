import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { getDefaultRouteForUser } from '../utils/auth';

const Register = () => {
  const [accountType, setAccountType] = useState('individual');
  const [form, setForm] = useState({
    phone: '',
    name: '',
    email: '',
    role: 'helper',
    organizationName: '',
    registrationNumber: '',
    ward: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // Clear error on input change
  };

  const handleAccountTypeChange = (e) => {
    setAccountType(e.target.value);
    setError(''); // Clear error
    // Reset conditional fields when switching account type
    setForm(prev => ({
      ...prev,
      role: 'helper',
      organizationName: '',
      registrationNumber: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!form.phone || !form.name || !form.ward) {
        setError('Phone, Name, and Ward are required');
        setLoading(false);
        return;
      }

      if (accountType === 'individual' && !form.role) {
        setError('Please select a role');
        setLoading(false);
        return;
      }

      const orgTypes = ['organization', 'home_care', 'dropin_centre'];
      if (orgTypes.includes(accountType) && !form.organizationName) {
        setError('Organization name is required');
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        accountType
      };

      console.log('Registering with payload:', payload);
      const response = await api.post('/auth/register', payload);
      console.log('Registration response:', response.data);

      const user = response.data.user;
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-changed'));

      const destination = getDefaultRouteForUser(user);

      navigate(destination);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-auth-page">
        <div className="cl-auth-card" style={{ maxWidth: 540 }}>
          <div className="cl-auth-logo">ConnectLocal</div>
          <p style={{ color: 'var(--cl-gray-500)', marginBottom: '1.5rem', textAlign: 'center' }}>Create your account</p>
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              <strong>Error:</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/* Account Type */}
            <div className="mb-3">
              <label className="cl-label">Account Type</label>
              <select className="cl-select" value={accountType} onChange={handleAccountTypeChange}>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
                <option value="home_care">Home-Based Care</option>
                <option value="dropin_centre">Drop-in Centre</option>
              </select>
            </div>

            {/* Conditional fields for individuals */}
            {accountType === 'individual' && (
              <div className="mb-3">
                <label className="cl-label">I want to:</label>
                <select className="cl-select" name="role" value={form.role} onChange={handleChange}>
                  <option value="helper">Offer Help</option>
                  <option value="requester">Request Help</option>
                  <option value="both">Both</option>
                </select>
              </div>
            )}

            {/* Conditional fields for organizations/care centers */}
            {(accountType === 'organization' || accountType === 'home_care' || accountType === 'dropin_centre') && (
              <>
                <div className="mb-3">
                  <label className="cl-label">Organization Name</label>
                  <input
                    type="text"
                    className="cl-input"
                    name="organizationName"
                    value={form.organizationName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="cl-label">Registration Number (optional)</label>
                  <input
                    type="text"
                    className="cl-input"
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Common fields */}
            <div className="mb-3">
              <label className="cl-label">Full Name</label>
              <input
                type="text"
                className="cl-input"
                name="name"
                autoComplete="name"
                placeholder="e.g. Sipho Dlamini"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="cl-label">Phone Number</label>
              <input
                type="tel"
                inputMode="tel"
                className="cl-input"
                name="phone"
                autoComplete="tel"
                placeholder="e.g. 0761234567"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="cl-label">Email (optional)</label>
              <input
                type="email"
                className="cl-input"
                name="email"
                autoComplete="email"
                placeholder="e.g. sipho@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="cl-label">Ward / Area</label>
              <input
                type="text"
                className="cl-input"
                name="ward"
                autoComplete="address-level2"
                placeholder="e.g. Matsapha, Msogwaba"
                value={form.ward}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-cl-primary w-100" style={{ padding: '0.75rem' }} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>
          <p className="mt-3 text-center">
            Already have an account? <Link to="/login">Login</Link>
          </p>
      </div>
    </div>
  );
};

export default Register;