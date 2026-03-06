import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data.data);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/assignments/${id}`, { status: newStatus });
      setAssignments(assignments.map(a =>
        a._id === id ? { ...a, status: newStatus } : a
      ));
    } catch {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Assignments</h1>

      {assignments.length === 0 ? (
        <div className="alert alert-info">No assignments yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Client</th>
                <th>Helper</th>
                <th>Service Type</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a._id}>
                  <td>
                    <Link to={`/assignments/${a._id}`}>
                      {a.clientId?.name}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/profile/${a.helperId?._id}`}>
                      {a.helperId?.name}
                    </Link>
                  </td>
                  <td>{a.serviceType}</td>
                  <td>{a.schedule}</td>
                  <td>
                    <span className={`badge ${
                      a.status === 'active' ? 'bg-success' :
                      a.status === 'paused' ? 'bg-warning' :
                      'bg-secondary'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={a.status}
                      onChange={(e) => updateStatus(a._id, e.target.value)}
                      style={{ width: 'auto', display: 'inline-block' }}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Assignments;