import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [helpers, setHelpers] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    helperId: '',
    serviceType: '',
    schedule: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      setClient(res.data.data);
      // Fetch assignments for this client (if you have an endpoint)
      // For now, we'll rely on the assignments list page
    } catch (error) {
      console.error('Failed to fetch client', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchHelpers = useCallback(async () => {
    try {
      const res = await api.get('/users/helpers');
      setHelpers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch helpers', error);
    }
  }, []);

  useEffect(() => {
    fetchClient();
    fetchHelpers();
  }, [fetchClient, fetchHelpers]);

  const handleAssignmentChange = (e) => {
    setNewAssignment({ ...newAssignment, [e.target.name]: e.target.value });
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        ...newAssignment,
        clientId: id
      });
      alert('Assignment created');
      setShowAssignmentForm(false);
      setNewAssignment({ helperId: '', serviceType: '', schedule: '', notes: '' });
      // Optionally refresh assignments list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!client) return <div className="alert alert-danger">Client not found</div>;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4>Client Details</h4>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>Back</button>
            </div>
            <div className="card-body">
              <h5>{client.name}</h5>
              <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
              <p><strong>Address:</strong> {client.address || 'N/A'}</p>
              <p><strong>Ward:</strong> {client.ward}</p>
              <p><strong>Date of Birth:</strong> {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Gender:</strong> {client.gender || 'N/A'}</p>
              <p><strong>Emergency Contact:</strong></p>
              {client.emergencyContact?.name && (
                <ul>
                  <li>Name: {client.emergencyContact.name}</li>
                  <li>Phone: {client.emergencyContact.phone}</li>
                  <li>Relationship: {client.emergencyContact.relationship}</li>
                </ul>
              )}
              <p><strong>Care Notes:</strong> {client.careNotes || 'None'}</p>
              <p><strong>Status:</strong> <span className={`badge ${client.isActive ? 'bg-success' : 'bg-secondary'}`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span></p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>Assignments</h5>
              <button className="btn btn-sm btn-primary" onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
                {showAssignmentForm ? 'Cancel' : 'New Assignment'}
              </button>
            </div>
            <div className="card-body">
              {showAssignmentForm && (
                <form onSubmit={createAssignment} className="mb-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label>Helper</label>
                      <select
                        className="form-select"
                        name="helperId"
                        value={newAssignment.helperId}
                        onChange={handleAssignmentChange}
                        required
                      >
                        <option value="">Select helper</option>
                        {helpers.map(h => (
                          <option key={h._id} value={h._id}>
                            {h.name} {h.averageRating > 0 ? `(⭐ ${h.averageRating.toFixed(1)})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label>Service Type</label>
                      <input
                        type="text"
                        className="form-control"
                        name="serviceType"
                        value={newAssignment.serviceType}
                        onChange={handleAssignmentChange}
                        placeholder="e.g., elderly care, check-in"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label>Schedule</label>
                      <input
                        type="text"
                        className="form-control"
                        name="schedule"
                        value={newAssignment.schedule}
                        onChange={handleAssignmentChange}
                        placeholder="e.g., daily, weekly"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label>Notes (optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="notes"
                        value={newAssignment.notes}
                        onChange={handleAssignmentChange}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success">Create Assignment</button>
                </form>
              )}

              <p>View all assignments for this client on the <Link to="/assignments">Assignments page</Link>.</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5>Quick Actions</h5>
              <button className="btn btn-outline-primary w-100 mb-2" onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
                Assign Helper
              </button>
              <button className="btn btn-outline-secondary w-100" onClick={() => navigate(-1)}>Back to List</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;