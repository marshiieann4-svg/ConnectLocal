import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import RatingForm from '../components/RatingForm';
import SafetyCheckIn from '../components/SafetyCheckIn';

const ServiceDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [proposedAmount, setProposedAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

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

  const fetchPayment = useCallback(async () => {
    try {
      const res = await api.get(`/payments/service/${id}`);
      if (res.data.data) setPayment(res.data.data);
    } catch {
      // No payment yet — that's fine
    }
  }, [id]);

  useEffect(() => {
    fetchService();
    fetchPayment();
  }, [fetchService, fetchPayment]);

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

  const handleInitiatePayment = async () => {
    try {
      setInitiatingPayment(true);
      const res = await api.post('/payments/initiate', { serviceId: id });
      setPayment(res.data.data.payment);
      // Redirect to PayFast
      window.location.href = res.data.data.paymentUrl;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setInitiatingPayment(false);
    }
  };

const currentUserId = localStorage.getItem('userId');
const isRequester = service?.requesterId?._id === currentUserId;
const hasApplied = offers.some(o => o.helperId?._id === currentUserId);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!service) return <div className="alert alert-warning">Service not found</div>;

  return (
    <div>
      <div className="cl-page-header">
        <h2>{service.title}</h2>
      </div>
      <div className="row">
        <div className="col-md-8">
          <div className="cl-card mb-4">
              <p style={{ color: 'var(--cl-gray-600)' }}>{service.description}</p>
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
          <div className="card mb-3">
            <div className="card-body">
              <h5>Quick Actions</h5>
              <Link to="/dashboard" className="btn btn-outline-secondary w-100 mb-2">Back to Dashboard</Link>
              {isRequester && service.status === 'open' && (
                <p className="text-muted small">You will see offers below when helpers apply.</p>
              )}
            </div>
          </div>

          {/* Safety Check-In/Out */}
          {service.helperId && <SafetyCheckIn service={service} onUpdate={fetchService} />}

          {/* Payment Section */}
          {service.helperId && service.paymentAmount > 0 && (
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0"><i className="fas fa-credit-card me-2"></i>Payment</h6>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Amount:</span>
                  <strong>R{service.paymentAmount.toFixed(2)}</strong>
                </div>

                {!payment && isRequester && (
                  <button
                    className="btn btn-success w-100"
                    onClick={handleInitiatePayment}
                    disabled={initiatingPayment}
                  >
                    {initiatingPayment ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                    ) : (
                      <><i className="fas fa-lock me-2"></i>Pay Now (Escrow)</>
                    )}
                  </button>
                )}

                {payment && (
                  <div>
                    <span className={`badge ${
                      payment.status === 'escrowed' ? 'bg-info' :
                      payment.status === 'released' ? 'bg-success' :
                      payment.status === 'refunded' ? 'bg-warning' :
                      payment.status === 'failed' ? 'bg-danger' : 'bg-secondary'
                    } w-100 py-2`}>
                      {payment.status === 'escrowed' && <><i className="fas fa-shield-alt me-1"></i>Funds in Escrow</>}
                      {payment.status === 'released' && <><i className="fas fa-check-circle me-1"></i>Payment Released</>}
                      {payment.status === 'refunded' && <><i className="fas fa-undo me-1"></i>Refunded</>}
                      {payment.status === 'pending' && <><i className="fas fa-clock me-1"></i>Payment Pending</>}
                      {payment.status === 'failed' && <><i className="fas fa-times-circle me-1"></i>Payment Failed</>}
                    </span>
                    {payment.status === 'escrowed' && (
                      <small className="text-muted d-block mt-2">
                        Funds held securely until service is completed.
                      </small>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating Form — visible when service is completed */}
          {service.status === 'completed' && service.helper && !isRequester && (
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0"><i className="fas fa-star me-2"></i>Rate the Requester</h6>
              </div>
              <div className="card-body">
                <RatingForm
                  serviceId={service._id}
                  ratedId={service.requesterId?._id}
                  onRated={fetchService}
                />
              </div>
            </div>
          )}
          {service.status === 'completed' && service.helper && isRequester && (
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0"><i className="fas fa-star me-2"></i>Rate the Helper</h6>
              </div>
              <div className="card-body">
                <RatingForm
                  serviceId={service._id}
                  ratedId={service.helper?._id}
                  onRated={fetchService}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;