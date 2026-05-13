import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardRoute } from '../../utils/constants';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-warm-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber border-t-transparent"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Role check
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardRoute(role)} replace />;
  }

  // User is authenticated and authorized
  return <Outlet />;
};
