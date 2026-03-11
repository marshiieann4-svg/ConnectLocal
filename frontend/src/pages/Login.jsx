import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { getDefaultRouteForUser } from '../utils/auth';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    const response = await api.post('/auth/login', { phone });
    const user = response.data.user;
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-changed'));

    const destination = getDefaultRouteForUser(user);

    navigate(destination);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="cl-auth-page">
      <div className="cl-auth-card">
        <div className="cl-auth-logo">ConnectLocal</div>
        <p style={{ color: 'var(--cl-gray-500)', marginBottom: '2rem', textAlign: 'center' }}>Sign in to your account</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="phone" className="cl-label">Phone Number</label>
            <input
              type="tel"
              inputMode="tel"
              className="cl-input"
              id="phone"
              autoComplete="tel"
              placeholder="e.g. 0761234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-cl-primary w-100" style={{ padding: '0.75rem' }}>Login</button>
        </form>
        <p className="mt-3 text-center" style={{ color: 'var(--cl-gray-500)' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;