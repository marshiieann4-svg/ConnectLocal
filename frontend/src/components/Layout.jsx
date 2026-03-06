import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isOrganization = ['organization', 'home_care', 'dropin_centre'].includes(user.accountType);

  return (
    <>
      <header className="bg-light border-bottom mb-4">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between py-3">
            <Link to="/" className="d-flex align-items-center text-dark text-decoration-none">
              <span className="fs-4 fw-bold">ConnectLocal</span>
            </Link>
            {token ? (
              <div className="d-flex align-items-center">
                <nav className="nav me-3">
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/profile" className="nav-link">Profile</Link>
                  <Link to="/verification" className="nav-link">Verification</Link>
                  <Link to="/create-service" className="nav-link">Post Request</Link>
                  <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                  {isOrganization && (
                    <>
                      <Link to="/clients" className="nav-link">Clients</Link>
                      <Link to="/assignments" className="nav-link">Assignments</Link>
                    </>
                  )}
                  {user.accountType === 'admin' && (
                    <Link to="/admin" className="nav-link">Admin</Link>
                  )}
                </nav>
                <div className="dropdown">
                  <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    {user.name || 'User'}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link to="/profile" className="dropdown-item">Profile</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <Link to="/login" className="btn btn-outline-primary me-2">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
      <footer className="bg-light text-center py-3 mt-5">
        <p className="mb-0">&copy; 2026 ConnectLocal. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Layout;