import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.ward?.toLowerCase().includes(search.toLowerCase()) ||
      client.phone?.includes(search)
    );
    setFiltered(filtered);
  }, [search, clients]);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data);
      setFiltered(res.data.data);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await api.delete(`/clients/${id}`);
      setClients(clients.filter(c => c._id !== id));
    } catch {
      alert('Failed to delete client');
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Clients</h1>
        <Link to="/clients/new" className="btn btn-primary">+ Add New Client</Link>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, ward, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-6 text-end">
          <span className="text-muted">{filtered.length} client(s)</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="alert alert-info">No clients found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Ward</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => (
                <tr key={client._id}>
                  <td>{client.name}</td>
                  <td>{client.phone || '—'}</td>
                  <td>{client.ward}</td>
                  <td>
                    <span className={`badge ${client.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/clients/${client._id}`} className="btn btn-sm btn-outline-primary me-2">View</Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(client._id)}>Delete</button>
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

export default Clients;