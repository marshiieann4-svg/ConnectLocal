import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;

const SafetyCheckIn = ({ service, onUpdate }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const socket = useSocket();

  const currentUserId = localStorage.getItem('userId');
  const isHelper = service.helperId?._id === currentUserId || service.helperId === currentUserId;
  const isRequester = service.requesterId?._id === currentUserId || service.requesterId === currentUserId;

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get(`/safety/service/${service._id}`);
      setLogs(res.data.data || []);
    } catch {
      // No logs yet
    } finally {
      setLoading(false);
    }
  }, [service._id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Listen for real-time safety events
  useEffect(() => {
    if (!socket) return;

    const handleCheckIn = (data) => {
      if (data.serviceId === service._id) {
        setNotification({ type: 'checkin', ...data });
        fetchLogs();
      }
    };
    const handleCheckOut = (data) => {
      if (data.serviceId === service._id) {
        setNotification({ type: 'checkout', ...data });
        fetchLogs();
      }
    };
    const handleConfirmed = (data) => {
      if (data.serviceId === service._id) {
        setNotification({ type: 'confirmed', ...data });
        fetchLogs();
      }
    };
    const handleDisputed = (data) => {
      if (data.serviceId === service._id) {
        setNotification({ type: 'disputed', ...data });
        fetchLogs();
      }
    };

    socket.on('safetyCheckIn', handleCheckIn);
    socket.on('safetyCheckOut', handleCheckOut);
    socket.on('checkInConfirmed', handleConfirmed);
    socket.on('checkInDisputed', handleDisputed);

    return () => {
      socket.off('safetyCheckIn', handleCheckIn);
      socket.off('safetyCheckOut', handleCheckOut);
      socket.off('checkInConfirmed', handleConfirmed);
      socket.off('checkInDisputed', handleDisputed);
    };
  }, [socket, service._id, fetchLogs]);

  // Auto-dismiss notifications after 8s
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 8000);
    return () => clearTimeout(t);
  }, [notification]);

  const startCamera = async () => {
    setCameraOpen(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Could not access camera. Please allow camera permissions.');
      setCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setCapturedPhoto(blob);
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const handleCheckIn = async () => {
    if (!capturedPhoto) {
      alert('Please take a selfie before checking in.');
      return;
    }
    setCheckingIn(true);
    try {
      const loc = await getLocation();
      const formData = new FormData();
      formData.append('selfie', capturedPhoto, 'checkin-selfie.jpg');
      if (loc) {
        formData.append('latitude', loc.latitude);
        formData.append('longitude', loc.longitude);
      }
      if (notes) formData.append('notes', notes);

      await api.post(`/safety/service-checkin/${service._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCapturedPhoto(null);
      setNotes('');
      fetchLogs();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (logId) => {
    setCheckingOut(true);
    try {
      const loc = await getLocation();
      const formData = new FormData();
      if (capturedPhoto) {
        formData.append('selfie', capturedPhoto, 'checkout-selfie.jpg');
      }
      if (loc) {
        formData.append('latitude', loc.latitude);
        formData.append('longitude', loc.longitude);
      }

      await api.put(`/safety/service-checkout/${logId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCapturedPhoto(null);
      fetchLogs();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleConfirm = async (logId) => {
    try {
      await api.put(`/safety/confirm/${logId}`);
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Confirmation failed');
    }
  };

  const handleDispute = async (logId) => {
    const reason = prompt('Please provide a reason for disputing:');
    if (reason === null) return;
    try {
      await api.put(`/safety/dispute/${logId}`, { reason });
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Dispute failed');
    }
  };

  const activeLog = logs.find(l => ['checked_in', 'confirmed'].includes(l.status));
  const canCheckIn = isHelper && !activeLog && ['assigned', 'in_progress'].includes(service.status);
  const canCheckOut = isHelper && !!activeLog;

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  };

  const statusColor = (status) => {
    const map = {
      checked_in: '#f59e0b',
      confirmed: '#10b981',
      checked_out: '#64748b',
      completed: '#10b981',
      disputed: '#ef4444',
      missed: '#ef4444'
    };
    return map[status] || '#64748b';
  };

  const statusLabel = (status) => {
    const map = {
      checked_in: 'Awaiting Confirmation',
      confirmed: 'Confirmed',
      checked_out: 'Checked Out',
      completed: 'Completed',
      disputed: 'Disputed',
      missed: 'Missed'
    };
    return map[status] || status;
  };

  if (loading) return <div className="cl-spinner"></div>;

  // Don't show if service is open or cancelled
  if (!['assigned', 'in_progress', 'completed'].includes(service.status)) return null;

  return (
    <div className="cl-card mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="mb-0" style={{ fontWeight: 700 }}>
          <i className="fas fa-shield-alt me-2" style={{ color: 'var(--cl-blue)' }}></i>
          Safety Check-In
        </h6>
        {activeLog && (
          <span className="cl-badge" style={{ background: statusColor(activeLog.status) + '20', color: statusColor(activeLog.status) }}>
            {statusLabel(activeLog.status)}
          </span>
        )}
      </div>

      {/* Real-time notification banner */}
      {notification && (
        <div className="alert mb-3 cl-animate-in" style={{
          borderRadius: 'var(--cl-radius)',
          padding: '0.75rem 1rem',
          background: notification.type === 'checkin' ? '#fef3c7' :
                      notification.type === 'confirmed' ? '#d1fae5' :
                      notification.type === 'disputed' ? '#fee2e2' : '#e8f0fe',
          border: 'none',
          fontSize: '0.9rem'
        }}>
          <i className={`fas ${
            notification.type === 'checkin' ? 'fa-camera' :
            notification.type === 'confirmed' ? 'fa-check-circle' :
            notification.type === 'disputed' ? 'fa-exclamation-triangle' : 'fa-sign-out-alt'
          } me-2`}></i>
          {notification.message}
          <button className="btn-close btn-close-sm float-end" onClick={() => setNotification(null)}></button>
        </div>
      )}

      {/* Helper: Check-in flow */}
      {canCheckIn && (
        <div>
          <p style={{ color: 'var(--cl-gray-500)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Take a selfie to check in. The requester will be notified to confirm your arrival.
          </p>

          {/* Camera / Photo area */}
          {!capturedPhoto && !cameraOpen && (
            <button className="btn btn-cl-primary w-100 mb-3" onClick={startCamera}>
              <i className="fas fa-camera me-2"></i>Open Camera for Selfie
            </button>
          )}

          {cameraOpen && (
            <div className="text-center mb-3">
              <div style={{
                borderRadius: 'var(--cl-radius-lg)',
                overflow: 'hidden',
                display: 'inline-block',
                border: '3px solid var(--cl-blue)',
                position: 'relative'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', maxWidth: '320px', display: 'block' }}
                />
              </div>
              <div className="d-flex gap-2 justify-content-center mt-2">
                <button className="btn btn-cl-primary" onClick={capturePhoto}>
                  <i className="fas fa-camera me-2"></i>Capture
                </button>
                <button className="btn btn-cl-outline" onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          )}

          {capturedPhoto && (
            <div className="text-center mb-3">
              <div style={{
                borderRadius: 'var(--cl-radius-lg)',
                overflow: 'hidden',
                display: 'inline-block',
                border: '3px solid var(--cl-success)'
              }}>
                <img
                  src={URL.createObjectURL(capturedPhoto)}
                  alt="Selfie preview"
                  style={{ width: '100%', maxWidth: '320px', display: 'block' }}
                />
              </div>
              <div className="mt-2">
                <button className="btn btn-cl-ghost btn-sm" onClick={retakePhoto}>
                  <i className="fas fa-redo me-1"></i>Retake
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="mb-3">
            <input
              type="text"
              className="cl-input"
              placeholder="Any notes? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            className="btn btn-cl-primary w-100"
            onClick={handleCheckIn}
            disabled={checkingIn || !capturedPhoto}
          >
            {checkingIn ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Checking In...</>
            ) : (
              <><i className="fas fa-sign-in-alt me-2"></i>Check In</>
            )}
          </button>
        </div>
      )}

      {/* Helper: Check-out button */}
      {canCheckOut && (
        <div>
          <div className="alert" style={{
            background: '#d1fae5',
            borderRadius: 'var(--cl-radius)',
            border: 'none',
            padding: '0.75rem 1rem',
            fontSize: '0.9rem'
          }}>
            <i className="fas fa-check-circle me-2" style={{ color: '#10b981' }}></i>
            You are currently checked in
            {activeLog.requesterConfirmed && <strong> (Confirmed by requester)</strong>}
          </div>

          {!capturedPhoto && !cameraOpen && (
            <button className="btn btn-cl-outline w-100 mb-2" onClick={startCamera}>
              <i className="fas fa-camera me-2"></i>Take Check-Out Selfie (optional)
            </button>
          )}

          {cameraOpen && (
            <div className="text-center mb-3">
              <div style={{
                borderRadius: 'var(--cl-radius-lg)',
                overflow: 'hidden',
                display: 'inline-block',
                border: '3px solid var(--cl-blue)'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', maxWidth: '320px', display: 'block' }}
                />
              </div>
              <div className="d-flex gap-2 justify-content-center mt-2">
                <button className="btn btn-cl-primary" onClick={capturePhoto}>
                  <i className="fas fa-camera me-2"></i>Capture
                </button>
                <button className="btn btn-cl-outline" onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          )}

          {capturedPhoto && (
            <div className="text-center mb-3">
              <div style={{
                borderRadius: 'var(--cl-radius-lg)',
                overflow: 'hidden',
                display: 'inline-block',
                border: '3px solid var(--cl-success)'
              }}>
                <img
                  src={URL.createObjectURL(capturedPhoto)}
                  alt="Selfie preview"
                  style={{ width: '100%', maxWidth: '320px', display: 'block' }}
                />
              </div>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <button
            className="btn btn-cl-primary w-100"
            onClick={() => handleCheckOut(activeLog._id)}
            disabled={checkingOut}
            style={{ background: 'var(--cl-gray-700)' }}
          >
            {checkingOut ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Checking Out...</>
            ) : (
              <><i className="fas fa-sign-out-alt me-2"></i>Check Out</>
            )}
          </button>
        </div>
      )}

      {/* Requester: Confirmation panel for pending check-ins */}
      {isRequester && logs.filter(l => l.status === 'checked_in').map(log => (
        <div key={log._id} className="cl-animate-in" style={{
          border: '2px solid #f59e0b',
          borderRadius: 'var(--cl-radius)',
          padding: '1rem',
          marginBottom: '1rem',
          background: '#fffbeb'
        }}>
          <h6 style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.75rem' }}>
            <i className="fas fa-exclamation-circle me-2"></i>
            Helper Check-In Pending Confirmation
          </h6>
          <p style={{ fontSize: '0.9rem', color: '#78350f', marginBottom: '0.5rem' }}>
            <strong>{log.helperId?.name}</strong> checked in at {formatTime(log.checkInTime)}
          </p>
          {log.checkInPhoto && (
            <div className="text-center mb-3">
              <img
                src={`${API_BASE}/uploads/${log.checkInPhoto}`}
                alt="Helper selfie"
                style={{
                  width: '100%',
                  maxWidth: '240px',
                  borderRadius: 'var(--cl-radius)',
                  border: '2px solid #fbbf24'
                }}
              />
              <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '0.25rem' }}>
                Helper's check-in selfie
              </div>
            </div>
          )}
          {log.notes && (
            <p style={{ fontSize: '0.85rem', color: '#78350f' }}>
              <i className="fas fa-sticky-note me-1"></i> {log.notes}
            </p>
          )}
          <div className="d-flex gap-2">
            <button className="btn btn-cl-primary flex-grow-1" onClick={() => handleConfirm(log._id)}>
              <i className="fas fa-check me-2"></i>Confirm
            </button>
            <button className="btn btn-cl-outline flex-grow-1" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDispute(log._id)}>
              <i className="fas fa-times me-2"></i>Dispute
            </button>
          </div>
        </div>
      ))}

      {/* History */}
      {logs.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h6 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--cl-gray-700)', marginBottom: '0.75rem' }}>
            Check-In History
          </h6>
          {logs.map(log => (
            <div key={log._id} style={{
              padding: '0.75rem',
              borderRadius: 'var(--cl-radius-sm)',
              background: 'var(--cl-gray-50)',
              marginBottom: '0.5rem',
              fontSize: '0.85rem',
              border: '1px solid var(--cl-gray-100)'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{log.helperId?.name || 'Helper'}</strong>
                  <span className="ms-2" style={{ color: statusColor(log.status), fontWeight: 600, fontSize: '0.8rem' }}>
                    {statusLabel(log.status)}
                  </span>
                </div>
                {log.checkInPhoto && (
                  <img
                    src={`${API_BASE}/uploads/${log.checkInPhoto}`}
                    alt="selfie"
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ color: 'var(--cl-gray-500)', marginTop: '0.25rem' }}>
                <i className="fas fa-sign-in-alt me-1"></i>{formatTime(log.checkInTime)}
                {log.checkOutTime && (
                  <span className="ms-3"><i className="fas fa-sign-out-alt me-1"></i>{formatTime(log.checkOutTime)}</span>
                )}
              </div>
              {log.requesterConfirmed && (
                <div style={{ color: '#10b981', marginTop: '0.25rem' }}>
                  <i className="fas fa-check-circle me-1"></i>Confirmed at {formatTime(log.requesterConfirmedAt)}
                </div>
              )}
              {log.requesterDisputed && (
                <div style={{ color: '#ef4444', marginTop: '0.25rem' }}>
                  <i className="fas fa-exclamation-triangle me-1"></i>Disputed: {log.disputeReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No activity yet message */}
      {!canCheckIn && !canCheckOut && logs.length === 0 && (
        <p style={{ color: 'var(--cl-gray-500)', fontSize: '0.9rem', textAlign: 'center' }}>
          No check-in activity yet.
        </p>
      )}
    </div>
  );
};

export default SafetyCheckIn;
