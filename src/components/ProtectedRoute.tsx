import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Handle OAuth token coming via query string so we don't bounce to /signin
  const [tokenHandled, setTokenHandled] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      try {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth', 'true');
        // Strip token from URL without causing navigation
        const cleanUrl = location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      } catch {}
    }
    setTokenHandled(true);
  }, [location.search, location.pathname]);

  if (!tokenHandled || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // First, check if user just logged out and redirect to home
  const justLoggedOut = (() => {
    try { return localStorage.getItem('just_logged_out') === '1'; } catch { return false; }
  })();
  if (justLoggedOut) {
    try { localStorage.removeItem('just_logged_out'); } catch {}
    return <Navigate to="/" replace />;
  }

  // Then, check authentication
  if (!isAuthenticated) {
    // Redirect unauthenticated users to home and preserve intended location if needed
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
