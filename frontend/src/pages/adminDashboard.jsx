import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getDefaultRouteForUser, isAdminUser } from '../utils/auth';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminName, setAdminName] = useState('Admin');

  const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`).replace(/\/api\/?$/, '');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get('/auth/me');
      const me = meRes.data?.user || {};

      if (!isAdminUser(me)) {
        navigate(getDefaultRouteForUser(me), { replace: true });
        return;
      }

      setAdminName(me.name || 'Admin');

      const docsRes = await api.get('/admin/documents/pending');
      const pendingDocs = Array.isArray(docsRes.data?.data)
        ? docsRes.data.data
        : Array.isArray(docsRes.data?.documents)
          ? docsRes.data.documents
          : [];

      setDocuments(pendingDocs);
      setError('');
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        window.dispatchEvent(new Event('auth-changed'));
        navigate('/login', { replace: true });
        return;
      }

      const message = error.response?.data?.message || 'Failed to fetch pending documents.';
      setError(message);
      console.error('Failed to fetch pending documents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/documents/${id}/verify`);
      setDocuments((prev) => prev.filter(doc => doc._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Verification failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/documents/${id}/reject`);
      setDocuments((prev) => prev.filter(doc => doc._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Rejection failed');
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="mb-0">Admin Panel</h2>
        <span className="badge bg-dark-subtle text-dark border">Signed in as {adminName}</span>
      </div>

      <p className="text-muted">Pending verification queue: {documents.length}</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {documents.length === 0 ? (
        <div className="alert alert-info">No pending documents.</div>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>User</th>
              <th>Document Type</th>
              <th>File</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc._id}>
                <td>{doc.userId?.name} ({doc.userId?.phone})</td>
                <td>{doc.documentType}</td>
                <td>
                  <a href={`${backendBaseUrl}${doc.documentUrl}`} target="_blank" rel="noreferrer">View</a>
                </td>
                <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-success btn-sm me-2" onClick={() => handleVerify(doc._id)}>Verify</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReject(doc._id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;