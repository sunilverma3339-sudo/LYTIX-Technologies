import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../lib/auth.jsx";

export default function ProtectedRoute({ children, role }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <main className="page-shell flex min-h-[70vh] items-center justify-center">
        <div className="loader-panel">Loading secure workspace...</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      return <Navigate to={homeForRole(user.role)} replace />;
    }
  }

  return children;
}

function homeForRole(role) {
  const map = {
    admin: "/admin/dashboard",
    super_admin: "/super-admin/dashboard",
    hr: "/hr/dashboard",
    recruiter: "/recruiter/dashboard",
    mentor: "/mentor/dashboard",
    student: "/student/dashboard",
  };
  return map[role] || "/student/dashboard";
}
