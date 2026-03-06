import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AddClient = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    ward: '',
    dateOfBirth: '',
    gender: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    careNotes: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', form);
      navigate('/org-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Add New Client</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Full Name</label>
            <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label>Phone</label>
            <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="col-12 mb-3">
            <label>Address</label>
            <input type="text" className="form-control" name="address" value={form.address} onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-3">
            <label>Ward</label>
            <input type="text" className="form-control" name="ward" value={form.ward} onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label>Date of Birth</label>
            <input type="date" className="form-control" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-3">
            <label>Gender</label>
            <select className="form-control" name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <h5>Emergency Contact</h5>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label>Name</label>
            <input type="text" className="form-control" name="emergency.name" value={form.emergencyContact.name} onChange={handleChange} />
          </div>
          <div className="col-md-4 mb-3">
            <label>Phone</label>
            <input type="text" className="form-control" name="emergency.phone" value={form.emergencyContact.phone} onChange={handleChange} />
          </div>
          <div className="col-md-4 mb-3">
            <label>Relationship</label>
            <input type="text" className="form-control" name="emergency.relationship" value={form.emergencyContact.relationship} onChange={handleChange} />
          </div>
        </div>
        <div className="mb-3">
          <label>Care Notes</label>
          <textarea className="form-control" rows="3" name="careNotes" value={form.careNotes} onChange={handleChange}></textarea>
        </div>
        <button type="submit" className="btn btn-primary">Create Client</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(-1)}>Cancel</button>
      </form>
    </div>
  );
};

export default AddClient;