import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAdminUser, isOrganizationUser } from '../utils/auth';
import PWAInstallPrompt from './PWAInstallPrompt';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isAdmin = isAdminUser(user);
  const isOrganization = isOrganizationUser(user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/login');
  };

  const NavLink = ({ to, icon, children }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`cl-nav-link ${isActive ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      >
        <i className={icon}></i>
        <span>{children}</span>
      </Link>
    );
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Unauthenticated layout
  if (!token) {
    return (
      <>
        <header style={{ background: 'white', borderBottom: '1px solid var(--cl-gray-200)' }}>
          <div className="container">
            <div className="d-flex align-items-center justify-content-between py-3">
              <Link to="/" className="text-decoration-none">
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--cl-blue)' }}>ConnectLocal</span>
              </Link>
              <div>
                <Link to="/login" className="btn btn-cl-outline me-2" style={{ padding: '0.4rem 1rem' }}>Login</Link>
                <Link to="/register" className="btn btn-cl-primary" style={{ padding: '0.4rem 1rem' }}>Register</Link>
              </div>
            </div>
          </div>
        </header>
        <main className="container my-4">{children}</main>
        <div className="cl-footer mt-5">
          <p>&copy; 2026 ConnectLocal. All rights reserved.</p>
        </div>
      </>
    );
  }

  // Authenticated layout
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Overlay */}
      {sidebarOpen && <div className="cl-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`cl-sidebar ${sidebarOpen ? 'cl-sidebar-mobile' : 'd-none d-lg-flex'}`}
      >
        <div className="cl-sidebar-brand">
          <h5>ConnectLocal</h5>
          <small>{user.name}</small>
        </div>

        <nav className="cl-sidebar-nav">
          <NavLink to="/dashboard" icon="fas fa-home">Dashboard</NavLink>
          <NavLink to="/chat" icon="fas fa-comments">Messages</NavLink>
          <NavLink to="/profile" icon="fas fa-user">Profile</NavLink>
          <NavLink to="/create-service" icon="fas fa-plus-circle">Post Request</NavLink>
          <NavLink to="/search-helpers" icon="fas fa-search">Find Helpers</NavLink>
          <NavLink to="/leaderboard" icon="fas fa-trophy">Leaderboard</NavLink>
          <NavLink to="/transactions" icon="fas fa-wallet">Payments</NavLink>
          <NavLink to="/verification" icon="fas fa-shield-alt">Verification</NavLink>

          {isOrganization && (
            <>
              <div className="cl-nav-section">Organization</div>
              <NavLink to="/clients" icon="fas fa-users">Clients</NavLink>
              <NavLink to="/assignments" icon="fas fa-tasks">Assignments</NavLink>
              <NavLink to="/org-dashboard" icon="fas fa-chart-line">Org Dashboard</NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="cl-nav-section">Admin</div>
              <NavLink to="/admin" icon="fas fa-cog">Admin Panel</NavLink>
            </>
          )}
        </nav>

        <div className="cl-sidebar-footer">
          <button className="btn btn-cl-ghost w-100 text-start" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-2"></i>Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }} onClick={() => sidebarOpen && setSidebarOpen(false)}>
        <PWAInstallPrompt />

        {/* Mobile top bar */}
        <header className="d-lg-none cl-topbar">
          <div className="d-flex align-items-center justify-content-between">
            <button className="btn btn-cl-ghost" onClick={() => setSidebarOpen(true)}>
              <i className="fas fa-bars"></i>
            </button>
            <span className="cl-topbar-brand">ConnectLocal</span>
            <div style={{ width: '40px' }}></div>
          </div>
        </header>

        <main className="cl-main cl-animate-in">
          {children}
        </main>

        <div className="cl-footer">
          <p>&copy; 2026 ConnectLocal</p>
        </div>
      </div>
    </div>
  );
};

export default Layout;