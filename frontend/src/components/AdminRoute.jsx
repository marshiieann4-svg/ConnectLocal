import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { getDefaultRouteForUser, getStoredUser, isAdminUser } from '../utils/auth';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const [status, setStatus] = useState(token ? 'checking' : 'unauthorized');
  const [redirectTo, setRedirectTo] = useState('/dashboard');

  useEffect(() => {
    if (!token) {
      setStatus('unauthorized');
      return;
    }

    let isMounted = true;

    const validateAdminSession = async () => {
      try {
        const res = await api.get('/auth/me');
        const serverUser = res.data?.user || {};
        localStorage.setItem('user', JSON.stringify(serverUser));

        if (!isMounted) return;

        if (isAdminUser(serverUser)) {
          setStatus('authorized');
          return;
        }

        setRedirectTo(getDefaultRouteForUser(serverUser));
        setStatus('forbidden');
      } catch (error) {
        if (!isMounted) return;

        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
          window.dispatchEvent(new Event('auth-changed'));
          setStatus('unauthorized');
          return;
        }

        const fallbackUser = getStoredUser();
        setRedirectTo(getDefaultRouteForUser(fallbackUser));
        setStatus('forbidden');
      }
    };

    validateAdminSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === 'checking') {
    return <div className="text-center mt-5">Checking admin access...</div>;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'forbidden') {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default AdminRoute;
