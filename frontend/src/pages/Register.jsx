import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAccountTypeChange = (e) => {
    setAccountType(e.target.value);
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
    try {
      const payload = {
        ...form,
        accountType
      };
      const response = await api.post('/auth/register', payload);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 600 }}>
      <div className="card shadow">
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Register</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Account Type */}
            <div className="mb-3">
              <label className="form-label">Account Type</label>
              <select className="form-select" value={accountType} onChange={handleAccountTypeChange}>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
                <option value="home_care">Home-Based Care</option>
                <option value="dropin_centre">Drop-in Centre</option>
              </select>
            </div>

            {/* Conditional fields for individuals */}
            {accountType === 'individual' && (
              <div className="mb-3">
                <label className="form-label">I want to:</label>
                <select className="form-select" name="role" value={form.role} onChange={handleChange}>
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
                  <label className="form-label">Organization Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="organizationName"
                    value={form.organizationName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Registration Number (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Common fields */}
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email (optional)</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Ward / Area</label>
              <input
                type="text"
                className="form-control"
                name="ward"
                value={form.ward}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">Register</button>
          </form>
          <p className="mt-3 text-center">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;