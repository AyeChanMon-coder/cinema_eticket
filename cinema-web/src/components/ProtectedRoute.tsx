import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute: React.FC = () => {
  const token: string | null = localStorage.getItem("admin_token");

  // Token မရှိလျှင် Login Page သို့ ပြန်မောင်းထုတ်မည်
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
