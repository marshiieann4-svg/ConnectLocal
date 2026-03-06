import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const AssignmentDetail = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [safetyLogs, setSafetyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        () => {
          setError('Unable to get your location. Please enable GPS.');
        }
      );
    } else {
      setError('Geolocation not supported by your browser.');
    }
  }, []);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await api.get(`/assignments/${id}`); // need to add this endpoint!
      setAssignment(res.data.data);
    } catch {
      setError('Assignment not found');
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
      await api.post(`/safety/checkin/${id}`, {
        ...location,
        notes
      });
      alert('Checked in successfully!');
      fetchSafetyLogs();
      setNotes('');
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async (logId) => {
    if (!location) {
      alert('Waiting for location...');
      return;
    }
    try {
      await api.put(`/safety/checkout/${logId}`, location);
      alert('Checked out successfully!');
      fetchSafetyLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  const activeLog = safetyLogs.find(log => log.status === 'checked_in');

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>Assignment Details</h2>
      {assignment && (
        <div className="card mb-4">
          <div className="card-body">
            <h5>Client: {assignment.clientId?.name}</h5>
            <p>Service Type: {assignment.serviceType}</p>
            <p>Schedule: {assignment.schedule}</p>
            <p>Status: <span className="badge bg-success">{assignment.status}</span></p>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header">
          <h5>Safety Check-In / Check-Out</h5>
        </div>
        <div className="card-body">
          {location ? (
            <p className="text-success">📍 Location ready</p>
          ) : (
            <p className="text-warning">⏳ Acquiring location...</p>
          )}
          {!activeLog ? (
            <>
              <div className="mb-3">
                <label>Notes (optional)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
              <button className="btn btn-primary" onClick={handleCheckIn} disabled={!location}>
                Check In
              </button>
            </>
          ) : (
            <div>
              <p>Checked in at: {new Date(activeLog.checkInTime).toLocaleString()}</p>
              <button className="btn btn-warning" onClick={() => handleCheckOut(activeLog._id)} disabled={!location}>
                Check Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5>Previous Logs</h5>
        </div>
        <div className="card-body">
          {safetyLogs.length === 0 ? (
            <p>No logs yet.</p>
          ) : (
            <ul className="list-group">
              {safetyLogs.map(log => (
                <li key={log._id} className="list-group-item">
                  <strong>{log.status === 'checked_in' ? 'Checked In' : 'Checked Out'}</strong> at{' '}
                  {log.status === 'checked_in'
                    ? new Date(log.checkInTime).toLocaleString()
                    : new Date(log.checkOutTime).toLocaleString()}
                  {log.notes && <p className="mb-0 text-muted">Note: {log.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;