import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TransactionHistory = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalPaid: 0, totalEarned: 0, pendingEscrow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/history');
        setPayments(res.data.data || []);
        setSummary(res.data.summary || {});
      } catch (err) {
        console.error('Failed to load payments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-secondary',
      paid: 'bg-primary',
      escrowed: 'bg-info',
      released: 'bg-success',
      refunded: 'bg-warning text-dark',
      failed: 'bg-danger'
    };
    return map[status] || 'bg-secondary';
  };

  const currentUserId = localStorage.getItem('userId');

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h3 className="mb-4">
        <i className="fas fa-receipt me-2"></i>Transaction History
      </h3>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <div className="h4 text-success mb-1">R{summary.totalEarned?.toFixed(2) || '0.00'}</div>
              <small className="text-muted">Total Earned</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <div className="h4 text-primary mb-1">R{summary.totalPaid?.toFixed(2) || '0.00'}</div>
              <small className="text-muted">Total Paid</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <div className="h4 text-info mb-1">R{summary.pendingEscrow?.toFixed(2) || '0.00'}</div>
              <small className="text-muted">In Escrow</small>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      {payments.length === 0 ? (
        <div className="alert alert-light border text-center">
          <i className="fas fa-wallet fa-2x text-muted mb-2 d-block"></i>
          No transactions yet. Payments will appear here when you pay for or earn from services.
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isPayer = p.payerId?._id === currentUserId;
                  return (
                    <tr key={p._id}>
                      <td>
                        <small>{new Date(p.createdAt).toLocaleDateString('en-ZA', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}</small>
                      </td>
                      <td>
                        {p.serviceId ? (
                          <Link to={`/service/${p.serviceId._id}`} className="text-decoration-none">
                            {p.serviceId.title}
                          </Link>
                        ) : 'N/A'}
                      </td>
                      <td>
                        {isPayer ? (
                          <span className="text-danger"><i className="fas fa-arrow-up me-1"></i>Paid</span>
                        ) : (
                          <span className="text-success"><i className="fas fa-arrow-down me-1"></i>Earned</span>
                        )}
                      </td>
                      <td className="fw-bold">R{p.amount?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${statusBadge(p.status)}`}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
