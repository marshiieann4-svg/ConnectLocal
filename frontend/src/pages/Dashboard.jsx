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
    <div className="container mt-4">
      <h1>Dashboard</h1>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-white bg-primary">
            <div className="card-body text-center">
              <i className="fas fa-users fa-2x mb-2"></i>
              <h3>{stats.totalUsers}</h3>
              <p className="mb-0">Total Users</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-white bg-info">
            <div className="card-body text-center">
              <i className="fas fa-hands-helping fa-2x mb-2"></i>
              <h3>{stats.activeHelpers}</h3>
              <p className="mb-0">Active Helpers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-white bg-warning">
            <div className="card-body text-center">
              <i className="fas fa-clock fa-2x mb-2"></i>
              <h3>{stats.totalServices - stats.completedServices}</h3>
              <p className="mb-0">Open Requests</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-white bg-success">
            <div className="card-body text-center">
              <i className="fas fa-check-circle fa-2x mb-2"></i>
              <h3>{stats.completedServices}</h3>
              <p className="mb-0">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select className="form-select" name="category" value={filters.category} onChange={handleFilterChange}>
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
              <label className="form-label">Location</label>
              <input type="text" className="form-control" name="location" placeholder="Enter ward or area" value={filters.location} onChange={handleFilterChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Min Helper Rating</label>
              <select className="form-select" name="minRating" value={filters.minRating} onChange={handleFilterChange}>
                <option value="">Any</option>
                <option value="4">4+ stars</option>
                <option value="3">3+ stars</option>
                <option value="2">2+ stars</option>
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
            <button className="btn btn-outline-secondary" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </div>

      {/* Services List */}
      <h3 className="mb-3">Recent Help Requests</h3>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : services.length === 0 ? (
        <div className="alert alert-info">No services match your criteria.</div>
      ) : (
        <div className="row">
          {services.map(service => (
            <div key={service._id} className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{service.title}</h5>
                  <p className="card-text">{service.description}</p>
                  <p className="card-text">
                    <small className="text-muted">
                      <i className="fas fa-tag me-1"></i>{service.category}<br />
                      <i className="fas fa-map-marker-alt me-1"></i>{service.location}<br />
                      <i className="fas fa-clock me-1"></i>Urgency: {service.urgency}
                    </small>
                  </p>
                  {service.helper && (
                    <p className="card-text">
                      <small>
                        Helper: {service.helper.name} 
                        {service.helper.averageRating > 0 && 
                          <span> (⭐ {service.helper.averageRating.toFixed(1)})</span>
                        }
                      </small>
                    </p>
                  )}
                  {service.offerCount > 0 && (
                    <p className="card-text">
                      <small className="text-muted">{service.offerCount} offer(s)</small>
                    </p>
                  )}
                  <Link to={`/service/${service._id}`} className="btn btn-outline-primary btn-sm">View Details</Link>
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