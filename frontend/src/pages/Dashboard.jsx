import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalServices: 0,
    completedServices: 0,
    activeHelpers: 0
  });
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    minRating: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchServices();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const fetchServices = async (filterParams = {}) => {
    try {
      const params = new URLSearchParams(filterParams).toString();
      const res = await api.get(`/services?${params}`);
      setServices(res.data.data);
    } catch (error) {
      console.error('Failed to fetch services', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.location) params.location = filters.location;
    if (filters.minRating) params.minRating = filters.minRating;
    fetchServices(params);
  };

  const clearFilters = () => {
    setFilters({ category: '', location: '', minRating: '' });
    fetchServices();
  };

  return (
    <div>
      <div className="cl-page-header">
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--cl-gray-500)' }}>Overview of community activity</p>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="cl-stat-card">
            <div className="cl-stat-icon"><i className="fas fa-users"></i></div>
            <div className="cl-stat-value">{stats.totalUsers}</div>
            <div className="cl-stat-label">Total Users</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="cl-stat-card">
            <div className="cl-stat-icon"><i className="fas fa-hands-helping"></i></div>
            <div className="cl-stat-value">{stats.activeHelpers}</div>
            <div className="cl-stat-label">Active Helpers</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="cl-stat-card">
            <div className="cl-stat-icon"><i className="fas fa-clock"></i></div>
            <div className="cl-stat-value">{stats.totalServices - stats.completedServices}</div>
            <div className="cl-stat-label">Open Requests</div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="cl-stat-card">
            <div className="cl-stat-icon"><i className="fas fa-check-circle"></i></div>
            <div className="cl-stat-value">{stats.completedServices}</div>
            <div className="cl-stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cl-filter-bar">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="cl-label">Category</label>
            <select className="cl-select" name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="gardening">Gardening</option>
              <option value="tutoring">Tutoring</option>
              <option value="elderly_care">Elderly Care</option>
              <option value="childcare">Childcare</option>
              <option value="transport">Transport</option>
              <option value="repairs">Repairs</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="cl-label">Location</label>
            <input type="text" className="cl-input" name="location" placeholder="Enter ward or area" value={filters.location} onChange={handleFilterChange} />
          </div>
          <div className="col-md-4">
            <label className="cl-label">Min Helper Rating</label>
            <select className="cl-select" name="minRating" value={filters.minRating} onChange={handleFilterChange}>
              <option value="">Any</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-cl-primary" onClick={applyFilters}>Apply Filters</button>
          <button className="btn btn-cl-outline" onClick={clearFilters}>Clear</button>
        </div>
      </div>

      {/* Services List */}
      <h3 className="mb-3" style={{ fontWeight: 700, color: 'var(--cl-gray-900)' }}>Recent Help Requests</h3>
      {loading ? (
        <div className="cl-spinner"></div>
      ) : services.length === 0 ? (
        <div className="cl-empty">No services match your criteria.</div>
      ) : (
        <div className="row">
          {services.map(service => (
            <div key={service._id} className="col-md-6 mb-4">
              <div className="cl-service-card">
                <div className="cl-service-card-body">
                  <h5 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--cl-gray-900)' }}>{service.title}</h5>
                  <p style={{ color: 'var(--cl-gray-600)', marginBottom: '0.75rem' }}>{service.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className="cl-badge blue"><i className="fas fa-tag me-1"></i>{service.category}</span>
                    <span className="cl-badge blue"><i className="fas fa-map-marker-alt me-1"></i>{service.location}</span>
                    <span className="cl-badge yellow"><i className="fas fa-clock me-1"></i>{service.urgency}</span>
                  </div>
                  {service.helper && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--cl-gray-600)', marginBottom: '0.5rem' }}>
                      Helper: {service.helper.name}
                      {service.helper.averageRating > 0 &&
                        <span> ({service.helper.averageRating.toFixed(1)} ⭐)</span>
                      }
                    </p>
                  )}
                  {service.offerCount > 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--cl-gray-500)', marginBottom: '0.5rem' }}>{service.offerCount} offer(s)</p>
                  )}
                  <Link to={`/service/${service._id}`} className="btn btn-cl-outline btn-sm">View Details</Link>
                </div>
              </div>
            </div>

          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;