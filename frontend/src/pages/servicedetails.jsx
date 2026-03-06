import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ServiceDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchService = useCallback(async () => {
    try {
      const res = await api.get(`/services/${id}`);
      setService(res.data.data);
      setOffers(res.data.data.offers || []);
    } catch {
      setError('Service not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/services/${id}/apply`, {
        message: applyMessage,
        proposedAmount: proposedAmount ? Number(proposedAmount) : undefined
      });
      alert('Application submitted!');
      setShowApplyForm(false);
      fetchService(); // refresh to show new offer
    } catch (err) {
      alert(err.response?.data?.message || 'Application failed');
    }
  };

  async function handleAcceptOffer(offerId) {
    if (!window.confirm('Accept this offer? This will reject all others.')) return;
    try {
      await api.put(`/services/${id}/accept-offer/${offerId}`);
      alert('Offer accepted!');
      fetchService();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept offer');
    }
  }

const currentUserId = localStorage.getItem('userId');
const isRequester = service?.requesterId?._id === currentUserId;
const hasApplied = offers.some(o => o.helperId?._id === currentUserId);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!service) return <div className="alert alert-warning">Service not found</div>;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="card-title">{service.title}</h2>
              <p className="card-text">{service.description}</p>
              <p>
                <strong>Category:</strong> {service.category}<br />
                <strong>Location:</strong> {service.location}<br />
                <strong>Urgency:</strong> {service.urgency}<br />
                <strong>Status:</strong> {service.status}
              </p>
              <p>
                <strong>Posted by:</strong> {service.requesterId?.name}
                {service.requesterId?.averageRating > 0 && (
                  <span> (⭐ {service.requesterId.averageRating.toFixed(1)})</span>
                )}
              </p>
              {service.helper && (
                <p>
                  <strong>Helper assigned:</strong> {service.helper.name}
                  {service.helper.averageRating > 0 && (
                    <span> (⭐ {service.helper.averageRating.toFixed(1)})</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Offers Section */}
          {service.status === 'open' && offers.length > 0 && (
            <div className="card mb-4">
              <div className="card-header">Offers ({offers.length})</div>
              <div className="list-group list-group-flush">
                {offers.map(offer => (
                  <div key={offer._id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{offer.helperId?.name}</strong> 
                        {offer.helperId?.averageRating > 0 && 
                          <span className="ms-2 badge bg-info">⭐ {offer.helperId.averageRating.toFixed(1)}</span>
                        }
                        <p className="mb-1 mt-1">{offer.message}</p>
                        {offer.proposedAmount && <p className="mb-0">💰 Proposed: R{offer.proposedAmount}</p>}
                      </div>
                      {isRequester && offer.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleAcceptOffer(offer._id)}>
                          Accept
                        </button>
                      )}
                    </div>
                    <small className="text-muted">Status: {offer.status}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Form (only for helpers if service is open and they haven't applied) */}
          {!isRequester && service.status === 'open' && !hasApplied && (
            <div className="card">
              <div className="card-header">
                <button className="btn btn-primary" onClick={() => setShowApplyForm(!showApplyForm)}>
                  {showApplyForm ? 'Cancel' : 'Apply to Help'}
                </button>
              </div>
              {showApplyForm && (
                <div className="card-body">
                  <form onSubmit={handleApply}>
                    <div className="mb-3">
                      <label className="form-label">Message to requester</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={applyMessage}
                        onChange={(e) => setApplyMessage(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Proposed amount (optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button type="submit" className="btn btn-success">Submit Application</button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5>Quick Actions</h5>
              <Link to="/dashboard" className="btn btn-outline-secondary w-100 mb-2">Back to Dashboard</Link>
              {isRequester && service.status === 'open' && (
                <p className="text-muted small">You will see offers below when helpers apply.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;