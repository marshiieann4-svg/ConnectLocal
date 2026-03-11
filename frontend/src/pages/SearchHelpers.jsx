import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SearchHelpers = () => {
  const navigate = useNavigate();
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    services: [],
    languages: [],
    minRating: 0,
    ward: '',
    page: 1
  });

  const [showFilters, setShowFilters] = useState(false);

  // Service and language options
  const serviceOptions = [
    { value: 'companionship', label: 'Companionship' },
    { value: 'meal_preparation', label: 'Meal Preparation' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'cleaning', label: 'Cleaning & Housework' },
    { value: 'shopping', label: 'Shopping & Errands' },
    { value: 'medication_reminders', label: 'Medication Reminders' },
    { value: 'personal_care', label: 'Personal Care' },
    { value: 'respite_care', label: 'Respite Care' },
    { value: 'mobility_assistance', label: 'Mobility Assistance' },
    { value: 'other', label: 'Other' }
  ];

  const languageOptions = [
    'English',
    'Zulu',
    'Xhosa',
    'Afrikaans',
    'Sotho',
    'Tswana',
    'Tsonga',
    'Venda',
    'Ndebele',
    'Swati'
  ];

  const wards = [
    'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
    'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10'
  ];

  // Fetch helpers based on filters
  const fetchHelpers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.services.length > 0) params.append('services', filters.services.join(','));
      if (filters.languages.length > 0) params.append('languages', filters.languages.join(','));
      if (filters.minRating > 0) params.append('minRating', filters.minRating);
      if (filters.ward) params.append('ward', filters.ward);
      params.append('page', filters.page);
      params.append('limit', 12);

      const res = await api.get(`/users/helpers/search?${params.toString()}`);
      setHelpers(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch helpers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpers();
  }, [filters.page]);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleServiceToggle = (service) => {
    const newServices = filters.services.includes(service)
      ? filters.services.filter(s => s !== service)
      : [...filters.services, service];
    setFilters({ ...filters, services: newServices, page: 1 });
  };

  const handleLanguageToggle = (language) => {
    const newLanguages = filters.languages.includes(language)
      ? filters.languages.filter(l => l !== language)
      : [...filters.languages, language];
    setFilters({ ...filters, languages: newLanguages, page: 1 });
  };

  const handleApplyFilters = () => {
    setFilters({ ...filters, page: 1 });
    fetchHelpers();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      services: [],
      languages: [],
      minRating: 0,
      ward: '',
      page: 1
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-success';
    if (rating >= 3.5) return 'text-info';
    if (rating >= 2.5) return 'text-warning';
    return 'text-danger';
  };

  const getCompletionBadge = (services, languages, experience) => {
    let completeness = 0;
    if (services && services.length > 0) completeness += 33;
    if (languages && languages.length > 0) completeness += 33;
    if (experience && experience.years > 0) completeness += 34;
    return completeness;
  };

  if (loading && helpers.length === 0) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="cl-page-header">
        <h2>
          <i className="fas fa-search me-2"></i>Find Helpers
        </h2>
      </div>
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text" style={{ background: 'white', borderColor: 'var(--cl-gray-200)' }}>
              <i className="fas fa-user-tie" style={{ color: 'var(--cl-blue)' }}></i>
            </span>
            <input
              type="text"
              className="cl-input"
              style={{ borderRadius: '0' }}
              placeholder="Search by name or phone..."
              value={filters.search}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
            <button
              className="btn btn-cl-primary"
              onClick={handleApplyFilters}
            >
              <i className="fas fa-search me-2"></i>Search
            </button>
          </div>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-cl-outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-sliders-h me-2"></i>
            {showFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="cl-card">
                <h5 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--cl-gray-900)' }}>Filter by:</h5>

                {/* Services Filter */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    <i className="fas fa-briefcase me-2"></i>Services
                  </h6>
                  <div className="row g-2">
                    {serviceOptions.map((service) => (
                      <div key={service.value} className="col-md-4 col-lg-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`service-${service.value}`}
                            checked={filters.services.includes(service.value)}
                            onChange={() => handleServiceToggle(service.value)}
                          />
                          <label className="form-check-label" htmlFor={`service-${service.value}`}>
                            {service.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages Filter */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    <i className="fas fa-language me-2"></i>Languages Spoken
                  </h6>
                  <div className="row g-2">
                    {languageOptions.map((language) => (
                      <div key={language} className="col-md-4 col-lg-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`lang-${language}`}
                            checked={filters.languages.includes(language)}
                            onChange={() => handleLanguageToggle(language)}
                          />
                          <label className="form-check-label" htmlFor={`lang-${language}`}>
                            {language}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating & Ward Filters */}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="cl-label fw-bold">Minimum Rating</label>
                    <select
                      className="cl-select"
                      value={filters.minRating}
                      onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    >
                      <option value={0}>All ratings</option>
                      <option value={2.0}>2.0+</option>
                      <option value={3.0}>3.0+</option>
                      <option value={3.5}>3.5+</option>
                      <option value={4.0}>4.0+</option>
                      <option value={4.5}>4.5+</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="cl-label fw-bold">Ward</label>
                    <select
                      className="cl-select"
                      value={filters.ward}
                      onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
                    >
                      <option value="">All wards</option>
                      {wards.map((ward) => (
                        <option key={ward} value={ward}>{ward}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-cl-primary"
                    onClick={handleApplyFilters}
                  >
                    <i className="fas fa-check me-2"></i>Apply Filters
                  </button>
                  <button
                    className="btn btn-cl-outline"
                    onClick={handleClearFilters}
                  >
                    <i className="fas fa-times me-2"></i>Clear All
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="row mb-3">
        <div className="col-12">
          <p className="text-muted">
            Found <strong>{pagination.total}</strong> helpers
            {filters.services.length > 0 && ` offering ${filters.services.length} service(s)`}
            {filters.languages.length > 0 && ` speaking ${filters.languages.length} language(s)`}
          </p>
        </div>
      </div>

      {/* Helpers Grid */}
      {helpers.length === 0 ? (
        <div className="alert alert-info" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          No helpers found matching your criteria. Try adjusting your filters or search terms.
        </div>
      ) : (
        <div className="row g-3 mb-4">
          {helpers.map((helper) => (
            <div key={helper._id} className="col-md-6 col-lg-4 col-xl-3">
              <div className="cl-service-card" style={{ cursor: 'pointer' }}>
                {/* Profile Picture */}
                <div
                  className="position-relative bg-light"
                  style={{ height: '180px', overflow: 'hidden' }}
                  onClick={() => navigate(`/profile/${helper._id}`)}
                >
                  {helper.profilePicture ? (
                    <img
                      src={helper.profilePicture}
                      alt={helper.name}
                      className="w-100 h-100 object-fit-cover"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                      <i className="fas fa-user fa-3x text-muted"></i>
                    </div>
                  )}
                  {/* Completion Badge */}
                  <span className="badge bg-success position-absolute top-0 end-0 m-2">
                    {getCompletionBadge(helper.servicesOffered, helper.languages, helper.experience)}%
                  </span>
                </div>

                <div className="card-body">
                  {/* Name */}
                  <h5 className="card-title mb-2">{helper.name}</h5>

                  {/* Rating */}
                  <div className="mb-2">
                    <span className={`h5 fw-bold ${getRatingColor(helper.averageRating || 0)}`}>
                      {helper.averageRating ? helper.averageRating.toFixed(1) : 'N/A'}
                      <i className="fas fa-star ms-1" style={{ fontSize: '0.8em' }}></i>
                    </span>
                    <small className="text-muted">
                      ({helper.totalRatings} {helper.totalRatings === 1 ? 'review' : 'reviews'})
                    </small>
                  </div>

                  {/* Bio */}
                  <p className="card-text small text-muted mb-2" style={{ minHeight: '40px' }}>
                    {helper.bio ? helper.bio.substring(0, 60) + '...' : 'No bio yet'}
                  </p>

                  {/* Languages */}
                  {helper.languages && helper.languages.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">Languages:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {helper.languages.slice(0, 2).map((lang, idx) => (
                          <span key={idx} className="cl-badge blue">
                            {lang}
                          </span>
                        ))}
                        {helper.languages.length > 2 && (
                          <span className="cl-badge blue">+{helper.languages.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {helper.servicesOffered && helper.servicesOffered.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">Services:</small>
                      <div className="d-flex gap-1" style={{ fontSize: '0.75rem' }}>
                        {helper.servicesOffered.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="cl-badge blue">
                            {service.replace('_', ' ')}
                          </span>
                        ))}
                        {helper.servicesOffered.length > 2 && (
                          <span className="cl-badge blue">+{helper.servicesOffered.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {helper.experience && helper.experience.years > 0 && (
                    <small className="text-muted d-block mb-2">
                      <i className="fas fa-briefcase me-1"></i>
                      {helper.experience.years} {helper.experience.years === 1 ? 'year' : 'years'} experience
                    </small>
                  )}

                  {/* Location */}
                  <small className="text-muted d-block mb-3">
                    <i className="fas fa-map-marker-alt me-1"></i>{helper.ward}
                  </small>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-cl-outline btn-sm"
                      onClick={() => navigate(`/profile/${helper._id}`)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="row">
          <div className="col-12 d-flex justify-content-center">
            <nav aria-label="Page navigation">
              <ul className="pagination">
                <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <li
                    key={page}
                    className={`page-item ${filters.page === page ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setFilters({ ...filters, page })}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${filters.page === pagination.pages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHelpers;
