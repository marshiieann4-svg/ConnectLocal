import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ProfileCompletionWidget = ({ userId = null, compact = false }) => {
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletion();
  }, [userId]);

  const fetchCompletion = async () => {
    try {
      setLoading(true);
      // Get current user's profile completion
      const res = await api.get('/users/profile/completion');
      setCompletion(res.data);
    } catch (error) {
      console.error('Failed to fetch profile completion', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !completion) {
    return null;
  }

  const { percentage, checklist, nextSteps } = completion;

  const getProgressColor = (percent) => {
    if (percent >= 80) return 'success';
    if (percent >= 60) return 'info';
    if (percent >= 40) return 'warning';
    return 'danger';
  };

  const getProgressIcon = (percent) => {
    if (percent >= 80) return 'fas fa-check-circle';
    if (percent >= 60) return 'fas fa-star-half-alt';
    if (percent >= 40) return 'fas fa-exclamation-circle';
    return 'fas fa-do-not-enter';
  };

  if (compact) {
    return (
      <div className="card border-0 shadow-sm mb-3 bg-light">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-0 fw-bold">Profile Completeness</h6>
              <small className="text-muted">{percentage}% complete</small>
            </div>
            <div>
              <div className="progress" style={{ width: '80px', height: '8px' }}>
                <div
                  className={`progress-bar bg-${getProgressColor(percentage)}`}
                  role="progressbar"
                  style={{ width: `${percentage}%` }}
                  aria-valuenow={percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0">
        <h5 className="mb-0">
          <i className={`${getProgressIcon(percentage)} me-2 text-${getProgressColor(percentage)}`}></i>
          Profile Completeness
        </h5>
      </div>
      <div className="card-body">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold">{percentage}% Complete</span>
            <small className="text-muted">
              {percentage >= 80 ? '✓ Profile looks great!' : `${100 - percentage} % to go`}
            </small>
          </div>
          <div className="progress" style={{ height: '24px' }}>
            <div
              className={`progress-bar bg-${getProgressColor(percentage)} d-flex align-items-center justify-content-center text-white fw-bold`}
              role="progressbar"
              style={{ width: `${percentage}%` }}
              aria-valuenow={percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {percentage > 10 && `${percentage}%`}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <h6 className="fw-bold mb-3">Profile Checklist</h6>
        <div className="checklist">
          {Object.entries(checklist).map(([field, completed]) => {
            const labels = {
              name: 'Full Name',
              phone: 'Phone Number',
              email: 'Email Address',
              ward: 'Ward/Location',
              profilePicture: 'Profile Picture',
              bio: 'Bio/Description',
              verificationLevel: 'Verification',
              idVerified: 'ID Verification',
              skills: 'Skills',
              servicesOffered: 'Services Offered',
              languages: 'Languages',
              experience: 'Work Experience',
              backgroundCheckStatus: 'Background Check'
            };

            return (
              <div key={field} className="d-flex align-items-center mb-2">
                <div className={`me-2 ${completed ? 'text-success' : 'text-muted'}`}>
                  {completed ? (
                    <i className="fas fa-check-circle"></i>
                  ) : (
                    <i className="fas fa-circle"></i>
                  )}
                </div>
                <span className={completed ? 'text-dark' : 'text-muted'}>
                  {labels[field] || field}
                </span>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        {nextSteps && nextSteps.length > 0 && (
          <div className="mt-4 pt-3 border-top">
            <h6 className="fw-bold mb-3">
              <i className="fas fa-lightbulb me-2 text-warning"></i>Next Steps
            </h6>
            <ul className="list-unstyled">
              {nextSteps.map((step, idx) => (
                <li key={idx} className="mb-2">
                  <i className="fas fa-arrow-right me-2 text-primary"></i>
                  {step}
                </li>
              ))}
            </ul>
            <button className="btn btn-sm btn-primary mt-2">
              <i className="fas fa-edit me-2"></i>
              Complete Profile
            </button>
          </div>
        )}

        {/* Success Message */}
        {percentage === 100 && (
          <div className="alert alert-success mt-4 mb-0">
            <i className="fas fa-trophy me-2"></i>
            <strong>Excellent!</strong> Your profile is complete and ready to go!
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletionWidget;
