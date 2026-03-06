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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Post a Help Request</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select
                    className="form-select"
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
                  <label htmlFor="location" className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="urgency" className="form-label">Urgency</label>
                  <select
                    className="form-select"
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
                <button type="submit" className="btn btn-primary w-100">Post Request</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateService;