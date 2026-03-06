import React, { useState } from 'react';
import api from '../services/api';

const Verification = () => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('id');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('userId', localStorage.getItem('userId'));

    setUploading(true);
    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Document uploaded successfully! It is pending verification.');
      setFile(null);
      e.target.reset();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Upload Verification Document</h2>
              {message && (
                <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="documentType" className="form-label">Document Type</label>
                  <select
                    className="form-select"
                    id="documentType"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                  >
                    <option value="id">ID Document</option>
                    <option value="police_clearance">Police Clearance</option>
                    <option value="proof_of_address">Proof of Address</option>
                    <option value="certificate">Certificate</option>
                    <option value="reference">Reference Letter</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="file" className="form-label">Select file (image or PDF)</label>
                  <input
                    type="file"
                    className="form-control"
                    id="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;