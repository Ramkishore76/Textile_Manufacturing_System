import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireBuyer?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireBuyer = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading AGT Textile Mills...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If page requires Buyer role, block internal staff
  if (requireBuyer) {
    if (user.role !== 'BUYER') {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  // If internal page, block Buyer role
  if (!requireBuyer && user.role === 'BUYER') {
    return <Navigate to="/buyer/dashboard" replace />;
  }

  // Role checks for internal staff
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-6 text-center shadow-xs">
          <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-3 text-neutral-600 font-bold text-sm">
            !
          </div>
          <h2 className="text-base font-semibold text-neutral-900 mb-1">Access Restricted</h2>
          <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
            Your role (<span className="font-semibold text-neutral-800">{user.role}</span>) does not have authorization to access this operational module.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => window.history.back()}
              className="px-3.5 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-md text-xs font-medium transition"
            >
              Previous Page
            </button>
            <a
              href="/app/dashboard"
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition inline-block"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
