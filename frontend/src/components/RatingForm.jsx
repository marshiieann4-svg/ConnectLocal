import React, { useState } from 'react';
import api from '../services/api';

const StarInput = ({ label, value, onChange }) => (
  <div className="mb-3">
    <label className="form-label fw-bold">{label}</label>
    <div className="d-flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="btn btn-link p-0 fs-4"
          onClick={() => onChange(star)}
          style={{ color: star <= value ? '#ffc107' : '#dee2e6', textDecoration: 'none' }}
        >
          ★
        </button>
      ))}
      <span className="ms-2 align-self-center text-muted small">{value}/5</span>
    </div>
  </div>
);

const RatingForm = ({ serviceId, ratedId, onRated }) => {
  const [communication, setCommunication] = useState(0);
  const [reliability, setReliability] = useState(0);
  const [quality, setQuality] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!communication || !reliability || !quality) {
      setError('Please rate all three categories.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const raterId = localStorage.getItem('userId');
      await api.post('/ratings', {
        serviceId,
        raterId,
        ratedId,
        communication,
        reliability,
        quality,
        comment: comment.trim(),
        isPublic: true
      });
      setSubmitted(true);
      if (onRated) onRated();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit rating';
      if (msg.includes('duplicate') || msg.includes('E11000')) {
        setError('You have already rated this service.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="alert alert-success">
        <i className="fas fa-check-circle me-2"></i>
        Thank you for your rating!
      </div>
    );
  }

  const overall = communication && reliability && quality
    ? ((communication + reliability + quality) / 3).toFixed(1)
    : null;

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <StarInput label="Communication" value={communication} onChange={setCommunication} />
      <StarInput label="Reliability" value={reliability} onChange={setReliability} />
      <StarInput label="Quality of Work" value={quality} onChange={setQuality} />

      {overall && (
        <div className="mb-3 p-2 bg-light rounded">
          <strong>Overall:</strong> {overall}/5 ⭐
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-bold">Comment (optional)</label>
        <textarea
          className="form-control"
          rows="3"
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
        />
        <small className="text-muted">{comment.length}/500</small>
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Submitting...
          </>
        ) : (
          <>
            <i className="fas fa-star me-2"></i>
            Submit Rating
          </>
        )}
      </button>
    </form>
  );
};

export default RatingForm;
