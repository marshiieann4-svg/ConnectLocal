import React from 'react';
import { useParams, Link } from 'react-router-dom';

const PaymentResult = () => {
  const { id } = useParams();
  const isSuccess = window.location.pathname.includes('/success');

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          {isSuccess ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                <h3>Payment Successful!</h3>
                <p className="text-muted">
                  Your payment has been received and funds are held securely in escrow
                  until the service is completed.
                </p>
                <div className="d-flex gap-2 justify-content-center mt-4">
                  <Link to={`/service/${id}`} className="btn btn-primary">
                    <i className="fas fa-eye me-2"></i>View Service
                  </Link>
                  <Link to="/transactions" className="btn btn-outline-secondary">
                    <i className="fas fa-receipt me-2"></i>Transaction History
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <i className="fas fa-times-circle fa-4x text-danger mb-3"></i>
                <h3>Payment Cancelled</h3>
                <p className="text-muted">
                  Your payment was cancelled. No charges have been made.
                  You can try again from the service page.
                </p>
                <div className="d-flex gap-2 justify-content-center mt-4">
                  <Link to={`/service/${id}`} className="btn btn-primary">
                    <i className="fas fa-arrow-left me-2"></i>Back to Service
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline-secondary">
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
