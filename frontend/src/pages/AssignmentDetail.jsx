import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [safetyLogs, setSafetyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          setError('Unable to get your location. Please enable GPS.');
          console.error('Geolocation error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation not supported by your browser.');
    }
  }, []);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await api.get(`/assignments/${id}`);
      setAssignment(res.data.data);
    } catch (err) {
      setError('Assignment not found');
      console.error('Failed to fetch assignment:', err);
    }
  }, [id]);

  const fetchSafetyLogs = useCallback(async () => {
    try {
      const res = await api.get(`/safety/history/${id}`);
      setSafetyLogs(res.data.data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignment();
    fetchSafetyLogs();
    getLocation();
  }, [fetchAssignment, fetchSafetyLogs, getLocation]);

  const handleCheckIn = async () => {
    if (!location) {
      alert('Waiting for location...');
      return;
    }
    try {
      setCheckingIn(true);
      await api.post(`/safety/checkin/${id}`, {
        ...location,
        notes
      });
      alert('✅ Checked in successfully!');
      fetchSafetyLogs();
      setNotes('');
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (logId) => {
    if (!location) {
      alert('Waiting for location...');
      return;
    }
    try {
      setCheckingOut(true);
      await api.put(`/safety/checkout/${logId}`, location);
      alert('✅ Checked out successfully!');
      fetchSafetyLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const activeLog = safetyLogs.find(log => log.status === 'checked_in');

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-success',
      paused: 'bg-warning',
      completed: 'bg-secondary',
      cancelled: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  const getLogStatusBadge = (status) => {
    const badges = {
      checked_in: 'bg-primary',
      checked_out: 'bg-success',
      missed: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-outline-dark" onClick={() => navigate('/assignments')}>
          <i className="fas fa-arrow-left me-2"></i>Back to Assignments
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <button className="btn btn-outline-dark mb-3" onClick={() => navigate('/assignments')}>
        <i className="fas fa-arrow-left me-2"></i>Back
      </button>

      {/* Assignment Info Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">
            <i className="fas fa-briefcase me-2"></i>
            Assignment Details
          </h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <h6 className="text-muted">Client</h6>
              <p className="mb-0 fw-bold">{assignment?.clientId?.name || 'N/A'}</p>
              <small className="text-muted">{assignment?.clientId?.phone}</small>
            </div>
            <div className="col-md-6 mb-3">
              <h6 className="text-muted">Helper</h6>
              <p className="mb-0 fw-bold">{assignment?.helperId?.name || 'N/A'}</p>
              <small className="text-muted">{assignment?.helperId?.phone}</small>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <h6 className="text-muted">Status</h6>
              <span className={`badge ${getStatusBadge(assignment?.status)}`}>
                {assignment?.status?.toUpperCase()}
              </span>
            </div>
            <div className="col-md-4 mb-3">
              <h6 className="text-muted">Start Date</h6>
              <p className="mb-0">{new Date(assignment?.startDate).toLocaleDateString()}</p>
            </div>
            <div className="col-md-4 mb-3">
              <h6 className="text-muted">Expected Hours/Day</h6>
              <p className="mb-0">{assignment?.hoursPerWeek || 0} hrs</p>
            </div>
          </div>
          {assignment?.notes && (
            <div className="mt-3">
              <h6 className="text-muted">Notes</h6>
              <p className="mb-0">{assignment.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* GPS Status Card */}
      {location ? (
        <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
          <i className="fas fa-map-marker-alt me-2"></i>
          <div>
            <strong>GPS Enabled</strong>
            <br />
            <small>
              Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
              {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
            </small>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4" role="alert">
          <div>
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>GPS Unavailable</strong>
            <br />
            <small>Location is required for check-in/out. Please enable GPS in your browser settings and try again.</small>
          </div>
          <button className="btn btn-sm btn-outline-warning ms-3" onClick={getLocation}>
            <i className="fas fa-redo me-1"></i>Retry
          </button>
        </div>
      )}

      {/* Safety Check-in/out Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">
            <i className="fas fa-shield-alt me-2"></i>
            Safety Check-in / Check-out
          </h5>
        </div>
        <div className="card-body">
          {!activeLog ? (
            <div>
              <p>You are not currently checked in. Check in to start tracking your safety.</p>
              <textarea
                className="form-control mb-3"
                placeholder="Optional notes (e.g., arrived at client's home)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
              />
              <button
                className="btn btn-success"
                onClick={handleCheckIn}
                disabled={!location || checkingIn}
              >
                <i className={`fas ${checkingIn ? 'fa-spinner fa-spin' : 'fa-sign-in-alt'} me-2`}></i>
                {checkingIn ? 'Checking In...' : 'Check In'}
              </button>
            </div>
          ) : (
            <div>
              <div className="alert alert-info">
                <i className="fas fa-clock me-2"></i>
                <strong>Checked in at:</strong> {new Date(activeLog.checkInTime).toLocaleString()}
                {activeLog.notes && (
                  <div className="mt-2">
                    <strong>Notes:</strong> {activeLog.notes}
                  </div>
                )}
              </div>
              <button
                className="btn btn-danger"
                onClick={() => handleCheckOut(activeLog._id)}
                disabled={!location || checkingOut}
              >
                <i className={`fas ${checkingOut ? 'fa-spinner fa-spin' : 'fa-sign-out-alt'} me-2`}></i>
                {checkingOut ? 'Checking Out...' : 'Check Out'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Safety Log History */}
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">
            <i className="fas fa-history me-2"></i>
            Safety Log History
          </h5>
        </div>
        <div className="card-body">
          {safetyLogs.length === 0 ? (
            <p className="text-muted mb-0">No safety logs yet</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {safetyLogs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        {log.checkInTime
                          ? new Date(log.checkInTime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </td>
                      <td>
                        {log.checkOutTime
                          ? new Date(log.checkOutTime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td>
                        <span className={`badge ${getLogStatusBadge(log.status)}`}>
                          {log.status === 'missed' && <i className="fas fa-exclamation-triangle me-1"></i>}
                          {log.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <small>{log.notes || '-'}</small>
                      </td>
                      <td>
                        {log.checkInLocation?.coordinates && (
                          <a
                            href={`https://www.google.com/maps?q=${log.checkInLocation.coordinates[1]},${log.checkInLocation.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="fas fa-map-marked-alt me-1"></i>
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;