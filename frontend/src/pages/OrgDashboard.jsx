import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const OrgDashboard = () => {
  const [clients, setClients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, assignmentsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/assignments')
        ]);
        setClients(clientsRes.data.data);
        setAssignments(assignmentsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Organization Dashboard</h1>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card text-white bg-primary">
            <div className="card-body text-center">
              <h3>{clients.length}</h3>
              <p className="mb-0">Total Clients</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-white bg-success">
            <div className="card-body text-center">
              <h3>{assignments.filter(a => a.status === 'active').length}</h3>
              <p className="mb-0">Active Assignments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <h2>Clients</h2>
        <Link to="/clients/new" className="btn btn-primary">Add New Client</Link>
      </div>

      {clients.length === 0 ? (
        <div className="alert alert-info">No clients yet. Add your first client.</div>
      ) : (
        <div className="row">
          {clients.slice(0, 5).map(client => (
            <div key={client._id} className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{client.name}</h5>
                  <p className="card-text">
                    <strong>Ward:</strong> {client.ward}<br />
                    <strong>Phone:</strong> {client.phone || 'N/A'}<br />
                    <strong>Active:</strong> {client.isActive ? 'Yes' : 'No'}
                  </p>
                  <Link to={`/clients/${client._id}`} className="btn btn-sm btn-outline-primary">View Details</Link>
                </div>
              </div>
            </div>
          ))}
          {clients.length > 5 && (
            <div className="text-center">
              <Link to="/clients">View All Clients</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrgDashboard;