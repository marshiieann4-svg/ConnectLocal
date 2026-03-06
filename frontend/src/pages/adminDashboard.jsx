import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDocs();
  }, []);

  const fetchPendingDocs = async () => {
    try {
      const res = await api.get('/admin/documents/pending');
      setDocuments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch pending documents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/documents/${id}/verify`);
      // remove from list or refresh
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch {
      alert('Verification failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/documents/${id}/reject`);
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch {
      alert('Rejection failed');
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard – Pending Verifications</h2>
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
                  <a href={`http://localhost:5000${doc.documentUrl}`} target="_blank" rel="noreferrer">View</a>
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