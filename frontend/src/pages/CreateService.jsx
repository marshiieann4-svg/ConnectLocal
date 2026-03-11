import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateService = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    urgency: 'anytime',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requesterId = localStorage.getItem('userId');
      const payload = { ...form, requesterId };
      await api.post('/services', payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service');
    }
  };

  return (
    <div>
      <div className="cl-page-header">
        <h2>Post a Help Request</h2>
        <p style={{ color: 'var(--cl-gray-500)' }}>Describe what you need help with</p>
      </div>
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="cl-card">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="cl-label">Title</label>
                  <input
                    type="text"
                    className="cl-input"
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="cl-label">Description</label>
                  <textarea
                    className="cl-input"
                    id="description"
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="category" className="cl-label">Category</label>
                  <select
                    className="cl-select"
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="gardening">Gardening</option>
                    <option value="tutoring">Tutoring</option>
                    <option value="elderly_care">Elderly Care</option>
                    <option value="childcare">Childcare</option>
                    <option value="transport">Transport</option>
                    <option value="repairs">Repairs</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="location" className="cl-label">Location</label>
                  <input
                    type="text"
                    className="cl-input"
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="urgency" className="cl-label">Urgency</label>
                  <select
                    className="cl-select"
                    id="urgency"
                    name="urgency"
                    value={form.urgency}
                    onChange={handleChange}
                  >
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-cl-primary w-100" style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                  <i className="fas fa-paper-plane me-2"></i>Post Request
                </button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateService;